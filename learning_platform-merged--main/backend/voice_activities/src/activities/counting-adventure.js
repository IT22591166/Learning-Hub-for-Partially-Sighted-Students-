/**
 * Counting Adventure Activity
 * Story-driven learning activity for number recognition and counting skills
 * Target Age: 4-8 years
 */

export const countingAdventure = {
  id: 'counting-adventure',
  name: 'Story Counting Adventure',
  description: 'Help Sophie count apples on her adventure through the orchard!',
  targetAge: [4, 8],
  duration: 600000, // 10 minutes
  skillsFocused: ['counting', 'number-recognition', 'number-naming'],
  
  difficulty: 'adaptive',
  difficultyRange: [1, 5],
  
  // Story context
  story: {
    title: 'Sophie\'s Apple Orchard Adventure',
    character: 'sophie',
    introduction: 'Welcome to the apple orchard! Today we are going to help Sophie count apples. Are you ready?',
    setting: 'A beautiful sunny apple orchard with friendly trees and happy birds'
  },

  // Session structure
  sessionStructure: {
    introduction: {
      narration: 'Hello! I am Sophie, and I need your help counting apples in my orchard. Let\'s start our counting adventure together!',
      character: 'sophie',
      emotionalTone: 'encouraging',
      actions: ['play-ambient-music', 'play-orchard-sounds']
    },
    mainSection: {
      type: 'adaptive-questioning',
      minQuestions: 5,
      maxQuestions: 15,
      targetAccuracy: 0.55
    },
    closure: {
      type: 'celebration',
      narration: 'Wonderful job helping me count! You are a great helper!',
      actions: ['play-celebration-sound', 'announce-rewards']
    }
  },

  // Question bank with difficulty levels
  questionBank: [
    // Difficulty 1 - Very Easy
    {
      id: 'q1_1',
      difficulty: 1,
      prompt: 'Sophie found one apple. How many apples does she have?',
      narration: 'Sophie found one apple on the tree. How many apples does she have?',
      expectedAnswers: ['one', '1', 'one apple'],
      fuzzyMatch: true,
      image: null, // Could add visual reference
      hint: 'Think of the number one. Say it out loud.',
      feedback: {
        correct: 'Perfect! One apple! You counted correctly.',
        incorrect: 'Not quite. One apple means the number 1. Try again!'
      },
      character: 'sophie',
      timeLimit: 15000 // 15 seconds
    },
    {
      id: 'q1_2',
      difficulty: 1,
      prompt: 'Sophie has two apples in her basket. How many apples does she have?',
      narration: 'Sophie collected two apples and put them in her basket. How many apples are in the basket?',
      expectedAnswers: ['two', '2', 'two apples'],
      fuzzyMatch: true,
      hint: 'Count on your fingers: one, two.',
      feedback: {
        correct: 'Excellent! Two apples! Great counting!',
        incorrect: 'Let me count with you: one, two. Try again!'
      },
      character: 'sophie',
      timeLimit: 15000
    },

    // Difficulty 2 - Easy
    {
      id: 'q2_1',
      difficulty: 2,
      prompt: 'Sophie picked three apples from the tree. How many apples did she pick?',
      narration: 'Sophie climbed the tree and picked one, two, three apples. How many apples did she pick in total?',
      expectedAnswers: ['three', '3', 'three apples'],
      fuzzyMatch: true,
      hint: 'Count: one, two, three.',
      feedback: {
        correct: 'Brilliant! Three apples! You are a great counter!',
        incorrect: 'Almost! Let us count together: one, two, three.'
      },
      character: 'sophie',
      timeLimit: 15000
    },
    {
      id: 'q2_2',
      difficulty: 2,
      prompt: 'Sophie found four red apples. How many apples did she find?',
      narration: 'Sophie found four beautiful red apples under a big tree.',
      expectedAnswers: ['four', '4', 'four apples'],
      fuzzyMatch: true,
      hint: 'Use your four fingers to help count.',
      feedback: {
        correct: 'Perfect! Four apples! You are doing amazing!',
        incorrect: 'Not quite. Remember: one, two, three, four. Try again!'
      },
      character: 'buddy',
      timeLimit: 15000
    },

    // Difficulty 3 - Medium
    {
      id: 'q3_1',
      difficulty: 3,
      prompt: 'Sophie has three apples and her friend gives her two more. How many apples does Sophie have now?',
      narration: 'Sophie has three apples in her basket. Her friend comes and gives her two more apples. How many apples does Sophie have now?',
      expectedAnswers: ['five', '5', 'five apples'],
      fuzzyMatch: true,
      hint: 'Start with three, then add two more.',
      feedback: {
        correct: 'Excellent! You solved the problem! Three and two makes five!',
        incorrect: 'Let us think about it. Start with three apples, then add two more.'
      },
      character: 'sophie',
      timeLimit: 20000
    },
    {
      id: 'q3_2',
      difficulty: 3,
      prompt: 'There are five apples on the tree. Sophie picks two. How many apples are left on the tree?',
      narration: 'Five apples are hanging on a tree. Sophie picks two apples and takes them home. How many apples are still on the tree?',
      expectedAnswers: ['three', '3', 'three apples'],
      fuzzyMatch: true,
      hint: 'Start with five and take away two.',
      feedback: {
        correct: 'Fantastic! Five take away two equals three!',
        incorrect: 'Think about it: five apples, Sophie takes two. How many are left?'
      },
      character: 'teacher',
      timeLimit: 20000
    },

    // Difficulty 4 - Harder
    {
      id: 'q4_1',
      difficulty: 4,
      prompt: 'Sophie picks four apples in the morning and three apples in the afternoon. How many apples did she pick in total?',
      narration: 'Sophie is busy picking apples! In the morning, she picked four apples. In the afternoon, she picked three more apples. How many apples did she pick altogether?',
      expectedAnswers: ['seven', '7', 'seven apples'],
      fuzzyMatch: true,
      hint: 'Count: four, then add three more.',
      feedback: {
        correct: 'Perfect! You solved a hard problem! Four and three makes seven!',
        incorrect: 'Let us count together. Four plus three is seven.'
      },
      character: 'buddy',
      timeLimit: 25000
    },
    {
      id: 'q4_2',
      difficulty: 4,
      prompt: 'There are nine apples. Sophie eats two. How many apples are left?',
      narration: 'Sophie has nine delicious apples. She is so hungry that she eats two of them. How many apples does she have left?',
      expectedAnswers: ['seven', '7', 'seven apples'],
      fuzzyMatch: true,
      hint: 'Start with nine and subtract two.',
      feedback: {
        correct: 'Wonderful! Nine minus two equals seven!',
        incorrect: 'Let us think: nine apples, take away two. How many remain?'
      },
      character: 'sophie',
      timeLimit: 25000
    },

    // Difficulty 5 - Very Hard
    {
      id: 'q5_1',
      difficulty: 5,
      prompt: 'Sophie has six apples. She eats one and gives three to her friend. How many apples does Sophie have left?',
      narration: 'Sophie starts with six apples. She eats one apple for lunch. Then she gives three apples to her friend. How many apples does Sophie still have?',
      expectedAnswers: ['two', '2', 'two apples'],
      fuzzyMatch: true,
      hint: 'Start with six. First, subtract one. Then, subtract three more.',
      feedback: {
        correct: 'Amazing! You solved a very hard problem! Six minus one minus three equals two!',
        incorrect: 'Let us work through it step by step: six apples, minus one, minus three.'
      },
      character: 'teacher',
      timeLimit: 30000
    },
    {
      id: 'q5_2',
      difficulty: 5,
      prompt: 'There are five red apples and four green apples in the basket. How many apples are there in total?',
      narration: 'Sophie has a basket with apples. There are five red apples and four green apples. How many apples does she have altogether?',
      expectedAnswers: ['nine', '9', 'nine apples'],
      fuzzyMatch: true,
      hint: 'Add the red apples and the green apples together.',
      feedback: {
        correct: 'Fantastic! Five red plus four green equals nine apples!',
        incorrect: 'Think about it: five plus four. How many in total?'
      },
      character: 'buddy',
      timeLimit: 30000
    }
  ],

  // Rewards and achievements
  rewards: {
    badges: [
      {
        id: 'counter',
        name: 'Counter',
        description: 'Complete the counting adventure',
        condition: { minQuestions: 5 }
      },
      {
        id: 'accuracy-star',
        name: 'Accuracy Star',
        description: 'Get 80% or higher accuracy',
        condition: { minAccuracy: 0.8 }
      },
      {
        id: 'speedy-counter',
        name: 'Speedy Counter',
        description: 'Answer 3 questions in under 5 seconds each',
        condition: { fastAnswerCount: 3 }
      },
      {
        id: 'problem-solver',
        name: 'Problem Solver',
        description: 'Complete difficult (level 4-5) questions',
        condition: { hardQuestionsCorrect: 2 }
      }
    ],
    soundEffects: {
      correct: 'ding-cheerful.wav',
      incorrect: 'gentle-chime.wav',
      levelUp: 'magic-sparkle.wav',
      badgeUnlock: 'triumph.wav'
    },
    encouragement: [
      'Great job!',
      'You are doing fantastic!',
      'I believe in you!',
      'Keep it up!',
      'Wonderful work!',
      'You are a superstar!'
    ]
  },

  // Activity metadata
  metadata: {
    version: '1.0.0',
    createdDate: '2025-11-26',
    language: 'en-US',
    accessibility: {
      audioOnly: true,
      screenReaderCompatible: true,
      wcagCompliance: '2.1-AA',
      requiresVisuals: false
    },
    research: {
      focusSkills: ['counting', 'basic-addition', 'basic-subtraction'],
      assessmentType: 'formative',
      useInResearch: true
    }
  }
};

export default countingAdventure;
