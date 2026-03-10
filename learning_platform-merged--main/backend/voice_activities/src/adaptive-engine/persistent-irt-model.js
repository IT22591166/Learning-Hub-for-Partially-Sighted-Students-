/**
 * Enhanced IRT Model with Real-Time Persistence
 * Saves student progress continuously during learning sessions
 */

class PersistentIRTModel {
    constructor(studentId, activityId) {
        this.studentId = studentId;
        this.activityId = activityId;
        this.ability = 0.0;
        this.standardError = 0.5;
        this.saveInterval = null;
        this.pendingSave = false;
        
        this.loadStudentProgress();
        this.setupAutoSave();
    }
    
    async loadStudentProgress() {
        try {
            const response = await fetch(`/api/db/progress/${this.studentId}/${this.activityId}`);
            if (response.ok) {
                const progress = await response.json();
                this.ability = progress.ability || 0.0;
                this.standardError = progress.standard_error || 0.5;
                console.log(`✅ Loaded ability: ${this.ability.toFixed(3)} for ${this.activityId}`);
            } else {
                console.log(`ℹ️ No prior progress found for ${this.studentId}/${this.activityId}`);
            }
        } catch (error) {
            console.warn('Failed to load student progress:', error);
        }
    }
    
    setupAutoSave() {
        // Save progress every 30 seconds if there are unsaved changes
        this.saveInterval = setInterval(() => {
            if (this.pendingSave) {
                this.saveProgress();
            }
        }, 30000);
    }
    
    updateAbility(isCorrect, difficulty, discrimination = 1.2, guessing = 0.1) {
        const oldAbility = this.ability;
        
        // 3PL IRT model probability
        const probability = guessing + (1 - guessing) / (1 + Math.exp(-discrimination * (this.ability - difficulty)));
        
        // Bayesian update using information gain
        const information = discrimination * discrimination * probability * (1 - probability);
        const newStandardError = Math.sqrt(1 / (1 / (this.standardError * this.standardError) + information));
        
        // Update ability estimate
        const likelihood = isCorrect ? probability : (1 - probability);
        const abilityChange = (discrimination * (isCorrect ? 1 : 0 - probability)) / information;
        
        this.ability = oldAbility + abilityChange;
        this.standardError = newStandardError;
        
        // Bound ability within reasonable range
        this.ability = Math.max(-4.0, Math.min(4.0, this.ability));
        this.standardError = Math.max(0.1, Math.min(1.0, this.standardError));
        
        // Mark for saving
        this.pendingSave = true;
        
        console.log(`📊 Ability updated: ${oldAbility.toFixed(3)} → ${this.ability.toFixed(3)} (SE: ${this.standardError.toFixed(3)})`);
        
        return {
            ability: this.ability,
            standardError: this.standardError,
            change: this.ability - oldAbility
        };
    }
    
    async saveProgress() {
        if (!this.pendingSave) return;
        
        try {
            const progressData = {
                student_id: this.studentId,
                activity_id: this.activityId,
                ability: this.ability,
                standard_error: this.standardError,
                last_updated: new Date().toISOString()
            };
            
            const response = await fetch('/api/db/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(progressData)
            });
            
            if (response.ok) {
                this.pendingSave = false;
                console.log('✅ Progress saved to database');
            } else {
                console.warn('⚠️ Failed to save progress, will retry later');
            }
        } catch (error) {
            console.error('❌ Error saving progress:', error);
        }
    }
    
    // Force immediate save (call when session ends)
    async forceSave() {
        this.pendingSave = true;
        await this.saveProgress();
    }
    
    // Clean up auto-save interval
    destroy() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        // Final save before destruction
        this.forceSave();
    }
    
    // Get current ability estimate with confidence interval
    getAbilityEstimate() {
        const margin = 1.96 * this.standardError; // 95% confidence interval
        return {
            ability: this.ability,
            standardError: this.standardError,
            confidenceInterval: {
                lower: this.ability - margin,
                upper: this.ability + margin
            }
        };
    }
}

// Export for global use
window.PersistentIRTModel = PersistentIRTModel;