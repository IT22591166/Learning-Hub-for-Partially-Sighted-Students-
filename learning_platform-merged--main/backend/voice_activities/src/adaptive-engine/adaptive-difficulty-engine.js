/**
 * Adaptive Difficulty Engine
 * Uses Item Response Theory (IRT) to adjust question difficulty
 * Based on student performance, confidence, and emotional state
 */

import { logger } from '../utils/logger.js';

export class AdaptiveDifficultyEngine {
  constructor(options = {}) {
    this.options = {
      targetSuccessRate: options.targetSuccessRate || 0.55, // Target 55% success
      abilityInitial: options.abilityInitial || 0,
      minDifficulty: options.minDifficulty || -3,
      maxDifficulty: options.maxDifficulty || 3,
      emotionWeighting: options.emotionWeighting || true,
      ...options
    };

    // IRT Parameters
    this.irtParams = {
      discriminationMin: 0.5,
      discriminationMax: 2.0,
      guessingParameter: 0.1 // Probability of correct guess
    };

    this.performanceHistory = [];
    this.abilityEstimate = this.options.abilityInitial;
    this.standardError = 1.0;
  }

  /**
   * Update ability estimate based on response
   */
  updatePerformance(response) {
    if (!response || !response.isCorrect === undefined) {
      logger.warn('Invalid performance response');
      return;
    }

    const metric = {
      questionId: response.questionId,
      isCorrect: response.isCorrect ? 1 : 0,
      responseTime: response.responseTime || 0,
      difficulty: response.difficulty || 0,
      confidence: response.confidence || 0.5,
      emotionalState: response.emotionalState || {},
      timestamp: Date.now()
    };

    // Update IRT ability estimate
    this.updateIRTAbility(metric);

    // Apply emotional adjustment if available
    if (this.options.emotionWeighting && response.emotionalState) {
      this.applyEmotionalAdjustment(metric);
    }

    // Store in history
    this.performanceHistory.push(metric);

    logger.debug(`Ability updated: ${this.abilityEstimate.toFixed(2)} ± ${this.standardError.toFixed(2)}`);

    return {
      abilityEstimate: this.abilityEstimate,
      standardError: this.standardError,
      nextDifficulty: this.getNextQuestionDifficulty()
    };
  }

  /**
   * Update ability using IRT Bayesian approach
   */
  updateIRTAbility(metric) {
    const { isCorrect, difficulty } = metric;
    
    // IRT 3-Parameter Logistic Model
    // P(correct) = c + (1-c) / (1 + exp(-a(θ - b)))
    // where: θ = ability, b = difficulty, a = discrimination, c = guessing param
    
    const a = 1.2; // discrimination parameter
    const b = difficulty; // difficulty = b parameter
    const c = this.irtParams.guessingParameter;
    
    // Calculate probability of correct response at current ability
    const exponent = -a * (this.abilityEstimate - b);
    const pCorrect = c + (1 - c) / (1 + Math.exp(exponent));

    // Likelihood of observed response
    const likelihood = isCorrect ? pCorrect : (1 - pCorrect);

    // Information gain from this item
    const information = a * a * (pCorrect - c) * (1 - pCorrect) / 
                      Math.pow(pCorrect - c * (1 - pCorrect), 2);

    // Update standard error using information
    if (information > 0) {
      this.standardError = Math.sqrt(1 / (1 / this.standardError ** 2 + information));
    }

    // Bayesian update of ability (simplified gradient descent)
    const learningRate = 0.3;
    const error = isCorrect ? (1 - pCorrect) : -pCorrect;
    const abilityDelta = learningRate * error * a;

    this.abilityEstimate = Math.max(
      this.options.minDifficulty,
      Math.min(
        this.options.maxDifficulty,
        this.abilityEstimate + abilityDelta
      )
    );
  }

