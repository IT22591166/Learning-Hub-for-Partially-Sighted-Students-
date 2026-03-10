/**
 * Multi-Language Voice Learning Support
 * Extends voice learning to support multiple languages and cultures
 */

const LanguageConfig = {
    'en-US': {
        name: 'English (US)',
        speechLang: 'en-US',
        voice: 'en-US-Standard-J',
        patterns: {
            numbers: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
            colors: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white'],
            confirmations: ['yes', 'yeah', 'correct', 'right', 'true'],
            negations: ['no', 'nope', 'wrong', 'false', 'incorrect']
        },
        encouragements: [
            "Great job!", "Well done!", "Excellent!", "You're amazing!",
            "Keep it up!", "Fantastic work!", "You're doing wonderfully!"
        ]
    },
    'es-ES': {
        name: 'Spanish (Spain)',
        speechLang: 'es-ES',
        voice: 'es-ES-Standard-J',
        patterns: {
            numbers: ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'],
            colors: ['rojo', 'azul', 'verde', 'amarillo', 'naranja', 'morado', 'rosa', 'negro', 'blanco'],
            confirmations: ['sí', 'correcto', 'cierto', 'verdadero'],
            negations: ['no', 'incorrecto', 'falso', 'malo']
        },
        encouragements: [
            "¡Muy bien!", "¡Excelente!", "¡Fantástico!", "¡Eres increíble!",
            "¡Sigue así!", "¡Magnífico trabajo!", "¡Lo estás haciendo muy bien!"
        ]
    },
    'fr-FR': {
        name: 'French (France)',
        speechLang: 'fr-FR',
        voice: 'fr-FR-Standard-J',
        patterns: {
            numbers: ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'],
            colors: ['rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet', 'rose', 'noir', 'blanc'],
            confirmations: ['oui', 'correct', 'vrai', 'juste'],
            negations: ['non', 'incorrect', 'faux', 'mal']
        },
        encouragements: [
            "Très bien!", "Excellent!", "Fantastique!", "Tu es formidable!",
            "Continue!", "Magnifique travail!", "Tu te débrouilles très bien!"
        ]
    }
};

class MultiLanguageVoiceLearning {
    constructor(defaultLanguage = 'en-US') {
        this.currentLanguage = defaultLanguage;
        this.config = LanguageConfig[defaultLanguage];
        this.fallbackLanguage = 'en-US';
        
        this.setupLanguageSpecificComponents();
    }
    
    setupLanguageSpecificComponents() {
        // Update speech recognition language
        if (this.speechRecognizer) {
            this.speechRecognizer.lang = this.config.speechLang;
        }
        
        // Update text-to-speech language
        if (this.textToSpeech) {
            this.textToSpeech.lang = this.config.speechLang;
            this.textToSpeech.voice = this.config.voice;
        }
    }
    
    switchLanguage(languageCode) {
        if (!LanguageConfig[languageCode]) {
            console.warn(`Language ${languageCode} not supported, using fallback`);
            languageCode = this.fallbackLanguage;
        }
        
        this.currentLanguage = languageCode;
        this.config = LanguageConfig[languageCode];
        this.setupLanguageSpecificComponents();
        
        console.log(`🌍 Switched to language: ${this.config.name}`);
    }
    
    translateNumber(num, toLanguage = null) {
        const lang = toLanguage || this.currentLanguage;
        const config = LanguageConfig[lang];
        
        if (num >= 0 && num < config.patterns.numbers.length) {
            return config.patterns.numbers[num];
        }
        
        return num.toString(); // Fallback to digit
    }
    
    recognizeAnswer(spokenText, expectedAnswers) {
        const normalized = spokenText.toLowerCase().trim();
        const config = this.config;
        
        // Check direct matches
        for (let answer of expectedAnswers) {
            if (normalized.includes(answer.toLowerCase())) {
                return { match: true, confidence: 1.0 };
            }
        }
        
        // Check number translations
        for (let i = 0; i < config.patterns.numbers.length; i++) {
            if (normalized.includes(config.patterns.numbers[i])) {
                const numberAsString = i.toString();
                if (expectedAnswers.includes(numberAsString)) {
                    return { match: true, confidence: 0.9 };
                }
            }
        }
        
        // Check fuzzy matches (Levenshtein distance)
        for (let answer of expectedAnswers) {
            const distance = this.levenshteinDistance(normalized, answer.toLowerCase());
            const maxLength = Math.max(normalized.length, answer.length);
            const similarity = 1 - (distance / maxLength);
            
            if (similarity > 0.7) {
                return { match: true, confidence: similarity };
            }
        }
        
        return { match: false, confidence: 0.0 };
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
        
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j - 1][i] + 1,     // deletion
                    matrix[j][i - 1] + 1,     // insertion
                    matrix[j - 1][i - 1] + substitutionCost // substitution
                );
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    getEncouragement() {
        const encouragements = this.config.encouragements;
        return encouragements[Math.floor(Math.random() * encouragements.length)];
    }
    
    localizeActivity(activityContent) {
        // Deep clone the activity to avoid modifying original
        const localized = JSON.parse(JSON.stringify(activityContent));
        
        // Translate encouragements and feedback
        if (localized.encouragements) {
            localized.encouragements = this.config.encouragements;
        }
        
        // Translate number-based questions
        if (localized.questions) {
            localized.questions = localized.questions.map(q => this.localizeQuestion(q));
        }
        
        return localized;
    }
    
    localizeQuestion(question) {
        const localized = { ...question };
        
        // Translate expected answers
        if (localized.expectedAnswers) {
            localized.expectedAnswers = [...localized.expectedAnswers];
            
            // Add translated number words
            localized.expectedAnswers.forEach(answer => {
                if (!isNaN(answer)) {
                    const num = parseInt(answer);
                    const translated = this.translateNumber(num);
                    if (!localized.expectedAnswers.includes(translated)) {
                        localized.expectedAnswers.push(translated);
                    }
                }
            });
        }
        
        return localized;
    }
    
    getAvailableLanguages() {
        return Object.keys(LanguageConfig).map(code => ({
            code: code,
            name: LanguageConfig[code].name
        }));
    }
}

// Export for use in voice learning module
window.MultiLanguageVoiceLearning = MultiLanguageVoiceLearning;
window.LanguageConfig = LanguageConfig;