/**
 * Enhanced Speech Recognition with Multiple Fallbacks
 * Improves reliability when Web Speech API fails
 */

class EnhancedSpeechRecognizer {
    constructor() {
        this.recognition = null;
        this.isRecognizing = false;
        this.fallbackOptions = [];
        this.currentProvider = 'web-speech';
        
        this.initializeProviders();
        this.setupEventHandlers();
    }
    
    initializeProviders() {
        // Primary: Web Speech API (Chrome/Edge)
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 3;
            console.log('✅ Web Speech API available');
        }
        
        // Fallback 1: Check if Vosk WebAssembly is available
        this.checkVoskAvailability();
        
        // Fallback 2: Azure Speech SDK (if configured)
        this.checkAzureAvailability();
        
        // Fallback 3: Manual text input as last resort
        this.fallbackOptions.push('manual-input');
    }
    
    async checkVoskAvailability() {
        try {
            // Check if Vosk WebAssembly model is loaded
            if (window.Vosk && window.VoskModel) {
                this.fallbackOptions.push('vosk-offline');
                console.log('✅ Vosk offline recognition available');
            }
        } catch (e) {
            console.log('ℹ️ Vosk offline recognition not available');
        }
    }
    
    checkAzureAvailability() {
        try {
            // Check if Azure Speech SDK is loaded
            if (window.SpeechSDK && window.AZURE_SPEECH_KEY) {
                this.fallbackOptions.push('azure-speech');
                console.log('✅ Azure Speech recognition available');
            }
        } catch (e) {
            console.log('ℹ️ Azure Speech recognition not configured');
        }
    }
    
    async startRecognition() {
        if (this.isRecognizing) return;
        
        try {
            this.isRecognizing = true;
            
            switch (this.currentProvider) {
                case 'web-speech':
                    return await this.useWebSpeech();
                case 'vosk-offline':
                    return await this.useVoskOffline();
                case 'azure-speech':
                    return await this.useAzureSpeech();
                case 'manual-input':
                    return await this.useManualInput();
                default:
                    throw new Error('No recognition provider available');
            }
        } catch (error) {
            console.warn(`${this.currentProvider} failed:`, error.message);
            return await this.tryNextProvider();
        } finally {
            this.isRecognizing = false;
        }
    }
    
    async useWebSpeech() {
        if (!this.recognition) {
            throw new Error('Web Speech API not supported');
        }
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.recognition.stop();
                reject(new Error('Recognition timeout'));
            }, 10000);
            
            this.recognition.onresult = (event) => {
                clearTimeout(timeout);
                const result = event.results[0][0].transcript;
                const confidence = event.results[0][0].confidence;
                resolve({ 
                    text: result, 
                    confidence: confidence,
                    provider: 'web-speech'
                });
            };
            
            this.recognition.onerror = (event) => {
                clearTimeout(timeout);
                reject(new Error(`Speech recognition error: ${event.error}`));
            };
            
            this.recognition.start();
        });
    }
    
    async useVoskOffline() {
        // Placeholder for Vosk WebAssembly implementation
        // In production, you would load and use Vosk models here
        return new Promise((resolve, reject) => {
            // Simulate Vosk recognition
            setTimeout(() => {
                reject(new Error('Vosk implementation not complete'));
            }, 1000);
        });
    }
    
    async useAzureSpeech() {
        // Placeholder for Azure Speech SDK implementation
        return new Promise((resolve, reject) => {
            try {
                const speechConfig = window.SpeechSDK.SpeechConfig.fromSubscription(
                    window.AZURE_SPEECH_KEY, 
                    window.AZURE_SPEECH_REGION || 'eastus'
                );
                speechConfig.speechRecognitionLanguage = 'en-US';
                
                // Implementation would continue here...
                reject(new Error('Azure Speech implementation not complete'));
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async useManualInput() {
        return new Promise((resolve) => {
            const modal = this.createManualInputModal();
            document.body.appendChild(modal);
            
            const input = modal.querySelector('input');
            const submitBtn = modal.querySelector('.submit-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');
            
            const cleanup = () => {
                document.body.removeChild(modal);
            };
            
            submitBtn.onclick = () => {
                const text = input.value.trim();
                cleanup();
                resolve({ 
                    text: text, 
                    confidence: text ? 1.0 : 0.0,
                    provider: 'manual-input'
                });
            };
            
            cancelBtn.onclick = () => {
                cleanup();
                resolve({ 
                    text: '', 
                    confidence: 0.0,
                    provider: 'manual-input'
                });
            };
            
            input.focus();
        });
    }
    
    createManualInputModal() {
        const modal = document.createElement('div');
        modal.className = 'speech-input-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3>🎤 Voice recognition unavailable</h3>
                    <p>Please type your answer below:</p>
                    <input type="text" placeholder="Type your answer..." class="speech-input">
                    <div class="modal-buttons">
                        <button class="submit-btn">Submit</button>
                        <button class="cancel-btn">Skip</button>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    async tryNextProvider() {
        // Find next available provider
        const currentIndex = this.fallbackOptions.indexOf(this.currentProvider);
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < this.fallbackOptions.length) {
            this.currentProvider = this.fallbackOptions[nextIndex];
            console.log(`🔄 Switching to provider: ${this.currentProvider}`);
            return await this.startRecognition();
        } else {
            // All providers failed
            console.error('❌ All speech recognition providers failed');
            return await this.useManualInput();
        }
    }
    
    setupEventHandlers() {
        // Add CSS for manual input modal
        const style = document.createElement('style');
        style.textContent = `
            .speech-input-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
            }
            
            .modal-overlay {
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
            }
            
            .modal-content {
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
                text-align: center;
            }
            
            .speech-input {
                width: 100%;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                margin: 15px 0;
            }
            
            .modal-buttons {
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            
            .modal-buttons button {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .submit-btn {
                background: #4CAF50;
                color: white;
            }
            
            .cancel-btn {
                background: #f44336;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }
    
    getProviderStatus() {
        return {
            current: this.currentProvider,
            available: this.fallbackOptions,
            isRecognizing: this.isRecognizing
        };
    }
}

// Export for use in voice learning module
window.EnhancedSpeechRecognizer = EnhancedSpeechRecognizer;