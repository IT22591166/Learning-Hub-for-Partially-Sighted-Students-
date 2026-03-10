/**
 * Basic Math Activity
 * Interactive activity for learning simple addition and subtraction
 * Target Age: 6-8 years
 */

export const basicMath = {
  id: 'basic-math',
  name: 'Math Mystery Solver',
  description: 'Solve fun math puzzles with Professor Wise Owl!',
  targetAge: [6, 8],
  duration: 600000, // 10 minutes
  skillsFocused: ['addition', 'subtraction', 'mental-math', 'number-sense'],
  
  difficulty: 'adaptive',
  difficultyRange: [1, 4],
  
  // Story context
  story: {
    title: 'Professor Wise Owl\'s Math Mystery',
    character: 'owl',
    introduction: 'Hoot hoot! I am Professor Wise Owl, and I have math mysteries for you to solve!',
    setting: 'A cozy library filled with books and magical chalkboards'
  },

  // Session structure
  sessionStructure: {
    introduction: {
      narration: 'Hoot hoot! Welcome to my library! Today you will solve math mysteries. I will read a problem, and you tell me the answer. Are you ready?',
      character: 'owl',
      emotionalTone: 'wise',
      actions: ['play-owl-hoot', 'play-library-ambience']
    },
    mainSection: {
      type: 'adaptive-questioning',
      minQuestions: 8,
      maxQuestions: 15,
      targetAccuracy: 0.70
    },
    closure: {
      type: 'celebration',
      narration: 'Hoot hoot hoot! You solved all the mysteries! You are a math genius!',
      actions: ['play-owl-celebration', 'announce-rewards']
    }
  },

  // Question bank with difficulty levels
  questionBank: [
    // Difficulty 1 - Very Easy (simple addition with 1-2)
    {
      id: 'q1_1',
      difficulty: 1,
      type: 'addition',
      prompt: 'One plus one equals what?',
      narration: 'You have one apple and your friend gives you one more apple. How many apples do you have now?',
      num1: 1,
      num2: 1,
      operation: '+',
      expectedAnswers: ['two', '2', 'two apples'],
      fuzzyMatch: true,
      hint: 'One and one makes two.',
      feedback: {
        correct: 'Perfect! One plus one is two!',
        incorrect: 'Not quite. One and one is two. Try again!'
      },
      character: 'owl',
      timeLimit: 15000
    },
    {
      id: 'q1_2',
      difficulty: 1,
      type: 'addition',
      prompt: 'Two plus one equals what?',
      narration: 'There are two birds on a branch. Another bird lands. How many birds are there now?',
      num1: 2,
      num2: 1,
      operation: '+',
      expectedAnswers: ['three', '3', 'three birds'],
      fuzzyMatch: true,
      hint: 'Two plus one is three.',
      feedback: {
        correct: 'Great! Two plus one is three!',
        incorrect: 'Try again. Two plus one equals three.'
      },
      character: 'owl',
      timeLimit: 15000
    },
    {
      id: 'q1_3',
      difficulty: 1,
      type: 'addition',
      prompt: 'Three plus one equals what?',
      narration: 'You have three toys and get one more toy. How many toys do you have?',
      num1: 3,
      num2: 1,
      operation: '+',
      expectedAnswers: ['four', '4', 'four toys'],
      fuzzyMatch: true,
      hint: 'Three plus one is four.',
      feedback: {
        correct: 'Excellent! Three plus one is four!',
        incorrect: 'Almost! Three plus one equals four.'
      },
      character: 'owl',
      timeLimit: 15000
    },

    // Difficulty 2 - Easy (addition with 2-3, subtraction intro)
    {
      id: 'q2_1',
      difficulty: 2,
      type: 'addition',
      prompt: 'Two plus two equals what?',
      narration: 'You have two cookies and your sister has two cookies. How many cookies do you have together?',
      num1: 2,
      num2: 2,
      operation: '+',
      expectedAnswers: ['four', '4', 'four cookies'],
      fuzzyMatch: true,
      hint: 'Two plus two is four.',
      feedback: {
        correct: 'Perfect! Two plus two is four!',
        incorrect: 'Try again. Two plus two equals four.'
      },
      character: 'owl',
      timeLimit: 15000
    },
    {
      id: 'q2_2',
      difficulty: 2,
      type: 'addition',
      prompt: 'Three plus two equals what?',
      narration: 'There are three flowers in one vase and two flowers in another vase. How many flowers are there in total?',
      num1: 3,
      num2: 2,
      operation: '+',
      expectedAnswers: ['five', '5', 'five flowers'],
      fuzzyMatch: true,
      hint: 'Three plus two is five.',
      feedback: {
        correct: 'Great! Three plus two is five!',
        incorrect: 'Count on: three, four, five. Three plus two is five.'
      },
      character: 'owl',
      timeLimit: 15000
    },
    {
      id: 'q2_3',
      difficulty: 2,
      type: 'subtraction',
      prompt: 'Three minus one equals what?',
      narration: 'You have three candies and eat one candy. How many candies are left?',
      num1: 3,
      num2: 1,
      operation: '-',
      expectedAnswers: ['two', '2', 'two candies'],
      fuzzyMatch: true,
      hint: 'If you take away one from three, you have two.',
      feedback: {
        correct: 'Wonderful! Three minus one is two!',
        incorrect: 'Try again. Three take away one is two.'
      },
      character: 'owl',
      timeLimit: 15000
    },

    // Difficulty 3 - Medium (addition/subtraction with 3-5)
    {
      id: 'q3_1',
      difficulty: 3,
      type: 'addition',
      prompt: 'Four plus three equals what?',
      narration: 'You have four crayons and find three more crayons. How many crayons do you have now?',
      num1: 4,
      num2: 3,
      operation: '+',
      expectedAnswers: ['seven', '7', 'seven crayons'],
      fuzzyMatch: true,
      hint: 'Four plus three is seven.',
      feedback: {
        correct: 'Excellent! Four plus three is seven!',
        incorrect: 'Count: four, five, six, seven. Four plus three is seven.'
      },
      character: 'owl',
      timeLimit: 15000
    },
    {
      id: 'q3_2',
      difficulty: 3,
      type: 'subtraction',
      prompt: 'Five minus two equals what?',
      narration: 'You have five balloons and two balloons pop. How many balloons do you have left?',
      num1: 5,
      num2: 2,
      operation: '-',
      expectedAnswers: ['three', '3', 'three balloons'],
      fuzzyMatch: true,
      hint: 'Five take away two is three.',
      feedback: {
        correct: 'Great! Five minus two is three!',
        incorrect: 'Count back: five, four, three. Five minus two is three.'
      },
      character: 'owl',
      timeLimit: 15000
    },

    // Difficulty 4 - Hard (addition/subtraction with 5-10)
    {
      id: 'q4_1',
      difficulty: 4,
      type: 'addition',
      prompt: 'Five plus four equals what?',
      narration: 'There are five birds in the tree and four more birds arrive. How many birds are in the tree now?',
      num1: 5,
      num2: 4,
      operation: '+',
      expectedAnswers: ['nine', '9', 'nine birds'],
      fuzzyMatch: true,
      hint: 'Five plus four is nine.',
      feedback: {
        correct: 'Perfect! Five plus four is nine!',
        incorrect: 'Count carefully: five, six, seven, eight, nine. Five plus four is nine.'
      },
      character: 'owl',
      timeLimit: 15000
    },
    {
      id: 'q4_2',
      difficulty: 4,
      type: 'subtraction',
      prompt: 'Eight minus three equals what?',
      narration: 'You have eight stickers and give away three stickers. How many stickers do you have left?',
      num1: 8,
      num2: 3,
      operation: '-',
      expectedAnswers: ['five', '5', 'five stickers'],
      fuzzyMatch: true,
      hint: 'Eight take away three is five.',
      feedback: {
        correct: 'Fantastic! Eight minus three is five!',
        incorrect: 'Count back: eight, seven, six, five. Eight minus three is five.'
      },
      character: 'owl',
      timeLimit: 15000
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
    xpPerCorrectAnswer: 15, // Math problems worth more XP
    bonusXpForSpeed: 5,
    bonusXpForAccuracy: 15,
    badgesEarned: [
      {
        id: 'math-wizard',
        name: 'Math Wizard',
        description: 'Solved addition and subtraction problems',
        icon: '🧙'
      }
    ]
  }
};
