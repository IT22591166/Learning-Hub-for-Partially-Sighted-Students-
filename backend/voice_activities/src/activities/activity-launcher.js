/**
 * Activity Launcher
 * Manages complete activity lifecycle with backend integration
 * - Start sessions
 * - Process responses
 * - Calculate rewards
 * - Update progress
 * - End sessions
 * - Voice input for answers
 */

// Backend API configuration
const BACKEND_URL = 'http://localhost:5001';
const GLOVE_API = `${BACKEND_URL}/api/smart-glove`;

/**
 * Send haptic pulse: 1 vibration for correct, 2 for wrong
 */
function hapticFeedback(isCorrect) {
  hapticPulse();
  if (!isCorrect) setTimeout(() => hapticPulse(), 400);
}

/** Fire a single motor pulse (fire-and-forget) */
function hapticPulse(command = '3') {
  fetch(`${GLOVE_API}/motor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command })
  }).catch(() => {});
}

/** Celebration pattern: 3 rapid pulses */
function hapticCelebration() {
  hapticPulse();
  setTimeout(() => hapticPulse(), 300);
  setTimeout(() => hapticPulse(), 600);
}

export class ActivityLauncher {
  constructor(activity, studentId, currentLevel = 1, voiceManager = null) {
    this.activity = activity;
    this.studentId = studentId;
    this.currentLevel = currentLevel;
    this.sessionId = null;
    this.responses = [];
    this.startTime = null;
    this.currentQuestionIndex = 0;
    this.totalXP = 0;
    this.voiceManager = voiceManager; // Voice input handler
    this.useVoiceInput = !!voiceManager; // Flag for voice vs other input
  }

  /**
   * Start a learning session
   */
  async startSession() {
    try {
      console.log(`🚀 Starting session for student ${this.studentId} in activity ${this.activity.id}`);
      
      const payload = {
        student_id: this.studentId,
        activity_id: this.activity.id
      };
      
      console.log('📤 Session creation payload:', payload);

      try {
        const response = await fetch(`${BACKEND_URL}/api/db/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          timeout: 5000
        });

        console.log(`📥 Session response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.session_id) {
            this.sessionId = data.session_id;
            this.startTime = Date.now();
            // Haptic: single pulse to signal session start
            hapticPulse();
            console.log(`✅ Session started: ${this.sessionId}`);
            return this.sessionId;
          }
        }
      } catch (fetchError) {
        console.warn('⚠️ Backend unavailable, using local session:', fetchError.message);
      }

      // Fallback: Create local session ID if backend is unavailable
      this.sessionId = `local-${this.studentId}-${Date.now()}`;
      this.startTime = Date.now();
      // Haptic: single pulse to signal session start
      hapticPulse();
      console.log(`✅ Local session created: ${this.sessionId}`);
      return this.sessionId;
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      // Still create a session to allow activity to proceed
      this.sessionId = `local-${this.studentId}-${Date.now()}`;
      return this.sessionId;
    }
  }

  /**
   * Get next question based on current difficulty level
   */
  getNextQuestion() {
    const levelQuestions = this.activity.questionBank.filter(
      q => q.difficulty === this.currentLevel
    );

    if (levelQuestions.length === 0) {
      // Fallback to any question if none at level
      return this.activity.questionBank[this.currentQuestionIndex % this.activity.questionBank.length];
    }

    const question = levelQuestions[this.currentQuestionIndex % levelQuestions.length];
    return question;
  }

  /**
   * Check if answer is correct (fuzzy matching)
   */
  checkAnswer(question, userAnswer) {
    const normalized = userAnswer.toLowerCase().trim();
    
    return question.expectedAnswers.some(expected => {
      const normalizedExpected = expected.toLowerCase().trim();
      // Check for exact match or partial match
      return normalized === normalizedExpected || 
             normalized.includes(normalizedExpected) ||
             normalizedExpected.includes(normalized);
    });
  }

  /**
   * Record student response to backend
   */
  async recordResponse(question, userAnswer, timeInSeconds) {
    try {
      const isCorrect = this.checkAnswer(question, userAnswer);
      const xpEarned = this.calculateXP(isCorrect, timeInSeconds);

      // Try to send to backend (but don't fail if it's down)
      try {
        const response = await fetch(`${BACKEND_URL}/api/db/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: this.sessionId,
            student_id: this.studentId,
            question_id: question.id,
            response_text: userAnswer,
            correct: isCorrect,
            confidence: isCorrect ? 1.0 : 0.0,
            emotion_state: null
          }),
          timeout: 5000
        });

        if (!response.ok) {
          console.warn('⚠️ Backend failed to record response, continuing locally');
        }
      } catch (fetchError) {
        console.warn('⚠️ Backend unavailable, recording response locally:', fetchError.message);
      }

      // Store locally regardless of backend status
      this.responses.push({
        questionId: question.id,
        isCorrect,
        timeInSeconds,
        xpEarned
      });

      this.totalXP += xpEarned;

      // Update difficulty based on performance
      await this.updateDifficulty();

      // Haptic feedback: 1 pulse correct, 2 pulses wrong
      hapticFeedback(isCorrect);

      return {
        isCorrect,
        xpEarned,
        feedback: isCorrect ? question.feedback.correct : question.feedback.incorrect
      };
    } catch (error) {
      console.error('❌ Error in recordResponse:', error);
      // Still return a response to allow activity to continue
      return {
        isCorrect: false,
        xpEarned: 0,
        feedback: 'Please try again!'
      };
    }
  }

  /**
   * Calculate XP earned for this response
   */
  calculateXP(isCorrect, timeInSeconds) {
    if (!isCorrect) return 0;

    let xp = this.activity.rewards?.xpPerCorrectAnswer || 10;

    // Speed bonus
    if (timeInSeconds < 5 && this.activity.rewards?.bonusXpForSpeed) {
      xp += this.activity.rewards.bonusXpForSpeed;
    }

    return xp;
  }

  /**
   * Record voice response and process answer
   */
  async recordVoiceResponse(question, voiceResult) {
    try {
      const userAnswer = voiceResult.transcript;
      const confidence = voiceResult.confidence || 0;
      
      console.log(`🎤 Voice response: "${userAnswer}" (confidence: ${(confidence * 100).toFixed(0)}%)`);

      // Check if answer is correct
      const isCorrect = this.checkAnswer(question, userAnswer);
      const timeInSeconds = 15; // Voice input duration (approximate)
      const xpEarned = this.calculateXP(isCorrect, timeInSeconds);

      // Try to send to backend (but don't fail if it's down)
      try {
        const response = await fetch(`${BACKEND_URL}/api/db/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: this.sessionId,
            student_id: this.studentId,
            question_id: question.id,
            response_text: userAnswer,
            correct: isCorrect,
            confidence: confidence,
            emotion_state: null
          }),
          timeout: 5000
        });

        if (!response.ok) {
          console.warn('⚠️ Backend failed to record voice response, continuing locally');
        }
      } catch (fetchError) {
        console.warn('⚠️ Backend unavailable, recording voice response locally:', fetchError.message);
      }

      // Store locally regardless of backend status
      this.responses.push({
        questionId: question.id,
        isCorrect,
        timeInSeconds,
        xpEarned,
        voiceConfidence: confidence
      });

      this.totalXP += xpEarned;

      // Update difficulty based on performance
      await this.updateDifficulty();

      // Give voice feedback
      if (this.voiceManager) {
        this.voiceManager.giveFeedback(isCorrect, question);
      }

      // Haptic feedback: 1 pulse correct, 2 pulses wrong
      hapticFeedback(isCorrect);

      return {
        isCorrect,
        xpEarned,
        feedback: isCorrect ? question.feedback.correct : question.feedback.incorrect,
        confidence: confidence
      };
    } catch (error) {
      console.error('❌ Failed to record voice response:', error);
      throw error;
    }
  }

  /**
   * Get next question
   */
  getNextQuestion() {
    const levelQuestions = this.activity.questionBank.filter(
      q => q.difficulty === this.currentLevel
    );

    if (levelQuestions.length === 0) {
      // Fallback to any question if none at level
      return this.activity.questionBank[this.currentQuestionIndex % this.activity.questionBank.length];
    }

    const question = levelQuestions[this.currentQuestionIndex % levelQuestions.length];
    return question;
  }

  /**
   * Check if answer is correct (fuzzy matching)
   */
  checkAnswer(question, userAnswer) {
    const normalized = userAnswer.toLowerCase().trim();
    
    return question.expectedAnswers.some(expected => {
      const normalizedExpected = expected.toLowerCase().trim();
      // Check for exact match or partial match
      return normalized === normalizedExpected || 
             normalized.includes(normalizedExpected) ||
             normalizedExpected.includes(normalized);
    });
  }

  /**
  getAccuracy() {
    if (this.responses.length === 0) return 0;
    const correct = this.responses.filter(r => r.isCorrect).length;
    return correct / this.responses.length;
  }

  /**
   * Update difficulty based on accuracy
   */
  async updateDifficulty() {
    const accuracy = this.getAccuracy();
    const rules = this.activity.adaptiveRules || {
      increaseOn: 0.75,
      decreaseOn: 0.40,
      minDifficulty: 1,
      maxDifficulty: 5
    };
    
    let newLevel = this.currentLevel;

    if (accuracy >= rules.increaseOn && this.currentLevel < rules.maxDifficulty) {
      newLevel = this.currentLevel + 1;
      console.log(`⬆️ Difficulty increased to Level ${newLevel}`);
    } else if (accuracy < rules.decreaseOn && this.currentLevel > rules.minDifficulty) {
      newLevel = this.currentLevel - 1;
      console.log(`⬇️ Difficulty decreased to Level ${newLevel}`);
    }

    if (newLevel !== this.currentLevel) {
      // Haptic: left motor for difficulty up, right motor for difficulty down
      hapticPulse(newLevel > this.currentLevel ? '1' : '2');
      this.currentLevel = newLevel;

      // Update in database
      try {
        await fetch(`/api/db/progress/${this.studentId}/${this.activity.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_level: this.currentLevel,
            accuracy: Math.round(accuracy * 100),
            total_xp: this.totalXP
          })
        });
      } catch (error) {
        console.error('❌ Failed to update progress:', error);
      }
    }
  }

  /**
   * End the learning session
   */
  async endSession() {
    try {
      const duration = Date.now() - this.startTime;
      const accuracy = this.getAccuracy();

      // End session in database
      const response = await fetch(`/api/db/sessions/${this.sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: duration,
          total_responses: this.responses.length
        })
      });

      if (!response.ok) throw new Error('Failed to end session');

      // Check for accuracy bonus
      let bonusXP = 0;
      if (accuracy === 1.0 && this.activity.rewards?.bonusXpForAccuracy) {
        bonusXP = this.activity.rewards.bonusXpForAccuracy;
        this.totalXP += bonusXP;
        console.log(`🎯 Perfect accuracy! Bonus: +${bonusXP} XP`);
      }

      // Award badges if conditions met
      await this.checkAndAwardBadges();

      // Haptic: celebration pattern for session completion
      hapticCelebration();

      console.log(`✅ Session ended: ${this.sessionId}`);

      // Announce session summary via voice
      if (this.voiceManager) {
        const accuracy = this.responses.length > 0 
          ? (this.responses.filter(r => r.isCorrect).length / this.responses.length) * 100 
          : 0;
        
        setTimeout(() => {
          this.voiceManager.feedback.speakSessionSummary(
            this.totalXP,
            this.responses.filter(r => r.isCorrect).length,
            this.responses.length,
            accuracy
          );
        }, 1000);
      }

      return {
        sessionId: this.sessionId,
        totalXP: this.totalXP,
        bonusXP: bonusXP,
        accuracy: Math.round(accuracy * 100),
        responses: this.responses.length,
        duration: Math.round(duration / 1000) // seconds
      };
    } catch (error) {
      console.error('❌ Failed to end session:', error);
      throw error;
    }
  }

  /**
   * Announce session start via voice
   */
  announceSessionStart() {
    if (this.voiceManager && this.voiceManager.feedback) {
      const characterName = this.activity.story?.character || 'Friend';
      this.voiceManager.feedback.speakSessionStart(
        this.activity.name,
        characterName
      );
    }
  }

  /**
   * Announce next question via voice
   */
  announceNextQuestion() {
    if (this.voiceManager && this.voiceManager.feedback) {
      this.voiceManager.feedback.speakNextQuestion();
    }
  }

  /**
   * Announce XP earned via voice
   */
  announceXPEarned(xpAmount) {
    if (this.voiceManager && this.voiceManager.feedback) {
      this.voiceManager.feedback.speakXPEarned(xpAmount);
    }
  }

  /**
   * Announce badge awarded via voice
   */
  announceBadgeAwarded(badgeName) {
    if (this.voiceManager && this.voiceManager.feedback) {
      this.voiceManager.feedback.speakBadgeAwarded(badgeName);
    }
  }

  /**
   * Announce level up via voice
   */
  announceLevelUp(level) {
    if (this.voiceManager && this.voiceManager.feedback) {
      this.voiceManager.feedback.speakLevelUp(level);
    }
  }

  /**
   * Announce difficulty change via voice
   */
  announceDifficultyChange(newLevel, isIncrease) {
    if (this.voiceManager && this.voiceManager.feedback) {
      this.voiceManager.feedback.speakDifficultyChange(newLevel, isIncrease);
    }
  }

  /**
   * Check and award badges based on performance
   */
  async checkAndAwardBadges() {
    try {
      const accuracy = this.getAccuracy();
      const badgesToAward = [];

      // Activity-specific badge on first completion
      if (this.responses.length > 0) {
        const badgeId = this.activity.rewards?.badgesEarned?.[0]?.id;
        if (badgeId) {
          badgesToAward.push({
            badge_id: badgeId,
            activity_id: this.activity.id
          });
        }
      }

      // Award all earned badges
      for (const badge of badgesToAward) {
        await fetch(`${BACKEND_URL}/api/db/badges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: this.studentId,
            badge_id: badge.badge_id,
            activity_id: badge.activity_id
          })
        });
      }

      if (badgesToAward.length > 0) {
        console.log(`🏆 Awarded ${badgesToAward.length} badge(s)`);
      }
    } catch (error) {
      console.error('❌ Failed to award badges:', error);
    }
  }

  /**
   * Get session summary
   */
  getSummary() {
    return {
      activity: this.activity.name,
      sessionId: this.sessionId,
      questionsAnswered: this.responses.length,
      correctAnswers: this.responses.filter(r => r.isCorrect).length,
      accuracy: Math.round(this.getAccuracy() * 100),
      totalXP: this.totalXP,
      currentLevel: this.currentLevel,
      duration: Math.round((Date.now() - this.startTime) / 1000)
    };
  }
}

/**
 * Initialize activity session from dashboard
 */
export async function initializeActivity(activityId, studentId) {
  try {
    // Import activity registry
    const { getActivityById } = await import('./index.js');
    
    // Load activity from registry
    const activity = await getActivityById(activityId);
    
    if (!activity) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    console.log(`📚 Loaded activity: ${activity.name}`);

    // Create launcher (default to level 1 for now)
    const launcher = new ActivityLauncher(activity, studentId, 1);

    // Start session
    await launcher.startSession();

    console.log(`✅ Launcher initialized with session: ${launcher.sessionId}`);
    return launcher;
  } catch (error) {
    console.error('❌ Failed to initialize activity:', error);
    throw error;
  }
}
