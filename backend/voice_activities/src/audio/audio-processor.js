/**
 * Audio Processor Module
 * Handles audio preprocessing, feature extraction, and analysis
 */

import { logger } from '../utils/logger.js';

export class AudioProcessor {
  constructor(sampleRate = 16000) {
    this.sampleRate = sampleRate;
    this.audioContext = null;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioBuffer = [];
    this.isRecording = false;
  }

  /**
   * Initialize audio context and get microphone access
   */
  async initialize() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.sampleRate
      });
      this.audioContext = audioContext;

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false // We'll handle gain manually
        }
      });

      this.mediaStream = stream;
      logger.info('Audio processor initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize audio processor:', error);
      throw new Error('Microphone access denied or unavailable');
    }
  }

  /**
   * Start recording audio
   */
  startRecording() {
    if (!this.mediaStream) {
      throw new Error('Audio processor not initialized');
    }

    this.audioBuffer = [];
    this.isRecording = true;

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(this.audioContext.destination);

    processor.onaudioprocess = (event) => {
      if (this.isRecording) {
        const inputData = event.inputBuffer.getChannelData(0);
        this.audioBuffer.push(...inputData);
      }
    };

    this.processor = processor;
    this.source = source;

    logger.debug('Audio recording started');
  }

  /**
   * Stop recording and get audio buffer
   */
  stopRecording() {
    this.isRecording = false;

    if (this.processor) {
      this.processor.disconnect();
      this.source.disconnect();
    }

    const audioData = new Float32Array(this.audioBuffer);
    logger.debug(`Audio recording stopped. Duration: ${audioData.length / this.sampleRate}s`);

    return audioData;
  }

  /**
   * Extract acoustic features from audio buffer
   * Used for emotion detection and analysis
   */
  extractFeatures(audioBuffer) {
    const features = {
      timestamp: Date.now(),
      sampleRate: this.sampleRate,
      duration: audioBuffer.length / this.sampleRate,
      rms: this.calculateRMS(audioBuffer),
      energy: this.calculateEnergy(audioBuffer),
      zcr: this.calculateZeroCrossingRate(audioBuffer),
      mfcc: this.calculateMFCC(audioBuffer),
      pitch: this.estimateFundamentalFrequency(audioBuffer),
      spectralCentroid: this.calculateSpectralCentroid(audioBuffer),
      speechRate: this.estimateSpeechRate(audioBuffer)
    };

    return features;
  }

  /**
   * Calculate RMS (Root Mean Square) energy
   */
  calculateRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Calculate energy in dB
   */
  calculateEnergy(buffer) {
    const rms = this.calculateRMS(buffer);
    // Convert to dB (ref: 1.0)
    return 20 * Math.log10(Math.max(rms, 1e-10));
  }

  /**
   * Calculate Zero Crossing Rate (ZCR)
   * Useful for distinguishing voiced/unvoiced speech
   */
  calculateZeroCrossingRate(buffer) {
    let crossings = 0;
    for (let i = 1; i < buffer.length; i++) {
      if ((buffer[i] >= 0 && buffer[i - 1] < 0) || 
          (buffer[i] < 0 && buffer[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / buffer.length;
  }

  /**
   * Calculate MFCC (Mel-Frequency Cepstral Coefficients)
   * Key feature for speech recognition and emotion detection
   */
  calculateMFCC(buffer, numCoefficients = 13) {
    // 1. Pre-emphasis
    const emphasized = this.preEmphasis(buffer);

    // 2. Framing
    const frameLength = Math.floor(this.sampleRate * 0.025); // 25ms
    const hopLength = Math.floor(this.sampleRate * 0.010);   // 10ms
    const frames = [];

    for (let i = 0; i < emphasized.length - frameLength; i += hopLength) {
      frames.push(emphasized.slice(i, i + frameLength));
    }

    // 3. Apply Hamming window and FFT to each frame
    const melSpectrograms = frames.map(frame => {
      const windowed = this.hammingWindow(frame);
      const spectrum = this.computeFFT(windowed);
      return this.melScale(spectrum);
    });

    // 4. Log compression
    const logMelSpectrogram = melSpectrograms.map(spec => 
      spec.map(val => Math.log(Math.max(val, 1e-10)))
    );

    // 5. DCT to get MFCCs
    const mfccs = logMelSpectrogram.map(logSpec => 
      this.discreteCosineTransform(logSpec).slice(0, numCoefficients)
    );

    // Return mean MFCC across frames
    const meanMFCC = new Array(numCoefficients).fill(0);
    for (const mfcc of mfccs) {
      for (let i = 0; i < numCoefficients; i++) {
        meanMFCC[i] += mfcc[i];
      }
    }

    return meanMFCC.map(val => val / mfccs.length);
  }

  /**
   * Pre-emphasis filter
   */
  preEmphasis(buffer, coeff = 0.97) {
    const emphasized = new Float32Array(buffer.length);
    emphasized[0] = buffer[0];

    for (let i = 1; i < buffer.length; i++) {
      emphasized[i] = buffer[i] - coeff * buffer[i - 1];
    }

    return emphasized;
  }

  /**
   * Apply Hamming window
   */
  hammingWindow(frame) {
    const windowed = new Float32Array(frame.length);
    for (let i = 0; i < frame.length; i++) {
      windowed[i] = frame[i] * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (frame.length - 1)));
    }
    return windowed;
  }

  /**
   * Simple FFT implementation (stub - use external library for production)
   */
  computeFFT(signal) {
    // In production, use FFT.js or similar library
    // For now, return magnitude spectrum
    const spectrum = new Array(signal.length).fill(0);
    // TODO: Implement proper FFT
    return spectrum;
  }

  /**
   * Convert to mel scale
   */
  melScale(spectrum) {
    // TODO: Implement mel-scale filtering
    return spectrum;
  }

  /**
   * Discrete Cosine Transform
   */
  discreteCosineTransform(input) {
    const output = new Array(input.length);
    const N = input.length;

    for (let k = 0; k < N; k++) {
      let sum = 0;
      for (let n = 0; n < N; n++) {
        sum += input[n] * Math.cos((Math.PI / N) * (n + 0.5) * k);
      }
      output[k] = sum;
    }

    return output;
  }

  /**
   * Estimate fundamental frequency (pitch)
   * Using autocorrelation method
   */
  estimateFundamentalFrequency(buffer) {
    const minPeriod = Math.floor(this.sampleRate / 400); // Min 400 Hz
    const maxPeriod = Math.floor(this.sampleRate / 80);  // Max 80 Hz

    let maxCorr = 0;
    let bestPeriod = maxPeriod;

    for (let period = minPeriod; period <= maxPeriod; period++) {
      let corr = 0;
      for (let i = 0; i < buffer.length - period; i++) {
        corr += buffer[i] * buffer[i + period];
      }

      if (corr > maxCorr) {
        maxCorr = corr;
        bestPeriod = period;
      }
    }

    const f0 = this.sampleRate / bestPeriod;
    return f0 > 400 && f0 < 400 ? f0 : 0; // Return 0 if unvoiced
  }

  /**
   * Calculate spectral centroid
   * Center of mass of the frequency spectrum
   */
  calculateSpectralCentroid(buffer) {
    // TODO: Implement spectral centroid calculation
    return 0;
  }

  /**
   * Estimate speech rate
   */
  estimateSpeechRate(buffer) {
    // Estimate words per minute based on energy peaks
    // This is a simplified version
    const frameDuration = buffer.length / this.sampleRate;
    return 150 / 60; // Placeholder: return 2.5 words/second
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.processor) {
      this.processor.disconnect();
    }
    if (this.source) {
      this.source.disconnect();
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
  }
}

export default AudioProcessor;
