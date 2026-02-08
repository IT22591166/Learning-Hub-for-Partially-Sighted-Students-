/**
 * Colors & Shapes Activity
 * Interactive learning activity for color and shape recognition
 * Target Age: 3-7 years
 */

export const colorsAndShapes = {
  id: 'colors-and-shapes',
  name: 'Colors & Shapes Explorer',
  description: 'Learn and identify colors and shapes with Max the Robot!',
  targetAge: [3, 7],
  duration: 600000, // 10 minutes
  skillsFocused: ['color-recognition', 'shape-identification', 'vocabulary'],
  
  difficulty: 'adaptive',
  difficultyRange: [1, 4],
  
  // Story context
  story: {
    title: 'Max\'s Rainbow Workshop',
    character: 'max',
    introduction: 'Welcome to my colorful workshop! Let\'s explore shapes and colors together!',
    setting: 'A bright, colorful robot workshop filled with colorful shapes and objects'
  },

  // Session structure
  sessionStructure: {
    introduction: {
      narration: 'Beep boop! Hello, I\'m Max the Robot! Welcome to my workshop. Today we\'re going to learn about colors and shapes. Are you ready to explore?',
      character: 'max',
      emotionalTone: 'excited',
      actions: ['play-robot-sounds', 'show-colorful-lights']
    },
    mainSection: {
      type: 'adaptive-questioning',
      minQuestions: 5,
      maxQuestions: 12,
      targetAccuracy: 0.60
    },
    closure: {
      type: 'celebration',
      narration: 'Beep boop! You did an amazing job learning colors and shapes!',
      actions: ['play-celebration-sound', 'announce-rewards']
    }
  },

  // Question bank with difficulty levels
  questionBank: [
    // ==================== DIFFICULTY 1: BASIC COLORS ====================
    {
      id: 'q1_1',
      difficulty: 1,
      prompt: 'What color is the apple?',
      narration: 'I see a bright apple. What color is it?',
      expectedAnswers: ['red', 'RED', 'Red'],
      fuzzyMatch: true,
      hint: 'It\'s the color of fire engines and stop signs.',
      feedback: {
        correct: 'Perfect! Red is correct! Great job!',
        incorrect: 'Not quite. This apple is red. Try again!'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q1_2',
      difficulty: 1,
      prompt: 'What color is the sky?',
      narration: 'Look up! What color is the sky on a sunny day?',
      expectedAnswers: ['blue', 'BLUE', 'Blue'],
      fuzzyMatch: true,
      hint: 'It\'s like the color of the ocean.',
      feedback: {
        correct: 'Excellent! The sky is blue!',
        incorrect: 'Not quite. The sky is blue. Try again!'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q1_3',
      difficulty: 1,
      prompt: 'What color is the grass?',
      narration: 'What color is the grass in the park?',
      expectedAnswers: ['green', 'GREEN', 'Green'],
      fuzzyMatch: true,
      hint: 'It\'s the color of leaves on trees.',
      feedback: {
        correct: 'Great! Green is the color of grass!',
        incorrect: 'Not quite. Grass is green. Try again!'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q1_4',
      difficulty: 1,
      prompt: 'What color is a banana?',
      narration: 'I have a yummy banana. What color is it?',
      expectedAnswers: ['yellow', 'YELLOW', 'Yellow'],
      fuzzyMatch: true,
      hint: 'It\'s the color of the sun.',
      feedback: {
        correct: 'Perfect! Bananas are yellow!',
        incorrect: 'Not quite. A banana is yellow. Try again!'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q1_5',
      difficulty: 1,
      prompt: 'What color is an orange?',
      narration: 'What color is this juicy orange fruit?',
      expectedAnswers: ['orange', 'ORANGE', 'Orange'],
      fuzzyMatch: true,
      hint: 'It\'s between red and yellow.',
      feedback: {
        correct: 'Wonderful! An orange is orange!',
        incorrect: 'Not quite. An orange is orange. Try again!'
      },
      character: 'max',
      timeLimit: 12000
    },

    // ==================== DIFFICULTY 2: SHAPES ====================
    {
      id: 'q2_1',
      difficulty: 2,
      prompt: 'What shape has four equal sides and four corners?',
      narration: 'I see a shape with four equal sides and four corners. What shape is it?',
      expectedAnswers: ['square', 'SQUARE', 'Square'],
      fuzzyMatch: true,
      hint: 'A window pane looks like this shape.',
      feedback: {
        correct: 'Excellent! That\'s a square!',
        incorrect: 'Not quite. This shape is a square. Try again!'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q2_2',
      difficulty: 2,
      prompt: 'What shape has three sides and three corners?',
      narration: 'This shape has three sides and three corners. What is it called?',
      expectedAnswers: ['triangle', 'TRIANGLE', 'Triangle'],
      fuzzyMatch: true,
      hint: 'A piece of pizza looks like this shape.',
      feedback: {
        correct: 'Great! That\'s a triangle!',
        incorrect: 'Not quite. This shape is a triangle. Try again!'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q2_3',
      difficulty: 2,
      prompt: 'What shape is round with no corners?',
      narration: 'This shape is round and has no corners. What\'s it called?',
      expectedAnswers: ['circle', 'CIRCLE', 'Circle'],
      fuzzyMatch: true,
      hint: 'A ball or a wheel looks like this shape.',
      feedback: {
        correct: 'Perfect! That\'s a circle!',
        incorrect: 'Not quite. This shape is a circle. Try again!'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q2_4',
      difficulty: 2,
      prompt: 'What shape has two long sides and two short sides?',
      narration: 'This shape has two long sides and two short sides. What shape is it?',
      expectedAnswers: ['rectangle', 'RECTANGLE', 'Rectangle'],
      fuzzyMatch: true,
      hint: 'A door or a window looks like this shape.',
      feedback: {
        correct: 'Excellent! That\'s a rectangle!',
        incorrect: 'Not quite. This shape is a rectangle. Try again!'
      },
      character: 'max',
      timeLimit: 12000
    },

    // ==================== DIFFICULTY 3: COLORS & SHAPES COMBINED ====================
    {
      id: 'q3_1',
      difficulty: 3,
      prompt: 'What color square do you see?',
      narration: 'I see a red square. Can you tell me what color this square is?',
      expectedAnswers: ['red', 'RED', 'Red'],
      fuzzyMatch: true,
      hint: 'Look at the color, not the shape.',
      feedback: {
        correct: 'Great! The square is red!',
        incorrect: 'Not quite. The square is red. Try again!'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q3_2',
      difficulty: 3,
      prompt: 'How many blue circles are there?',
      narration: 'I see some blue circles. Can you count them? How many blue circles do you see?',
      expectedAnswers: ['three', '3', 'three circles'],
      fuzzyMatch: true,
      hint: 'Count each blue circle: one, two, three.',
      feedback: {
        correct: 'Perfect! There are three blue circles!',
        incorrect: 'Not quite. Let me count with you. There are three blue circles.'
      },
      character: 'max',
      timeLimit: 15000
    },
    {
      id: 'q3_3',
      difficulty: 3,
      prompt: 'What color is this triangle?',
      narration: 'Look at this triangle. What color is it?',
      expectedAnswers: ['green', 'GREEN', 'Green'],
      fuzzyMatch: true,
      hint: 'It\'s the same color as grass.',
      feedback: {
        correct: 'Excellent! The triangle is green!',
        incorrect: 'Not quite. The triangle is green. Try again!'
      },
      character: 'max',
      timeLimit: 12000
    },
    {
      id: 'q3_4',
      difficulty: 3,
      prompt: 'What shape is yellow?',
      narration: 'Which shape is yellow? Is it a triangle, circle, or square?',
      expectedAnswers: ['circle', 'CIRCLE', 'Circle'],
      fuzzyMatch: true,
      hint: 'It\'s round.',
      feedback: {
        correct: 'Great! The yellow shape is a circle!',
        incorrect: 'Not quite. The yellow shape is a circle. Try again!'
      },
      character: 'max',
      timeLimit: 12000
    },

    // ==================== DIFFICULTY 4: ADVANCED CHALLENGES ====================
    {
      id: 'q4_1',
      difficulty: 4,
      prompt: 'How many red rectangles and blue squares do you see in total?',
      narration: 'Look at the shapes. Count the red rectangles and blue squares. How many shapes do you see in total?',
      expectedAnswers: ['five', '5', 'five shapes'],
      fuzzyMatch: true,
      hint: 'Count all the rectangles and squares together.',
      feedback: {
        correct: 'Fantastic! You counted all five shapes!',
        incorrect: 'Not quite. There are five shapes in total. Try again!'
      },
      character: 'max',
      timeLimit: 15000
    },
    {
      id: 'q4_2',
      difficulty: 4,
      prompt: 'Which colors did you see?',
      narration: 'Tell me all the different colors you saw today. Name as many as you can remember!',
      expectedAnswers: ['red', 'blue', 'green', 'yellow', 'orange'],
      fuzzyMatch: true,
      hint: 'Think about all the colors we learned about.',
      feedback: {
        correct: 'Amazing! You remember all the colors!',
        incorrect: 'Good try! You learned: red, blue, green, yellow, and orange!'
      },
      character: 'max',
      timeLimit: 15000
    }
  ]
};

export default colorsAndShapes;
