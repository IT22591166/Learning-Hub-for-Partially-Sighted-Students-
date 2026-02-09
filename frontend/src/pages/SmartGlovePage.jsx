import { useState, useEffect, useCallback } from 'react'

const API_BASE = 'http://localhost:5000/api/smart-glove'

export default function SmartGlovePage() {
    const [isConnected, setIsConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [deviceAddress, setDeviceAddress] = useState(null)
    const [connectionError, setConnectionError] = useState(null)
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

    // Check connection status on mount
    useEffect(() => {
        checkConnectionStatus()
    }, [])

    const checkConnectionStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/status`)
            const data = await res.json()
            setIsConnected(data.connected)
            setDeviceAddress(data.device_address)
        } catch (err) {
            console.error('Failed to check status:', err)
        }
    }

    const handleConnect = async () => {
        setIsConnecting(true)
        setConnectionError(null)
        try {
            const res = await fetch(`${API_BASE}/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeout: 15 })
            })
            const data = await res.json()
            if (data.success) {
                setIsConnected(true)
                setDeviceAddress(data.device_address)
                showToast('🧤 Connected to SmartHapticGlove!')
            } else {
                setConnectionError(data.message)
                showToast(`❌ ${data.message}`)
            }
        } catch (err) {
            setConnectionError('Failed to connect to backend')
            showToast('❌ Failed to connect to backend server')
        } finally {
            setIsConnecting(false)
        }
    }

    const handleDisconnect = async () => {
        try {
            const res = await fetch(`${API_BASE}/disconnect`, { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                setIsConnected(false)
                setDeviceAddress(null)
                showToast('🔌 Disconnected from SmartHapticGlove')
            }
        } catch (err) {
            showToast('❌ Failed to disconnect')
        }
    }

    const sendMotorCommand = async (command) => {
        if (!isConnected) {
            showToast('❌ Please connect to glove first')
            return
        }
        try {
            const res = await fetch(`${API_BASE}/motor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            })
            const data = await res.json()
            if (data.success) {
                showToast(`📳 Motor ${command === '3' ? 'both' : command} activated!`)
            } else {
                showToast(`❌ ${data.message}`)
            }
        } catch (err) {
            showToast('❌ Failed to send motor command')
        }
    }

    const sendHapticPattern = async (pattern) => {
        if (!isConnected) {
            showToast('❌ Please connect to glove first')
            return
        }
        try {
            const res = await fetch(`${API_BASE}/haptic-pattern`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    pattern, 
                    intensity: settings.vibrationIntensity 
                })
            })
            const data = await res.json()
            if (data.success) {
                showToast(`📳 Haptic pattern '${pattern}' sent!`)
            } else {
                showToast(`❌ ${data.message}`)
            }
        } catch (err) {
            showToast('❌ Failed to send haptic pattern')
        }
    }

    const testHapticFeedback = async () => {
        if (!isConnected) {
            showToast('❌ Please connect to glove first')
            return
        }
        try {
            const res = await fetch(`${API_BASE}/test`, { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                showToast('📳 Haptic test signal sent!')
            } else {
                showToast(`❌ ${data.message}`)
            }
        } catch (err) {
            showToast('❌ Failed to send test signal')
        }
    }

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
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                                {isConnecting ? 'Connecting...' : isConnected ? 'Glove Connected' : 'Glove Disconnected'}
                            </h3>
                            {isConnected && deviceAddress && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    Device: {deviceAddress}
                                </p>
                            )}
                            {connectionError && !isConnected && (
                                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                                    {connectionError}
                                </p>
                            )}
                        </div>
                    </div>
                    <button 
                        className={`connect-button ${isConnected ? 'disconnect' : ''}`} 
                        onClick={isConnected ? handleDisconnect : handleConnect}
                        disabled={isConnecting}
                    >
                        {isConnecting ? 'Scanning...' : isConnected ? 'Disconnect' : 'Connect Glove'}
                    </button>
                </div>
            </section>

            {/* Motor Control - Only show when connected */}
            {isConnected && (
                <section className="settings-section">
                    <div className="section-header"><h2>🎮 Motor Control</h2><p>Test individual motors</p></div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="action-button" onClick={() => sendMotorCommand('1')}>Motor 1 (Left)</button>
                        <button className="action-button" onClick={() => sendMotorCommand('2')}>Motor 2 (Right)</button>
                        <button className="action-button" onClick={() => sendMotorCommand('3')}>Both Motors</button>
                    </div>
                </section>
            )}

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
                                        onClick={() => {
                                            setPattern(key, opt)
                                            if (isConnected) sendHapticPattern(opt)
                                        }}>
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
                <button className="action-button" onClick={testHapticFeedback}>📳 Test Feedback</button>
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
