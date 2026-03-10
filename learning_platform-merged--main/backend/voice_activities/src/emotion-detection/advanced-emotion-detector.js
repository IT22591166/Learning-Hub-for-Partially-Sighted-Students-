/**
 * Multi-Modal Emotion Detection
 * Combines voice analysis, computer vision, and behavioral patterns
 */

/**
 * Audio Emotion Analyzer
 * Analyzes emotion from voice characteristics
 */
class AudioEmotionAnalyzer {
    constructor() {
        this.isInitialized = true;
    }
    
    async analyze(audioData) {
        // Use existing emotion detection from the main emotion-detector.js
        if (window.EmotionDetector) {
            const detector = new window.EmotionDetector();
            return await detector.detectEmotion(audioData);
        }
        
        // Fallback basic analysis
        return {
            confidence: 0.6,
            frustration: 0.3,
            engagement: 0.7,
            confusion: 0.2
        };
    }
}

class AdvancedEmotionDetector {
    constructor() {
        this.audioAnalyzer = new AudioEmotionAnalyzer();
        this.visionAnalyzer = new FacialEmotionAnalyzer();
        this.behaviorTracker = new BehaviorPatternTracker();
        
        this.emotionHistory = [];
        this.calibrationData = new Map(); // Per-student calibration
        this.isCalibrated = false;
    }
    
    async analyzeCombinedEmotion(audioData, videoFrame = null, responseTime = null, accuracy = null) {
        const timestamp = Date.now();
        
        // Analyze each modality
        const audioEmotions = await this.audioAnalyzer.analyze(audioData);
        const visualEmotions = videoFrame ? await this.visionAnalyzer.analyze(videoFrame) : null;
        const behaviorEmotions = this.behaviorTracker.analyze({
            responseTime,
            accuracy,
            timestamp,
            recentHistory: this.emotionHistory.slice(-5)
        });
        
        // Weight and combine emotions
        const combinedEmotions = this.fuseEmotions({
            audio: audioEmotions,
            visual: visualEmotions,
            behavior: behaviorEmotions
        });
        
        // Apply student-specific calibration
        const calibratedEmotions = this.applyCalibration(combinedEmotions);
        
        // Update emotion history
        this.emotionHistory.push({
            timestamp,
            emotions: calibratedEmotions,
            modalities: { audio: !!audioEmotions, visual: !!visualEmotions, behavior: !!behaviorEmotions }
        });
        
        // Keep only last 50 emotion readings
        if (this.emotionHistory.length > 50) {
            this.emotionHistory.shift();
        }
        
        return calibratedEmotions;
    }
    
    fuseEmotions({ audio, visual, behavior }) {
        const weights = {
            audio: 0.5,     // Primary: voice is most reliable for learning emotions
            visual: 0.3,    // Secondary: facial expressions when available
            behavior: 0.2   // Tertiary: response patterns
        };
        
        const emotions = ['confidence', 'frustration', 'engagement', 'confusion'];
        const fused = {};
        
        emotions.forEach(emotion => {
            let weightedSum = 0;
            let totalWeight = 0;
            
            if (audio?.[emotion] !== undefined) {
                weightedSum += audio[emotion] * weights.audio;
                totalWeight += weights.audio;
            }
            
            if (visual?.[emotion] !== undefined) {
                weightedSum += visual[emotion] * weights.visual;
                totalWeight += weights.visual;
            }
            
            if (behavior?.[emotion] !== undefined) {
                weightedSum += behavior[emotion] * weights.behavior;
                totalWeight += weights.behavior;
            }
            
            fused[emotion] = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
        });
        
        return fused;
    }
    
    applyCalibration(emotions) {
        if (!this.isCalibrated) {
            return emotions; // Return raw emotions during calibration phase
        }
        
        const calibrated = {};
        Object.keys(emotions).forEach(emotion => {
            const calibration = this.calibrationData.get(emotion) || { mean: 0.5, std: 0.2 };
            
            // Normalize using student's historical mean/std
            const normalized = (emotions[emotion] - calibration.mean) / calibration.std;
            
            // Convert back to 0-1 scale using standard normal distribution
            calibrated[emotion] = Math.max(0, Math.min(1, 0.5 + normalized * 0.2));
        });
        
        return calibrated;
    }
    
    calibrateToStudent(studentEmotionHistory) {
        /**
         * Calibrate emotion thresholds based on student's historical data
         * This personalizes emotion detection for individual speech patterns
         */
        if (studentEmotionHistory.length < 10) {
            console.log('⚠️ Insufficient data for emotion calibration');
            return;
        }
        
        const emotions = ['confidence', 'frustration', 'engagement', 'confusion'];
        
        emotions.forEach(emotion => {
            const values = studentEmotionHistory.map(h => h.emotions[emotion]).filter(v => v !== undefined);
            
            if (values.length > 5) {
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
                const std = Math.sqrt(variance);
                
                this.calibrationData.set(emotion, {
                    mean: mean,
                    std: Math.max(0.1, std) // Prevent division by zero
                });
                
                console.log(`📊 Calibrated ${emotion}: mean=${mean.toFixed(3)}, std=${std.toFixed(3)}`);
            }
        });
        
        this.isCalibrated = true;
        console.log('✅ Emotion detection calibrated for individual student');
    }
    
