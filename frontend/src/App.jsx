import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { hapticNotify } from './utils/hapticNotify'
import HomePage from './pages/HomePage'
import SciBotPage from './pages/SciBotPage'
import SmartGlovePage from './pages/SmartGlovePage'
import VoiceActivitiesPage from './pages/VoiceActivitiesPage'
import ObjectRecognitionPage from './pages/ObjectRecognitionPage'


function App() {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode')
        return saved !== null ? JSON.parse(saved) : true
    })
    const location = useLocation()

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
        document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    }, [darkMode])

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/scibot', label: 'AI Tutor' },
        { path: '/smart-glove', label: 'Smart Glove' },
        { path: '/voice-activities', label: 'Voice Learning' },
    ]

    return (
        <div className={`app ${darkMode ? 'dark' : 'light'}`}>
            <nav className="navbar">
                <div className="nav-brand">
                    <span className="nav-logo">📚</span>
                    <Link to="/" className="nav-title">Learning Hub</Link>
                </div>

                <ul className="nav-links">
                    {navLinks.map(link => (
                        <li key={link.path}>
                            <Link
                                to={link.path}
                                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                                onMouseEnter={() => hapticNotify('1')}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="nav-actions">
                    <button
                        className="theme-toggle"
                        onClick={() => setDarkMode(!darkMode)}
                        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        onMouseEnter={() => hapticNotify('1')}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            </nav>

            <main className="main-content">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/scibot" element={<SciBotPage />} />
                    <Route path="/smart-glove" element={<SmartGlovePage />} />
                    <Route path="/voice-activities" element={<VoiceActivitiesPage />} />
                    <Route path="/object-recognition" element={<ObjectRecognitionPage />} />
                </Routes>
            </main>

            <footer className="footer">
                <div className="footer-bottom">
                    <p>© 2026 Learning Hub. All rights reserved.</p>
                    <p className="footer-tagline">Designed for accessibility ♿</p>
                </div>
            </footer>
        </div>
    )
}

export default App
