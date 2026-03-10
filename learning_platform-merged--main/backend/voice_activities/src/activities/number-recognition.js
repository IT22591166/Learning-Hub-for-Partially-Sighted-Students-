/**
 * Number Recognition Activity
 * Interactive activity for learning to recognize and name numbers 1-10
 * Target Age: 5-7 years
 */

export const numberRecognition = {
  id: 'number-recognition',
  name: 'Number Recognition Quest',
  description: 'Learn to recognize numbers 1-10 with Max the Robot!',
  targetAge: [5, 7],
  duration: 600000, // 10 minutes
  skillsFocused: ['number-recognition', 'number-naming', 'visual-counting'],
  
  difficulty: 'adaptive',
  difficultyRange: [1, 4],
  
  // Story context
  story: {
    title: 'Max the Robot\'s Number Quest',
    character: 'max',
    introduction: 'Beep boop! I am Max the Robot, and I need your help learning numbers!',
    setting: 'A futuristic robot laboratory with colorful number displays'
  },

  // Session structure
  sessionStructure: {
    introduction: {
      narration: 'Beep boop! Welcome to my number laboratory! I will show you a number with pictures, and you tell me what number it is. Ready?',
      character: 'max',
      emotionalTone: 'curious',
      actions: ['play-robot-sound', 'play-lab-ambience']
    },
    mainSection: {
      type: 'adaptive-questioning',
      minQuestions: 8,
      maxQuestions: 15,
      targetAccuracy: 0.70
    },
    closure: {
      type: 'celebration',
      narration: 'Beep boop beep! You learned so many numbers! You are a number master!',
      actions: ['play-robot-celebration', 'announce-rewards']
    }
  },

  // Question bank with difficulty levels
  questionBank: [
    // Difficulty 1 - Very Easy (1-3)
    {
      id: 'q1_1',
      difficulty: 1,
      prompt: 'How many stars do you see?',
      narration: 'Look at the stars! How many stars are there?',
      visualCount: 1,
      expectedAnswers: ['one', '1', 'one star'],
      fuzzyMatch: true,
      hint: 'Count the stars: one.',
      feedback: {
        correct: 'That is right! There is one star!',
        incorrect: 'Not quite. Count again: one star. Say the number one!'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q1_2',
      difficulty: 1,
      prompt: 'How many circles are here?',
      narration: 'Count the circles. How many circles do you see?',
      visualCount: 2,
      expectedAnswers: ['two', '2', 'two circles'],
      fuzzyMatch: true,
      hint: 'Count: one, two.',
      feedback: {
        correct: 'Perfect! Two circles!',
        incorrect: 'Try counting again. One, two.'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q1_3',
      difficulty: 1,
      prompt: 'How many squares can you count?',
      narration: 'Look at the squares and count them. How many are there?',
      visualCount: 3,
      expectedAnswers: ['three', '3', 'three squares'],
      fuzzyMatch: true,
      hint: 'One, two, three squares.',
      feedback: {
        correct: 'Excellent! Three squares!',
        incorrect: 'Let us count together: one, two, three.'
      },
      character: 'max',
      timeLimit: 12000
    },

    // Difficulty 2 - Easy (4-6)
    {
      id: 'q2_1',
      difficulty: 2,
      prompt: 'How many hearts do you see?',
      narration: 'Count all the hearts. What number do you get?',
      visualCount: 4,
      expectedAnswers: ['four', '4', 'four hearts'],
      fuzzyMatch: true,
      hint: 'Count: one, two, three, four.',
      feedback: {
        correct: 'Great job! Four hearts!',
        incorrect: 'Try counting again carefully: one, two, three, four.'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q2_2',
      difficulty: 2,
      prompt: 'How many triangles are on the screen?',
      narration: 'Look carefully and count the triangles.',
      visualCount: 5,
      expectedAnswers: ['five', '5', 'five triangles'],
      fuzzyMatch: true,
      hint: 'One, two, three, four, five.',
      feedback: {
        correct: 'Wonderful! Five triangles!',
        incorrect: 'Count slowly: one, two, three, four, five.'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q2_3',
      difficulty: 2,
      prompt: 'How many flowers are here?',
      narration: 'Count the pretty flowers.',
      visualCount: 6,
      expectedAnswers: ['six', '6', 'six flowers'],
      fuzzyMatch: true,
      hint: 'Count carefully: one, two, three, four, five, six.',
      feedback: {
        correct: 'Perfect! Six flowers!',
        incorrect: 'Let me help: one, two, three, four, five, six.'
      },
      character: 'max',
      timeLimit: 12000
    },

    // Difficulty 3 - Medium (7-8)
    {
      id: 'q3_1',
      difficulty: 3,
      prompt: 'How many butterflies can you count?',
      narration: 'Count all the butterflies flying around.',
      visualCount: 7,
      expectedAnswers: ['seven', '7', 'seven butterflies'],
      fuzzyMatch: true,
      hint: 'One, two, three, four, five, six, seven.',
      feedback: {
        correct: 'Excellent! Seven butterflies!',
        incorrect: 'Count carefully: one through seven.'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q3_2',
      difficulty: 3,
      prompt: 'How many apples are on the tree?',
      narration: 'Count the apples hanging from the tree.',
      visualCount: 8,
      expectedAnswers: ['eight', '8', 'eight apples'],
      fuzzyMatch: true,
      hint: 'Count: one, two, three, four, five, six, seven, eight.',
      feedback: {
        correct: 'Great! Eight apples!',
        incorrect: 'Count each apple carefully: one through eight.'
      },
      character: 'max',
      timeLimit: 12000
    },

    // Difficulty 4 - Hard (9-10)
    {
      id: 'q4_1',
      difficulty: 4,
      prompt: 'How many balloons are there?',
      narration: 'Count all the balloons floating in the air.',
      visualCount: 9,
      expectedAnswers: ['nine', '9', 'nine balloons'],
      fuzzyMatch: true,
      hint: 'Count carefully: one through nine.',
      feedback: {
        correct: 'Perfect! Nine balloons!',
        incorrect: 'Count again from one to nine.'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q4_2',
      difficulty: 4,
      prompt: 'How many stars are in the sky?',
      narration: 'Count all the twinkling stars.',
      visualCount: 10,
      expectedAnswers: ['ten', '10', 'ten stars'],
      fuzzyMatch: true,
      hint: 'Count: one, two, three, four, five, six, seven, eight, nine, ten.',
      feedback: {
        correct: 'Fantastic! Ten stars! You counted to ten!',
        incorrect: 'Count all the way to ten: one through ten.'
      },
      character: 'max',
      timeLimit: 12000
    }
  ],

  // Adaptive difficulty rules
  adaptiveRules: {
    increaseOn: 0.75, // 75% accuracy
    decreaseOn: 0.50, // 50% accuracy
    minDifficulty: 1,
    maxDifficulty: 4
  },

  // Rewards
  rewards: {
    xpPerCorrectAnswer: 10,
    bonusXpForSpeed: 5, // Extra 5 XP if answered in < 5 seconds
    bonusXpForAccuracy: 10, // Extra 10 XP if 100% accuracy on all questions
    badgesEarned: [
      {
        id: 'number-master',
        name: 'Number Recognizer',
        description: 'Recognized numbers 1-10 correctly',
        icon: '🔢'
      }
    ]
  }
};
