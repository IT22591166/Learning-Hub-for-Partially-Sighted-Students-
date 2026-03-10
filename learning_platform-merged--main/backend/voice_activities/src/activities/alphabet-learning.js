/**
 * Alphabet Learning Activity
 * Interactive activity for learning letters and their sounds
 * Target Age: 4-6 years
 */

export const alphabetLearning = {
  id: 'alphabet-learning',
  name: 'Alphabet Adventure',
  description: 'Learn letters A-Z with friendly characters!',
  targetAge: [4, 6],
  duration: 900000, // 15 minutes - longer because more content
  skillsFocused: ['letter-recognition', 'letter-sounds', 'phonics', 'letter-naming'],
  
  difficulty: 'adaptive',
  difficultyRange: [1, 3],
  
  // Story context
  story: {
    title: 'The Alphabet Journey',
    character: 'dragon',
    introduction: 'Hello! I am Dragon Dan, and I want to teach you all the letters!',
    setting: 'A magical land where each letter has its own colorful kingdom'
  },

  // Session structure
  sessionStructure: {
    introduction: {
      narration: 'Roar! Welcome to the Alphabet Journey! We will explore different letters today. I will show you a letter, and you tell me what it is or what sound it makes. Ready?',
      character: 'dragon',
      emotionalTone: 'excited',
      actions: ['play-dragon-roar', 'play-magical-music']
    },
    mainSection: {
      type: 'adaptive-questioning',
      minQuestions: 10,
      maxQuestions: 20,
      targetAccuracy: 0.70
    },
    closure: {
      type: 'celebration',
      narration: 'Roar roar roar! You learned so many letters! You are an alphabet master!',
      actions: ['play-dragon-celebration', 'announce-rewards']
    }
  },

  // Question bank with difficulty levels
  questionBank: [
    // Difficulty 1 - Very Easy (uppercase single letters A-G)
    {
      id: 'q1_1',
      difficulty: 1,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Look at this letter. What is it?',
      letter: 'A',
      expectedAnswers: ['a', 'ay', 'letter a', 'the letter a'],
      fuzzyMatch: true,
      hint: 'This is the first letter of the alphabet. It sounds like "ay".',
      feedback: {
        correct: 'Correct! That is the letter A!',
        incorrect: 'That is the letter A. The sound is "ay".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q1_2',
      difficulty: 1,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Can you name this letter?',
      letter: 'B',
      expectedAnswers: ['b', 'bee', 'letter b', 'the letter b'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "buh". Think of the word ball.',
      feedback: {
        correct: 'Perfect! That is the letter B!',
        incorrect: 'This is the letter B. The sound is "buh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q1_3',
      difficulty: 1,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'What is this letter called?',
      letter: 'C',
      expectedAnswers: ['c', 'see', 'letter c', 'the letter c'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "cuh". Think of the word cat.',
      feedback: {
        correct: 'Great! That is the letter C!',
        incorrect: 'This is the letter C. The sound is "cuh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q1_4',
      difficulty: 1,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Look and tell me the letter name.',
      letter: 'D',
      expectedAnswers: ['d', 'dee', 'letter d', 'the letter d'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "duh". Think of the word dog.',
      feedback: {
        correct: 'Excellent! That is the letter D!',
        incorrect: 'This is the letter D. The sound is "duh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q1_5',
      difficulty: 1,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Can you name this letter?',
      letter: 'E',
      expectedAnswers: ['e', 'ee', 'letter e', 'the letter e'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "eh". Think of the word egg.',
      feedback: {
        correct: 'Perfect! That is the letter E!',
        incorrect: 'This is the letter E. The sound is "eh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q1_6',
      difficulty: 1,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'What is this letter?',
      letter: 'F',
      expectedAnswers: ['f', 'ef', 'letter f', 'the letter f'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "fff". Think of the word fish.',
      feedback: {
        correct: 'Great! That is the letter F!',
        incorrect: 'This is the letter F. The sound is "fff".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q1_7',
      difficulty: 1,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Tell me the name of this letter.',
      letter: 'G',
      expectedAnswers: ['g', 'gee', 'letter g', 'the letter g'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "guh". Think of the word go.',
      feedback: {
        correct: 'Excellent! That is the letter G!',
        incorrect: 'This is the letter G. The sound is "guh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },

    // Difficulty 2 - Easy (uppercase H-N)
    {
      id: 'q2_1',
      difficulty: 2,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Look at this letter. What is its name?',
      letter: 'H',
      expectedAnswers: ['h', 'aych', 'letter h', 'the letter h'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "huh". Think of the word hat.',
      feedback: {
        correct: 'Perfect! That is the letter H!',
        incorrect: 'This is the letter H. The sound is "huh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q2_2',
      difficulty: 2,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Can you tell me this letter?',
      letter: 'I',
      expectedAnswers: ['i', 'eye', 'letter i', 'the letter i'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "ih". Think of the word igloo.',
      feedback: {
        correct: 'Great! That is the letter I!',
        incorrect: 'This is the letter I. The sound is "ih".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q2_3',
      difficulty: 2,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'What is this letter called?',
      letter: 'J',
      expectedAnswers: ['j', 'jay', 'letter j', 'the letter j'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "juh". Think of the word jump.',
      feedback: {
        correct: 'Excellent! That is the letter J!',
        incorrect: 'This is the letter J. The sound is "juh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q2_4',
      difficulty: 2,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Name this letter for me.',
      letter: 'K',
      expectedAnswers: ['k', 'kay', 'letter k', 'the letter k'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "kuh". Think of the word kite.',
      feedback: {
        correct: 'Perfect! That is the letter K!',
        incorrect: 'This is the letter K. The sound is "kuh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q2_5',
      difficulty: 2,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Can you name this letter?',
      letter: 'L',
      expectedAnswers: ['l', 'el', 'letter l', 'the letter l'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "luh". Think of the word lion.',
      feedback: {
        correct: 'Great! That is the letter L!',
        incorrect: 'This is the letter L. The sound is "luh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q2_6',
      difficulty: 2,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'What is this letter?',
      letter: 'M',
      expectedAnswers: ['m', 'em', 'letter m', 'the letter m'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "mmm". Think of the word moon.',
      feedback: {
        correct: 'Excellent! That is the letter M!',
        incorrect: 'This is the letter M. The sound is "mmm".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q2_7',
      difficulty: 2,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Tell me the name of this letter.',
      letter: 'N',
      expectedAnswers: ['n', 'en', 'letter n', 'the letter n'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "nuh". Think of the word nose.',
      feedback: {
        correct: 'Perfect! That is the letter N!',
        incorrect: 'This is the letter N. The sound is "nuh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },

    // Difficulty 3 - Medium (uppercase O-Z)
    {
      id: 'q3_1',
      difficulty: 3,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Look at this letter. What is it?',
      letter: 'O',
      expectedAnswers: ['o', 'oh', 'letter o', 'the letter o'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "oh". Think of the word orange.',
      feedback: {
        correct: 'Great! That is the letter O!',
        incorrect: 'This is the letter O. The sound is "oh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q3_2',
      difficulty: 3,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Can you name this letter?',
      letter: 'P',
      expectedAnswers: ['p', 'pee', 'letter p', 'the letter p'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "puh". Think of the word pig.',
      feedback: {
        correct: 'Excellent! That is the letter P!',
        incorrect: 'This is the letter P. The sound is "puh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q3_3',
      difficulty: 3,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'What is this letter called?',
      letter: 'R',
      expectedAnswers: ['r', 'ar', 'letter r', 'the letter r'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "rrr". Think of the word run.',
      feedback: {
        correct: 'Perfect! That is the letter R!',
        incorrect: 'This is the letter R. The sound is "rrr".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q3_4',
      difficulty: 3,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Name this letter for me.',
      letter: 'S',
      expectedAnswers: ['s', 'es', 'letter s', 'the letter s'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "sss". Think of the word sun.',
      feedback: {
        correct: 'Great! That is the letter S!',
        incorrect: 'This is the letter S. The sound is "sss".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q3_5',
      difficulty: 3,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Can you tell me this letter?',
      letter: 'T',
      expectedAnswers: ['t', 'tee', 'letter t', 'the letter t'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "tuh". Think of the word tiger.',
      feedback: {
        correct: 'Excellent! That is the letter T!',
        incorrect: 'This is the letter T. The sound is "tuh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q3_6',
      difficulty: 3,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'What is this letter?',
      letter: 'U',
      expectedAnswers: ['u', 'you', 'letter u', 'the letter u'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "uh". Think of the word umbrella.',
      feedback: {
        correct: 'Perfect! That is the letter U!',
        incorrect: 'This is the letter U. The sound is "uh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q3_7',
      difficulty: 3,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Tell me the name of this letter.',
      letter: 'V',
      expectedAnswers: ['v', 'vee', 'letter v', 'the letter v'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "vuh". Think of the word violin.',
      feedback: {
        correct: 'Great! That is the letter V!',
        incorrect: 'This is the letter V. The sound is "vuh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q3_8',
      difficulty: 3,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Can you name this letter?',
      letter: 'W',
      expectedAnswers: ['w', 'double-u', 'letter w', 'the letter w'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "wuh". Think of the word water.',
      feedback: {
        correct: 'Excellent! That is the letter W!',
        incorrect: 'This is the letter W. The sound is "wuh".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q3_9',
      difficulty: 3,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'What is this letter called?',
      letter: 'X',
      expectedAnswers: ['x', 'ex', 'letter x', 'the letter x'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "ecks". Think of the word xylophone.',
      feedback: {
        correct: 'Perfect! That is the letter X!',
        incorrect: 'This is the letter X. The sound is "ecks".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q3_10',
      difficulty: 3,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Name this letter for me.',
      letter: 'Y',
      expectedAnswers: ['y', 'why', 'letter y', 'the letter y'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "why". Think of the word yes.',
      feedback: {
        correct: 'Great! That is the letter Y!',
        incorrect: 'This is the letter Y. The sound is "why".'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q3_11',
      difficulty: 3,
      type: 'letter-recognition',
      prompt: 'What letter is this?',
      narration: 'Can you tell me this letter?',
      letter: 'Z',
      expectedAnswers: ['z', 'zee', 'letter z', 'the letter z'],
      fuzzyMatch: true,
      hint: 'This letter sounds like "zzz". Think of the word zebra.',
      feedback: {
        correct: 'Excellent! That is the letter Z!',
        incorrect: 'This is the letter Z. The sound is "zzz".'
      },
      character: 'dragon',
      timeLimit: 12000
    }
  ],

  // Adaptive difficulty rules
  adaptiveRules: {
    increaseOn: 0.75,
    decreaseOn: 0.50,
    minDifficulty: 1,
    maxDifficulty: 3
  },

  // Rewards
  rewards: {
    xpPerCorrectAnswer: 10,
    bonusXpForSpeed: 3,
    bonusXpForAccuracy: 20,
    badgesEarned: [
      {
        id: 'alphabet-expert',
        name: 'Alphabet Expert',
        description: 'Learned all 26 letters of the alphabet',
        icon: '🔤'
      }
    ]
  }
};
