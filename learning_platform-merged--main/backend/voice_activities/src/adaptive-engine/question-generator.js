/**
 * Adaptive Question Generator
 * Creates personalized questions based on student performance and interests
 */

class AdaptiveQuestionGenerator {
    constructor() {
        this.templates = new Map();
        this.studentProfile = {};
        this.difficultyLevels = {
            1: 'very_easy',
            2: 'easy', 
            3: 'medium',
            4: 'hard',
            5: 'very_hard'
        };
        
        this.initializeTemplates();
    }
    
    initializeTemplates() {
        // Math question templates
        this.templates.set('counting', {
            very_easy: [
                "Count the {objects}. There are {count} {objects}. How many {objects} are there?",
                "Sophie has {count} {objects}. Can you count them for her?"
            ],
            easy: [
                "If you have {count1} {objects} and get {count2} more, how many do you have?",
                "Count by {step}s: {start}, {next}, ..."
            ],
            medium: [
                "{name} had {original} {objects}. She gave away {given} and found {found} more. How many does she have now?",
                "What comes next in this pattern: {pattern}?"
            ]
        });
        
        this.templates.set('shapes', {
            very_easy: [
                "What shape is this? *shows {shape}*",
                "Point to the {shape} among these shapes."
            ],
            easy: [
                "How many sides does a {shape} have?",
                "Which shape has {sides} sides?"
            ],
            medium: [
                "If you combine a {shape1} and {shape2}, what new shapes can you make?",
                "Draw a {shape} inside another {shape}. What do you see?"
            ]
        });
    }
    
    async generateQuestion(subject, targetDifficulty, studentAbility, studentInterests = []) {
        const difficulty = this.calculateOptimalDifficulty(targetDifficulty, studentAbility);
        const template = this.selectTemplate(subject, difficulty, studentInterests);
        
        if (!template) {
            return this.fallbackToStaticQuestion(subject, difficulty);
        }
        
        const question = this.populateTemplate(template, difficulty);
        
        return {
            id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            subject: subject,
            difficulty: difficulty,
            text: question.text,
            expectedAnswers: question.answers,
            hints: question.hints,
            explanation: question.explanation,
            personalizedFor: studentInterests,
            generated: true
        };
    }
    
    calculateOptimalDifficulty(targetDifficulty, studentAbility) {
        // Adjust difficulty based on student's current ability level
        // Ability ranges from -3 to +3, map to difficulty 1-5
        const abilityDifficulty = Math.round((studentAbility + 3) * 5 / 6) + 1;
        abilityDifficulty = Math.max(1, Math.min(5, abilityDifficulty));
        
        // Blend target and ability-based difficulty
        return Math.round((targetDifficulty + abilityDifficulty) / 2);
    }
    
    selectTemplate(subject, difficulty, interests) {
        const subjectTemplates = this.templates.get(subject);
        if (!subjectTemplates) return null;
        
        const difficultyLevel = this.difficultyLevels[difficulty];
        const availableTemplates = subjectTemplates[difficultyLevel] || subjectTemplates['easy'];
        
        if (!availableTemplates || availableTemplates.length === 0) return null;
        
        // Select template randomly, with preference for student interests
        return availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    }
    
