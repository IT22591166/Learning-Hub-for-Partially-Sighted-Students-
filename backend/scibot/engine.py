"""
SciBot Engine - Grade 7 Science Q&A using TF-IDF retrieval + LLM answer generation
Adapted from IT22557124's SciBot module
"""

import os
import re
import pickle
from pathlib import Path
from typing import List, Dict, Any, Optional
from threading import Lock
from functools import lru_cache

import numpy as np
import pandas as pd

from pypdf import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity

# Optional fast semantic retrieval
try:
    import faiss
    from sentence_transformers import SentenceTransformer
    _HAS_SEMANTIC = True
except Exception:
    faiss = None
    SentenceTransformer = None
    _HAS_SEMANTIC = False

# Sparse matrix support
try:
    from scipy import sparse
    _HAS_SCIPY = True
except Exception:
    sparse = None
    _HAS_SCIPY = False

# LLM for natural answer generation (optional but recommended)
USE_LLM = True
_HAS_LLM = False

if USE_LLM:
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch
        _HAS_LLM = True
        MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
        device = "cuda" if torch.cuda.is_available() else "cpu"
        llm_tokenizer = None
        llm_model = None
    except ImportError:
        print("⚠ transformers/torch not installed. LLM answers disabled, using extractive fallback.")
        USE_LLM = False

# ----------------------------------------------------
# CONFIG - paths relative to this file's directory
# ----------------------------------------------------
BASE_DIR = Path(__file__).parent

PDF_PATHS = [
    BASE_DIR / "data" / "science G-7 P-I E.pdf",
    BASE_DIR / "data" / "science G-7 P-II E.pdf",
]

QA_CSV_PATH = BASE_DIR / "data" / "grade7_science_generated_2000_QA.csv"

INDEX_DIR = BASE_DIR / "model_data"
INDEX_DIR.mkdir(exist_ok=True)

CHUNKS_PATH = INDEX_DIR / "corpus_chunks.pkl"
TFIDF_VECTORIZER_PATH = INDEX_DIR / "tfidf_vectorizer.pkl"
DOC_MATRIX_PATH = INDEX_DIR / "doc_matrix.npy"
DOC_MATRIX_SPARSE_PATH = INDEX_DIR / "doc_matrix.npz"
RELEVANCE_MODEL_PATH = INDEX_DIR / "relevance_model.pkl"

