/**
 * Voice Input Module
 * Web Speech API wrapper for speech recognition
 * Captures student voice responses and converts to text
 */

export class VoiceInput {
  constructor() {
    // Browser-specific Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ Speech Recognition API not available in this browser');
      this.available = false;
      return;
    }

    this.recognition = new SpeechRecognition();
    this.available = true;
    this.isListening = false;
    this.transcript = '';
    this.confidence = 0;
    
    // Configuration
    this.recognition.continuous = false; // Single phrase
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    
    // Callbacks
    this.onStart = null;
    this.onResult = null;
    this.onError = null;
    this.onEnd = null;

    // Event handlers
    this.setupEventHandlers();
  }

  /**
   * Setup Web Speech API event handlers
   */
  setupEventHandlers() {
    this.recognition.onstart = () => {
      this.isListening = true;
      this.transcript = '';
      console.log('🎤 Listening...');
      if (this.onStart) this.onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          this.transcript = transcript.toLowerCase().trim();
          this.confidence = confidence;
          console.log(`✅ Final: "${this.transcript}" (confidence: ${(confidence * 100).toFixed(0)}%)`);
        } else {
          interimTranscript += transcript;
          console.log(`📝 Interim: "${interimTranscript}"`);
        }
      }

      if (this.onResult) {
        this.onResult({
          transcript: this.transcript,
          interimTranscript: interimTranscript,
          confidence: this.confidence,
          isFinal: this.transcript.length > 0
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.error(`❌ Speech recognition error: ${event.error}`);
      if (this.onError) this.onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🎤 Stopped listening');
      if (this.onEnd) this.onEnd();
    };
  }

  /**
   * Start listening for voice input
   * @param {number} timeout - Timeout in ms (0 = no timeout)
   */
  start(timeout = 0) {
    if (!this.available) {
      console.error('Speech Recognition not available');
      return false;
    }

    if (this.isListening) {
      console.warn('Already listening');
      return false;
    }

    this.transcript = '';
    this.confidence = 0;
    this.recognition.start();

    // Auto-stop after timeout
    if (timeout > 0) {
      setTimeout(() => {
        if (this.isListening) {
          console.log(`⏱️ Voice timeout after ${timeout}ms`);
          this.stop();
        }
      }, timeout);
    }

    return true;
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Cancel listening (abort)
   */
  abort() {
    if (this.isListening) {
      this.recognition.abort();
    }
  }

  /**
   * Get current transcript
   */
  getTranscript() {
    return this.transcript;
  }

  /**
   * Get confidence score (0-1)
   */
  getConfidence() {
    return this.confidence;
  }

  /**
   * Get transcript + confidence object
   */
  getResult() {
    return {
      transcript: this.transcript,
      confidence: this.confidence,
      isListening: this.isListening
    };
  }

  /**
   * Set language for recognition
   * @param {string} lang - Language code (e.g., 'en-US', 'es-ES')
   */
  setLanguage(lang) {
    this.recognition.lang = lang;
    console.log(`🌍 Language set to: ${lang}`);
  }

  /**
   * Check if voice input is available
   */
  isAvailable() {
    return this.available;
  }
}

/**
 * Voice Feedback - Text-to-speech
 */
export class VoiceFeedback {
  constructor() {
    const SpeechSynthesis = window.speechSynthesis;
    
    this.synthesis = SpeechSynthesis;
    this.available = !!SpeechSynthesis;
    this.isSpeaking = false;

    if (this.available) {
      console.log('✅ Text-to-Speech available');
    } else {
      console.warn('⚠️ Text-to-Speech not available');
    }
  }

  /**
   * Speak text aloud
   * @param {string} text - Text to speak
   * @param {object} options - Voice options
   */
  speak(text, options = {}) {
    if (!this.available) {
      console.warn('Speech Synthesis not available');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Voice options
    utterance.rate = options.rate || 0.9; // Slightly slower for clarity
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8;
    utterance.lang = options.lang || 'en-US';

    utterance.onstart = () => {
      this.isSpeaking = true;
      console.log(`🔊 Speaking: "${text}"`);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      console.log('🔊 Finished speaking');
    };

    utterance.onerror = (error) => {
      console.error(`❌ Speech synthesis error: ${error.error}`);
      this.isSpeaking = false;
    };

    this.synthesis.speak(utterance);
  }

  /**
   * Stop speaking
   */
  stop() {
    if (this.available) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Speak feedback for correct answer
   */
  speakCorrect(activity) {
    const feedbackPhrases = [
      'Excellent! You got it right!',
      'Great job! That is correct!',
      'Perfect! Well done!',
      'Yes! You are a star!',
      'Fantastic! You nailed it!',
      'That is absolutely correct! Amazing!',
      'You are so smart! That is right!',
      'Wonderful! You got it perfect!'
    ];

    const phrase = feedbackPhrases[Math.floor(Math.random() * feedbackPhrases.length)];
    this.speak(phrase, { rate: 0.85, pitch: 1.2 });
  }

  /**
   * Speak feedback for incorrect answer
   */
  speakIncorrect(activity, expectedAnswer) {
    const feedbackPhrases = [
      `Let me help you. The answer is ${expectedAnswer}. Try again!`,
      `Not quite. The correct answer is ${expectedAnswer}. Do not worry, keep trying!`,
      `Oops! That is not right. The answer is ${expectedAnswer}. You can do it!`,
      `Not that one. The answer is ${expectedAnswer}. Try the next question!`,
      `That was not right. The correct answer is ${expectedAnswer}. Good try!`
    ];

    const phrase = feedbackPhrases[Math.floor(Math.random() * feedbackPhrases.length)];
    this.speak(phrase, { rate: 0.85, pitch: 1.0 });
  }

  /**
   * Speak question narration
   */
  speakQuestion(narration) {
    this.speak(narration, { rate: 0.8, pitch: 1.1 });
  }

  /**
   * Speak XP earned announcement
   */
  speakXPEarned(xpAmount) {
    const phrases = [
      `You earned ${xpAmount} experience points!`,
      `Plus ${xpAmount} XP! Great job!`,
      `Awesome! That is ${xpAmount} points for you!`,
      `You got ${xpAmount} XP! Keep going!`,
      `Fantastic! Add ${xpAmount} to your score!`
    ];
    
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.speak(phrase, { rate: 0.9, pitch: 1.1 });
  }

  /**
   * Speak badge awarded announcement
   */
  speakBadgeAwarded(badgeName) {
    const phrases = [
      `Congratulations! You earned the ${badgeName} badge!`,
      `Amazing! You unlocked the ${badgeName} badge!`,
      `Fantastic! The ${badgeName} badge is yours!`,
      `You deserve the ${badgeName} badge! Well done!`,
      `You are so awesome! You got the ${badgeName} badge!`
    ];
    
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.speak(phrase, { rate: 0.85, pitch: 1.2 });
  }

  /**
   * Speak level up announcement
   */
  speakLevelUp(level) {
    const phrases = [
      `Congratulations! You reached level ${level}!`,
      `Amazing! You leveled up to ${level}!`,
      `You are now level ${level}! So awesome!`,
      `Level ${level} unlocked! You are doing great!`,
      `You just became level ${level}! Incredible!`
    ];
    
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.speak(phrase, { rate: 0.85, pitch: 1.2 });
  }

  /**
   * Speak difficulty level change
   */
  speakDifficultyChange(newLevel, isIncrease) {
    let phrase;
    if (isIncrease) {
      const upPhrases = [
        `Great job! You are ready for level ${newLevel}. It is a bit harder now!`,
        `You are doing so well! Level ${newLevel} is coming up. This one is trickier!`,
        `Awesome performance! Now you are on level ${newLevel}!`
      ];
      phrase = upPhrases[Math.floor(Math.random() * upPhrases.length)];
    } else {
      const downPhrases = [
        `Let us go back to level ${newLevel} for now. You can try harder next time!`,
        `Level ${newLevel} will help you build confidence. No worries!`,
        `Back to level ${newLevel}. You are learning! Keep trying!`
      ];
      phrase = downPhrases[Math.floor(Math.random() * downPhrases.length)];
    }
    this.speak(phrase, { rate: 0.85 });
  }

  /**
   * Speak session start
   */
  speakSessionStart(activityName, characterName) {
    const phrases = [
      `Welcome to ${activityName}! I am ${characterName}. Let us start learning!`,
      `Hello! I am ${characterName}. We are about to start ${activityName}. Ready to learn?`,
      `Great! ${characterName} here. We are going to do ${activityName}. Let us begin!`,
      `I am ${characterName}. Today we are learning ${activityName}. Are you ready?`
    ];
    
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.speak(phrase, { rate: 0.8, pitch: 1.0 });
  }

  /**
   * Speak session end summary
   */
  speakSessionSummary(totalXP, questionsCorrect, totalQuestions, accuracy) {
    const accuracyPercent = Math.round(accuracy);
    const phrases = [
      `Great job! You earned ${totalXP} points. You got ${questionsCorrect} out of ${totalQuestions} questions right. That is ${accuracyPercent} percent accuracy!`,
      `Excellent work! You scored ${totalXP} XP. You answered ${questionsCorrect} out of ${totalQuestions} correctly. Amazing job!`,
      `Fantastic! You earned ${totalXP} experience points with ${accuracyPercent} percent accuracy. You got ${questionsCorrect} questions right!`
    ];
    
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.speak(phrase, { rate: 0.8, pitch: 1.0 });
  }

  /**
   * Speak ready to start next question
   */
  speakNextQuestion() {
    const phrases = [
      'Ready for the next question? Listen carefully!',
      'Here we go! Next question coming up!',
      'Let us try another one! Pay attention!',
      'On to the next question! You got this!'
    ];
    
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.speak(phrase, { rate: 0.9, pitch: 1.0 });
  }

  /**
   * Speak listening prompt
   */
  speakListeningPrompt() {
    const phrases = [
      'I am listening now. Tell me your answer!',
      'Go ahead! Speak your answer!',
      'I am ready! What is your answer?',
      'You can answer now. I am listening!'
    ];
    
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.speak(phrase, { rate: 0.9, pitch: 1.0 });
  }

  /**
   * Speak error message
   */
  speakError(errorType) {
    const errorMessages = {
      'no-speech': 'I did not hear anything. Please speak louder and try again!',
      'timeout': 'Time is up! Let us move to the next question.',
      'network': 'Connection error. Let us try again!',
      'not-allowed': 'I need microphone permission. Please allow me to listen!',
      'recognition-error': 'I did not quite catch that. Can you say it again?'
    };
    
    const message = errorMessages[errorType] || 'Something went wrong. Let us try again!';
    this.speak(message, { rate: 0.85, pitch: 0.9 });
  }

  /**
   * Check if currently speaking
   */
  isSpeaking() {
    return this.isSpeaking;
  }
}

/**
 * Combined Voice Manager for activities
 */
export class VoiceManager {
  constructor() {
    this.input = new VoiceInput();
    this.feedback = new VoiceFeedback();
    this.questionTimeoutMs = 15000; // 15 seconds to answer
    this.currentQuestion = null;
    this.onAnswerRecognized = null;
  }

  /**
   * Start listening for answer with timeout
   */
  listenForAnswer(question, onAnswerCallback) {
    this.currentQuestion = question;
    this.onAnswerRecognized = onAnswerCallback;

    console.log(`🎤 Listening for answer to: ${question.prompt}`);
    
    // Setup voice input callback
    this.input.onEnd = () => {
      const result = this.input.getResult();
      if (result.transcript) {
        console.log(`📝 Recognized: "${result.transcript}"`);
        if (this.onAnswerRecognized) {
          this.onAnswerRecognized(result);
        }
      }
    };

    // Start listening with timeout
    this.input.start(this.questionTimeoutMs);
  }

  /**
   * Stop listening
   */
  stopListening() {
    this.input.stop();
  }

  /**
   * Give voice feedback
   */
  giveFeedback(isCorrect, question) {
    if (isCorrect) {
      this.feedback.speakCorrect(question.activity);
    } else {
      this.feedback.speakIncorrect(
        question.activity,
        question.expectedAnswers[0]
      );
    }
  }

  /**
   * Speak the question
   */
  speakQuestion(question) {
    if (question.narration) {
      this.feedback.speakQuestion(question.narration);
    }
  }

  /**
   * Check if voice is available
   */
  isAvailable() {
    return this.input.isAvailable() && this.feedback.available;
  }

  /**
   * Set language
   */
  setLanguage(lang) {
    this.input.setLanguage(lang);
    // TODO: Also set feedback language
  }
}
