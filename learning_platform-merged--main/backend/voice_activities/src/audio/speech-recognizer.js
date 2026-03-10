/**
 * Speech Recognition Module
 * Handles audio capture and speech-to-text conversion
 * Optimized for children's speech patterns
 */

import { EventEmitter } from 'events';
import { AudioProcessor } from './audio-processor.js';
import { logger } from '../utils/logger.js';

export class SpeechRecognizer extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      language: options.language || 'en-US',
      interimResults: true,
      maxAlternatives: 3,
      continuous: options.continuous || false,
      ...options
    };

    this.isListening = false;
    this.audioProcessor = new AudioProcessor();
    this.recognitionResult = null;

    // Initialize Web Speech API
    this.initializeWebSpeechAPI();
  }

  /**
   * Initialize Web Speech API or fallback
   */
  initializeWebSpeechAPI() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      logger.warn('Web Speech API not available - will use fallback ASR');
      this.usesFallback = true;
      return;
    }

    this.recognition = new SpeechRecognition();
    this.setupRecognitionHandlers();
  }

  /**
   * Setup event handlers for Web Speech API
   */
  setupRecognitionHandlers() {
    this.recognition.language = this.options.language;
    this.recognition.interimResults = this.options.interimResults;
    this.recognition.maxAlternatives = this.options.maxAlternatives;
    this.recognition.continuous = this.options.continuous;

    this.recognition.onstart = () => {
      logger.debug('Speech recognition started');
      this.emit('listening', { timestamp: Date.now() });
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        this.emit('partial-result', {
          text: interimTranscript,
          isFinal: false,
          confidence: maxConfidence
        });
      }

      if (finalTranscript) {
        this.recognitionResult = {
          text: finalTranscript,
          confidence: maxConfidence,
          isFinal: true,
          timestamp: Date.now(),
          language: this.options.language,
          alternatives: event.results[event.results.length - 1]
        };

        this.emit('final-result', this.recognitionResult);
      }
    };

    this.recognition.onerror = (event) => {
      logger.error('Speech recognition error:', event.error);
      this.emit('error', {
        code: event.error,
        message: this.getErrorMessage(event.error)
      });
    };

    this.recognition.onend = () => {
      logger.debug('Speech recognition ended');
      this.isListening = false;
      this.emit('stopped', { timestamp: Date.now() });
    };
  }

  /**
   * Start listening for speech
   */
  async startListening() {
    if (this.isListening) {
      logger.warn('Already listening');
      return;
    }

    try {
      if (this.usesFallback) {
        await this.startFallbackListening();
      } else {
        this.isListening = true;
        this.recognition.start();
      }
    } catch (error) {
      logger.error('Failed to start listening:', error);
      this.emit('error', {
        code: 'START_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Stop listening for speech
   */
  stopListening() {
    if (!this.isListening) {
      return;
    }

    try {
      if (this.usesFallback) {
        this.stopFallbackListening();
      } else {
        this.recognition.stop();
      }
      this.isListening = false;
    } catch (error) {
      logger.error('Error stopping recognition:', error);
    }
  }

  /**
   * Abort speech recognition
   */
  abort() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  /**
   * Fallback ASR using external service (Vosk, Azure, etc)
   */
  async startFallbackListening() {
    logger.info('Using fallback ASR');
    // TODO: Implement fallback ASR integration
    // Could use: Vosk (offline), Azure Speech Services, Google Cloud Speech, etc.
  }

  /**
   * Stop fallback listening
   */
  stopFallbackListening() {
    // TODO: Implement fallback stop
  }

  /**
   * Get human-readable error messages
   */
  getErrorMessage(code) {
    const errorMessages = {
      'network': 'Network error occurred',
      'audio': 'Audio capture error',
      'not-allowed': 'Microphone access denied',
      'no-speech': 'No speech detected',
      'timeout': 'Speech recognition timed out',
      'bad-grammar': 'Grammar not recognized'
    };

    return errorMessages[code] || `Unknown error: ${code}`;
  }

  /**
   * Check if browser supports speech recognition
   */
  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Set language for recognition
   */
  setLanguage(language) {
    this.options.language = language;
    if (this.recognition) {
      this.recognition.language = language;
    }
  }

  /**
   * Get current recognition status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      language: this.options.language,
      isSupported: SpeechRecognizer.isSupported(),
      usesFallback: this.usesFallback || false,
      lastResult: this.recognitionResult
    };
  }
}

export default SpeechRecognizer;
