/**
 * Enhanced Voice Learning Module Integration
 * Combines all improvements into main voice learning system
 */

class EnhancedVoiceLearningModule {
    constructor(studentId, activityId) {
        this.studentId = studentId;
        this.activityId = activityId;
        
        // Initialize enhanced components with fallbacks
        this.initializeComponents();
        
        // Session state
        this.currentQuestion = null;
        this.sessionData = {
            startTime: Date.now(),
            responses: [],
            emotionHistory: []
        };
        
        this.setupEventListeners();
    }
    
    initializeComponents() {
        // Initialize with fallbacks for each component
        try {
            this.speechRecognizer = window.EnhancedSpeechRecognizer ? 
                new EnhancedSpeechRecognizer() : 
                this.createFallbackSpeechRecognizer();
        } catch (e) {
            console.warn('Enhanced speech recognizer failed, using fallback:', e);
            this.speechRecognizer = this.createFallbackSpeechRecognizer();
        }
        
        try {
            this.emotionDetector = window.AdvancedEmotionDetector ? 
                new AdvancedEmotionDetector() : 
                this.createFallbackEmotionDetector();
        } catch (e) {
            console.warn('Advanced emotion detector failed, using fallback:', e);
            this.emotionDetector = this.createFallbackEmotionDetector();
        }
        
        try {
            this.irtModel = window.PersistentIRTModel ? 
                new PersistentIRTModel(this.studentId, this.activityId) :
                this.createFallbackIRTModel();
        } catch (e) {
            console.warn('Persistent IRT model failed, using fallback:', e);
            this.irtModel = this.createFallbackIRTModel();
        }
        
        try {
            this.questionGenerator = window.AdaptiveQuestionGenerator ? 
                new AdaptiveQuestionGenerator() :
                this.createFallbackQuestionGenerator();
        } catch (e) {
            console.warn('Adaptive question generator failed, using fallback:', e);
            this.questionGenerator = this.createFallbackQuestionGenerator();
        }
        
        try {
            this.languageSupport = window.MultiLanguageVoiceLearning ? 
                new MultiLanguageVoiceLearning() :
                this.createFallbackLanguageSupport();
        } catch (e) {
            console.warn('Multi-language support failed, using fallback:', e);
            this.languageSupport = this.createFallbackLanguageSupport();
        }
    }
    
    createFallbackSpeechRecognizer() {
        return {
            startRecognition: async () => {
                return new Promise((resolve) => {
                    const response = prompt("Please type your answer (speech recognition not available):");
                    resolve({ 
                        text: response || "", 
                        confidence: response ? 1.0 : 0.0,
                        provider: 'manual-fallback'
                    });
                });
            }
        };
    }
    
    createFallbackEmotionDetector() {
        return {
            analyzeCombinedEmotion: async () => ({
                confidence: 0.5,
                frustration: 0.3,
                engagement: 0.6,
                confusion: 0.2
            }),
            recommendIntervention: () => null,
            emotionHistory: []
        };
    }
    
    createFallbackIRTModel() {
        return {
            ability: 0.0,
            updateAbility: (correct) => ({
                ability: this.ability + (correct ? 0.1 : -0.1),
                change: correct ? 0.1 : -0.1
            }),
            getAbilityEstimate: () => ({ ability: 0.0, standardError: 0.5 }),
            forceSave: async () => {},
            destroy: () => {}
        };
    }
    
    createFallbackQuestionGenerator() {
        return {
            generateQuestion: async (subject, difficulty) => ({
                id: `fallback_${Date.now()}`,
                subject: subject,
                difficulty: difficulty,
                text: "Count from 1 to 5",
                expectedAnswers: ["1, 2, 3, 4, 5", "one two three four five"],
                generated: false
            })
        };
    }
    
    createFallbackLanguageSupport() {
        return {
            recognizeAnswer: (text, expectedAnswers) => {
                return {
                    match: expectedAnswers.some(answer => 
                        text.toLowerCase().includes(answer.toLowerCase())
                    ),
                    confidence: 0.8
                };
            },
            localizeQuestion: (question) => question,
            getEncouragement: () => "Great job!"
        };
    }
    
    async startLearningSession() {
        console.log('🚀 Starting Enhanced Voice Learning Session');
        
        // Load student's emotion calibration data
        await this.emotionDetector.calibrateToStudent(await this.loadStudentEmotionHistory());
        
        // Generate first question
        await this.askNextQuestion();
    }
    
    async askNextQuestion() {
        // Get student's current ability for adaptive difficulty
        const abilityData = this.irtModel.getAbilityEstimate();
        const targetDifficulty = this.calculateTargetDifficulty(abilityData.ability);
        
        // Generate personalized question
        this.currentQuestion = await this.questionGenerator.generateQuestion(
            this.activityId,
            targetDifficulty,
            abilityData.ability,
            await this.getStudentInterests()
        );
        
        // Localize for student's language
        this.currentQuestion = this.languageSupport.localizeQuestion(this.currentQuestion);
        
        // Present question with TTS
        await this.speakQuestion(this.currentQuestion.text);
        
        // Start listening for response
        this.startListeningForAnswer();
    }
    
    async startListeningForAnswer() {
        try {
            // Start enhanced speech recognition with fallbacks
            const recognitionResult = await this.speechRecognizer.startRecognition();
            
            // Process and evaluate the response
            await this.processStudentResponse(recognitionResult);
            
        } catch (error) {
            console.error('Recognition failed:', error);
            await this.handleRecognitionError();
        }
    }
    
