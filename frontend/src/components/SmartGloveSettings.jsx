import { useState } from 'react'
import './SmartGloveSettings.css'

function SmartGloveSettings({ onBack }) {
  // Connection State
  const [isConnected, setIsConnected] = useState(false)
  const [batteryLevel, setBatteryLevel] = useState(85)

  // Haptic Feedback Settings
  const [hapticSettings, setHapticSettings] = useState({
    // Global Settings
    hapticEnabled: true,
    vibrationIntensity: 70,
    
    // Input Feedback (when user interacts)
    inputFeedback: {
      enabled: true,
      buttonPress: true,
      gestureRecognition: true,
      touchConfirmation: true,
      intensity: 60
    },
    
    // Output Feedback (app responses)
    outputFeedback: {
      enabled: true,
      navigationCues: true,
      objectDetectionAlerts: true,
      textReadingPulse: true,
      errorWarnings: true,
      successConfirmation: true,
      intensity: 75
    },
    
    // Pattern Settings
    patterns: {
      navigationPattern: 'pulse', // pulse, wave, tap
      alertPattern: 'urgent', // gentle, moderate, urgent
      confirmationPattern: 'double-tap' // single-tap, double-tap, long
    }
  })

  const handleToggle = (path) => {
    setHapticSettings(prev => {
      const keys = path.split('.')
      const newSettings = { ...prev }
      let current = newSettings
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = !current[keys[keys.length - 1]]
      return newSettings
    })
  }

  const handleSliderChange = (path, value) => {
    setHapticSettings(prev => {
      const keys = path.split('.')
      const newSettings = { ...prev }
      let current = newSettings
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = parseInt(value)
      return newSettings
    })
  }

  const handlePatternChange = (patternType, value) => {
    setHapticSettings(prev => ({
      ...prev,
      patterns: {
        ...prev.patterns,
        [patternType]: value
      }
    }))
  }

  const handleConnect = () => {
    setIsConnected(!isConnected)
  }

  const testHapticFeedback = () => {
    // This would trigger a test vibration on the actual glove
    console.log('Testing haptic feedback with current settings:', hapticSettings)
    alert('Haptic test signal sent to glove!')
  }

  const resetToDefaults = () => {
    setHapticSettings({
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
  }

  return (
    <div className="smart-glove-settings">
      <div className="settings-header">
        <button className="back-button" onClick={onBack} aria-label="Go back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h1>🧤 Smart Glove Settings</h1>
        <p className="settings-subtitle">Configure haptic feedback for inputs and outputs</p>
      </div>

      {/* Connection Status */}
      <section className="settings-section connection-section">
        <div className="connection-status">
          <div className="status-info">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <div>
              <h3>{isConnected ? 'Glove Connected' : 'Glove Disconnected'}</h3>
              {isConnected && (
                <p className="battery-info">
                  🔋 Battery: {batteryLevel}%
                  <span className="battery-bar">
                    <span className="battery-level" style={{ width: `${batteryLevel}%` }}></span>
                  </span>
                </p>
              )}
            </div>
          </div>
          <button 
            className={`connect-button ${isConnected ? 'disconnect' : ''}`}
            onClick={handleConnect}
          >
            {isConnected ? 'Disconnect' : 'Connect Glove'}
          </button>
        </div>
      </section>

      {/* Global Haptic Toggle */}
      <section className="settings-section">
        <div className="section-header">
          <h2>⚡ Global Haptic Settings</h2>
        </div>
        <div className="setting-item main-toggle">
          <div className="setting-info">
            <h3>Enable Haptic Feedback</h3>
            <p>Turn all haptic feedback on or off</p>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={hapticSettings.hapticEnabled}
              onChange={() => handleToggle('hapticEnabled')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        {hapticSettings.hapticEnabled && (
          <div className="setting-item slider-item">
            <div className="setting-info">
              <h3>Master Vibration Intensity</h3>
              <p>Overall strength of haptic feedback</p>
            </div>
            <div className="slider-control">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={hapticSettings.vibrationIntensity}
                onChange={(e) => handleSliderChange('vibrationIntensity', e.target.value)}
              />
              <span className="slider-value">{hapticSettings.vibrationIntensity}%</span>
            </div>
          </div>
        )}
      </section>

      {/* Input Feedback Settings */}
      {hapticSettings.hapticEnabled && (
        <section className="settings-section">
          <div className="section-header">
            <h2>👆 Input Feedback</h2>
            <p>Haptic responses when you interact with the glove</p>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Enable Input Feedback</h3>
              <p>Feel confirmation when you perform actions</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={hapticSettings.inputFeedback.enabled}
                onChange={() => handleToggle('inputFeedback.enabled')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {hapticSettings.inputFeedback.enabled && (
            <>
              <div className="sub-settings">
                <div className="setting-item sub-item">
                  <div className="setting-info">
                    <h4>Button Press Feedback</h4>
                    <p>Vibrate when pressing glove buttons</p>
                  </div>
                  <label className="toggle-switch small">
                    <input 
                      type="checkbox" 
                      checked={hapticSettings.inputFeedback.buttonPress}
                      onChange={() => handleToggle('inputFeedback.buttonPress')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item sub-item">
                  <div className="setting-info">
                    <h4>Gesture Recognition</h4>
                    <p>Confirm when gestures are detected</p>
                  </div>
                  <label className="toggle-switch small">
                    <input 
                      type="checkbox" 
                      checked={hapticSettings.inputFeedback.gestureRecognition}
                      onChange={() => handleToggle('inputFeedback.gestureRecognition')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item sub-item">
                  <div className="setting-info">
                    <h4>Touch Confirmation</h4>
                    <p>Feel feedback on touch inputs</p>
                  </div>
                  <label className="toggle-switch small">
                    <input 
                      type="checkbox" 
                      checked={hapticSettings.inputFeedback.touchConfirmation}
                      onChange={() => handleToggle('inputFeedback.touchConfirmation')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item slider-item">
                <div className="setting-info">
                  <h3>Input Feedback Intensity</h3>
                </div>
                <div className="slider-control">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={hapticSettings.inputFeedback.intensity}
                    onChange={(e) => handleSliderChange('inputFeedback.intensity', e.target.value)}
                  />
                  <span className="slider-value">{hapticSettings.inputFeedback.intensity}%</span>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* Output Feedback Settings */}
      {hapticSettings.hapticEnabled && (
        <section className="settings-section">
          <div className="section-header">
            <h2>📤 Output Feedback</h2>
            <p>Haptic responses from app notifications and alerts</p>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Enable Output Feedback</h3>
              <p>Receive haptic notifications from the app</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={hapticSettings.outputFeedback.enabled}
                onChange={() => handleToggle('outputFeedback.enabled')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {hapticSettings.outputFeedback.enabled && (
            <>
              <div className="sub-settings">
                <div className="setting-item sub-item">
                  <div className="setting-info">
                    <h4>Navigation Cues</h4>
                    <p>Directional feedback for navigation</p>
                  </div>
                  <label className="toggle-switch small">
                    <input 
                      type="checkbox" 
                      checked={hapticSettings.outputFeedback.navigationCues}
                      onChange={() => handleToggle('outputFeedback.navigationCues')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item sub-item">
                  <div className="setting-info">
                    <h4>Object Detection Alerts</h4>
                    <p>Vibrate when objects are recognized</p>
                  </div>
                  <label className="toggle-switch small">
                    <input 
                      type="checkbox" 
                      checked={hapticSettings.outputFeedback.objectDetectionAlerts}
                      onChange={() => handleToggle('outputFeedback.objectDetectionAlerts')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item sub-item">
                  <div className="setting-info">
                    <h4>Text Reading Pulse</h4>
                    <p>Rhythmic feedback during text-to-speech</p>
                  </div>
                  <label className="toggle-switch small">
                    <input 
                      type="checkbox" 
                      checked={hapticSettings.outputFeedback.textReadingPulse}
                      onChange={() => handleToggle('outputFeedback.textReadingPulse')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item sub-item">
                  <div className="setting-info">
                    <h4>Error Warnings</h4>
                    <p>Strong alerts for errors or warnings</p>
                  </div>
                  <label className="toggle-switch small">
                    <input 
                      type="checkbox" 
                      checked={hapticSettings.outputFeedback.errorWarnings}
                      onChange={() => handleToggle('outputFeedback.errorWarnings')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item sub-item">
                  <div className="setting-info">
                    <h4>Success Confirmation</h4>
                    <p>Positive feedback on successful actions</p>
                  </div>
                  <label className="toggle-switch small">
                    <input 
                      type="checkbox" 
                      checked={hapticSettings.outputFeedback.successConfirmation}
                      onChange={() => handleToggle('outputFeedback.successConfirmation')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item slider-item">
                <div className="setting-info">
                  <h3>Output Feedback Intensity</h3>
                </div>
                <div className="slider-control">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={hapticSettings.outputFeedback.intensity}
                    onChange={(e) => handleSliderChange('outputFeedback.intensity', e.target.value)}
                  />
                  <span className="slider-value">{hapticSettings.outputFeedback.intensity}%</span>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* Vibration Patterns */}
      {hapticSettings.hapticEnabled && (
        <section className="settings-section">
          <div className="section-header">
            <h2>〰️ Vibration Patterns</h2>
            <p>Customize how different feedback feels</p>
          </div>
          
          <div className="pattern-settings">
            <div className="pattern-item">
              <h4>Navigation Pattern</h4>
              <div className="pattern-options">
                {['pulse', 'wave', 'tap'].map(pattern => (
                  <button
                    key={pattern}
                    className={`pattern-button ${hapticSettings.patterns.navigationPattern === pattern ? 'active' : ''}`}
                    onClick={() => handlePatternChange('navigationPattern', pattern)}
                  >
                    {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="pattern-item">
              <h4>Alert Pattern</h4>
              <div className="pattern-options">
                {['gentle', 'moderate', 'urgent'].map(pattern => (
                  <button
                    key={pattern}
                    className={`pattern-button ${hapticSettings.patterns.alertPattern === pattern ? 'active' : ''}`}
                    onClick={() => handlePatternChange('alertPattern', pattern)}
                  >
                    {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="pattern-item">
              <h4>Confirmation Pattern</h4>
              <div className="pattern-options">
                {['single-tap', 'double-tap', 'long'].map(pattern => (
                  <button
                    key={pattern}
                    className={`pattern-button ${hapticSettings.patterns.confirmationPattern === pattern ? 'active' : ''}`}
                    onClick={() => handlePatternChange('confirmationPattern', pattern)}
                  >
                    {pattern.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <section className="settings-actions">
        <button className="action-button test-button" onClick={testHapticFeedback}>
          <span>📳</span> Test Haptic Feedback
        </button>
        <button className="action-button reset-button" onClick={resetToDefaults}>
          <span>🔄</span> Reset to Defaults
        </button>
        <button className="action-button save-button">
          <span>💾</span> Save Settings
        </button>
      </section>
    </div>
  )
}

export default SmartGloveSettings
