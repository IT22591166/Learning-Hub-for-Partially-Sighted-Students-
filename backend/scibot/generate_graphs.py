"""
Generate research report graphs for SciBot.
Produces PNG charts showing model performance and data statistics.

Usage:
  cd merged-project/backend
  python -m scibot.generate_graphs
"""

import os
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

# ----------------------------------------------------
# Paths (relative to scibot package directory)
# ----------------------------------------------------
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
INDEX_DIR = BASE_DIR / "model_data"
REPORT_DIR = BASE_DIR / "graph_reports"
REPORT_DIR.mkdir(exist_ok=True)

CHUNKS_PATH = INDEX_DIR / "corpus_chunks.pkl"
TFIDF_VECTORIZER_PATH = INDEX_DIR / "tfidf_vectorizer.pkl"
DOC_MATRIX_PATH = INDEX_DIR / "doc_matrix.npy"
DOC_MATRIX_SPARSE_PATH = INDEX_DIR / "doc_matrix.npz"
QA_CSV_PATH = DATA_DIR / "grade7_science_generated_2000_QA.csv"

# Try scipy for sparse matrix support
try:
    from scipy import sparse as sp
    _HAS_SCIPY = True
except ImportError:
    sp = None
    _HAS_SCIPY = False

# ----------------------------------------------------
# Load core objects
# ----------------------------------------------------
print("🔹 Loading corpus chunks...")
with open(CHUNKS_PATH, "rb") as f:
    corpus_chunks = pickle.load(f)

print("🔹 Loading TF-IDF vectorizer...")
with open(TFIDF_VECTORIZER_PATH, "rb") as f:
    tfidf_vectorizer: TfidfVectorizer = pickle.load(f)

print("🔹 Loading document matrix...")
if DOC_MATRIX_SPARSE_PATH.exists() and _HAS_SCIPY:
    doc_matrix = sp.load_npz(str(DOC_MATRIX_SPARSE_PATH))
    # Convert to dense for cosine_similarity compatibility in graph generation
    doc_matrix_dense = doc_matrix.toarray()
elif DOC_MATRIX_PATH.exists():
    doc_matrix_dense = np.load(DOC_MATRIX_PATH, allow_pickle=False)
else:
    raise FileNotFoundError("No document matrix found. Run the SciBot backend first to build the index.")


def vectorize_text(texts):
    """Use the same TF-IDF vectorizer as in engine.py."""
    X = tfidf_vectorizer.transform(texts).astype("float32").toarray()
    return X


# ----------------------------------------------------
# 1. DATA PREPROCESSING REPORTS
# ----------------------------------------------------
def plot_chunk_length_distribution():
    """Histogram of chunk lengths in words."""
    lengths = [len(c["text"].split()) for c in corpus_chunks]

    plt.figure(figsize=(8, 4))
    plt.hist(lengths, bins=30, color="#4A90D9", edgecolor="#2C5F8A")
    plt.xlabel("Chunk length (words)")
    plt.ylabel("Number of chunks")
    plt.title("Data Preprocessing: Distribution of Chunk Lengths")
    out_path = REPORT_DIR / "chunk_length_histogram.png"
    plt.tight_layout()
    plt.savefig(out_path, dpi=300)
    plt.close()
    print(f"✅ Saved chunk length distribution to {out_path}")


def plot_chunks_per_source():
    """Bar chart of chunks per source PDF."""
    sources = [c["source"] for c in corpus_chunks]
    unique_sources, counts = np.unique(sources, return_counts=True)

    plt.figure(figsize=(8, 4))
    plt.bar(unique_sources, counts, color=["#4A90D9", "#E67E22"])
    plt.xlabel("Source PDF")
    plt.ylabel("Number of chunks")
    plt.title("Chunks per Source PDF")
    plt.xticks(rotation=15, ha="right")
    out_path = REPORT_DIR / "chunks_per_source.png"
    plt.tight_layout()
    plt.savefig(out_path, dpi=300)
    plt.close()
    print(f"✅ Saved chunks per source plot to {out_path}")


# ----------------------------------------------------
# 2. BUILD SUPERVISED DATASET
# ----------------------------------------------------
def map_answers_to_pdf_chunks(answers):
    """
    For each CSV answer, find the most similar PDF chunk
    using TF-IDF + cosine similarity.
    """
    ans_vecs = vectorize_text(answers)
    sims = cosine_similarity(ans_vecs, doc_matrix_dense)

    mapped_chunk_texts = []
    for i in range(sims.shape[0]):
        best_idx = int(np.argmax(sims[i]))
        mapped_chunk_texts.append(corpus_chunks[best_idx]["text"])
    return mapped_chunk_texts


