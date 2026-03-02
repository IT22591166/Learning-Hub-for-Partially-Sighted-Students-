import { useEffect, useRef, useState } from "react";
import { hapticNotify } from "../utils/hapticNotify";
import {
    BookOpen,
    Clock,
    CheckCircle,
    Sun,
    Moon,
    Palette,
    Play,
    Award,
    TrendingUp,
    Sparkles,
    Brain,
    Target,
    Download,
    FileText,
    ClipboardCheck,
    RefreshCw,
    HelpCircle,
    PauseCircle,
    Atom,
    Leaf,
    Bolt,
    ExternalLink,
    Volume2,
} from "lucide-react";
import ChatBox from "../components/ChatBox";

const YT_STATES = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
};

export default function SciBotPage() {
    const videoId = "NeuU4575E48";

    const playerRef = useRef(null);
    const iframeContainerRef = useRef(null);
    const lastTimeRef = useRef(0);
    const tickRef = useRef(null);

    const [duration, setDuration] = useState(0);
    const [watchTime, setWatchTime] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [notes, setNotes] = useState("");
    const [theme, setTheme] = useState("light");
    const [isPlaying, setIsPlaying] = useState(false);

    // Optional: UI-only state (does not change your video logic)
    const [isMutedHint, setIsMutedHint] = useState(false);

    const isDark = theme === "dark";
    const isBlue = theme === "blue";

    const statGradients = {
        blue: "from-blue-500 to-blue-600",
        indigo: "from-indigo-500 to-indigo-600",
        purple: "from-purple-500 to-purple-600",
        emerald: "from-emerald-500 to-emerald-600",
    };

    const formatTime = (sec) => {
        const s = Number.isFinite(sec) ? sec : 0;
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        let mounted = true;

        const ensureYTApi = () =>
            new Promise((resolve) => {
                if (window.YT?.Player) return resolve();

                const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
                if (!existing) {
                    const tag = document.createElement("script");
                    tag.src = "https://www.youtube.com/iframe_api";
                    document.body.appendChild(tag);
                }

                const prev = window.onYouTubeIframeAPIReady;
                window.onYouTubeIframeAPIReady = () => {
                    prev?.();
                    resolve();
                };
            });

        const clearTick = () => {
            if (tickRef.current) {
                clearInterval(tickRef.current);
                tickRef.current = null;
            }
        };

        const startTick = () => {
            clearTick();
            tickRef.current = setInterval(() => {
                const p = playerRef.current;
                if (!p?.getPlayerState) return;

                const state = p.getPlayerState();
                setIsPlaying(state === YT_STATES.PLAYING);

                const d = p.getDuration?.() || 0;
                if (d > 0) setDuration(d);

                if (state === YT_STATES.PLAYING) {
                    const current = p.getCurrentTime?.() || 0;

                    if (current > lastTimeRef.current) {
                        setWatchTime((prev) => prev + (current - lastTimeRef.current));
                    }
                    lastTimeRef.current = current;

                    const pct = d > 0 ? Math.min(Math.round((current / d) * 100), 100) : 0;
                    setProgress(pct);
                }

                if (state === YT_STATES.ENDED) {
                    setIsCompleted(true);
                    setProgress(100);
                }
            }, 500);
        };

        (async () => {
            await ensureYTApi();
            if (!mounted) return;
            if (!iframeContainerRef.current) return;

            playerRef.current = new window.YT.Player(iframeContainerRef.current, {
                videoId,
                width: "100%",
                height: "100%",
                playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1 },
                events: {
                    onReady: (e) => {
                        if (!mounted) return;
                        const d = e.target.getDuration?.() || 0;
                        setDuration(d);
                        lastTimeRef.current = e.target.getCurrentTime?.() || 0;
                        startTick();
                    },
                    onStateChange: (e) => {
                        if (!mounted) return;

                        if (e.data === YT_STATES.PLAYING) {
                            lastTimeRef.current = playerRef.current?.getCurrentTime?.() || 0;
                        }

                        if (e.data === YT_STATES.ENDED) {
                            setIsCompleted(true);
                            setProgress(100);
                        }
                    },
                },
            });
        })();

        return () => {
            mounted = false;
            clearTick();
            try {
                playerRef.current?.destroy?.();
            } catch { }
            playerRef.current = null;
        };
    }, [videoId]);

    // =========================
    // THEME TOKENS (pro UI)
    // =========================
    const pageBg =
        theme === "light"
            ? "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
            : isDark
                ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
                : "bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950";

    const headerBg =
        theme === "light"
            ? "bg-white/75 border-b border-gray-200"
            : isDark
                ? "bg-slate-900/75 border-b border-slate-800"
                : "bg-gradient-to-r from-blue-900/70 via-indigo-900/70 to-slate-900/70 border-b border-blue-800/40";

    const cardBase =
        theme === "light"
            ? "bg-white/80 shadow-xl shadow-blue-100/60 border border-white"
            : isDark
                ? "bg-slate-900/60 shadow-2xl border border-slate-800/60 backdrop-blur-xl"
                : "bg-slate-900/55 shadow-2xl border border-blue-800/35 backdrop-blur-xl";

    const subtleText = theme === "light" ? "text-gray-600" : "text-slate-300";
    const mainText = theme === "light" ? "text-slate-900" : "text-white";
    const hairline = theme === "light" ? "border-gray-200/70" : "border-slate-800/70";

    const accentGlow =
        isBlue || isDark ? "shadow-blue-500/20 shadow-lg" : "shadow-blue-400/25 shadow-lg";

    const pill =
        theme === "light"
            ? "bg-gray-50 border border-gray-200 text-slate-900 hover:bg-gray-100"
            : "bg-slate-800/40 border border-slate-700/70 text-white hover:bg-slate-800/60";

    const primaryBtn =
        theme === "light"
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl"
            : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl";

    const softBtn =
        theme === "light"
            ? "bg-white border border-gray-200 hover:bg-gray-50 text-slate-900"
            : "bg-slate-900/40 border border-slate-700 hover:bg-slate-800/40 text-white";

    const ringFocus =
        theme === "light"
            ? "focus:ring-4 focus:ring-blue-200/60 focus:border-blue-400"
            : "focus:ring-4 focus:ring-blue-500/25 focus:border-blue-500";

    const statItems = [
        { icon: Clock, label: "Watch Time", value: formatTime(watchTime), color: "blue" },
        { icon: TrendingUp, label: "Progress", value: `${progress}%`, color: "indigo" },
        { icon: Target, label: "Duration", value: formatTime(duration), color: "purple" },
        { icon: Award, label: "Status", value: isCompleted ? "Done" : "Learning", color: "emerald" },
    ];

    const learningTips = [
        { icon: Target, text: "Watch without distractions, pause when needed" },
        { icon: BookOpen, text: "Summarize concepts in your own words" },
        { icon: HelpCircle, text: "Ask questions when you feel stuck" },
        { icon: RefreshCw, text: "Rewatch challenging sections" },
    ];

    const quickActions = [
        { icon: Download, text: "Download Materials", desc: "PDFs, worksheets, images" },
        { icon: FileText, text: "View Transcript", desc: "Read along with the lecture" },
        { icon: ClipboardCheck, text: "Take Quiz", desc: "Check understanding quickly" },
    ];

    const keyConcepts = [
        { icon: Bolt, text: "Energy Transfer", tag: "Core" },
        { icon: Atom, text: "Chemical Reactions", tag: "Important" },
        { icon: Leaf, text: "Natural Processes", tag: "Basics" },
    ];

    const progressLabel =
        progress >= 95 ? "Almost finished" : progress >= 60 ? "Great progress" : progress >= 25 ? "Keep going" : "Start learning";

    return (
        <div className={`min-h-screen transition-all duration-700 ${pageBg} relative overflow-x-hidden ${mainText}`}>
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div
                    className={`absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-20 animate-pulse ${theme === "light" ? "bg-blue-400" : "bg-blue-600"
                        }`}
                    style={{ animationDuration: "4s" }}
                />
                <div
                    className={`absolute -bottom-32 -right-28 w-[34rem] h-[34rem] rounded-full blur-3xl opacity-20 animate-pulse ${theme === "light" ? "bg-indigo-400" : "bg-indigo-600"
                        }`}
                    style={{ animationDuration: "6s", animationDelay: "1s" }}
                />
            </div>

            {/* HEADER */}
            <header className={`${headerBg} sticky top-0 z-50 backdrop-blur-xl transition-all duration-500`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Brand */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative flex-shrink-0">
                                <div
                                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ${accentGlow}`}
                                >
                                    <Brain className="text-white" size={20} />
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                            </div>

                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
                                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        Science Learning Hub 
                                    </span>
                                </h1>
                                <p className={`${subtleText} text-xs sm:text-sm flex items-center gap-2`}>
                                    Grade 7 • Interactive Experience
                                    {isPlaying && (
                                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                            <Play size={12} fill="currentColor" /> Live
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Theme switch */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setTheme("light")}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-300 hover:scale-105 ${theme === "light"
                                        ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                        : "border-slate-300/30 hover:border-blue-400 hover:bg-blue-50/10"
                                    }`}
                                aria-label="Switch to light theme"
                                onMouseEnter={() => hapticNotify('3')}
                            >
                                <Sun size={14} />
                                <span className="hidden sm:inline">Light</span>
                            </button>

                            <button
                                onClick={() => setTheme("dark")}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-300 hover:scale-105 ${theme === "dark"
                                        ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                        : "border-slate-300/30 hover:border-emerald-400 hover:bg-emerald-50/10"
                                    }`}
                                aria-label="Switch to dark theme"
                                onMouseEnter={() => hapticNotify('3')}
                            >
                                <Moon size={14} />
                                <span className="hidden sm:inline">Dark</span>
                            </button>

                            <button
                                onClick={() => setTheme("blue")}
                                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-300 hover:scale-105 ${theme === "blue"
                                        ? "border-indigo-400 bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                                        : "border-slate-300/30 hover:border-indigo-400 hover:bg-indigo-50/10"
                                    }`}
                                aria-label="Switch to blue theme"
                                onMouseEnter={() => hapticNotify('3')}
                            >
                                <Palette size={14} />
                                <span>Blue</span>
                            </button>
                        </div>
                    </div>

                    {/* Secondary header row */}
                    <div className={`mt-4 flex flex-wrap items-center gap-2 ${subtleText} text-xs`}>
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${pill}`}>
                            <Sparkles size={14} />
                            {progressLabel}
                        </span>
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${pill}`}>
                            <Clock size={14} />
                            {formatTime(watchTime)} watched
                        </span>
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${pill}`}>
                            <Target size={14} />
                            {formatTime(duration)} total
                        </span>

                        <button
                            onClick={() => setIsMutedHint((p) => !p)}
                            className={`ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${pill}`}
                            title="Accessibility tip"
                            aria-label="Accessibility tip"
                            onMouseEnter={() => hapticNotify('3')}
                        >
                            <Volume2 size={14} />
                            Voice help
                        </button>
                    </div>

                    {isMutedHint && (
                        <div className={`mt-3 rounded-2xl px-4 py-3 text-xs ${cardBase}`}>
                            <p className={`${subtleText} leading-relaxed`}>
                                Tip: Use <b>Ctrl + K</b> to open chat, <b>Ctrl + M</b> to start/stop mic, <b>Esc</b> to stop listening.
                                In chat voice mode: say <b>"hi"</b> to open, <b>"send"</b> to submit, <b>"stop listening"</b> to close.
                            </p>
                        </div>
                    )}
                </div>
            </header>

            {/* STATS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {statItems.map((stat, i) => {
                        const grad = statGradients[stat.color] ?? statGradients.blue;
                        const StatIcon = stat.icon;

                        return (
                            <div
                                key={i}
                                className={`${cardBase} rounded-2xl p-4 transform hover:scale-[1.02] transition-all duration-300 group cursor-pointer`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`${subtleText} text-xs mb-1`}>{stat.label}</p>
                                        <p className={`text-lg sm:text-xl font-extrabold ${mainText}`}>{stat.value}</p>
                                    </div>
                                    <div
                                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity`}
                                    >
                                        <StatIcon className="text-white" size={18} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* MAIN GRID */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-6">
                    {/* HERO VIDEO CARD */}
                    <section className={`${cardBase} rounded-3xl overflow-hidden relative`}>
                        {/* top accent */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                        <div className="p-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className={`text-xl sm:text-2xl font-extrabold leading-tight ${mainText}`}>
                                        Lesson 01 - Plant Diversity (Part 01) | Grade 07 Science in English
                                    </h2>
                                    <p className={`${subtleText} text-sm mt-1`}>
                                        Interactive learning with real-time progress tracking and voice assistant support.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <a
                                        href={`https://www.youtube.com/watch?v=${videoId}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${softBtn} transition-all hover:scale-105`}
                                        title="Open on YouTube"
                                        onMouseEnter={() => hapticNotify('3')}
                                    >
                                        <ExternalLink size={14} />
                                        YouTube
                                    </a>
                                </div>
                            </div>

                            {/* Progress meter */}
                            <div className="mt-5">
                                <div className="flex justify-between mb-2 text-sm">
                                    <span className={`font-semibold flex items-center gap-2 ${mainText}`}>
                                        <TrendingUp size={16} className={theme === "light" ? "text-blue-600" : "text-blue-300"} />
                                        Learning Progress
                                    </span>
                                    <span className="font-extrabold text-blue-600 dark:text-blue-300">{progress}%</span>
                                </div>

                                <div className={`relative w-full h-4 rounded-full overflow-hidden ${theme === "light" ? "bg-slate-200" : "bg-slate-800"}`}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${pill}`}>
                                        <Clock size={14} />
                                        {formatTime(watchTime)} watched
                                    </span>
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${pill}`}>
                                        <Target size={14} />
                                        {formatTime(duration)} total
                                    </span>
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${pill}`}>
                                        <PauseCircle size={14} />
                                        Tip: pause + note
                                    </span>

                                    {isCompleted && (
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                            <CheckCircle size={14} />
                                            Completed
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* VIDEO */}
                        <div className="bg-black relative aspect-video">
                            <div ref={iframeContainerRef} className="absolute inset-0 w-full h-full" />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between text-white/90 text-xs">
                                <span className="px-3 py-1.5 rounded-full bg-black/35 border border-white/10 backdrop-blur-md">
                                    {isPlaying ? "Playing" : "Paused"}
                                </span>
                                <span className="px-3 py-1.5 rounded-full bg-black/35 border border-white/10 backdrop-blur-md">
                                    Progress: {progress}%
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* NOTES CARD */}
                    <section className={`${cardBase} rounded-3xl p-5 sm:p-6`}>
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h3 className={`text-lg font-extrabold flex items-center gap-2 ${mainText}`}>
                                <BookOpen className={theme === "light" ? "text-blue-600" : "text-blue-300"} size={22} />
                                Your Lecture Notes
                            </h3>

                            <span className={`${subtleText} text-xs bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full`}>
                                Auto-saved
                            </span>
                        </div>

                        <textarea
                            className={`w-full h-56 p-4 rounded-2xl border-2 text-sm outline-none transition-all duration-300 resize-none ${ringFocus} ${theme === "light"
                                    ? "bg-gray-50 border-gray-200 text-slate-900 placeholder:text-gray-400"
                                    : "bg-slate-950/30 border-slate-700 text-white placeholder:text-slate-400"
                                }`}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={`Write your key points, questions, and insights here...\n\nTip: Summarize in your own words to remember better!`}
                            aria-label="Lecture notes"
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                            <span className={`${subtleText} text-xs flex items-center gap-2`}>
                                <Brain size={14} />
                                {notes.length} characters
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    className={`px-4 py-2.5 rounded-xl text-sm font-bold ${softBtn} transition-all hover:scale-105`}
                                    onClick={() => setNotes("")}
                                    type="button"
                                    onMouseEnter={() => hapticNotify('3')}
                                >
                                    Clear
                                </button>
                                <button
                                    className={`px-6 py-2.5 rounded-xl text-sm font-extrabold ${primaryBtn} transition-all hover:scale-105`}
                                    type="button"
                                    onMouseEnter={() => hapticNotify('3')}
                                >
                                    Save Notes
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* RIGHT COLUMN */}
                <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
                    {/* Tips */}
                    <section className={`${cardBase} rounded-3xl p-5 sm:p-6`}>
                        <h3 className={`text-lg font-extrabold mb-4 flex items-center gap-2 ${mainText}`}>
                            <Sparkles className="text-yellow-500" size={20} />
                            Pro Learning Tips
                        </h3>

                        <ul className="space-y-3 text-sm">
                            {learningTips.map((tip, i) => {
                                const TipIcon = tip.icon;
                                return (
                                    <li
                                        key={i}
                                        className={`flex gap-3 items-start group cursor-pointer hover:translate-x-1 transition-transform`}
                                    >
                                        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                                            <TipIcon size={16} />
                                        </div>
                                        <span className={`leading-relaxed pt-1 ${mainText}`}>{tip.text}</span>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className={`mt-5 pt-5 border-t ${hairline}`}>
                            <div className={`flex items-center justify-between ${subtleText} text-xs`}>
                                <span className="flex items-center gap-2">
                                    <HelpCircle size={14} />
                                    Need help?
                                </span>
                                <span className="font-semibold">{isCompleted ? "Nice work!" : "Keep going!"}</span>
                            </div>
                        </div>
                    </section>

                    {/* Quick actions */}
                    <section className={`${cardBase} rounded-3xl p-5 sm:p-6`}>
                        <h3 className={`text-lg font-extrabold mb-4 ${mainText}`}>Quick Actions</h3>

                        <div className="space-y-2">
                            {quickActions.map((item, i) => {
                                const ActionIcon = item.icon;
                                return (
                                    <button
                                        key={i}
                                        className={`w-full px-4 py-3 rounded-2xl text-left flex items-center justify-between gap-3 group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${theme === "light"
                                                ? "bg-white border border-gray-200 hover:border-blue-300"
                                                : "bg-slate-900/30 border border-slate-700 hover:border-blue-500/40"
                                            }`}
                                        type="button"
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 border border-blue-500/20 flex items-center justify-center">
                                                <ActionIcon size={18} className={theme === "light" ? "text-blue-700" : "text-blue-300"} />
                                            </span>
                                            <span>
                                                <span className={`block text-sm font-extrabold ${mainText}`}>{item.text}</span>
                                                <span className={`block text-xs ${subtleText}`}>{item.desc}</span>
                                            </span>
                                        </span>

                                        <span className={`text-lg opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${mainText}`}>
                                            →
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Key concepts */}
                    <section className={`${cardBase} rounded-3xl p-5 sm:p-6`}>
                        <h3 className={`text-lg font-extrabold mb-4 ${mainText}`}>Key Concepts</h3>

                        <div className="flex flex-col gap-2">
                            {keyConcepts.map((concept, i) => {
                                const ConceptIcon = concept.icon;
                                return (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border hover:scale-[1.01] transition-transform cursor-pointer ${theme === "light"
                                                ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20"
                                                : "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                                <ConceptIcon size={18} className="text-white" />
                                            </div>
                                            <span className={`text-sm font-extrabold ${mainText}`}>{concept.text}</span>
                                        </div>

                                        <span
                                            className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${theme === "light"
                                                    ? "bg-white/70 border-gray-200 text-slate-800"
                                                    : "bg-slate-900/40 border-slate-700 text-slate-200"
                                                }`}
                                        >
                                            {concept.tag}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </aside>
            </main>

            {/* Chat (kept exactly, just theme props) */}
            <ChatBox theme={theme} isDark={isDark} />
        </div>
    );
}
