import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import {
  Atom,
  Mic,
  Send,
  X,
  Maximize2,
  Trash2,
  User,
  Bot,
  RefreshCw,
  PauseCircle,
} from "lucide-react";
import { hapticNotify } from "../utils/hapticNotify";

const ChatBox = ({ theme = "light", isDark = false }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: "Hello! I'm ChatBot. Ask me anything about the lecture!",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatSize, setChatSize] = useState("medium");
  const [micPermission, setMicPermission] = useState("unknown");

  const messagesEndRef = useRef(null);

  const [voiceReady, setVoiceReady] = useState(false);
  const [needsVoiceEnable, setNeedsVoiceEnable] = useState(true);

  // ✅ NEW: refresh overlay after stop listening
  const [needsRefreshNotice, setNeedsRefreshNotice] = useState(false);
  const refreshBtnRef = useRef(null);

  const [position, setPosition] = useState(() => ({
    x: window.innerWidth - 100,
    y: window.innerHeight - 100,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const recognitionRef = useRef(null);
  const wakeWordRecognitionRef = useRef(null);
  const finalTranscriptBuffer = useRef("");

  const isWakeListening = useRef(false);
  const isMainListening = useRef(false);

  const didInitWakeRef = useRef(false);
  const didInitMainRecRef = useRef(false);

  // Voice activity UI
  const audioStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Accessibility live region
  const [srStatus, setSrStatus] = useState("");
  const inputRef = useRef(null);

  // ==========================
  // ✅ TTS (Text-to-Speech)
  // ==========================
  const ttsEnabledRef = useRef(true);
  const speakingRef = useRef(false);
  const lastSpokenRef = useRef("");
  const voiceRef = useRef(null);
  const lastBotAnswerRef = useRef("");

  const stopTTS = () => {
    try {
      window.speechSynthesis.cancel();
    } catch { }
    speakingRef.current = false;
  };

  const pickVoice = () => {
    try {
      const voices = window.speechSynthesis.getVoices?.() || [];
      const v =
        voices.find((x) => /en/i.test(x.lang) && /female|natural|enhanced/i.test(x.name)) ||
        voices.find((x) => /en/i.test(x.lang)) ||
        voices[0];
      voiceRef.current = v || null;
    } catch { }
  };

  const speak = (text, { interrupt = true } = {}) => {
    const t = (text || "").trim();
    if (!t) return;
    if (!("speechSynthesis" in window)) return;
    if (!ttsEnabledRef.current) return;

    const key = t.slice(0, 220);
    if (lastSpokenRef.current === key && speakingRef.current) return;
    lastSpokenRef.current = key;

    try {
      if (interrupt) window.speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(t);
      u.lang = "en-US";
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = 1;
      u.pitch = 1;

      u.onstart = () => (speakingRef.current = true);
      u.onend = () => (speakingRef.current = false);
      u.onerror = () => (speakingRef.current = false);

      window.speechSynthesis.speak(u);
    } catch { }
  };

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    pickVoice();
    const onVoices = () => pickVoice();
    window.speechSynthesis.onvoiceschanged = onVoices;
    return () => {
      try {
        window.speechSynthesis.onvoiceschanged = null;
      } catch { }
    };
  }, []);

  const WAKE_WORDS = ["hey", "hi", "hello", "ok buddy", "ok budy", "sci buddy", "ChatBoty"];
  const SEND_WORDS = ["send", "submit", "go"];

  // Voice control words
  const STOP_WORDS = ["stop listening", "stop", "pause listening", "pause", "cancel"];
  const START_WORDS = ["start listening", "listen", "resume listening", "resume"];
  const CLOSE_WORDS = ["close chat", "close", "exit"];
  const MINIMIZE_WORDS = ["minimize chat", "minimize"];
  const CLEAR_WORDS = ["clear chat", "clear"];

  // (optional) TTS voice commands
  const MUTE_WORDS = ["mute", "disable speech", "stop speaking"];
  const UNMUTE_WORDS = ["unmute", "enable speech", "start speaking"];
  const REPEAT_WORDS = ["repeat", "say again"];

  const sizeConfig = {
    small: { width: 340, height: 500 },
    medium: { width: 420, height: 650 },
    large: { width: 500, height: 800 },
  };

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  // ✅ NEW: robust restart for unlimited voice Qs (prevents stopping after 2nd question)
  const safeRestartMainListening = async () => {
    const rec = recognitionRef.current;
    if (!rec) return;

    // stop wake word to avoid conflicts
    try {
      wakeWordRecognitionRef.current?.stop?.();
    } catch { }

    // already listening
    if (isMainListening.current) return;

    // retry start (Chrome sometimes fails if restart is too fast)
    for (let i = 0; i < 8; i++) {
      try {
        rec.start();
        isMainListening.current = true;
        return;
      } catch (e) {
        await wait(450);
      }
    }

    // fallback: wake word mode if restart still fails
    if (voiceReady) startWakeWord();
  };

  const getThemeColors = () => {
    if (theme === "dark") {
      return {
        header: "bg-slate-800 border-b border-slate-700",
        bg: "bg-slate-900",
        inputBg: "bg-slate-800 border-slate-700 text-white",
        userBubble: "bg-emerald-600 text-white shadow-md shadow-emerald-900/20",
        botBubble: "bg-slate-800 text-slate-200 border border-slate-700 shadow-sm",
        bubbleBtn: "bg-emerald-600 hover:bg-emerald-500",
        iconBtn: "hover:bg-slate-700 text-slate-400 hover:text-white",
      };
    } else if (theme === "blue") {
      return {
        header: "bg-indigo-600 text-white",
        bg: "bg-indigo-50",
        inputBg: "bg-white border-indigo-200 text-slate-800 focus:ring-indigo-400",
        userBubble: "bg-indigo-600 text-white shadow-md shadow-indigo-500/30",
        botBubble: "bg-white text-slate-700 border border-indigo-100 shadow-sm",
        bubbleBtn: "bg-indigo-600 hover:bg-indigo-500",
        iconBtn: "hover:bg-white/20 text-indigo-100 hover:text-white",
      };
    }
    return {
      header: "bg-blue-600 text-white",
      bg: "bg-gray-50",
      inputBg: "bg-white border-gray-200 text-slate-800 focus:ring-blue-400",
      userBubble: "bg-blue-600 text-white shadow-md shadow-blue-500/30",
      botBubble: "bg-white text-slate-700 border border-gray-200 shadow-sm",
      bubbleBtn: "bg-blue-600 hover:bg-blue-500",
      iconBtn: "hover:bg-white/20 text-blue-100 hover:text-white",
    };
  };

  const currentTheme = getThemeColors();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen, isMinimized]);

  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.3);
      osc.onended = () => ctx.close();
    } catch { }
  };

  const playEndBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.18);
      osc.onended = () => ctx.close();
    } catch { }
  };

  const askFlaskBackend = async (overrideQuestion) => {
    const q = (overrideQuestion ?? input).trim();
    if (!q) return;

    setMessages((prev) => [...prev, { id: Date.now(), text: q, sender: "user", timestamp: new Date() }]);
    setSrStatus(`You said: ${q}`);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/scibot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();

      const answerText = data?.answer || "Sorry, I did not find an answer.";
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: answerText, sender: "bot", timestamp: new Date() }]);
      setSrStatus(`ChatBot answered: ${answerText}`);
      hapticNotify('1');

      lastBotAnswerRef.current = answerText;
      speak(answerText, { interrupt: true });
    } catch {
      const errMsg = "I'm having trouble connecting to my brain server. Please try again.";
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, text: errMsg, sender: "bot", isError: true, timestamp: new Date() },
      ]);
      setSrStatus("Error: cannot connect to server.");

      lastBotAnswerRef.current = errMsg;
      speak(errMsg, { interrupt: true });
    }

    setLoading(false);
  };

  const normalizeText = (t) => (t || "").toLowerCase().replace(/\s+/g, " ").trim();

  const stripTrailingCommand = (text, commands) => {
    const t = normalizeText(text);
    for (const cmd of commands) {
      const escaped = cmd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b${escaped}\\b[\\s\\.!?,]*$`, "i");
      if (re.test(t)) return { matched: cmd, cleaned: t.replace(re, "").trim() };
    }
    return { matched: null, cleaned: t };
  };

  // Stop everything
  const stopAllListening = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch { }
    try {
      wakeWordRecognitionRef.current?.stop?.();
    } catch { }
    isMainListening.current = false;
    isWakeListening.current = false;
    setIsRecording(false);
    stopVoiceActivity();
    setSrStatus("Stopped all listening.");
    stopTTS();
  };

  const stopVoiceActivity = () => {
    try {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } catch { }
    rafRef.current = null;
    try {
      audioStreamRef.current?.getTracks?.().forEach((t) => t.stop());
    } catch { }
    audioStreamRef.current = null;
    try {
      audioCtxRef.current?.close?.();
    } catch { }
    audioCtxRef.current = null;
    analyserRef.current = null;
    setIsSpeaking(false);
  };

  // ✅ CLOSE ON STOP + show refresh overlay
  const stopMainListening = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch { }
    isMainListening.current = false;
    setIsRecording(false);
    stopVoiceActivity();

    setIsOpen(false);
    setIsMinimized(false);

    // ✅ show refresh notice overlay
    setNeedsRefreshNotice(true);

    setSrStatus("Stopped listening. Refresh the page to start a new chat.");
    speak("Stopped listening. Please refresh the page to start a new chat.", { interrupt: true });

    // keep wake word alive (optional)
    if (voiceReady) startWakeWord();
  };

  const startVoiceActivity = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      audioStreamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.fftSize);
      const gate = 0.02;
      const onNeed = 3;
      const offNeed = 10;
      let on = 0;
      let off = 0;

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          const v = (buffer[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buffer.length);
        const speaking = rms > gate;

        if (speaking) {
          on++;
          off = 0;
        } else {
          off++;
          on = 0;
        }
        if (!isSpeaking && on >= onNeed) setIsSpeaking(true);
        if (isSpeaking && off >= offNeed) setIsSpeaking(false);

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setMicPermission("denied");
      setIsSpeaking(false);
    }
  };

  const toggleRecording = async () => {
    const rec = recognitionRef.current;
    const wakeRec = wakeWordRecognitionRef.current;
    if (!rec) return;

    if (!isMainListening.current) {
      finalTranscriptBuffer.current = "";
      setInput("");
      setSrStatus("Listening. Ask your question, then say 'send'.");
      if (wakeRec && isWakeListening.current) {
        try {
          wakeRec.stop();
        } catch { }
      }
      await startVoiceActivity();
      try {
        rec.start();
        isMainListening.current = true;
      } catch {
        isMainListening.current = false;
      }
    } else {
      stopMainListening();
    }
  };

  // MAIN recognition init
  useEffect(() => {
    if (didInitMainRecRef.current) return;
    didInitMainRecRef.current = true;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSrStatus("Speech recognition is not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => {
      setIsRecording(true);
      isMainListening.current = true;
      playBeep();
    };

    rec.onend = () => {
      setIsRecording(false);
      isMainListening.current = false;
      playEndBeep();
      stopVoiceActivity();

      if (voiceReady && !isMainListening.current) startWakeWord();
    };

    rec.onresult = (e) => {
      let interim = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;

        if (e.results[i].isFinal) {
          finalTranscriptBuffer.current += transcript + " ";
          const combined = (finalTranscriptBuffer.current || "").trim();
          const norm = normalizeText(combined);

          if (MUTE_WORDS.some((w) => norm.includes(w))) {
            ttsEnabledRef.current = false;
            stopTTS();
            setSrStatus("Speech muted.");
            finalTranscriptBuffer.current = "";
            setInput("");
            return;
          }
          if (UNMUTE_WORDS.some((w) => norm.includes(w))) {
            ttsEnabledRef.current = true;
            setSrStatus("Speech enabled.");
            speak("Speech enabled.", { interrupt: true });
            finalTranscriptBuffer.current = "";
            setInput("");
            return;
          }
          if (REPEAT_WORDS.some((w) => norm.includes(w))) {
            const lastBot = lastBotAnswerRef.current;
            if (lastBot) speak(lastBot, { interrupt: true });
            finalTranscriptBuffer.current = "";
            setInput("");
            return;
          }

          if (CLEAR_WORDS.some((w) => norm.includes(w))) {
            setMessages([]);
            finalTranscriptBuffer.current = "";
            setInput("");
            setSrStatus("Chat cleared.");
            return;
          }

          if (MINIMIZE_WORDS.some((w) => norm.includes(w))) {
            setIsMinimized(true);
            setSrStatus("Minimized.");
            return;
          }

          if (CLOSE_WORDS.some((w) => norm.includes(w))) {
            setIsOpen(false);
            setIsMinimized(false);
            setSrStatus("Closed.");
            stopAllListening();
            return;
          }

          // STOP words -> close + refresh notice
          if (STOP_WORDS.some((w) => norm.includes(w))) {
            finalTranscriptBuffer.current = "";
            setInput("");
            stopMainListening();
            return;
          }

          if (START_WORDS.some((w) => norm.includes(w))) {
            finalTranscriptBuffer.current = "";
            setInput("");
            setIsOpen(true);
            setIsMinimized(false);
            setSrStatus("Starting listening.");
            if (!isMainListening.current) toggleRecording();
            return;
          }

          const { matched: sendCmd, cleaned } = stripTrailingCommand(combined, SEND_WORDS);
          if (sendCmd) {
            const questionToSend = cleaned.trim();
            finalTranscriptBuffer.current = "";
            setInput("");

            if (questionToSend) {
              setSrStatus("Sending your question.");
              try {
                rec.stop();
              } catch { }

              askFlaskBackend(questionToSend).finally(() => {
                setIsOpen(true);
                setIsMinimized(false);

                setTimeout(async () => {
                  await safeRestartMainListening();
                  setSrStatus("Listening. Ask your next question, then say 'send'.");
                }, 900);
              });
            } else {
              setSrStatus("Please say a question before 'send'.");
            }
            return;
          }
        } else {
          interim += transcript;
        }
      }

      setInput((finalTranscriptBuffer.current + interim).trim());
    };

    rec.onerror = () => {
      setIsRecording(false);
      isMainListening.current = false;
      stopVoiceActivity();
      setSrStatus("Voice error. Please try again.");
      if (voiceReady) startWakeWord();
    };

    recognitionRef.current = rec;
  }, [voiceReady]);

  const startWakeWord = () => {
    const wakeRec = wakeWordRecognitionRef.current;
    if (!wakeRec || isWakeListening.current || isMainListening.current) return;
    try {
      wakeRec.start();
      isWakeListening.current = true;
    } catch { }
  };

  // Wake word init
  useEffect(() => {
    if (!voiceReady) return;
    if (didInitWakeRef.current) return;
    didInitWakeRef.current = true;

    const initWake = async () => {
      await wait(300);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const wakeRec = new SpeechRecognition();
      wakeRec.lang = "en-US";
      wakeRec.continuous = true;
      wakeRec.interimResults = false;

      wakeRec.onstart = () => (isWakeListening.current = true);
      wakeRec.onend = () => {
        isWakeListening.current = false;
        if (!isMainListening.current) setTimeout(() => startWakeWord(), 300);
      };
      wakeRec.onerror = () => {
        isWakeListening.current = false;
        if (!isMainListening.current) setTimeout(() => startWakeWord(), 400);
      };

      wakeRec.onresult = (e) => {
        const text = (e.results?.[0]?.[0]?.transcript || "").toLowerCase();

        if (WAKE_WORDS.some((w) => text.includes(w))) {
          playBeep();
          setIsOpen(true);
          setIsMinimized(false);
          setNeedsRefreshNotice(false); // ✅ hide refresh notice if user opens again
          setSrStatus("ChatBot opened. Listening. Ask your question then say 'send'.");

          speak("ChatBot opened. Ask your question, then say send.", { interrupt: true });

          try {
            wakeRec.stop();
          } catch { }

          setTimeout(() => {
            if (!isMainListening.current) toggleRecording();
          }, 300);
        }
      };

      wakeWordRecognitionRef.current = wakeRec;
      startWakeWord();
    };

    initWake();

    return () => {
      try {
        wakeWordRecognitionRef.current?.stop?.();
      } catch { }
    };
  }, [voiceReady]);

  // Permissions watcher
  useEffect(() => {
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "microphone" })
        .then((res) => {
          setMicPermission(res.state);
          res.onchange = () => setMicPermission(res.state);
        })
        .catch(() => { });
    }
  }, []);

  const requestMicAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
      setSrStatus("Microphone access granted.");
      speak("Microphone access granted.", { interrupt: true });
    } catch {
      setMicPermission("denied");
      setSrStatus("Microphone access denied.");
      speak("Microphone access denied.", { interrupt: true });
    }
  };

  const enableVoiceNow = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
    } catch { }
    setVoiceReady(true);
    setNeedsVoiceEnable(false);
    setSrStatus("Voice assistant enabled. Say hi or hey to openChatBot.");
    speak("Voice assistant enabled. Say hi or hey to open ChatBot.", { interrupt: true });
  };

  // Speak overlay instructions when site starts
  useEffect(() => {
    if (!needsVoiceEnable) return;
    speak(
      "Voice assistant setup. Press Enter or Space to enable voice mode. After that, say hi or hey to open ChatBot. Say stop listening to close.",
      { interrupt: true }
    );
  }, [needsVoiceEnable]);

  useEffect(() => {
    if (!needsVoiceEnable) return;
    const onKey = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        speak("Enabling voice mode.", { interrupt: true });
        enableVoiceNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [needsVoiceEnable]);

  // ✅ NEW: keyboard support for refresh overlay + autofocus
  useEffect(() => {
    if (!needsRefreshNotice) return;

    setTimeout(() => refreshBtnRef.current?.focus?.(), 50);

    const onKey = (e) => {
      if (e.key === "Escape") {
        setNeedsRefreshNotice(false);
        setSrStatus("Closed refresh notice.");
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [needsRefreshNotice]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        stopAllListening();
        setIsOpen(false);
        setIsMinimized(false);
      }
      if (e.ctrlKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleRecording();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((p) => !p);
        setIsMinimized(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Drag
  const handleMouseDown = (e) => {
    if (isOpen) return;
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      setPosition({
        x: Math.min(Math.max(e.clientX - dragOffset.x, 0), window.innerWidth - 80),
        y: Math.min(Math.max(e.clientY - dragOffset.y, 0), window.innerHeight - 80),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    setIsMinimized(false);
  };

  const cycleChatSize = () =>
    setChatSize((prev) => (prev === "small" ? "medium" : prev === "medium" ? "large" : "small"));

  const currentSize = sizeConfig[chatSize];
  const popupWidth = isMinimized ? 320 : currentSize.width;
  const popupHeight = isMinimized ? 64 : currentSize.height;

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {srStatus}
      </div>

      {/* ✅ NEW: Accessible refresh notice overlay */}
      {needsRefreshNotice && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Refresh to start a new chat"
        >
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-[90%]">
            <button
              onClick={() => setNeedsRefreshNotice(false)}
              aria-label="Close"
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-xl"
            >
              ×
            </button>

            <h2 className="text-lg font-bold mb-2">Start a New Chat</h2>
            <p className="text-sm text-slate-600 mb-4">
              Voice listening has stopped and the chat is closed.
              <br />
              To start a <b>fresh new chat</b>, please refresh this page.
            </p>

            <button
              ref={refreshBtnRef}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 flex items-center justify-center gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Now
            </button>

            <div className="mt-3 text-[12px] text-slate-500">
              Shortcut: <b>Ctrl + R</b> (Windows) / <b>Cmd + R</b> (Mac)
              <br />
              Tip: Press <b>Enter</b> or <b>Space</b> to refresh • <b>Esc</b> to close this message
            </div>
          </div>
        </div>
      )}

      {/* Accessible voice enable overlay */}
      {needsVoiceEnable && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Enable voice assistant"
        >
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-[90%]">
            <button
              onClick={() => setNeedsVoiceEnable(false)}
              aria-label="Close"
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-xl"
            >
              ×
            </button>

            <h2 className="text-lg font-bold mb-2">Enable Voice Assistant</h2>
            <p className="text-sm text-slate-600 mb-4">
              For privacy, your browser needs one keyboard action to start voice listening.
              <br />
              Press <b>Enter</b> (or <b>Space</b>) to enable. After that, say <b>“hi”</b> or <b>“hey”</b> to open ChatBot.
            </p>

            <button
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500"
              onClick={enableVoiceNow}
              autoFocus
            >
              Press Enter to Enable
            </button>

            <p className="text-[11px] text-slate-500 mt-3">Tip: Works with screen readers. No mouse needed.</p>
          </div>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`fixed z-50 transition-all duration-300 select-none ${isDragging ? "cursor-grabbing scale-110" : "cursor-pointer hover:scale-105"
          } ${isOpen ? "opacity-0 pointer-events-none translate-y-10" : "opacity-100"}`}
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
        onClick={() => !isDragging && toggleChat()}
        title="Open ChatBot"
      >
        <div
          className={`w-16 h-16 ${currentTheme.bubbleBtn} rounded-full shadow-xl flex items-center justify-center relative ring-4 ring-white/20 backdrop-blur-sm`}
        >
          <span className="absolute inset-0 rounded-full ring-2 ring-white/30 animate-pulse" />
          <Atom className="w-8 h-8 text-white drop-shadow-md" />
        </div>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={() => setIsMinimized(true)} />

          <div
            className={`fixed ${currentTheme.bg} rounded-3xl shadow-2xl border border-white/20 flex flex-col overflow-hidden z-50 transition-all duration-500 ease-out`}
            style={{ right: 24, bottom: 24, width: popupWidth, height: popupHeight }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 ${currentTheme.header}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Atom className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-wide">ChatBot</h3>
                  <p className="text-xs opacity-80">Voice: say “stop listening” to close • refresh for new chat</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={stopMainListening}
                  className="p-2 rounded-lg bg-red-500/90 text-white hover:bg-red-500 transition-colors"
                  title="Stop listening (close)"
                  aria-label="Stop listening (close)"
                >
                  <PauseCircle className="w-4 h-4" />
                </button>

                {!isMinimized && (
                  <button
                    onClick={() => setMessages([])}
                    className={`p-2 rounded-lg ${currentTheme.iconBtn} transition-colors`}
                    title="Clear Chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={cycleChatSize} className={`p-2 rounded-lg ${currentTheme.iconBtn} transition-colors`}>
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className={`p-2 rounded-lg ${currentTheme.iconBtn} transition-colors`}
                >
                  <span className="leading-none text-lg font-bold">{isMinimized ? "□" : "−"}</span>
                </button>
                <button
                  onClick={() => {
                    stopAllListening();
                    toggleChat();
                  }}
                  className={`p-2 rounded-lg ${currentTheme.iconBtn} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div className={`flex max-w-[85%] gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isUser ? "bg-indigo-100 text-indigo-600" : "bg-blue-100 text-blue-600"
                              }`}
                          >
                            {isUser ? <User size={16} /> : <Bot size={16} />}
                          </div>
                          <div
                            className={`p-3.5 rounded-2xl text-sm leading-relaxed ${isUser
                                ? currentTheme.userBubble + " rounded-tr-none"
                                : currentTheme.botBubble + " rounded-tl-none"
                              }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex gap-2 p-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Bot size={16} />
                        </div>
                        <div
                          className={`px-4 py-3 rounded-2xl rounded-tl-none ${currentTheme.botBubble} flex items-center gap-1.5`}
                        >
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div
                  className={`p-4 ${theme === "dark" ? "bg-slate-800" : "bg-white"} border-t ${theme === "dark" ? "border-slate-700" : "border-gray-100"
                    }`}
                >
                  {micPermission !== "granted" && (
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-xs text-slate-500">Enable microphone for voice chat</span>
                      <button onClick={requestMicAccess} className="text-xs font-medium text-blue-600 hover:underline">
                        Allow Access
                      </button>
                    </div>
                  )}

                  {isRecording && (
                    <div className="flex items-center gap-2 mb-3 px-1 animate-pulse">
                      <span className="text-xs font-semibold text-red-500">Listening… say “send” or “stop listening”</span>
                    </div>
                  )}

                  <div className="relative flex items-center gap-2">
                    <textarea
                      ref={inputRef}
                      className={`w-full ${currentTheme.inputBg} rounded-2xl pl-4 pr-24 py-3.5 text-sm outline-none focus:ring-2 resize-none shadow-sm transition-all`}
                      rows={1}
                      style={{ minHeight: "52px", maxHeight: "120px" }}
                      placeholder="Ask a question..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          askFlaskBackend();
                        }
                      }}
                    />
                    <div className="absolute right-2 top-1.5 flex items-center gap-1">
                      <button
                        onClick={toggleRecording}
                        className={`p-2 rounded-xl transition-all duration-300 ${isRecording
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105"
                            : "hover:bg-slate-100 text-slate-500"
                          }`}
                        title="Voice Input"
                      >
                        <Mic className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => askFlaskBackend()}
                        disabled={!input.trim() || loading}
                        className={`p-2 rounded-xl transition-all duration-300 ${!input.trim() || loading
                            ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                            : `${currentTheme.bubbleBtn} text-white shadow-lg shadow-blue-500/30`
                          }`}
                      >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400">Voice: “hi” open • “send” submit • “stop listening” close</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default ChatBox;
