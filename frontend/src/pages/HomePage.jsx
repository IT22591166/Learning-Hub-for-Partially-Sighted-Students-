import { Link } from 'react-router-dom'

const features = [
    {
        title: 'AI Tutor (SciBot)',
        description: 'Ask questions about Grade 7 Science and get instant answers from your textbook using AI-powered retrieval.',
        icon: '🤖',
        path: '/scibot',
        color: '#3a45e9',
        badge: 'AI Powered'
    },
    {
        title: 'Object Recognition',
        description: 'Identify objects using AI vision technology designed for partially sighted students.',
        icon: '👁️',
        path: '/object-recognition',
        color: '#3b82f6',
        badge: 'Hardware'
    },
    {
        title: 'Smart Glove Settings',
        description: 'Configure haptic feedback patterns, vibration intensity, and input/output settings for your smart glove.',
        icon: '🧤',
        path: '/smart-glove',
        color: '#f59e0b',
        badge: 'Settings'
    },
    {
        title: 'Voice Learning',
        description: 'Interactive voice-based activities with gamification, emotion detection, and adaptive difficulty for engaging learning.',
        icon: '🎤',
        path: '/voice-activities',
        color: '#10b981',
        badge: '7 Activities'
    }
]

export default function HomePage() {
    return (
        <>
            <div className="home-hero">
                <h1>Learning Hub</h1>
                <p>Empowering partially sighted students with accessible, AI-powered learning tools and assistive technology.</p>
            </div>

            <div className="features-grid">
                {features.map((f) => (
                    <Link
                        key={f.title}
                        to={f.path}
                        className="feature-card"
                        style={{ '--card-accent': f.color }}
                    >
                        <span className="feature-icon">{f.icon}</span>
                        <h2>{f.title}</h2>
                        <p>{f.description}</p>
                        <span className="feature-badge">{f.badge}</span>
                    </Link>
                ))}
            </div>
        </>
    )
}
