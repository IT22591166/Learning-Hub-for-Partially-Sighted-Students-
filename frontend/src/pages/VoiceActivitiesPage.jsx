export default function VoiceActivitiesPage() {
    return (
        <div className="voice-page">
            <div className="voice-header">
                <h1>🎤 Voice Interactive Learning</h1>
                <p>AI-powered voice-based activities with gamification and adaptive difficulty</p>
            </div>

            <iframe
                className="voice-iframe"
                src="/voice-activities/"
                title="Voice Learning Activities"
                allow="microphone; autoplay"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
        </div>
    )
}