def build_supervised_dataset():
    """
    Rebuild (question, PDF_chunk, label) pairs.
    Returns X (features) and y (labels).
    """
    if not QA_CSV_PATH.exists():
        raise FileNotFoundError(f"QA CSV not found: {QA_CSV_PATH}")

    df = pd.read_csv(QA_CSV_PATH)

    if "question" not in df.columns or "answer" not in df.columns:
        raise ValueError("CSV must have 'question' and 'answer' columns")

    df = df.dropna(subset=["question", "answer"])
    if len(df) == 0:
        raise ValueError("No valid Q–A rows in CSV")

    df = df.sample(min(len(df), 2000), random_state=42)

    questions_pos = df["question"].tolist()
    raw_answers = df["answer"].tolist()

    # Map answers → closest PDF chunk
    chunks_pos = map_answers_to_pdf_chunks(raw_answers)
    y_pos = [1] * len(df)

    # Negative pairs: shuffled chunk matches
    chunks_neg = chunks_pos.copy()
    rng = np.random.default_rng(1)
    rng.shuffle(chunks_neg)
    questions_neg = questions_pos
    y_neg = [0] * len(df)

    questions_all = questions_pos + questions_neg
    chunks_all = chunks_pos + chunks_neg
    y_all = np.array(y_pos + y_neg)

    # Build features |q − c|
    q_vecs = vectorize_text(questions_all)
    c_vecs = vectorize_text(chunks_all)
    X_all = np.abs(q_vecs - c_vecs)

    return X_all, y_all


# ----------------------------------------------------
# 3. SUPERVISED LEARNING REPORTS
# ----------------------------------------------------
def plot_supervised_label_distribution(y_all):
    """Bar chart of label 0 vs label 1 counts."""
    unique, counts = np.unique(y_all, return_counts=True)
    label_counts = dict(zip(unique, counts))

    plt.figure(figsize=(5, 4))
    plt.bar(["Not relevant (0)", "Relevant (1)"],
            [label_counts.get(0, 0), label_counts.get(1, 0)],
            color=["#E74C3C", "#27AE60"])
    plt.ylabel("Number of pairs")
    plt.title("Supervised Learning: Label Distribution")
    out_path = REPORT_DIR / "supervised_label_distribution.png"
    plt.tight_layout()
    plt.savefig(out_path, dpi=300)
    plt.close()
    print(f"✅ Saved label distribution plot to {out_path}")


def plot_supervised_accuracy_and_probs(X_all, y_all):
    """
    Train a Logistic Regression relevance model,
    plot (1) accuracy bar, and (2) histogram of predicted probabilities.
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X_all, y_all, test_size=0.2, random_state=42, stratify=y_all
    )

    clf = LogisticRegression(max_iter=1000)
    clf.fit(X_train, y_train)

    # ---------- accuracy ----------
    y_train_pred = clf.predict(X_train)
    y_test_pred = clf.predict(X_test)

    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)

    plt.figure(figsize=(5, 4))
    plt.bar(["Train", "Test"], [train_acc, test_acc], color=["#3498DB", "#2ECC71"])
    plt.ylim(0, 1)
    plt.ylabel("Accuracy")
    plt.title("Supervised Learning: Logistic Regression Accuracy")
    out_path_acc = REPORT_DIR / "relevance_model_accuracy.png"
    plt.tight_layout()
    plt.savefig(out_path_acc, dpi=300)
    plt.close()
    print(f"✅ Saved supervised accuracy plot to {out_path_acc}")

    # ---------- probability histogram ----------
    probs_all = clf.predict_proba(X_all)[:, 1]
    y_all_arr = np.array(y_all)

    probs_pos = probs_all[y_all_arr == 1]
    probs_neg = probs_all[y_all_arr == 0]

    plt.figure(figsize=(7, 4))
    plt.hist(probs_neg, bins=20, alpha=0.6, label="Not relevant (label 0)", color="#E74C3C")
    plt.hist(probs_pos, bins=20, alpha=0.6, label="Relevant (label 1)", color="#27AE60")
    plt.xlabel("Predicted probability of relevance (P(label=1))")
    plt.ylabel("Number of pairs")
    plt.title("Relevance Model Probability Histogram\n(Logistic Regression output)")
    plt.legend()
    out_path_hist = REPORT_DIR / "relevance_model_prob_histogram.png"
    plt.tight_layout()
    plt.savefig(out_path_hist, dpi=300)
    plt.close()
    print(f"✅ Saved relevance_model_prob_histogram to {out_path_hist}")


# ----------------------------------------------------
# MAIN
# ----------------------------------------------------
if __name__ == "__main__":
    print("🔧 Generating model reports...")

    # 1) Data preprocessing stats
    plot_chunk_length_distribution()
    plot_chunks_per_source()

    # 2) Supervised learning dataset + plots
    X_all, y_all = build_supervised_dataset()
    plot_supervised_label_distribution(y_all)
    plot_supervised_accuracy_and_probs(X_all, y_all)

    print(f"\n🎉 Done. Check the '{REPORT_DIR}' folder for PNG files.")
