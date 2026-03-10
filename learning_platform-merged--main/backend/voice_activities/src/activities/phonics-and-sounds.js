/**
 * Phonics & Sounds Activity
 * Interactive learning activity for letter sounds and phonics
 * Target Age: 4-8 years
 */

export const phonicsAndSounds = {
  id: 'phonics-and-sounds',
  name: 'Phonics & Letter Sounds',
  description: 'Learn letter sounds and simple phonics with Owl!',
  targetAge: [4, 8],
  duration: 600000, // 10 minutes
  skillsFocused: ['phonics', 'letter-sounds', 'pronunciation', 'vocabulary'],
  
  difficulty: 'adaptive',
  difficultyRange: [1, 4],
  
  // Story context
  story: {
    title: 'Owl\'s Sound Library',
    character: 'owl',
    introduction: 'Welcome to my sound library! Let\'s learn the sounds of letters together!',
    setting: 'A cozy library filled with books, pictures, and magical sound bubbles'
  },

  // Session structure
  sessionStructure: {
    introduction: {
      narration: 'Hoot hoot! Welcome to my library! I\'m Owl, and I love teaching sounds. Today we\'ll learn about letter sounds together. Are you ready?',
      character: 'owl',
      emotionalTone: 'wise',
      actions: ['play-library-ambience', 'flip-book-sound']
    },
    mainSection: {
      type: 'adaptive-questioning',
      minQuestions: 5,
      maxQuestions: 12,
      targetAccuracy: 0.60
    },
    closure: {
      type: 'celebration',
      narration: 'Hoot hoot! You are a superb reader! You learned so many sounds today!',
      actions: ['play-celebration-sound', 'announce-rewards']
    }
  },

  // Question bank with difficulty levels
  questionBank: [
    // ==================== DIFFICULTY 1: LETTER SOUNDS ====================
    {
      id: 'q1_1',
      difficulty: 1,
      prompt: 'What sound does the letter A make?',
      narration: 'The letter A makes a sound. Listen carefully. What sound does A make? Try to say it!',
      expectedAnswers: ['a', 'ah', 'A', 'AH', 'aah'],
      fuzzyMatch: true,
      hint: 'It sounds like "ah" or like in the word "apple".',
      feedback: {
        correct: 'Excellent! The letter A says "ah"!',
        incorrect: 'Not quite. The letter A says "ah". Try again!'
      },
      character: 'owl',
      timeLimit: 12000
    },
    {
      id: 'q1_2',
      difficulty: 1,
      prompt: 'What sound does the letter B make?',
      narration: 'The letter B makes a sound. What sound does B make?',
      expectedAnswers: ['b', 'buh', 'B', 'BUH', 'ba'],
      fuzzyMatch: true,
      hint: 'It sounds like "buh" or like in the word "ball".',
      feedback: {
        correct: 'Great! The letter B says "buh"!',
        incorrect: 'Not quite. The letter B says "buh". Try again!'
      },
      character: 'owl',
      timeLimit: 12000
    },
    {
      id: 'q1_3',
      difficulty: 1,
      prompt: 'What sound does the letter M make?',
      narration: 'The letter M makes a sound. What sound does M make?',
      expectedAnswers: ['m', 'muh', 'M', 'MUH', 'mmm'],
      fuzzyMatch: true,
      hint: 'It sounds like "muh" or like in the word "mom".',
      feedback: {
        correct: 'Perfect! The letter M says "muh"!',
        incorrect: 'Not quite. The letter M says "muh". Try again!'
      },
      character: 'owl',
      timeLimit: 12000
    },
    {
      id: 'q1_4',
      difficulty: 1,
      prompt: 'What sound does the letter S make?',
      narration: 'The letter S makes a sound. What sound does S make?',
      expectedAnswers: ['s', 'sss', 'S', 'SSS', 'sun'],
      fuzzyMatch: true,
      hint: 'It sounds like a snake: "sss" or like in the word "sun".',
      feedback: {
        correct: 'Wonderful! The letter S says "sss"!',
        incorrect: 'Not quite. The letter S says "sss". Try again!'
      },
      character: 'owl',
      timeLimit: 12000
    },
    {
      id: 'q1_5',
      difficulty: 1,
      prompt: 'What sound does the letter T make?',
      narration: 'The letter T makes a sound. What sound does T make?',
      expectedAnswers: ['t', 'tuh', 'T', 'TUH', 'ta'],
      fuzzyMatch: true,
      hint: 'It sounds like "tuh" or like in the word "tiger".',
      feedback: {
        correct: 'Excellent! The letter T says "tuh"!',
        incorrect: 'Not quite. The letter T says "tuh". Try again!'
      },
      character: 'owl',
      timeLimit: 12000
    },

    // ==================== DIFFICULTY 2: VOWELS ====================
    {
      id: 'q2_1',
      difficulty: 2,
      prompt: 'Which word starts with the letter B?',
      narration: 'Listen to these words: apple, ball, cat. Which one starts with the letter B?',
      expectedAnswers: ['ball', 'BALL', 'Ball'],
      fuzzyMatch: true,
      hint: 'Think of something round that you play with.',
      feedback: {
        correct: 'Great! Ball starts with B!',
        incorrect: 'Not quite. Ball starts with the letter B. Try again!'
      },
      character: 'owl',
      timeLimit: 12000
    },
    {
      id: 'q2_2',
      difficulty: 2,
      prompt: 'Which word starts with the letter M?',
      narration: 'Which word starts with M? Is it moon, car, or dog?',
      expectedAnswers: ['moon', 'MOON', 'Moon'],
      fuzzyMatch: true,
      hint: 'It\'s in the night sky.',
      feedback: {
        correct: 'Perfect! Moon starts with M!',
        incorrect: 'Not quite. Moon starts with the letter M. Try again!'
      },
      character: 'owl',
      timeLimit: 12000
    },
    {
      id: 'q2_3',
      difficulty: 2,
      prompt: 'Which word starts with the letter S?',
      narration: 'Which word starts with S? Is it sun, bed, or tree?',
      expectedAnswers: ['sun', 'SUN', 'Sun'],
      fuzzyMatch: true,
      hint: 'It\'s bright and warm in the sky.',
      feedback: {
        correct: 'Excellent! Sun starts with S!',
        incorrect: 'Not quite. Sun starts with the letter S. Try again!'
      },
      character: 'owl',
      timeLimit: 12000
    },

    // ==================== DIFFICULTY 3: RHYMING WORDS ====================
    {
      id: 'q3_1',
      difficulty: 3,
      prompt: 'What rhymes with cat?',
      narration: 'Cat rhymes with which word? Is it hat, dog, or fish?',
      expectedAnswers: ['hat', 'HAT', 'Hat'],
      fuzzyMatch: true,
      hint: 'You wear it on your head.',
      feedback: {
        correct: 'Great! Hat rhymes with cat!',
        incorrect: 'Not quite. Hat rhymes with cat. Try again!'
      },
      character: 'owl',
      timeLimit: 12000
    },
    {
      id: 'q3_2',
      difficulty: 3,
      prompt: 'What rhymes with dog?',
      narration: 'Dog rhymes with which word? Is it log, cat, or fish?',
      expectedAnswers: ['log', 'LOG', 'Log'],
      fuzzyMatch: true,
      hint: 'It\'s a piece of wood.',
      feedback: {
        correct: 'Perfect! Log rhymes with dog!',
        incorrect: 'Not quite. Log rhymes with dog. Try again!'
      },
      character: 'owl',
      timeLimit: 12000
    },
    {
      id: 'q3_3',
      difficulty: 3,
      prompt: 'What rhymes with fun?',
      narration: 'Fun rhymes with which word? Is it sun, bed, or tree?',
      expectedAnswers: ['sun', 'SUN', 'Sun'],
      fuzzyMatch: true,
      hint: 'It\'s in the sky and is bright.',
      feedback: {
        correct: 'Wonderful! Sun rhymes with fun!',
        incorrect: 'Not quite. Sun rhymes with fun. Try again!'
      },
      character: 'owl',
      timeLimit: 12000
    },

    // ==================== DIFFICULTY 4: ADVANCED PHONICS ====================
    {
      id: 'q4_1',
      difficulty: 4,
      prompt: 'What is the first sound in the word "strawberry"?',
      narration: 'Say the word strawberry. What is the first sound you hear?',
      expectedAnswers: ['s', 'sss', 'S', 'SSS'],
      fuzzyMatch: true,
      hint: 'It sounds like a snake.',
      feedback: {
        correct: 'Excellent! The first sound is "s"!',
        incorrect: 'Not quite. The first sound in strawberry is "s". Try again!'
      },
      character: 'owl',
      timeLimit: 12000
    },
    {
      id: 'q4_2',
      difficulty: 4,
      prompt: 'Can you spell the word cat using letter sounds?',
      narration: 'What letters make the word cat? Say each sound: c... a... t.',
      expectedAnswers: ['c', 'a', 't', 'cat', 'CAT'],
      fuzzyMatch: true,
      hint: 'C says "cuh", A says "ah", T says "tuh".',
      feedback: {
        correct: 'Amazing! You spelled cat with sounds!',
        incorrect: 'Good try! C-A-T spells cat!'
      },
      character: 'owl',
      timeLimit: 15000
    }
  ]
};

export default phonicsAndSounds;