  /**
   * Apply emotional state adjustments to difficulty
   */
  applyEmotionalAdjustment(metric) {
    const emotion = metric.emotionalState;
    
    // If frustrated, reduce difficulty
    if (emotion.frustration > 0.7) {
      this.abilityEstimate *= 0.95;
      logger.debug('Adjusted for frustration');
    }

    // If confident but too easy, increase difficulty
    if (emotion.confidence > 0.85 && metric.responseTime < 5000) {
      this.abilityEstimate *= 1.05;
      logger.debug('Adjusted for high confidence');
    }

    // If disengaged, reduce difficulty to maintain motivation
    if (emotion.engagement < 0.4) {
      this.abilityEstimate *= 0.97;
      logger.debug('Adjusted for low engagement');
    }
  }

  /**
   * Calculate next question difficulty
   */
  getNextQuestionDifficulty() {
    // Target difficulty where success probability ≈ targetSuccessRate
    // For IRT 3PL: P = 0.55 is roughly when θ ≈ b
    // So next difficulty should be close to current ability estimate
    
    const nextDifficulty = this.abilityEstimate + 
                          (Math.random() - 0.5) * 0.5; // Add small random variation

    return Math.max(
      this.options.minDifficulty,
      Math.min(this.options.maxDifficulty, nextDifficulty)
    );
  }

  /**
   * Generate personalized learning path
   */
  generatePersonalizedPath(questions, sessionLength = 10) {
    if (!questions || questions.length === 0) {
      logger.warn('No questions available for path generation');
      return [];
    }

    const path = [];
    let currentDifficulty = this.getNextQuestionDifficulty();

    for (let i = 0; i < sessionLength && questions.length > 0; i++) {
      // Find question closest to target difficulty
      const closestQuestion = this.findClosestQuestion(questions, currentDifficulty);
      
      if (closestQuestion) {
        path.push(closestQuestion);
        questions = questions.filter(q => q.id !== closestQuestion.id);
        currentDifficulty = this.getNextQuestionDifficulty();
      }
    }

    logger.debug(`Generated personalized path with ${path.length} questions`);
    return path;
  }

  /**
   * Find question closest to target difficulty
   */
  findClosestQuestion(questions, targetDifficulty) {
    let closest = null;
    let minDistance = Infinity;

    for (const question of questions) {
      const difficulty = question.difficulty || 0;
      const distance = Math.abs(difficulty - targetDifficulty);

      if (distance < minDistance) {
        minDistance = distance;
        closest = question;
      }
    }

    return closest;
  }

  /**
   * Get predicted success probability for a difficulty level
   */
  getPredictedSuccessProbability(difficulty) {
    const a = 1.2;
    const b = difficulty;
    const c = this.irtParams.guessingParameter;

    const exponent = -a * (this.abilityEstimate - b);
    const probability = c + (1 - c) / (1 + Math.exp(exponent));

    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Get statistics about performance
   */
  getStatistics() {
    if (this.performanceHistory.length === 0) {
      return null;
    }

    const correct = this.performanceHistory.filter(r => r.isCorrect === 1).length;
    const total = this.performanceHistory.length;
    const accuracy = correct / total;
    
    const avgResponseTime = this.performanceHistory.reduce((sum, r) => sum + r.responseTime, 0) / total;
    const avgConfidence = this.performanceHistory.reduce((sum, r) => sum + r.confidence, 0) / total;

    return {
      totalResponses: total,
      correctResponses: correct,
      accuracy,
      averageResponseTime: avgResponseTime,
      averageConfidence: avgConfidence,
      abilityEstimate: this.abilityEstimate,
      standardError: this.standardError,
      skillLevel: this.getSkillLevel(this.abilityEstimate)
    };
  }

  /**
   * Map ability to skill level
   */
  getSkillLevel(ability) {
    if (ability < -2) return 'Beginner';
    if (ability < -1) return 'Early Intermediate';
    if (ability < 0) return 'Intermediate';
    if (ability < 1) return 'Advanced';
    if (ability < 2) return 'Expert';
    return 'Master';
  }

  /**
   * Reset adapter for new session
   */
  reset() {
    this.performanceHistory = [];
    this.abilityEstimate = this.options.abilityInitial;
    this.standardError = 1.0;
    logger.debug('Adaptive difficulty engine reset');
  }
}

export default AdaptiveDifficultyEngine;
