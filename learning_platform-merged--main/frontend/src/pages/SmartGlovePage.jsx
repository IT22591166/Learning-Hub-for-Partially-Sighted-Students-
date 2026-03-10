import { useState } from 'react'

export default function SmartGlovePage() {
    const [isConnected, setIsConnected] = useState(false)
    const [batteryLevel] = useState(85)

    const [settings, setSettings] = useState({
        hapticEnabled: true,
        vibrationIntensity: 70,
        inputFeedback: {
            enabled: true,
            buttonPress: true,
            gestureRecognition: true,
            touchConfirmation: true,
            intensity: 60
        },
        outputFeedback: {
            enabled: true,
            navigationCues: true,
            objectDetectionAlerts: true,
            textReadingPulse: true,
            errorWarnings: true,
            successConfirmation: true,
            intensity: 75
        },
        patterns: {
            navigationPattern: 'pulse',
            alertPattern: 'urgent',
            confirmationPattern: 'double-tap'
        }
    })

    const toggle = (path) => {
        setSettings(prev => {
            const keys = path.split('.')
            const next = { ...prev }
            let obj = next
            for (let i = 0; i < keys.length - 1; i++) {
                obj[keys[i]] = { ...obj[keys[i]] }
                obj = obj[keys[i]]
            }
            obj[keys[keys.length - 1]] = !obj[keys[keys.length - 1]]
            return next
        })
    }

    const setSlider = (path, val) => {
        setSettings(prev => {
            const keys = path.split('.')
            const next = { ...prev }
            let obj = next
            for (let i = 0; i < keys.length - 1; i++) {
                obj[keys[i]] = { ...obj[keys[i]] }
                obj = obj[keys[i]]
            }
            obj[keys[keys.length - 1]] = parseInt(val)
            return next
        })
    }

    const setPattern = (type, val) => {
        setSettings(prev => ({ ...prev, patterns: { ...prev.patterns, [type]: val } }))
    }

    const showToast = (msg) => {
        let el = document.getElementById('glove-toast')
        if (!el) {
            el = document.createElement('div')
            el.id = 'glove-toast'
            el.setAttribute('role', 'status')
            el.setAttribute('aria-live', 'polite')
            Object.assign(el.style, {
                position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.85)', color: '#fff', padding: '0.75rem 1.25rem',
                borderRadius: '8px', fontSize: '0.9rem', zIndex: '9999', maxWidth: '90%', textAlign: 'center'
            })
            document.body.appendChild(el)
        }
        el.textContent = msg
        el.style.display = 'block'
        clearTimeout(showToast._tid)
        showToast._tid = setTimeout(() => el.style.display = 'none', 3000)
    }

    const Toggle = ({ checked, onChange, small }) => (
        <label className={`toggle-switch${small ? ' small' : ''}`}>
            <input type="checkbox" checked={checked} onChange={onChange} />
            <span className="toggle-slider" />
        </label>
    )

    const Slider = ({ path, value }) => (
        <div className="slider-control">
            <input type="range" min="0" max="100" value={value} onChange={e => setSlider(path, e.target.value)} />
            <span className="slider-value">{value}%</span>
        </div>
    )

    return (
        <div className="smart-glove-page">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>🧤 Smart Glove Settings</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure haptic feedback for inputs and outputs</p>
            </div>

            {/* Connection */}
            <section className="settings-section">
                <div className="connection-status">
                    <div className="status-info">
                        <span className={`status-indicator ${isConnected ? 'connected' : ''}`} />
                        <div>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{isConnected ? 'Glove Connected' : 'Glove Disconnected'}</h3>
                            {isConnected && (
                                <p className="battery-info">
                                    🔋 Battery: {batteryLevel}%
                                    <span className="battery-bar"><span className="battery-level" style={{ width: `${batteryLevel}%` }} /></span>
                                </p>
                            )}
                        </div>
                    </div>
                    <button className={`connect-button ${isConnected ? 'disconnect' : ''}`} onClick={() => setIsConnected(!isConnected)}>
                        {isConnected ? 'Disconnect' : 'Connect Glove'}
                    </button>
                </div>
            </section>

            {/* Global */}
            <section className="settings-section">
                <div className="section-header"><h2>⚡ Global Haptic Settings</h2></div>
                <div className="setting-item">
                    <div className="setting-info"><h3>Enable Haptic Feedback</h3><p>Turn all haptic feedback on or off</p></div>
                    <Toggle checked={settings.hapticEnabled} onChange={() => toggle('hapticEnabled')} />
                </div>
                {settings.hapticEnabled && (
                    <div className="setting-item">
                        <div className="setting-info"><h3>Master Vibration Intensity</h3></div>
                        <Slider path="vibrationIntensity" value={settings.vibrationIntensity} />
                    </div>
                )}
            </section>

            {/* Input Feedback */}
            {settings.hapticEnabled && (
                <section className="settings-section">
                    <div className="section-header"><h2>👆 Input Feedback</h2><p>Haptic responses when you interact with the glove</p></div>
                    <div className="setting-item">
                        <div className="setting-info"><h3>Enable Input Feedback</h3></div>
                        <Toggle checked={settings.inputFeedback.enabled} onChange={() => toggle('inputFeedback.enabled')} />
                    </div>
                    {settings.inputFeedback.enabled && (
                        <>
                            <div className="sub-settings">
                                {[['Button Press', 'buttonPress'], ['Gesture Recognition', 'gestureRecognition'], ['Touch Confirmation', 'touchConfirmation']].map(([label, key]) => (
                                    <div className="setting-item" key={key}>
                                        <div className="setting-info"><h4>{label}</h4></div>
                                        <Toggle small checked={settings.inputFeedback[key]} onChange={() => toggle(`inputFeedback.${key}`)} />
                                    </div>
                                ))}
                            </div>
                            <div className="setting-item">
                                <div className="setting-info"><h3>Input Intensity</h3></div>
                                <Slider path="inputFeedback.intensity" value={settings.inputFeedback.intensity} />
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* Output Feedback */}
            {settings.hapticEnabled && (
                <section className="settings-section">
                    <div className="section-header"><h2>📤 Output Feedback</h2><p>Haptic responses from app notifications</p></div>
                    <div className="setting-item">
                        <div className="setting-info"><h3>Enable Output Feedback</h3></div>
                        <Toggle checked={settings.outputFeedback.enabled} onChange={() => toggle('outputFeedback.enabled')} />
                    </div>
                    {settings.outputFeedback.enabled && (
                        <>
                            <div className="sub-settings">
                                {[['Navigation Cues', 'navigationCues'], ['Object Detection Alerts', 'objectDetectionAlerts'],
                                ['Text Reading Pulse', 'textReadingPulse'], ['Error Warnings', 'errorWarnings'],
                                ['Success Confirmation', 'successConfirmation']].map(([label, key]) => (
                                    <div className="setting-item" key={key}>
                                        <div className="setting-info"><h4>{label}</h4></div>
                                        <Toggle small checked={settings.outputFeedback[key]} onChange={() => toggle(`outputFeedback.${key}`)} />
                                    </div>
                                ))}
                            </div>
                            <div className="setting-item">
                                <div className="setting-info"><h3>Output Intensity</h3></div>
                                <Slider path="outputFeedback.intensity" value={settings.outputFeedback.intensity} />
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* Patterns */}
            {settings.hapticEnabled && (
                <section className="settings-section">
                    <div className="section-header"><h2>〰️ Vibration Patterns</h2></div>
                    {[['Navigation Pattern', 'navigationPattern', ['pulse', 'wave', 'tap']],
                    ['Alert Pattern', 'alertPattern', ['gentle', 'moderate', 'urgent']],
                    ['Confirmation Pattern', 'confirmationPattern', ['single-tap', 'double-tap', 'long']]].map(([label, key, options]) => (
                        <div key={key} style={{ marginBottom: '0.75rem' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>{label}</h4>
                            <div className="pattern-options">
                                {options.map(opt => (
                                    <button key={opt} className={`pattern-button ${settings.patterns[key] === opt ? 'active' : ''}`}
                                        onClick={() => setPattern(key, opt)}>
                                        {opt.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* Actions */}
            <div className="settings-actions">
                <button className="action-button" onClick={() => showToast('📳 Haptic test signal sent!')}>📳 Test Feedback</button>
                <button className="action-button" onClick={() => {
                    setSettings(s => ({
                        ...s, hapticEnabled: true, vibrationIntensity: 70,
                        inputFeedback: { enabled: true, buttonPress: true, gestureRecognition: true, touchConfirmation: true, intensity: 60 },
                        outputFeedback: { enabled: true, navigationCues: true, objectDetectionAlerts: true, textReadingPulse: true, errorWarnings: true, successConfirmation: true, intensity: 75 },
                        patterns: { navigationPattern: 'pulse', alertPattern: 'urgent', confirmationPattern: 'double-tap' }
                    }))
                    showToast('🔄 Settings reset to defaults')
                }}>🔄 Reset Defaults</button>
                <button className="action-button save-button" onClick={() => {
                    localStorage.setItem('smartGloveSettings', JSON.stringify(settings))
                    showToast('💾 Settings saved!')
                }}>💾 Save Settings</button>
            </div>
        </div>
    )
}