    populateTemplate(template, difficulty) {
        // Generate appropriate values based on difficulty
        const values = this.generateValues(difficulty);
        
        let questionText = template;
        
        // Replace placeholders with generated values
        Object.keys(values).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'g');
            questionText = questionText.replace(regex, values[key]);
        });
        
        return {
            text: questionText,
            answers: values.expectedAnswers || [values.answer],
            hints: values.hints || [],
            explanation: values.explanation || ''
        };
    }
    
    generateValues(difficulty) {
        const values = {};
        
        // Generate numbers based on difficulty
        switch (difficulty) {
            case 1: // Very Easy
                values.count = Math.floor(Math.random() * 5) + 1;
                values.count1 = Math.floor(Math.random() * 3) + 1;
                values.count2 = Math.floor(Math.random() * 3) + 1;
                break;
            case 2: // Easy
                values.count = Math.floor(Math.random() * 10) + 1;
                values.count1 = Math.floor(Math.random() * 5) + 1;
                values.count2 = Math.floor(Math.random() * 5) + 1;
                break;
            case 3: // Medium
                values.count = Math.floor(Math.random() * 20) + 1;
                values.original = Math.floor(Math.random() * 15) + 5;
                values.given = Math.floor(Math.random() * 5) + 1;
                values.found = Math.floor(Math.random() * 8) + 1;
                break;
            default:
                values.count = Math.floor(Math.random() * 10) + 1;
        }
        
        // Add common values
        values.objects = this.selectObject();
        values.shape = this.selectShape();
        values.name = this.selectName();
        
        // Calculate answer based on question type
        if (values.count1 && values.count2) {
            values.answer = values.count1 + values.count2;
            values.expectedAnswers = [values.answer.toString(), this.numberToWords(values.answer)];
        } else if (values.original && values.given && values.found) {
            values.answer = values.original - values.given + values.found;
            values.expectedAnswers = [values.answer.toString()];
        } else {
            values.answer = values.count;
            values.expectedAnswers = [values.answer.toString(), this.numberToWords(values.answer)];
        }
        
        return values;
    }
    
    selectObject() {
        const objects = ['apples', 'cookies', 'toys', 'books', 'flowers', 'stars', 'balloons', 'pencils'];
        return objects[Math.floor(Math.random() * objects.length)];
    }
    
    selectShape() {
        const shapes = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'diamond'];
        return shapes[Math.floor(Math.random() * shapes.length)];
    }
    
    selectName() {
        const names = ['Sophie', 'Max', 'Emma', 'Liam', 'Olivia', 'Noah', 'Sophia', 'James'];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    numberToWords(num) {
        const numbers = {
            1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
            6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
            11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
            16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty'
        };
        return numbers[num] || num.toString();
    }
    
    fallbackToStaticQuestion(subject, difficulty) {
        // Fallback to predefined questions if template generation fails
        const staticQuestions = {
            counting: {
                1: { text: "Count to 3", expectedAnswers: ["1, 2, 3", "one two three"] },
                2: { text: "What comes after 5?", expectedAnswers: ["6", "six"] },
                3: { text: "Count backwards from 10 to 7", expectedAnswers: ["10, 9, 8, 7"] }
            }
        };
        
        const questions = staticQuestions[subject];
        if (questions && questions[difficulty]) {
            return {
                ...questions[difficulty],
                id: `static_${subject}_${difficulty}_${Date.now()}`,
                subject: subject,
                difficulty: difficulty,
                generated: false
            };
        }
        
        return null;
    }
    
    analyzeStudentResponse(question, response, isCorrect) {
        // Analyze how student answered to improve future question generation
        const analysis = {
            questionId: question.id,
            response: response,
            isCorrect: isCorrect,
            responsePattern: this.categorizeResponse(response),
            difficulty: question.difficulty
        };
        
        // Update student profile based on response
        this.updateStudentProfile(analysis);
        
        return analysis;
    }
    
    categorizeResponse(response) {
        if (/^\d+$/.test(response.trim())) {
            return 'numeric';
        } else if (/^(one|two|three|four|five|six|seven|eight|nine|ten)$/i.test(response.trim())) {
            return 'word_numbers';
        } else if (response.length < 10) {
            return 'short_text';
        } else {
            return 'long_text';
        }
    }
    
    updateStudentProfile(analysis) {
        // Track student preferences and patterns
        if (!this.studentProfile.responsePatterns) {
            this.studentProfile.responsePatterns = {};
        }
        
        const pattern = analysis.responsePattern;
        if (!this.studentProfile.responsePatterns[pattern]) {
            this.studentProfile.responsePatterns[pattern] = { count: 0, accuracy: 0 };
        }
        
        this.studentProfile.responsePatterns[pattern].count++;
        if (analysis.isCorrect) {
            this.studentProfile.responsePatterns[pattern].accuracy++;
        }
    }
    
    getStudentInsights() {
        return {
            preferredResponseType: this.getPreferredResponseType(),
            strongSubjects: this.getStrongSubjects(),
            needsImprovement: this.getNeedsImprovementAreas(),
            profile: this.studentProfile
        };
    }
    
    getPreferredResponseType() {
        const patterns = this.studentProfile.responsePatterns || {};
        let bestPattern = null;
        let bestScore = 0;
        
        Object.keys(patterns).forEach(pattern => {
            const data = patterns[pattern];
            const accuracyRate = data.accuracy / data.count;
            const score = accuracyRate * Math.log(data.count + 1); // Weight by frequency
            
            if (score > bestScore) {
                bestScore = score;
                bestPattern = pattern;
            }
        });
        
        return bestPattern;
    }
}

// Export for use in voice learning module
window.AdaptiveQuestionGenerator = AdaptiveQuestionGenerator;