    async processStudentResponse(recognitionResult) {
        const responseTime = Date.now() - this.questionStartTime;
        
        // Analyze student's emotional state from voice
        const emotions = await this.emotionDetector.analyzeCombinedEmotion(
            recognitionResult.audioData,
            null, // video frame if available
            responseTime,
            null  // accuracy will be determined
        );
        
        // Evaluate answer correctness using multi-language support
        const evaluation = this.languageSupport.recognizeAnswer(
            recognitionResult.text,
            this.currentQuestion.expectedAnswers
        );
        
        // Update IRT model with new response
        const abilityUpdate = this.irtModel.updateAbility(
            evaluation.match,
            this.currentQuestion.difficulty
        );
        
        // Record response in session data
        this.sessionData.responses.push({
            questionId: this.currentQuestion.id,
            response: recognitionResult.text,
            isCorrect: evaluation.match,
            confidence: evaluation.confidence,
            responseTime: responseTime,
            emotions: emotions,
            abilityAfter: abilityUpdate.ability
        });
        
        // Check if intervention is needed
        const intervention = this.emotionDetector.recommendIntervention();
        if (intervention) {
            await this.handleIntervention(intervention);
        }
        
        // Provide feedback and continue
        await this.provideFeedback(evaluation.match, emotions);
        
        // Move to next question or end session
        if (this.shouldContinueSession()) {
            setTimeout(() => this.askNextQuestion(), 2000);
        } else {
            await this.endSession();
        }
    }
    
    async handleIntervention(intervention) {
        console.log(`🎯 Intervention triggered: ${intervention.type}`);
        
        switch (intervention.type) {
            case 'reduce_difficulty':
                // Adjust next question difficulty
                this.targetDifficultyAdjustment = -0.5;
                await this.speak(intervention.encouragement);
                break;
                
            case 'gamification_boost':
                // Show progress or award bonus points
                await this.showProgressVisualization();
                await this.speak(intervention.encouragement);
                break;
                
            case 'provide_hint':
                if (this.currentQuestion && this.currentQuestion.hints) {
                    const hint = this.currentQuestion.hints[0];
                    await this.speak(`${intervention.encouragement} ${hint}`);
                }
                break;
                
            case 'increase_challenge':
                this.targetDifficultyAdjustment = 0.3;
                await this.speak(intervention.encouragement);
                break;
        }
    }
    
    calculateTargetDifficulty(studentAbility) {
        // IRT optimal difficulty is around student's ability level
        let targetDifficulty = Math.round((studentAbility + 3) * 5 / 6) + 1;
        targetDifficulty = Math.max(1, Math.min(5, targetDifficulty));
        
        // Apply intervention adjustments
        if (this.targetDifficultyAdjustment) {
            targetDifficulty += this.targetDifficultyAdjustment;
            targetDifficulty = Math.max(1, Math.min(5, Math.round(targetDifficulty)));
            this.targetDifficultyAdjustment = 0; // Reset adjustment
        }
        
        return targetDifficulty;
    }
    
    shouldContinueSession() {
        const sessionLength = Date.now() - this.sessionData.startTime;
        const responseCount = this.sessionData.responses.length;
        const recentEmotions = this.emotionDetector.emotionHistory.slice(-3);
        
        // Continue if under 15 minutes and under 20 questions
        if (sessionLength > 15 * 60 * 1000 || responseCount >= 20) {
            return false;
        }
        
        // Stop if student shows high frustration consistently
        if (recentEmotions.length >= 3) {
            const avgFrustration = recentEmotions.reduce((sum, h) => sum + h.emotions.frustration, 0) / recentEmotions.length;
            if (avgFrustration > 0.8) {
                console.log('⚠️ Ending session due to high frustration');
                return false;
            }
        }
        
        return true;
    }
    
    async endSession() {
        console.log('🎯 Ending voice learning session');
        
        // Force save IRT model progress
        await this.irtModel.forceSave();
        
        // Calculate session statistics
        const stats = this.calculateSessionStats();
        
        // Provide session summary
        await this.provideFinalFeedback(stats);
        
        // Clean up resources
        this.irtModel.destroy();
    }
    
    async speak(text) {
        // Use enhanced TTS with emotional tone
        const encouragement = this.languageSupport.getEncouragement();
        return new Promise((resolve) => {
            // Implementation would use Web Speech API or similar
            console.log(`🗣️ Speaking: ${text}`);
            setTimeout(resolve, 1000); // Simulate speech duration
        });
    }
    
    calculateSessionStats() {
        const responses = this.sessionData.responses;
        const correctCount = responses.filter(r => r.isCorrect).length;
        const accuracy = responses.length > 0 ? correctCount / responses.length : 0;
        const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
        
        return {
            totalQuestions: responses.length,
            correctAnswers: correctCount,
            accuracy: Math.round(accuracy * 100),
            avgResponseTime: Math.round(avgResponseTime / 1000),
            sessionDuration: Math.round((Date.now() - this.sessionData.startTime) / 1000 / 60)
        };
    }
    
    async loadStudentEmotionHistory() {
        // Load from backend if available
        try {
            const response = await fetch(`/api/db/emotion-history/${this.studentId}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Could not load emotion history:', error);
        }
        return [];
    }
    
    async getStudentInterests() {
        // Could be loaded from student profile
        return ['animals', 'colors', 'numbers']; // Default interests
    }
}

// Export for use
window.EnhancedVoiceLearningModule = EnhancedVoiceLearningModule;