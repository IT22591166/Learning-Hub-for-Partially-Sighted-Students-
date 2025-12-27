import { useState, useEffect } from 'react'
import './App.css'
import SmartGloveSettings from './components/SmartGloveSettings'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved !== null ? JSON.parse(saved) : true
  })
  
  const [currentView, setCurrentView] = useState('home')

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const toggleTheme = () => {
    setDarkMode(!darkMode)
  }

  const features = [
    {
      id: 1,
      title: 'Curriculum',
      description: 'Access learning materials and courses',
      icon: '📚',
      color: '#4CAF50'
    },
    {
      id: 2,
      title: 'Object Recognition',
      description: 'Identify objects using AI vision',
      icon: '👁️',
      color: '#2196F3'
    },
    {
      id: 3,
      title: 'Smart Glove Settings',
      description: 'Configure your smart glove device',
      icon: '🧤',
      color: '#FF9800'
    },
    {
      id: 4,
      title: 'AI Tutor',
      description: 'Get personalized learning assistance',
      icon: '🤖',
      color: '#9C27B0'
    }
  ]

  const handleFeatureClick = (feature) => {
    if (feature.title === 'Smart Glove Settings') {
      setCurrentView('smart-glove')
    } else {
      console.log(`Navigating to ${feature.title}`)
      // Navigation will be added later with React Router
    }
  }

  const handleBackToHome = () => {
    setCurrentView('home')
  }

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-logo"></span>
          <span className="nav-title">Learning Hub</span>
        </div>
        
        <ul className="nav-links">
          <li><a href="#home" className="nav-link active">Home</a></li>
          <li><a href="#curriculum" className="nav-link">Curriculum</a></li>
          <li><a href="#about" className="nav-link">About</a></li>
          <li><a href="#contact" className="nav-link">Contact</a></li>
        </ul>

        <div className="nav-actions">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg className="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg className="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {currentView === 'smart-glove' ? (
        <SmartGloveSettings onBack={handleBackToHome} />
      ) : (
        <>
          <header className="header">
            <h1>Learning Hub</h1>
            <p className="subtitle">For Partially Sighted Students</p>
          </header>

          <main className="features-container">
            {features.map((feature) => (
              <button
                key={feature.id}
                className="feature-button"
                style={{ '--feature-color': feature.color }}
                onClick={() => handleFeatureClick(feature)}
                aria-label={`${feature.title}: ${feature.description}`}
              >
                <span className="feature-icon">{feature.icon}</span>
                <h2 className="feature-title">{feature.title}</h2>
                <p className="feature-description">{feature.description}</p>
              </button>
            ))}
          </main>

          <footer className="footer">
            <div className="footer-content">
              <div className="footer-section">
                <h3 className="footer-title">Learning Hub</h3>
                <p className="footer-description">
                  Empowering partially sighted students with accessible learning tools and AI-powered assistance.
                </p>
              </div>

              <div className="footer-section">
                <h4 className="footer-heading">Quick Links</h4>
                <ul className="footer-links">
                  <li><a href="#home">Home</a></li>
                  <li><a href="#curriculum">Curriculum</a></li>
                  <li><a href="#about">About Us</a></li>
                  <li><a href="#contact">Contact</a></li>
                </ul>
              </div>

              <div className="footer-section">
                <h4 className="footer-heading">Features</h4>
                <ul className="footer-links">
                  <li><a href="#curriculum">Curriculum</a></li>
                  <li><a href="#object-recognition">Object Recognition</a></li>
                  <li><a href="#smart-glove">Smart Glove</a></li>
                  <li><a href="#ai-tutor">AI Tutor</a></li>
                </ul>
              </div>

              <div className="footer-section">
                <h4 className="footer-heading">Contact Us</h4>
                <ul className="footer-contact">
                  <li>
                    <span className="contact-icon">📧</span>
                    <span>support@learninghub.com</span>
                  </li>
                  <li>
                    <span className="contact-icon">📞</span>
                    <span>+94 11 234 5678</span>
                  </li>
                  <li>
                    <span className="contact-icon">📍</span>
                    <span>Colombo, Sri Lanka</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="footer-bottom">
              <p>&copy; 2025 Learning Hub. All rights reserved.</p>
              <p className="footer-tagline">Designed for accessibility ♿</p>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

export default App