SEMANTIC_MODEL_NAME = os.environ.get("SEMANTIC_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
FAISS_INDEX_PATH = INDEX_DIR / "faiss_index.bin"
FAISS_META_PATH = INDEX_DIR / "faiss_meta.pkl"

# Globals
tfidf_vectorizer: Optional[TfidfVectorizer] = None
doc_matrix: Any = None
corpus_chunks: List[Dict[str, Any]] = []
relevance_model: Optional[LogisticRegression] = None

semantic_model = None
faiss_index = None
faiss_id_to_chunk_idx: List[int] = []

_initialized = False
_init_lock = Lock()

# ====================================================
# DATA PREPROCESSING
# ====================================================

def preprocess_text(raw: str) -> str:
    text = raw.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_text_from_pdf(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {path}")
    reader = PdfReader(str(path))
    pages = []
    for i, page in enumerate(reader.pages):
        raw_text = page.extract_text() or ""
        text = preprocess_text(raw_text)
        if text:
            pages.append({"page_num": i + 1, "text": text, "source": path.name})
    return pages


def fast_chunk_text(text: str, max_length: int = 900) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current = [], ""
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        if len(current) + len(s) > max_length:
            if current.strip():
                chunks.append(current.strip())
            current = s + " "
        else:
            current += s + " "
    if current.strip():
        chunks.append(current.strip())
    return chunks


def build_corpus_from_pdfs() -> List[Dict[str, Any]]:
    all_pages = []
    for pdf_path in PDF_PATHS:
        all_pages.extend(extract_text_from_pdf(pdf_path))
    corpus, cid = [], 0
    for page in all_pages:
        for ch in fast_chunk_text(page["text"], 900):
            corpus.append({"id": cid, "text": ch, "source": page["source"], "page_num": page["page_num"]})
            cid += 1
    return corpus


def build_or_load_index():
    global corpus_chunks, tfidf_vectorizer, doc_matrix
    has_sparse = DOC_MATRIX_SPARSE_PATH.exists() and _HAS_SCIPY
    has_dense = DOC_MATRIX_PATH.exists()

    if CHUNKS_PATH.exists() and TFIDF_VECTORIZER_PATH.exists() and (has_sparse or has_dense):
        print("🔹 Loading existing corpus, TF-IDF vectorizer, and matrix...")
        with open(CHUNKS_PATH, "rb") as f:
            corpus_chunks = pickle.load(f)
        with open(TFIDF_VECTORIZER_PATH, "rb") as f:
            tfidf_vectorizer = pickle.load(f)
        if has_sparse:
            doc_matrix = sparse.load_npz(str(DOC_MATRIX_SPARSE_PATH))
        else:
            doc_matrix = np.load(DOC_MATRIX_PATH, allow_pickle=False)
        print(f"✅ Loaded {len(corpus_chunks)} chunks from disk.")
        return

    print("🔹 Building corpus from PDFs...")
    corpus_chunks = build_corpus_from_pdfs()
    texts = [c["text"] for c in corpus_chunks]

    print("🔹 Fitting TF-IDF vectorizer on corpus chunks...")
    tfidf_vectorizer = TfidfVectorizer(max_features=20000, ngram_range=(1, 2), stop_words="english")
    doc_matrix = tfidf_vectorizer.fit_transform(texts).astype("float32")

    print("🔹 Saving corpus, TF-IDF vectorizer, and matrix...")
    with open(CHUNKS_PATH, "wb") as f:
        pickle.dump(corpus_chunks, f)
    with open(TFIDF_VECTORIZER_PATH, "wb") as f:
        pickle.dump(tfidf_vectorizer, f)
    if _HAS_SCIPY:
        sparse.save_npz(str(DOC_MATRIX_SPARSE_PATH), doc_matrix)
    else:
        np.save(DOC_MATRIX_PATH, doc_matrix.toarray())
    print("✅ Index data saved.")


def vectorize_text(texts: List[str]) -> np.ndarray:
    if tfidf_vectorizer is None:
        raise RuntimeError("TF-IDF vectorizer not initialized.")
    return tfidf_vectorizer.transform(texts).astype("float32").toarray()


# ====================================================
# OPTIONAL SEMANTIC INDEX (FAISS)
# ====================================================

def load_or_build_semantic_index():
    global semantic_model, faiss_index, faiss_id_to_chunk_idx
    if not _HAS_SEMANTIC:
        return
    if semantic_model is None:
        try:
            semantic_model = SentenceTransformer(SEMANTIC_MODEL_NAME)
        except Exception as e:
            print(f"⚠ Semantic model load failed: {e}")
            return

    if FAISS_INDEX_PATH.exists() and FAISS_META_PATH.exists():
        try:
            faiss_index = faiss.read_index(str(FAISS_INDEX_PATH))
            with open(FAISS_META_PATH, "rb") as f:
                meta = pickle.load(f)
            faiss_id_to_chunk_idx = meta.get("id_to_chunk_idx", [])
            if faiss_index and len(faiss_id_to_chunk_idx) == faiss_index.ntotal:
                print(f"✅ Loaded FAISS semantic index ({faiss_index.ntotal} vectors).")
                return
        except Exception:
            faiss_index = None

    if not corpus_chunks:
        return
    print("🔹 Building FAISS semantic index...")
    texts = [c["text"] for c in corpus_chunks]
    embeddings = semantic_model.encode(texts, batch_size=64, show_progress_bar=True, normalize_embeddings=True)
    emb = np.asarray(embeddings, dtype="float32")
    faiss_index = faiss.IndexFlatIP(emb.shape[1])
    faiss_index.add(emb)
    faiss_id_to_chunk_idx = list(range(len(corpus_chunks)))
    faiss.write_index(faiss_index, str(FAISS_INDEX_PATH))
    with open(FAISS_META_PATH, "wb") as f:
        pickle.dump({"id_to_chunk_idx": faiss_id_to_chunk_idx}, f)
    print(f"✅ FAISS semantic index saved ({faiss_index.ntotal} vectors).")


# ====================================================
# SUPERVISED RELEVANCE MODEL
# ====================================================

def build_features_for_pairs(questions, chunks):
    q_vecs = vectorize_text(questions)
    c_vecs = vectorize_text(chunks)
    return np.abs(q_vecs - c_vecs)


def map_answers_to_pdf_chunks(answers):
    if doc_matrix is None or tfidf_vectorizer is None:
        raise RuntimeError("Index must be built first.")
    ans_vecs = vectorize_text(answers)
    sims = cosine_similarity(ans_vecs, doc_matrix)
    return [corpus_chunks[int(np.argmax(sims[i]))]["text"] for i in range(sims.shape[0])]


def load_or_train_relevance_model():
    global relevance_model
    if RELEVANCE_MODEL_PATH.exists():
        with open(RELEVANCE_MODEL_PATH, "rb") as f:
            relevance_model = pickle.load(f)
        print("✅ Relevance model loaded.")
        return

    if not QA_CSV_PATH.exists():
        relevance_model = None
        return

    print(f"🔹 Training relevance model from {QA_CSV_PATH}...")
    df = pd.read_csv(QA_CSV_PATH)
    if "question" not in df.columns or "answer" not in df.columns:
        relevance_model = None
        return

    df = df.dropna(subset=["question", "answer"]).sample(min(len(df), 2000), random_state=42)
    questions_pos = df["question"].tolist()
    chunks_pos = map_answers_to_pdf_chunks(df["answer"].tolist())
    chunks_neg = chunks_pos.copy()
    np.random.default_rng(1).shuffle(chunks_neg)

    X_all = build_features_for_pairs(questions_pos * 2, chunks_pos + chunks_neg)
    y_all = np.array([1] * len(df) + [0] * len(df))

    clf = LogisticRegression(max_iter=1000)
    clf.fit(X_all, y_all)
    relevance_model = clf
    with open(RELEVANCE_MODEL_PATH, "wb") as f:
        pickle.dump(relevance_model, f)
    print("✅ Relevance model trained and saved.")


def rerank_with_supervised(question, candidates):
    if relevance_model is None:
        return candidates
    chunk_texts = [c["text"] for c in candidates]
    X = build_features_for_pairs([question] * len(chunk_texts), chunk_texts)
    scores = relevance_model.predict_proba(X)[:, 1]
    for c, s in zip(candidates, scores):
        c["supervised_score"] = float(s)
    candidates.sort(key=lambda x: x["supervised_score"], reverse=True)
    return candidates


# ====================================================
# RETRIEVAL
# ====================================================

def retrieve_chunks(question: str, k: int = 5, initial_k: int = 20):
    if tfidf_vectorizer is None or doc_matrix is None:
        raise RuntimeError("Index not initialized.")

    if faiss_index is not None and semantic_model is not None:
        q_emb = semantic_model.encode([question], normalize_embeddings=True)
        q_emb = np.asarray(q_emb, dtype="float32")
        scores, ids = faiss_index.search(q_emb, initial_k)
        idxs = [faiss_id_to_chunk_idx[int(i)] for i in ids[0] if int(i) != -1]
        candidates = [
            {"text": corpus_chunks[idx]["text"], "source": corpus_chunks[idx]["source"],
             "page_num": corpus_chunks[idx]["page_num"], "similarity": float(scores[0][r])}
            for r, idx in enumerate(idxs)
        ]
        return rerank_with_supervised(question, candidates)[:k]

    q_vec_sparse = tfidf_vectorizer.transform([question]).astype("float32")
    if _HAS_SCIPY and sparse is not None and sparse.issparse(doc_matrix):
        sims = (q_vec_sparse @ doc_matrix.T).toarray()[0]
    else:
        sims = cosine_similarity(q_vec_sparse.toarray(), doc_matrix)[0]

    idxs = np.argpartition(sims, -initial_k)[-initial_k:]
    idxs = idxs[np.argsort(sims[idxs])][::-1]
    candidates = [
        {"text": corpus_chunks[int(i)]["text"], "source": corpus_chunks[int(i)]["source"],
         "page_num": corpus_chunks[int(i)]["page_num"], "similarity": float(sims[i])}
        for i in idxs
    ]
    return rerank_with_supervised(question, candidates)[:k]


# ====================================================
# LLM ANSWER GENERATION (TinyLlama)
# ====================================================

def load_llm_if_needed():
    """Lazily load the LLM model on first use."""
    if not USE_LLM or not _HAS_LLM:
        return
    global llm_tokenizer, llm_model

    if llm_model is not None:
        return

    if device == "cpu":
        try:
            torch.set_num_threads(max(1, min(8, (os.cpu_count() or 2))))
        except Exception:
            pass

    print(f"🔹 Loading small LLM {MODEL_NAME} on {device}...")
    llm_tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=True)
    llm_model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map="auto" if device == "cuda" else None,
        low_cpu_mem_usage=True,
    )
    llm_model.to(device)
    llm_model.eval()
    print("✅ Small LLM loaded.")


