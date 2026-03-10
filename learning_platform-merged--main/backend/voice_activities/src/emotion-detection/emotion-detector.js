/**
 * Emotion Detection Module
 * Analyzes emotional state from acoustic features
 * Detects confidence, frustration, and engagement levels
 */

import { logger } from '../utils/logger.js';

export class EmotionDetector {
  constructor(options = {}) {
    this.options = {
      smoothingWindow: options.smoothingWindow || 3,
      enableRealTime: options.enableRealTime !== false,
      ...options
    };

    // Baseline thresholds (will be calibrated per user)
    this.baselineThresholds = {
      pitch: { min: 80, max: 250 },
      energy: { min: -60, max: -10 },
      speechRate: { min: 100, max: 250 }
    };

    this.emotionalHistory = [];
    this.smoothedEmotions = {};
  }

  /**
   * Main emotion analysis function
   */
  analyzeAudio(audioBuffer, sampleRate = 16000) {
    try {
      // Extract acoustic features
      const features = this.extractFeatures(audioBuffer, sampleRate);

      // Analyze each dimension
      const confidence = this.analyzeConfidence(features);
      const frustration = this.analyzeFrustration(features);
      const engagement = this.analyzeEngagement(features);

      // Combine into overall emotional state
      const emotionalState = {
        timestamp: Date.now(),
        confidence,
        frustration,
        engagement,
        arousal: (frustration + engagement) / 2,
        valence: 1 - frustration, // 0 = negative, 1 = positive
        dominantEmotion: this.getDominantEmotion(confidence, frustration, engagement),
        prosody: features.prosody,
        rawFeatures: features
      };

      // Apply temporal smoothing
      this.smoothEmotionalState(emotionalState);

      // Store in history
      this.emotionalHistory.push(emotionalState);

      return emotionalState;

    } catch (error) {
      logger.error('Error analyzing emotion:', error);
      return null;
    }
  }

  /**
   * Extract acoustic features from audio buffer
   */
  extractFeatures(audioBuffer, sampleRate) {
    const features = {
      timestamp: Date.now(),
      sampleRate,
      duration: audioBuffer.length / sampleRate,
      prosody: {}
    };

    // Calculate basic energy features
    features.rms = this.calculateRMS(audioBuffer);
    features.energy = 20 * Math.log10(Math.max(features.rms, 1e-10));
    features.zeroCrossingRate = this.calculateZeroCrossingRate(audioBuffer);

    // Pitch estimation (fundamental frequency)
    features.prosody.fundamentalFrequency = this.estimatePitch(audioBuffer, sampleRate);
    features.prosody.pitch = features.prosody.fundamentalFrequency;

    // Speech rate estimation
    features.prosody.speechRate = this.estimateSpeechRate(audioBuffer, sampleRate);

    // Energy features
    features.prosody.energy = features.energy;

    // Spectral features
    features.spectralCentroid = this.calculateSpectralCentroid(audioBuffer, sampleRate);
    features.spectralFlux = this.calculateSpectralFlux(audioBuffer, sampleRate);

    // Voice quality features
    features.voiceTensionIndex = this.estimateVoiceTension(features);
    features.voiceTensionIndex = Math.max(0, Math.min(1, features.voiceTensionIndex));

    // Hesitation markers
    features.pauseCount = this.countPauses(audioBuffer, sampleRate);
    features.pauseRatio = this.calculatePauseRatio(audioBuffer, sampleRate);

    return features;
  }

