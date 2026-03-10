/**
 * Voice Learning Module Core
 * Main orchestrator for the learning system
 */

import { SpeechRecognizer } from '../audio/speech-recognizer.js';
import { VoiceSynthesizer } from '../audio/text-to-speech.js';
import { AudioProcessor } from '../audio/audio-processor.js';
import { AdaptiveDifficultyEngine } from '../adaptive-engine/adaptive-difficulty-engine.js';
import { EmotionDetector } from '../emotion-detection/emotion-detector.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export class VoiceLearningModule {
  constructor(options = {}) {
    this.options = {
      userId: options.userId || 'unknown',
      language: options.language || 'en-US',
      activities: options.activities || [],
      adaptiveMode: options.adaptiveMode !== false,
      emotionDetection: options.emotionDetection !== false,
      debug: options.debug || false,
      ...options
    };

    this.modules = {
      speechRecognizer: null,
      voiceSynthesizer: null,
      audioProcessor: null,
      adaptiveEngine: null,
      emotionDetector: null
    };

    this.session = null;
    this.isActive = false;

    if (this.options.debug) {
      logger.setLevel(0); // DEBUG level
    }
  }

  /**
   * Initialize all modules
   */
  async initialize() {
    try {
      logger.info('Initializing Voice Learning Module...');

      // Initialize audio processor first (requires microphone access)
      this.modules.audioProcessor = new AudioProcessor();
      await this.modules.audioProcessor.initialize();

      // Initialize speech recognition
      this.modules.speechRecognizer = new SpeechRecognizer({
        language: this.options.language
      });

      // Initialize text-to-speech
      this.modules.voiceSynthesizer = new VoiceSynthesizer({
        language: this.options.language
      });

      // Initialize adaptive difficulty engine
      if (this.options.adaptiveMode) {
        this.modules.adaptiveEngine = new AdaptiveDifficultyEngine({
          targetSuccessRate: 0.55
        });
      }

      // Initialize emotion detection
      if (this.options.emotionDetection) {
        this.modules.emotionDetector = new EmotionDetector({
          smoothingWindow: 3
        });
      }

      logger.info('Voice Learning Module initialized successfully');
      return true;

    } catch (error) {
      logger.error('Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start a learning session
   */
  async startSession(options = {}) {
    if (this.session && this.isActive) {
      logger.warn('Session already active');
      return this.session;
    }

    try {
      const sessionId = uuidv4();
      
      this.session = {
        sessionId,
        userId: this.options.userId,
        activityId: options.activityId || this.options.activities[0],
        startTime: Date.now(),
        endTime: null,
        duration: options.duration || 15 * 60 * 1000,
        questions: [],
        responses: [],
        emotionalData: [],
        status: 'active'
      };

      this.isActive = true;

      logger.info(`Session ${sessionId} started for activity ${this.session.activityId}`);

      // Welcome message
      await this.speak(`Welcome to the learning activity! Let's get started.`, {
        character: 'sophie',
        emotionalTone: 'encouraging'
      });

      return this.session;

    } catch (error) {
      logger.error('Failed to start session:', error);
      throw error;
    }
  }

  /**
   * Present a question and collect response
   */
  async presentQuestion(question) {
    if (!this.session || !this.isActive) {
      throw new Error('No active session');
    }

    try {
      logger.info(`Presenting question: ${question.id}`);

      // Narrate the question
      await this.speak(question.prompt, {
        character: question.character || 'sophie',
        emotionalTone: 'neutral'
      });

      // Listen for response
      const response = await this.listenForResponse(question);

      if (!response) {
        logger.warn('No response received');
        return null;
      }

      // Validate response
      const isCorrect = this.validateResponse(response.text, question.expectedAnswers);

      // Create response record
      const responseRecord = {
        questionId: question.id,
        userResponse: response.text,
        isCorrect,
        responseTime: response.duration,
        difficulty: question.difficulty || 0,
        confidence: response.confidence || 0.5,
        emotionalState: response.emotionalState || null,
        timestamp: Date.now()
      };

      this.session.responses.push(responseRecord);

      if (response.emotionalState) {
        this.session.emotionalData.push(response.emotionalState);
      }

      // Provide feedback
      await this.provideFeedback(isCorrect, question, responseRecord);

      // Update adaptive difficulty
      if (this.modules.adaptiveEngine) {
        this.modules.adaptiveEngine.updatePerformance(responseRecord);
      }

      return responseRecord;

    } catch (error) {
      logger.error('Error presenting question:', error);
      throw error;
    }
  }

  /**
   * Listen for child's response
   */
  async listenForResponse(question, timeout = 30000) {
    return new Promise((resolve) => {
      const recognizer = this.modules.speechRecognizer;
      const startTime = Date.now();
      let bestResult = null;

      // Set timeout
      const timeoutHandle = setTimeout(() => {
        recognizer.stopListening();
        logger.warn('Response timeout');
        resolve(null);
      }, timeout);

      // Listen for final result
      recognizer.once('final-result', async (result) => {
        clearTimeout(timeoutHandle);
        recognizer.stopListening();

        const duration = Date.now() - startTime;
        let emotionalState = null;

        // Analyze emotion if enabled
        if (this.modules.emotionDetector && result.audioBuffer) {
          emotionalState = this.modules.emotionDetector.analyzeAudio(
            result.audioBuffer,
            16000
          );
        }

        resolve({
          text: result.text,
          confidence: result.confidence,
          duration,
          emotionalState,
          audioBuffer: result.audioBuffer
        });
      });

      // Start listening
      recognizer.startListening();
    });
  }

  /**
   * Validate response against expected answers
   */
  validateResponse(userResponse, expectedAnswers) {
    if (!expectedAnswers || expectedAnswers.length === 0) {
      return false;
    }

    const normalized = userResponse.toLowerCase().trim();

    // Exact match
    for (const expected of expectedAnswers) {
      if (normalized === expected.toLowerCase()) {
        return true;
      }
    }

    // Fuzzy match (simple Levenshtein distance)
    for (const expected of expectedAnswers) {
      const distance = this.levenshteinDistance(normalized, expected.toLowerCase());
      const maxDistance = Math.max(2, Math.floor(expected.length * 0.3));
      
      if (distance <= maxDistance) {
        return true;
      }
    }

    return false;
  }

  /**
   * Levenshtein distance for fuzzy matching
   */
  levenshteinDistance(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Provide feedback to learner
   */
  async provideFeedback(isCorrect, question, response) {
    let feedbackText;
    let emotionalTone = 'encouraging';

    if (isCorrect) {
      // Correct response feedback
      feedbackText = this.getPositiveFeedback(question, response);
      
      // Award reward if applicable
      if (response.confidence > 0.7 && response.responseTime < 5000) {
        feedbackText += ' Excellent work!';
      }
    } else {
      // Incorrect response feedback
      feedbackText = this.getNegativeFeedback(question, response);
      emotionalTone = 'calm';
    }

    // Consider emotional state
    if (response.emotionalState) {
      if (response.emotionalState.frustration > 0.6) {
        feedbackText += ' Let us try another one, you can do it!';
      }
    }

    await this.speak(feedbackText, {
      character: 'sophie',
      emotionalTone
    });
  }

  /**
   * Generate positive feedback
   */
  getPositiveFeedback(question, response) {
    const feedbackOptions = [
      'Wonderful! That is correct!',
      'Great job! You got it right!',
      'Excellent answer!',
      'Perfect! Well done!'
    ];

    return feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
  }

  /**
   * Generate negative/corrective feedback
   */
  getNegativeFeedback(question, response) {
    const feedbackOptions = [
      'Not quite. Let me give you a hint.',
      'That is not correct, but you are close.',
      'Try again, I believe in you!'
    ];

    return feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
  }

  /**
   * Speak text using TTS
   */
  async speak(text, options = {}) {
    try {
      await this.modules.voiceSynthesizer.speak(text, options);
    } catch (error) {
      logger.error('Text-to-speech failed:', error);
    }
  }

  /**
   * End learning session
   */
  async endSession() {
    if (!this.session || !this.isActive) {
      logger.warn('No active session to end');
      return null;
    }

    try {
      this.session.endTime = Date.now();
      this.session.duration = this.session.endTime - this.session.startTime;
      this.session.status = 'completed';

      // Generate session summary
      const summary = this.generateSessionSummary();

      // Provide closing message
      await this.speak(summary.closingMessage, {
        character: 'sophie',
        emotionalTone: 'celebratory'
      });

      this.isActive = false;

      logger.info(`Session ${this.session.sessionId} ended`);

      return {
        session: this.session,
        summary
      };

    } catch (error) {
      logger.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Generate session summary
   */
  generateSessionSummary() {
    const responses = this.session.responses;
    const correctCount = responses.filter(r => r.isCorrect).length;
    const accuracy = responses.length > 0 ? (correctCount / responses.length) * 100 : 0;

    let closingMessage = `Great work! You completed ${responses.length} questions `;
    closingMessage += `with ${accuracy.toFixed(0)}% accuracy. `;
    closingMessage += 'See you next time!';

    const emotionalTrend = this.modules.emotionDetector 
      ? this.modules.emotionDetector.getEmotionalTrend()
      : null;

    return {
      totalQuestions: responses.length,
      correctAnswers: correctCount,
      accuracy,
      sessionDuration: this.session.duration / 1000 / 60, // minutes
      emotionalTrend,
      closingMessage
    };
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    if (!this.session) {
      return null;
    }

    const stats = {
      sessionId: this.session.sessionId,
      status: this.session.status,
      duration: this.session.duration,
      questionCount: this.session.responses.length
    };

    if (this.modules.adaptiveEngine) {
      stats.performance = this.modules.adaptiveEngine.getStatistics();
    }

    if (this.modules.emotionDetector) {
      stats.emotionalTrend = this.modules.emotionDetector.getEmotionalTrend();
    }

    return stats;
  }

  /**
   * Cleanup and teardown
   */
  cleanup() {
    try {
      this.modules.audioProcessor?.cleanup();
      this.modules.speechRecognizer?.abort();
      this.modules.voiceSynthesizer?.stop();
      this.isActive = false;

      logger.info('Voice Learning Module cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

export default VoiceLearningModule;