def build_prompt(question: str, contexts: List[Dict[str, Any]]) -> str:
    """Build a prompt for the LLM using retrieved context chunks."""
    joined = "\n\n".join(
        f"[Source: {c['source']} page {c['page_num']}]\n{c['text']}"
        for c in contexts
    )
    return (
        "You are a Grade 7 science tutor.\n"
        "Use ONLY the information in the context from the textbook to answer.\n"
        "If the answer is not in the context, say: 'I cannot find this in the book.'\n"
        "Give a short, clear answer.\n\n"
        f"### Context:\n{joined}\n\n"
        f"### Question:\n{question}\n\n"
        "### Answer:\n"
    )


def generate_llm_answer(prompt: str, max_new_tokens: int = 128) -> str:
    """Generate an answer using the loaded LLM."""
    inputs = llm_tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        out = llm_model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            temperature=0.0,
        )
    full = llm_tokenizer.decode(out[0], skip_special_tokens=True)
    raw = full[len(prompt):].strip()

    for marker in ["### Question", "### Context", "### Answer"]:
        pos = raw.find(marker)
        if pos != -1:
            raw = raw[:pos].strip()

    sentences = [s.strip() for s in raw.split(".") if s.strip()]
    cleaned = ". ".join(sentences[:3])
    if cleaned and not cleaned.endswith("."):
        cleaned += "."
    return cleaned if cleaned else raw