  /**
   * Calculate RMS energy
   */
  calculateRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Calculate zero crossing rate
   */
  calculateZeroCrossingRate(buffer) {
    let crossings = 0;
    for (let i = 1; i < buffer.length; i++) {
      if ((buffer[i] >= 0 && buffer[i - 1] < 0) || 
          (buffer[i] < 0 && buffer[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / (buffer.length - 1);
  }

  /**
   * Estimate pitch using autocorrelation
   */
  estimatePitch(buffer, sampleRate) {
    const minPeriod = Math.floor(sampleRate / 400); // 400 Hz max
    const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min

    let maxCorr = 0;
    let bestPeriod = maxPeriod;

    // Only check first 2000 samples for speed
    const checkLength = Math.min(2000, buffer.length);

    for (let period = minPeriod; period <= maxPeriod; period++) {
      let corr = 0;
      for (let i = 0; i < checkLength - period; i++) {
        corr += buffer[i] * buffer[i + period];
      }

      if (corr > maxCorr) {
        maxCorr = corr;
        bestPeriod = period;
      }
    }

    const f0 = sampleRate / bestPeriod;
    
    // Validate pitch (reasonable range for children: 80-400 Hz)
    return (f0 >= 80 && f0 <= 400) ? f0 : 0;
  }

  /**
   * Estimate speech rate (words per minute)
   */
  estimateSpeechRate(buffer, sampleRate) {
    // Simplified: estimate based on energy peaks
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
    const peaks = [];
    const threshold = this.calculateRMS(buffer) * 0.5;

    for (let i = 0; i < buffer.length - windowSize; i += windowSize) {
      const windowEnergy = this.calculateRMS(buffer.slice(i, i + windowSize));
      if (windowEnergy > threshold) {
        peaks.push(i);
      }
    }

    // Count peaks as rough syllable estimate
    const duration = buffer.length / sampleRate;
    const estimatedSyllables = peaks.length / 2; // Rough conversion
    const wordsPerSecond = estimatedSyllables / 4 / duration; // ~4 syllables per word

    return Math.max(0, wordsPerSecond * 60); // Return WPM
  }

  /**
   * Calculate spectral centroid
   */
  calculateSpectralCentroid(buffer, sampleRate) {
    // Simplified calculation
    const windowSize = 512;
    let totalCentroid = 0;
    let windowCount = 0;

    for (let i = 0; i < buffer.length - windowSize; i += windowSize) {
      const spectrum = this.getSimpleSpectrum(buffer.slice(i, i + windowSize));
      totalCentroid += this.computeCentroid(spectrum, sampleRate, windowSize);
      windowCount++;
    }

    return windowCount > 0 ? totalCentroid / windowCount : 0;
  }

  /**
   * Simple spectrum calculation
   */
  getSimpleSpectrum(window) {
    // Apply Hamming window
    const windowed = new Float32Array(window.length);
    for (let i = 0; i < window.length; i++) {
      windowed[i] = window[i] * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (window.length - 1)));
    }

    // Simple magnitude spectrum (simplified - use FFT library in production)
    const spectrum = new Float32Array(window.length / 2);
    for (let i = 0; i < spectrum.length; i++) {
      spectrum[i] = Math.abs(windowed[i]);
    }
    return spectrum;
  }

  /**
   * Compute spectral centroid
   */
  computeCentroid(spectrum, sampleRate, windowSize) {
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < spectrum.length; i++) {
      const frequency = (i / spectrum.length) * (sampleRate / 2);
      numerator += frequency * spectrum[i];
      denominator += spectrum[i];
    }

    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Calculate spectral flux
   */
  calculateSpectralFlux(buffer, sampleRate) {
    // Simplified: use energy change as proxy
    const windowSize = 256;
    let flux = 0;
    let prevEnergy = 0;

    for (let i = 0; i < buffer.length - windowSize; i += windowSize) {
      const energy = this.calculateRMS(buffer.slice(i, i + windowSize));
      flux += Math.abs(energy - prevEnergy);
      prevEnergy = energy;
    }

    return flux;
  }

  /**
   * Estimate voice tension from acoustic features
   */
  estimateVoiceTension(features) {
    // Voice tension correlates with:
    // - Increased pitch variance
    // - Higher spectral centroid
    // - Reduced zero crossing rate (formant compression)

    let tension = 0;

    // Pitch elevation indicator
    if (features.prosody.pitch > this.baselineThresholds.pitch.max) {
      tension += 0.3;
    }

    // Energy increase indicator
    if (features.energy > -20) {
      tension += 0.3;
    }

    // Spectral centroid shift
    if (features.spectralCentroid > 2500) {
      tension += 0.2;
    }

    // ZCR decrease (formant changes)
    if (features.zeroCrossingRate < 0.15) {
      tension += 0.2;
    }

    return Math.min(1, tension);
  }

  /**
   * Count pauses/silences
   */
  countPauses(buffer, sampleRate) {
    const threshold = this.calculateRMS(buffer) * 0.2;
    const windowSize = Math.floor(sampleRate * 0.1); // 100ms
    let pauseCount = 0;

    for (let i = 0; i < buffer.length - windowSize; i += windowSize) {
      const windowEnergy = this.calculateRMS(buffer.slice(i, i + windowSize));
      if (windowEnergy < threshold) {
        pauseCount++;
      }
    }

    return pauseCount;
  }

  /**
   * Calculate pause ratio
   */
  calculatePauseRatio(buffer, sampleRate) {
    const pauseCount = this.countPauses(buffer, sampleRate);
    const windowSize = Math.floor(sampleRate * 0.1);
    const totalWindows = Math.ceil(buffer.length / windowSize);

    return totalWindows > 0 ? pauseCount / totalWindows : 0;
  }

  /**
   * Analyze confidence from acoustic features
   */
  analyzeConfidence(features) {
    // Confidence markers:
    // - Fluent speech (few pauses)
    // - Stable pitch
    // - Consistent energy
    // - Lower hesitation

    let confidence = 0.5; // Start at neutral

    // Penalty for pauses (hesitation)
    confidence -= features.pauseRatio * 0.4;

    // Reward for fluency
    if (features.prosody.speechRate > 100) {
      confidence += 0.2;
    }

    // Penalty for voice tension (uncertainty)
    confidence -= features.voiceTensionIndex * 0.2;

    // Reward for energy consistency
    if (features.energy > -40) {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Analyze frustration from acoustic features
   */
  analyzeFrustration(features) {
    // Frustration markers:
    // - Increased pitch
    // - Higher energy
    // - Faster speech rate
    // - Voice tension
    // - Irregular patterns

    let frustration = 0;

    // Pitch elevation (stress indicator)
    if (features.prosody.pitch > this.baselineThresholds.pitch.max) {
      frustration += 0.3;
    }

    // Energy increase
    if (features.energy > -25) {
      frustration += 0.3;
    }

    // Speech rate acceleration
    if (features.prosody.speechRate > 200) {
      frustration += 0.2;
    }

    // Voice tension
    frustration += features.voiceTensionIndex * 0.2;

    return Math.max(0, Math.min(1, frustration));
  }

  /**
   * Analyze engagement from acoustic features
   */
  analyzeEngagement(features) {
    // Engagement markers:
    // - Clear articulation (higher spectral centroid)
    // - Appropriate energy
    // - Natural speech rate
    // - Pitch variation (prosody)

    let engagement = 0.5;

    // Spectral variety (articulation clarity)
    if (features.spectralCentroid > 1500 && features.spectralCentroid < 3500) {
      engagement += 0.2;
    }

    // Energy level (not too low, not too high)
    if (features.energy > -45 && features.energy < -15) {
      engagement += 0.2;
    }

    // Speech rate variation
    if (features.prosody.speechRate > 100 && features.prosody.speechRate < 250) {
      engagement += 0.1;
    }

    // Pitch variation (intonation)
    engagement -= features.pauseRatio * 0.15; // Pauses reduce engagement

    return Math.max(0, Math.min(1, engagement));
  }

  /**
   * Determine dominant emotion
   */
  getDominantEmotion(confidence, frustration, engagement) {
    const emotions = [
      { name: 'calm', score: (1 - frustration) * confidence },
      { name: 'engaged', score: engagement * confidence },
      { name: 'frustrated', score: frustration },
      { name: 'confused', score: (1 - confidence) * (1 - engagement) }
    ];

    emotions.sort((a, b) => b.score - a.score);
    return emotions[0].name;
  }

  /**
   * Apply temporal smoothing to emotional state
   */
  smoothEmotionalState(emotionalState) {
    const window = this.options.smoothingWindow;
    const history = this.emotionalHistory.slice(-window);

    if (history.length > 0) {
      const avgConfidence = history.reduce((sum, e) => sum + e.confidence, 0) / history.length;
      const avgFrustration = history.reduce((sum, e) => sum + e.frustration, 0) / history.length;
      const avgEngagement = history.reduce((sum, e) => sum + e.engagement, 0) / history.length;

      this.smoothedEmotions = {
        confidence: avgConfidence,
        frustration: avgFrustration,
        engagement: avgEngagement
      };
    }
  }

  /**
   * Get emotional trend over time
   */
  getEmotionalTrend(duration = 60000) {
    const cutoff = Date.now() - duration;
    const recentHistory = this.emotionalHistory.filter(e => e.timestamp > cutoff);

    if (recentHistory.length === 0) {
      return null;
    }

    return {
      duration,
      sampleCount: recentHistory.length,
      averageConfidence: recentHistory.reduce((sum, e) => sum + e.confidence, 0) / recentHistory.length,
      averageFrustration: recentHistory.reduce((sum, e) => sum + e.frustration, 0) / recentHistory.length,
      averageEngagement: recentHistory.reduce((sum, e) => sum + e.engagement, 0) / recentHistory.length,
      dominantEmotions: this.getDominantEmotions(recentHistory),
      trend: this.calculateTrend(recentHistory)
    };
  }

  /**
   * Get most common emotions
   */
  getDominantEmotions(history) {
    const emotionCounts = {};
    history.forEach(e => {
      emotionCounts[e.dominantEmotion] = (emotionCounts[e.dominantEmotion] || 0) + 1;
    });

    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, frequency: count / history.length }));
  }

  /**
   * Calculate trend (improving/declining)
   */
  calculateTrend(history) {
    if (history.length < 2) return 'stable';

    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    const secondHalf = history.slice(Math.floor(history.length / 2));

    const firstConfidence = firstHalf.reduce((sum, e) => sum + e.confidence, 0) / firstHalf.length;
    const secondConfidence = secondHalf.reduce((sum, e) => sum + e.confidence, 0) / secondHalf.length;

    if (secondConfidence > firstConfidence + 0.1) return 'improving';
    if (secondConfidence < firstConfidence - 0.1) return 'declining';
    return 'stable';
  }

  /**
   * Reset emotion detector
   */
  reset() {
    this.emotionalHistory = [];
    this.smoothedEmotions = {};
    logger.debug('Emotion detector reset');
  }

  /**
   * Get current emotional state
   */
  getCurrentEmotionalState() {
    if (this.emotionalHistory.length === 0) {
      return null;
    }
    return this.emotionalHistory[this.emotionalHistory.length - 1];
  }
}

export default EmotionDetector;