    getEmotionalTrend(windowMinutes = 5) {
        /**
         * Analyze emotional trends over time window
         * Returns trend direction and significance
         */
        const cutoffTime = Date.now() - (windowMinutes * 60 * 1000);
        const recentEmotions = this.emotionHistory.filter(h => h.timestamp > cutoffTime);
        
        if (recentEmotions.length < 3) {
            return { trend: 'insufficient_data' };
        }
        
        const trends = {};
        ['confidence', 'frustration', 'engagement'].forEach(emotion => {
            const values = recentEmotions.map(h => h.emotions[emotion]);
            const firstHalf = values.slice(0, Math.floor(values.length / 2));
            const secondHalf = values.slice(Math.floor(values.length / 2));
            
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            
            const change = secondAvg - firstAvg;
            const magnitude = Math.abs(change);
            
            trends[emotion] = {
                direction: change > 0.05 ? 'increasing' : change < -0.05 ? 'decreasing' : 'stable',
                magnitude: magnitude,
                significance: magnitude > 0.1 ? 'high' : magnitude > 0.05 ? 'medium' : 'low'
            };
        });
        
        return trends;
    }
    
    recommendIntervention() {
        /**
         * Suggest interventions based on current emotional state
         */
        const recent = this.emotionHistory.slice(-3);
        if (recent.length === 0) return null;
        
        const avgEmotions = {};
        ['confidence', 'frustration', 'engagement', 'confusion'].forEach(emotion => {
            avgEmotions[emotion] = recent.reduce((sum, h) => sum + h.emotions[emotion], 0) / recent.length;
        });
        
        // High frustration intervention
        if (avgEmotions.frustration > 0.7) {
            return {
                type: 'reduce_difficulty',
                reason: 'High frustration detected',
                action: 'Reduce question difficulty by 0.5 points',
                encouragement: "Let's try something a bit easier. You're doing great!"
            };
        }
        
        // Low engagement intervention
        if (avgEmotions.engagement < 0.3) {
            return {
                type: 'gamification_boost',
                reason: 'Low engagement detected',
                action: 'Activate special badge or show progress visualization',
                encouragement: "You're making excellent progress! Look how much you've learned!"
            };
        }
        
        // Low confidence intervention
        if (avgEmotions.confidence < 0.3) {
            return {
                type: 'provide_hint',
                reason: 'Low confidence detected',
                action: 'Offer a helpful hint for the current question',
                encouragement: "Here's a little hint to help you out!"
            };
        }
        
        // High performance - challenge more
        if (avgEmotions.confidence > 0.8 && avgEmotions.engagement > 0.7 && avgEmotions.frustration < 0.3) {
            return {
                type: 'increase_challenge',
                reason: 'Student is performing very well',
                action: 'Increase difficulty slightly to maintain optimal challenge',
                encouragement: "You're amazing! Ready for a trickier question?"
            };
        }
        
        return null; // No intervention needed
    }
}

    /**
     * Facial Emotion Analyzer using MediaPipe or similar
     */
class FacialEmotionAnalyzer {
    constructor() {
        this.isInitialized = false;
        this.initializeIfAvailable();
    }
    
    async initializeIfAvailable() {
        // Check if MediaPipe or Face-API.js is available
        if (typeof faceapi !== 'undefined') {
            await this.initializeFaceAPI();
        } else if (window.MediaPipeHolistic) {
            await this.initializeMediaPipe();
        } else {
            console.log('ℹ️ No facial emotion detection library available');
        }
    }
    
    async analyze(videoFrame) {
        if (!this.isInitialized) {
            return null;
        }
        
        // Placeholder for actual facial emotion detection
        // Would extract facial landmarks and classify emotions
        return {
            confidence: 0.6,
            frustration: 0.2,
            engagement: 0.7,
            confusion: 0.3
        };
    }
}

    /**
     * Behavioral Pattern Tracker
     * Analyzes response times, accuracy patterns, interaction behavior
     */
class BehaviorPatternTracker {
    constructor() {
        this.responseTimeHistory = [];
        this.accuracyHistory = [];
    }
    
    analyze({ responseTime, accuracy, timestamp, recentHistory }) {
        if (responseTime) this.responseTimeHistory.push(responseTime);
        if (accuracy !== null) this.accuracyHistory.push(accuracy);
        
        // Keep last 20 responses
        if (this.responseTimeHistory.length > 20) this.responseTimeHistory.shift();
        if (this.accuracyHistory.length > 20) this.accuracyHistory.shift();
        
        const emotions = { confidence: 0.5, frustration: 0.5, engagement: 0.5, confusion: 0.5 };
        
        // Analyze response time patterns
        if (this.responseTimeHistory.length >= 3) {
            const avgTime = this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length;
            const recentTime = responseTime;
            
            if (recentTime > avgTime * 1.5) {
                emotions.confusion += 0.2; // Taking longer than usual
                emotions.confidence -= 0.1;
            } else if (recentTime < avgTime * 0.7) {
                emotions.confidence += 0.1; // Quick responses
                emotions.engagement += 0.1;
            }
        }
        
        // Analyze accuracy trends
        if (this.accuracyHistory.length >= 3) {
            const recentAccuracy = this.accuracyHistory.slice(-3);
            const declining = recentAccuracy.every((acc, i) => i === 0 || acc <= recentAccuracy[i - 1]);
            
            if (declining) {
                emotions.frustration += 0.2;
                emotions.confidence -= 0.15;
            }
        }
        
        // Normalize to 0-1 range
        Object.keys(emotions).forEach(key => {
            emotions[key] = Math.max(0, Math.min(1, emotions[key]));
        });
        
        return emotions;
    }
}

// Export for use in voice learning module
window.AdvancedEmotionDetector = AdvancedEmotionDetector;