# ====================================================
# EXTRACTIVE ANSWER (fallback when LLM not available)
# ====================================================

def extract_answer_from_chunk(chunk_text: str, max_sentences: int = 2) -> str:
    sentences = re.split(r'(?<=[.!?])\s+', chunk_text)
    cleaned = [s.strip() for s in sentences if s.strip()]
    ans = " ".join(cleaned[:max_sentences])
    return ans if ans else chunk_text


@lru_cache(maxsize=256)
def _cached_answer(question: str) -> str:
    ctx = retrieve_chunks(question, k=3, initial_k=20)
    if not ctx:
        return "I cannot find this in the book."

    # Use LLM for natural answers if available
    if USE_LLM and _HAS_LLM:
        load_llm_if_needed()
        prompt = build_prompt(question, ctx)
        return generate_llm_answer(prompt)

    # Fallback: extractive answer from best chunk
    return extract_answer_from_chunk(ctx[0]["text"], max_sentences=2)


def answer_question(q: str) -> str:
    q = (q or "").strip()
    if not q:
        return "Please type a question."
    return _cached_answer(q)


# ====================================================
# INITIALIZATION
# ====================================================

def initialize():
    global _initialized
    with _init_lock:
        if _initialized:
            return
        print("🔧 Initializing SciBot pipeline...")
        build_or_load_index()
        load_or_build_semantic_index()
        load_or_train_relevance_model()
        try:
            _cached_answer.cache_clear()
        except Exception:
            pass
        _initialized = True
        print("✅ SciBot initialization done.")
