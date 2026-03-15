import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:5001/api/smart-glove'

export default function SmartGlovePage() {
    const [isConnected, setIsConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [deviceInfo, setDeviceInfo] = useState(null)
    const [connectionError, setConnectionError] = useState(null)
    const [motorActive, setMotorActive] = useState(null)
    const [toast, setToast] = useState(null)

    useEffect(() => {
        fetchStatus()
    }, [])

    const showToast = (msg, type = 'info') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/status`)
            const data = await res.json()
            setIsConnected(data.connected)
            if (data.connected) {
                setDeviceInfo({
                    name: data.device_name,
                    address: data.device_address,
                    serviceUuid: data.service_uuid,
                    charUuid: data.characteristic_uuid
                })
            }
        } catch {
            /* backend not running */
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
                setDeviceInfo({
                    name: data.device_name,
                    address: data.device_address,
                    serviceUuid: data.service_uuid,
                    charUuid: data.characteristic_uuid
                })
                showToast('Connected to SmartHapticGlove!', 'success')
            } else {
                setConnectionError(data.message)
                showToast(data.message, 'error')
            }
        } catch {
            setConnectionError('Backend server not reachable. Is the Flask server running?')
            showToast('Backend server not reachable', 'error')
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
                setDeviceInfo(null)
                showToast('Disconnected', 'info')
            }
        } catch {
            showToast('Failed to disconnect', 'error')
        }
    }

    const sendMotor = async (command, label) => {
        if (!isConnected) return showToast('Connect glove first', 'error')
        setMotorActive(command)
        try {
            const res = await fetch(`${API_BASE}/motor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            })
            const data = await res.json()
            if (data.success) showToast(`${label} activated!`, 'success')
            else showToast(data.message, 'error')
        } catch {
            showToast('Failed to send command', 'error')
        } finally {
            setTimeout(() => setMotorActive(null), 400)
        }
    }

    const testFeedback = async () => {
        if (!isConnected) return showToast('Connect glove first', 'error')
        try {
            const res = await fetch(`${API_BASE}/test`, { method: 'POST' })
            const data = await res.json()
            if (data.success) showToast('Test pulse sent!', 'success')
            else showToast(data.message, 'error')
        } catch {
            showToast('Failed to send test', 'error')
        }
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem 1rem' }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
                    padding: '0.75rem 1.5rem', borderRadius: 10, fontSize: '0.9rem', zIndex: 9999,
                    color: '#fff', fontWeight: 500,
                    background: toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#3b82f6'
                }} role="status">{toast.msg}</div>
            )}

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>🧤 Smart Glove Settings</h1>
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Connect to ESP32 and control haptic motors via BLE</p>
            </div>

            {/* ── Connection Card ── */}
            <div style={{
                background: '#fff', borderRadius: 12, padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 12, height: 12, borderRadius: '50%',
                            background: isConnected ? '#22c55e' : isConnecting ? '#f59e0b' : '#ef4444',
                            boxShadow: isConnected ? '0 0 8px #22c55e' : 'none',
                            animation: isConnecting ? 'pulse 1.5s infinite' : 'none'
                        }} />
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                                {isConnecting ? 'Scanning...' : isConnected ? 'Connected' : 'Disconnected'}
                            </h3>
                            {isConnecting && (
                                <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0.15rem 0 0' }}>
                                    Searching for SmartHapticGlove...
                                </p>
                            )}
                            {connectionError && !isConnected && !isConnecting && (
                                <p style={{ fontSize: '0.78rem', color: '#ef4444', margin: '0.15rem 0 0' }}>{connectionError}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={isConnected ? handleDisconnect : handleConnect}
                        disabled={isConnecting}
                        style={{
                            padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', fontWeight: 600,
                            fontSize: '0.85rem', cursor: isConnecting ? 'wait' : 'pointer',
                            color: '#fff',
                            background: isConnecting ? '#f59e0b' : isConnected ? '#ef4444' : '#3b82f6',
                            opacity: isConnecting ? 0.7 : 1
                        }}
                    >
                        {isConnecting ? '⏳ Scanning...' : isConnected ? 'Disconnect' : 'Connect Glove'}
                    </button>
                </div>

                {/* Device Info */}
                {isConnected && deviceInfo && (
                    <div style={{
                        marginTop: '1rem', padding: '0.85rem', background: '#f0fdf4',
                        borderRadius: 8, border: '1px solid #bbf7d0'
                    }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>📡 Device Info</h4>
                        <table style={{ width: '100%', fontSize: '0.78rem', fontFamily: 'monospace', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr><td style={{ color: '#6b7280', paddingRight: 12, paddingBottom: 4 }}>Name</td><td style={{ fontWeight: 600 }}>{deviceInfo.name}</td></tr>
                                <tr><td style={{ color: '#6b7280', paddingRight: 12, paddingBottom: 4 }}>Address</td><td style={{ fontWeight: 600 }}>{deviceInfo.address}</td></tr>
                                <tr><td style={{ color: '#6b7280', paddingRight: 12, paddingBottom: 4 }}>Service UUID</td><td>{deviceInfo.serviceUuid}</td></tr>
                                <tr><td style={{ color: '#6b7280', paddingRight: 12 }}>Char UUID</td><td>{deviceInfo.charUuid}</td></tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Motor Test Card ── */}
            <div style={{
                background: '#fff', borderRadius: 12, padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', marginBottom: '1rem',
                opacity: isConnected ? 1 : 0.5, pointerEvents: isConnected ? 'auto' : 'none'
            }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>🎮 Motor Test</h3>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                    GPIO 12 = Motor 1 &nbsp;|&nbsp; GPIO 26 = Motor 2 &nbsp;|&nbsp; GPIO 2 = LED
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    {[
                        { cmd: '1', label: 'Motor 1', sub: 'GPIO 12', color: '#8b5cf6' },
                        { cmd: '2', label: 'Motor 2', sub: 'GPIO 26', color: '#06b6d4' },
                        { cmd: '3', label: 'Both', sub: 'GPIO 12+26', color: '#f59e0b' }
                    ].map(({ cmd, label, sub, color }) => (
                        <button
                            key={cmd}
                            onClick={() => sendMotor(cmd, label)}
                            style={{
                                padding: '0.75rem 0.5rem', borderRadius: 10, border: '2px solid ' + color,
                                background: motorActive === cmd ? color : '#fff',
                                color: motorActive === cmd ? '#fff' : color,
                                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {label}<br /><span style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.8 }}>{sub}</span>
                        </button>
                    ))}
                </div>

                {/* Test All button */}
                <button
                    onClick={testFeedback}
                    style={{
                        marginTop: '0.75rem', width: '100%', padding: '0.65rem',
                        borderRadius: 10, border: '2px solid #22c55e', background: '#f0fdf4',
                        color: '#16a34a', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                    }}
                >
                    📳 Test Haptic Feedback (Both Motors)
                </button>
            </div>

            {/* ── ESP32 Commands Card ── */}
            <div style={{
                background: '#fff', borderRadius: 12, padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb'
            }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>📋 ESP32 Commands</h3>
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ textAlign: 'left', padding: '0.35rem 0', color: '#6b7280', fontWeight: 500 }}>Command</th>
                            <th style={{ textAlign: 'left', padding: '0.35rem 0', color: '#6b7280', fontWeight: 500 }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '0.35rem 0' }}><code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>"1"</code></td>
                            <td style={{ padding: '0.35rem 0' }}>Motor 1 (GPIO 12) — 200ms pulse</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '0.35rem 0' }}><code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>"2"</code></td>
                            <td style={{ padding: '0.35rem 0' }}>Motor 2 (GPIO 26) — 200ms pulse</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '0.35rem 0' }}><code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>"3"</code></td>
                            <td style={{ padding: '0.35rem 0' }}>Both motors — 200ms pulse</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    )
}
