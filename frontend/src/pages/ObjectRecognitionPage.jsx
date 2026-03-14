import { useState, useRef, useEffect } from 'react'
import { hapticNotify } from '../utils/hapticNotify'

const SHAPES_INFO = {
    Circle: { emoji: '⭕', type: '2D', color: '#3b82f6' },
    Square: { emoji: '🟦', type: '2D', color: '#8b5cf6' },
    Rectangle: { emoji: '🟩', type: '2D', color: '#10b981' },
    Triangle: { emoji: '🔺', type: '2D', color: '#ef4444' },
    Sphere: { emoji: '🔵', type: '3D', color: '#6366f1' },
    Cube: { emoji: '🟪', type: '3D', color: '#a855f7' },
    Cuboid: { emoji: '📦', type: '3D', color: '#f59e0b' },
    Cylinder: { emoji: '🛢️', type: '3D', color: '#14b8a6' },
    Cone: { emoji: '📐', type: '3D', color: '#f97316' },
    Pyramid: { emoji: '🔻', type: '3D', color: '#ec4899' },
}

export default function ObjectRecognitionPage() {
    const [espIp, setEspIp] = useState(() => localStorage.getItem('esp32_ip') || '')
    const [connected, setConnected] = useState(false)
    const [connecting, setConnecting] = useState(false)
    const [detecting, setDetecting] = useState(false)
    const [flashOn, setFlashOn] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const [history, setHistory] = useState([])
    const [streamMode, setStreamMode] = useState(false)
    const imgRef = useRef(null)

    const baseUrl = espIp ? `http://${espIp.replace(/^https?:\/\//, '').replace(/\/$/, '')}` : ''

    // Save IP to localStorage
    useEffect(() => {
        if (espIp) localStorage.setItem('esp32_ip', espIp)
    }, [espIp])

    const connectToESP = async () => {
        if (!espIp.trim()) {
            setError('Please enter the ESP32-CAM IP address')
            return
        }
        setConnecting(true)
        setError('')
        try {
            // Try to fetch a capture to verify connection
            const res = await fetch(`${baseUrl}/capture?t=${Date.now()}`, {
                signal: AbortSignal.timeout(5000)
            })
            if (!res.ok) throw new Error('Failed to connect')
            const blob = await res.blob()
            if (imgRef.current) imgRef.current.src = URL.createObjectURL(blob)
            setConnected(true)
            setError('')
        } catch (e) {
            setError(`Cannot connect to ESP32 at ${espIp}. Make sure it's on the same WiFi network and the IP is correct.`)
            setConnected(false)
        }
        setConnecting(false)
    }

    const disconnect = () => {
        setConnected(false)
        setStreamMode(false)
        setResult(null)
        setFlashOn(false)
        if (imgRef.current) imgRef.current.src = ''
    }

    const capturePhoto = async () => {
        setError('')
        setStreamMode(false)
        try {
            const res = await fetch(`${baseUrl}/capture?t=${Date.now()}`)
            const blob = await res.blob()
            if (imgRef.current) imgRef.current.src = URL.createObjectURL(blob)
            // Turn off flash after capture
            if (flashOn) {
                await fetch(`${baseUrl}/flashoff`)
                setFlashOn(false)
            }
        } catch {
            setError('Failed to capture photo. Check ESP32 connection.')
        }
    }

    const detectShape = async () => {
        setDetecting(true)
        setError('')
        setResult(null)
        try {
            const res = await fetch(`${baseUrl}/detect`)
            const data = await res.json()
            if (data.error) {
                setError(data.error)
            } else {
                setResult(data)
                setHistory(prev => [data, ...prev].slice(0, 10))
                hapticNotify('1')
                // Refresh image to show what was detected
                capturePhoto()
            }
        } catch {
            setError('Detection failed. Check ESP32 connection.')
        }
        setDetecting(false)
    }

    const toggleFlash = async () => {
        try {
            await fetch(`${baseUrl}/${flashOn ? 'flashoff' : 'flashon'}`)
            setFlashOn(!flashOn)
        } catch {
            setError('Failed to toggle flash')
        }
    }

    const toggleStream = () => {
        if (streamMode) {
            setStreamMode(false)
            capturePhoto()
        } else {
            setStreamMode(true)
            if (imgRef.current) imgRef.current.src = `${baseUrl}/stream`
        }
    }

    const shapeInfo = result ? SHAPES_INFO[result.shape] || { emoji: '❓', type: '?', color: '#666' } : null
    const confidence = result ? (result.confidence * 100).toFixed(1) : 0

    return (
        <div className="object-recognition-page">
            <div className="or-header">
                <div className="or-icon">👁️</div>
                <h1>Object Recognition</h1>
                <p>AI-powered shape detection using ESP32-CAM with TensorFlow Lite</p>
            </div>

            {/* Connection Panel */}
            {!connected ? (
                <div className="or-connect-panel">
                    <div className="or-connect-card">
                        <h2>🔌 Connect to ESP32-CAM</h2>
                        <p className="or-hint">
                            Power on your ESP32-CAM board and check the Serial Monitor for its IP address.
                            Make sure your computer is on the same WiFi network.
                        </p>

                        <div className="or-ip-row">
                            <input
                                type="text"
                                value={espIp}
                                onChange={e => setEspIp(e.target.value)}
                                placeholder="e.g. 192.168.1.100"
                                className="or-ip-input"
                                onKeyDown={e => e.key === 'Enter' && connectToESP()}
                            />
                            <button
                                onClick={connectToESP}
                                disabled={connecting}
                                className="or-connect-btn"
                            >
                                {connecting ? '⏳ Connecting...' : '🔗 Connect'}
                            </button>
                        </div>

                        {error && <div className="or-error">{error}</div>}

                        <div className="or-setup-info">
                            <h3>📋 Setup Instructions</h3>
                            <ol>
                                <li>Install <strong>Arduino IDE</strong> and add the ESP32 board package</li>
                                <li>Install the <strong>TensorFlowLite_ESP32</strong> library</li>
                                <li>Open <code>hardware/esp32-cam/shape_detection.ino</code></li>
                                <li>Update WiFi credentials (SSID & password) in the code</li>
                                <li>Set Board: <strong>AI Thinker ESP32-CAM</strong>, enable PSRAM</li>
                                <li>Upload to ESP32-CAM and open Serial Monitor (115200 baud)</li>
                                <li>Copy the IP address shown and paste it above</li>
                            </ol>
                        </div>
                    </div>
                </div>
            ) : (
                /* Main Detection Interface */
                <div className="or-main">
                    {/* Status Bar */}
                    <div className="or-status-bar">
                        <div className="or-status-left">
                            <span className="or-status-dot connected" />
                            <span>Connected to <strong>{espIp}</strong></span>
                        </div>
                        <button onClick={disconnect} className="or-disconnect-btn">
                            Disconnect
                        </button>
                    </div>

                    <div className="or-grid">
                        {/* Camera View */}
                        <div className="or-camera-section">
                            <div className="or-camera-card">
                                <div className="or-camera-header">
                                    <h2>📷 Camera View</h2>
                                    {streamMode && <span className="or-live-badge">● LIVE</span>}
                                </div>

                                <div className="or-camera-frame">
                                    <img
                                        ref={imgRef}
                                        alt="ESP32-CAM feed"
                                        className="or-camera-img"
                                    />
                                    {detecting && (
                                        <div className="or-detecting-overlay">
                                            <div className="or-spinner" />
                                            <span>Running ML inference...</span>
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="or-controls">
                                    <button onClick={capturePhoto} className="or-btn or-btn-capture">
                                        📸 Capture
                                    </button>
                                    <button
                                        onClick={detectShape}
                                        disabled={detecting}
                                        className="or-btn or-btn-detect"
                                    >
                                        {detecting ? '⏳ Detecting...' : '🤖 Detect Shape'}
                                    </button>
                                    <button
                                        onClick={toggleStream}
                                        className={`or-btn ${streamMode ? 'or-btn-stop' : 'or-btn-stream'}`}
                                    >
                                        {streamMode ? '⏹ Stop Stream' : '▶ Live Stream'}
                                    </button>
                                    <button
                                        onClick={toggleFlash}
                                        className={`or-btn ${flashOn ? 'or-btn-flash-on' : 'or-btn-flash'}`}
                                    >
                                        {flashOn ? '💡 Flash ON' : '🔦 Flash OFF'}
                                    </button>
                                </div>

                                {error && <div className="or-error">{error}</div>}
                            </div>
                        </div>

                        {/* Results Panel */}
                        <div className="or-results-section">
                            {/* Detection Result */}
                            {result ? (
                                <div className="or-result-card">
                                    <h2>🎯 Detection Result</h2>
                                    <div className="or-shape-result">
                                        <div className="or-shape-emoji" style={{ color: shapeInfo.color }}>
                                            {shapeInfo.emoji}
                                        </div>
                                        <div className="or-shape-name">{result.shape}</div>
                                        <div className="or-shape-type">{shapeInfo.type} Shape</div>
                                    </div>

                                    {/* Confidence Bar */}
                                    <div className="or-confidence">
                                        <div className="or-confidence-label">
                                            <span>Confidence</span>
                                            <span className="or-confidence-value">{confidence}%</span>
                                        </div>
                                        <div className="or-confidence-bar">
                                            <div
                                                className="or-confidence-fill"
                                                style={{
                                                    width: `${confidence}%`,
                                                    background: shapeInfo.color
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Inference Time */}
                                    <div className="or-meta">
                                        ⚡ Inference: {result.inference_time_ms}ms (on-device)
                                    </div>

                                    {/* Formulas */}
                                    <div className="or-formulas">
                                        <h3>📐 Formulas</h3>
                                        {result.area_formula && (
                                            <div className="or-formula-item">
                                                <span className="or-formula-label">Area</span>
                                                <span className="or-formula-value">{result.area_formula}</span>
                                            </div>
                                        )}
                                        {result.perimeter_formula && (
                                            <div className="or-formula-item">
                                                <span className="or-formula-label">Perimeter</span>
                                                <span className="or-formula-value">{result.perimeter_formula}</span>
                                            </div>
                                        )}
                                        {result.volume_formula && (
                                            <div className="or-formula-item">
                                                <span className="or-formula-label">Volume</span>
                                                <span className="or-formula-value">{result.volume_formula}</span>
                                            </div>
                                        )}
                                        {result.surface_area_formula && (
                                            <div className="or-formula-item">
                                                <span className="or-formula-label">Surface Area</span>
                                                <span className="or-formula-value">{result.surface_area_formula}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="or-result-card or-result-placeholder">
                                    <div className="or-placeholder-icon">🤖</div>
                                    <p>Point the camera at a geometric shape and click <strong>"Detect Shape"</strong></p>
                                    <p className="or-hint">Supports: Circle, Square, Rectangle, Triangle, Sphere, Cube, Cuboid, Cylinder, Cone, Pyramid</p>
                                </div>
                            )}

                            {/* Detection History */}
                            {history.length > 0 && (
                                <div className="or-history-card">
                                    <h3>📊 Detection History</h3>
                                    <div className="or-history-list">
                                        {history.map((item, i) => {
                                            const info = SHAPES_INFO[item.shape] || { emoji: '❓', color: '#666' }
                                            return (
                                                <div key={i} className="or-history-item">
                                                    <span className="or-history-emoji">{info.emoji}</span>
                                                    <span className="or-history-name">{item.shape}</span>
                                                    <span className="or-history-conf" style={{ color: info.color }}>
                                                        {(item.confidence * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setHistory([])}
                                        className="or-btn or-btn-clear"
                                    >
                                        Clear History
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Hardware Info */}
            <div className="or-hardware-info">
                <h3>⚙️ Hardware Details</h3>
                <div className="or-hw-grid">
                    <div className="or-hw-item">
                        <span className="or-hw-icon">📷</span>
                        <span>ESP32-CAM (AI Thinker)</span>
                    </div>
                    <div className="or-hw-item">
                        <span className="or-hw-icon">🧠</span>
                        <span>TensorFlow Lite (on-device ML)</span>
                    </div>
                    <div className="or-hw-item">
                        <span className="or-hw-icon">📡</span>
                        <span>WiFi (same network)</span>
                    </div>
                    <div className="or-hw-item">
                        <span className="or-hw-icon">🎯</span>
                        <span>10 shape classes (96×96px model)</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
