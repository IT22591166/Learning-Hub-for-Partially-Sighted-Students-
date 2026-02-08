/**
 * Text-to-Speech Module
 * Generates natural voice output with emotional tone variations
 */

import { logger } from '../utils/logger.js';

export class VoiceSynthesizer {
  constructor(options = {}) {
    this.options = {
      language: options.language || 'en-US',
      rate: options.rate || 1.0,
      pitch: options.pitch || 1.0,
      volume: options.volume || 1.0,
      ...options
    };

    this.characters = {
      'sophie': {
        name: 'Sophie',
        voice: 'female',
        age: 'child',
        personality: 'friendly, encouraging'
      },
      'buddy': {
        name: 'Buddy',
        voice: 'male',
        age: 'child',
        personality: 'energetic, playful'
      },
      'teacher': {
        name: 'Teacher',
        voice: 'female',
        age: 'adult',
        personality: 'patient, educational'
      }
    };

    this.emotionalTones = {
      'neutral': { pitchMultiplier: 1.0, rateMultiplier: 1.0 },
      'encouraging': { pitchMultiplier: 1.1, rateMultiplier: 0.9 },
      'celebratory': { pitchMultiplier: 1.2, rateMultiplier: 1.1 },
      'calm': { pitchMultiplier: 0.9, rateMultiplier: 0.8 }
    };

    this.initializeWebSpeechSynthesis();
  }

  /**
   * Initialize Web Speech Synthesis API
   */
  initializeWebSpeechSynthesis() {
    const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
    
    if (!SpeechSynthesisUtterance) {
      logger.warn('Web Speech Synthesis API not available');
      this.usesFallback = true;
      return;
    }

    this.synth = window.speechSynthesis;
    this.usesFallback = false;

    // Get available voices
    this.updateVoices();
    
    // Re-update voices when they're loaded
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.updateVoices();
    }
  }

  /**
   * Update available voices
   */
  updateVoices() {
    if (!this.synth) return;

    this.availableVoices = this.synth.getVoices();
    logger.debug(`Found ${this.availableVoices.length} available voices`);
  }

  /**
   * Speak text with emotional tone
   */
  async speak(text, options = {}) {
    const speechOptions = {
      character: options.character || 'sophie',
      emotionalTone: options.emotionalTone || 'neutral',
      pace: options.pace || 'normal',
      ...options
    };

    if (this.usesFallback) {
      return this.speakUsingFallback(text, speechOptions);
    }

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);

        // Set voice characteristics
        this.applyCharacteristics(utterance, speechOptions);

        // Setup event handlers
        utterance.onstart = () => {
          logger.debug(`Speaking: "${text}"`);
        };

        utterance.onend = () => {
          logger.debug('Speech completed');
          resolve({ success: true, text, duration: utterance.duration });
        };

        utterance.onerror = (error) => {
          logger.error('Speech synthesis error:', error);
          reject(new Error(`Speech synthesis failed: ${error.error}`));
        };

        // Start speaking
        this.synth.speak(utterance);

      } catch (error) {
        logger.error('Failed to speak:', error);
        reject(error);
      }
    });
  }

  /**
   * Apply character and emotional characteristics to utterance
   */
  applyCharacteristics(utterance, options) {
    const character = this.characters[options.character] || this.characters['sophie'];
    const emotionalTone = this.emotionalTones[options.emotionalTone] || this.emotionalTones['neutral'];

    // Set voice based on character
    const voice = this.selectVoice(character, this.options.language);
    if (voice) {
      utterance.voice = voice;
    }

    // Set language
    utterance.lang = this.options.language;

    // Apply emotional tone modifiers
    const pitchMultiplier = emotionalTone.pitchMultiplier || 1.0;
    const rateMultiplier = emotionalTone.rateMultiplier || 1.0;

    utterance.pitch = this.options.pitch * pitchMultiplier;
    utterance.rate = this.getRate(options.pace) * rateMultiplier;
    utterance.volume = this.options.volume;

    // Add slight delays for natural speech
    if (options.emotionalTone === 'celebratory') {
      utterance.text = this.addEmphasis(utterance.text);
    }
  }

  /**
   * Select appropriate voice for character and language
   */
  selectVoice(character, language) {
    if (!this.availableVoices) return null;

    // Filter by language
    let langVoices = this.availableVoices.filter(v => v.lang.startsWith(language.split('-')[0]));
    
    if (langVoices.length === 0) {
      langVoices = this.availableVoices;
    }

    // Prefer female voice for children's characters
    if (character.voice === 'female') {
      const femaleVoices = langVoices.filter(v => v.name.toLowerCase().includes('female'));
      if (femaleVoices.length > 0) return femaleVoices[0];
    }

    // Prefer male voice for adult characters
    if (character.voice === 'male') {
      const maleVoices = langVoices.filter(v => v.name.toLowerCase().includes('male'));
      if (maleVoices.length > 0) return maleVoices[0];
    }

    return langVoices[0] || null;
  }

  /**
   * Get speech rate based on pace
   */
  getRate(pace) {
    const rates = {
      'slow': 0.7,
      'normal': 1.0,
      'fast': 1.3
    };
    return rates[pace] || rates['normal'];
  }

  /**
   * Add emphasis to text for celebratory tone
   */
  addEmphasis(text) {
    // Add pauses and emphasis markers
    // This is a simple implementation - could be enhanced
    return text.replace(/\!/g, '! ');
  }

  /**
   * Stop current speech
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.synth) {
      this.synth.pause();
    }
  }

  /**
   * Resume speech
   */
  resume() {
    if (this.synth) {
      this.synth.resume();
    }
  }

  /**
   * Fallback TTS implementation
   */
  async speakUsingFallback(text, options) {
    logger.warn('Using fallback TTS - audio quality may be reduced');
    // TODO: Implement fallback using external service
    // Could use: ElevenLabs API, Google Cloud TTS, Azure TTS, etc.
    return { success: true, text, usedFallback: true };
  }

  /**
   * Check if speech synthesis is supported
   */
  static isSupported() {
    return !!window.SpeechSynthesisUtterance;
  }

  /**
   * Get available characters
   */
  getAvailableCharacters() {
    return Object.keys(this.characters);
  }

  /**
   * Get available emotional tones
   */
  getAvailableEmotionalTones() {
    return Object.keys(this.emotionalTones);
  }
}

export default VoiceSynthesizer;
