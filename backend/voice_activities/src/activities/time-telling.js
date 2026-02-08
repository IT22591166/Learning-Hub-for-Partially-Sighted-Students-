/**
 * Time Telling Activity
 * Interactive learning activity for telling time and understanding time concepts
 * Target Age: 5-9 years
 */

export const timeTelling = {
  id: 'time-telling',
  name: 'Time Telling Adventure',
  description: 'Learn to tell time and understand daily schedules with Dragon!',
  targetAge: [5, 9],
  duration: 600000, // 10 minutes
  skillsFocused: ['time-telling', 'clock-reading', 'time-concepts', 'daily-routines'],
  
  difficulty: 'adaptive',
  difficultyRange: [1, 4],
  
  // Story context
  story: {
    title: 'Dragon\'s Time Tower',
    character: 'dragon',
    introduction: 'Welcome to my time tower! Let\'s learn about time together!',
    setting: 'A magical clock tower with colorful clocks and time-telling tools'
  },

  // Session structure
  sessionStructure: {
    introduction: {
      narration: 'Roar! Hello, I\'m a time-keeping dragon! In my tower, we have big clocks, little clocks, and magical hourglasses. Let\'s learn to tell time together!',
      character: 'dragon',
      emotionalTone: 'adventurous',
      actions: ['play-clock-ticking', 'show-clocks']
    },
    mainSection: {
      type: 'adaptive-questioning',
      minQuestions: 5,
      maxQuestions: 12,
      targetAccuracy: 0.60
    },
    closure: {
      type: 'celebration',
      narration: 'Roar! You\'ve learned so much about time! You\'re a time master now!',
      actions: ['play-celebration-sound', 'announce-rewards']
    }
  },

  // Question bank with difficulty levels
  questionBank: [
    // ==================== DIFFICULTY 1: BASIC CLOCK CONCEPTS ====================
    {
      id: 'q1_1',
      difficulty: 1,
      prompt: 'What does a clock help us do?',
      narration: 'A clock is round and has hands that move. What does it help us do?',
      expectedAnswers: ['tell time', 'tell the time', 'know what time it is', 'time'],
      fuzzyMatch: true,
      hint: 'It helps us know when to eat, sleep, or play.',
      feedback: {
        correct: 'Perfect! A clock helps us tell time!',
        incorrect: 'Not quite. A clock helps us tell the time. Try again!'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q1_2',
      difficulty: 1,
      prompt: 'How many hands does a clock have?',
      narration: 'Look at a clock. How many hands does it have moving around?',
      expectedAnswers: ['two', '2', 'two hands'],
      fuzzyMatch: true,
      hint: 'Count the sticks that move on the clock.',
      feedback: {
        correct: 'Great! A clock has two hands!',
        incorrect: 'Not quite. A clock has two hands. Try again!'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q1_3',
      difficulty: 1,
      prompt: 'How many numbers are on a clock?',
      narration: 'Count the numbers around the circle of a clock. How many are there?',
      expectedAnswers: ['twelve', '12', 'twelve numbers'],
      fuzzyMatch: true,
      hint: 'Start at the top and count all the numbers around.',
      feedback: {
        correct: 'Excellent! A clock has twelve numbers!',
        incorrect: 'Not quite. A clock has twelve numbers. Try again!'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q1_4',
      difficulty: 1,
      prompt: 'What does the short hand show on a clock?',
      narration: 'A clock has a short hand and a long hand. What does the short hand show?',
      expectedAnswers: ['hour', 'hours', 'the hour'],
      fuzzyMatch: true,
      hint: 'It points to the hour number.',
      feedback: {
        correct: 'Perfect! The short hand shows the hour!',
        incorrect: 'Not quite. The short hand shows the hour. Try again!'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q1_5',
      difficulty: 1,
      prompt: 'What does the long hand show on a clock?',
      narration: 'What does the long hand of a clock show us?',
      expectedAnswers: ['minutes', 'minute', 'the minutes'],
      fuzzyMatch: true,
      hint: 'It shows how many minutes have passed.',
      feedback: {
        correct: 'Great! The long hand shows the minutes!',
        incorrect: 'Not quite. The long hand shows the minutes. Try again!'
      },
      character: 'dragon',
      timeLimit: 12000
    },

    // ==================== DIFFICULTY 2: TELLING TIME O'CLOCK ====================
    {
      id: 'q2_1',
      difficulty: 2,
      prompt: 'What time is it when both hands point straight up?',
      narration: 'The short hand points to 12 and the long hand points to 12. What time is it?',
      expectedAnswers: ['12 o\'clock', 'twelve o\'clock', '12:00', '12', 'noon', 'midnight'],
      fuzzyMatch: true,
      hint: 'The hands are at the top of the clock.',
      feedback: {
        correct: 'Perfect! It\'s 12 o\'clock!',
        incorrect: 'Not quite. When both hands point up, it\'s 12 o\'clock. Try again!'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q2_2',
      difficulty: 2,
      prompt: 'What time is it when the short hand points to 3 and the long hand points to 12?',
      narration: 'The short hand points to 3 and the long hand points to 12. What time is it?',
      expectedAnswers: ['3 o\'clock', 'three o\'clock', '3:00', '3', 'three'],
      fuzzyMatch: true,
      hint: 'The short hand tells us it\'s three o\'clock.',
      feedback: {
        correct: 'Excellent! It\'s 3 o\'clock!',
        incorrect: 'Not quite. It\'s 3 o\'clock. Try again!'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q2_3',
      difficulty: 2,
      prompt: 'What time is it when the short hand points to 6 and the long hand points to 12?',
      narration: 'The short hand points to 6 and the long hand points to 12. What time is it?',
      expectedAnswers: ['6 o\'clock', 'six o\'clock', '6:00', '6', 'six'],
      fuzzyMatch: true,
      hint: 'The short hand tells us it\'s six o\'clock.',
      feedback: {
        correct: 'Great! It\'s 6 o\'clock!',
        incorrect: 'Not quite. It\'s 6 o\'clock. Try again!'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q2_4',
      difficulty: 2,
      prompt: 'What time is it when the short hand points to 9 and the long hand points to 12?',
      narration: 'The short hand points to 9 and the long hand points to 12. What time is it?',
      expectedAnswers: ['9 o\'clock', 'nine o\'clock', '9:00', '9', 'nine'],
      fuzzyMatch: true,
      hint: 'The short hand tells us it\'s nine o\'clock.',
      feedback: {
        correct: 'Perfect! It\'s 9 o\'clock!',
        incorrect: 'Not quite. It\'s 9 o\'clock. Try again!'
      },
      character: 'dragon',
      timeLimit: 12000
    },

    // ==================== DIFFICULTY 3: TIME CONCEPTS ====================
    {
      id: 'q3_1',
      difficulty: 3,
      prompt: 'How many minutes are in one hour?',
      narration: 'An hour is a long time. How many minutes make one hour?',
      expectedAnswers: ['60', 'sixty', 'sixty minutes'],
      fuzzyMatch: true,
      hint: 'The long hand moves all the way around the clock.',
      feedback: {
        correct: 'Excellent! There are 60 minutes in one hour!',
        incorrect: 'Not quite. There are 60 minutes in one hour. Try again!'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q3_2',
      difficulty: 3,
      prompt: 'What meal do you usually eat at 12 o\'clock in the middle of the day?',
      narration: 'When the clock shows 12 in the middle of the day, what meal do you eat?',
      expectedAnswers: ['lunch', 'LUNCH', 'Lunch'],
      fuzzyMatch: true,
      hint: 'It\'s after breakfast and before dinner.',
      feedback: {
        correct: 'Great! You eat lunch at 12 o\'clock!',
        incorrect: 'Not quite. You usually eat lunch at 12 o\'clock. Try again!'
      },
      character: 'dragon',
      timeLimit: 12000
    },
    {
      id: 'q3_3',
      difficulty: 3,
      prompt: 'When do you usually go to sleep?',
      narration: 'What time of day do you usually go to sleep?',
      expectedAnswers: ['night', 'bedtime', '8', '9', '10', 'evening'],
      fuzzyMatch: true,
      hint: 'It\'s when it\'s dark outside.',
      feedback: {
        correct: 'Perfect! You sleep at night!',
        incorrect: 'Not quite. You usually sleep at night. Try again!'
      },
      character: 'dragon',
      timeLimit: 12000
    },

    // ==================== DIFFICULTY 4: ADVANCED TIME ====================
    {
      id: 'q4_1',
      difficulty: 4,
      prompt: 'What time is it when the short hand points between 2 and 3, and the long hand points to 6?',
      narration: 'The long hand points to 6, which means 30 minutes. The short hand is between 2 and 3. What time is it?',
      expectedAnswers: ['2:30', 'two thirty', 'half past two'],
      fuzzyMatch: true,
      hint: 'When the long hand points to 6, it\'s half past the hour.',
      feedback: {
        correct: 'Excellent! It\'s 2:30!',
        incorrect: 'Not quite. It\'s 2:30 or half past two. Try again!'
      },
      character: 'dragon',
      timeLimit: 15000
    },
    {
      id: 'q4_2',
      difficulty: 4,
      prompt: 'How many hours are in a day?',
      narration: 'From morning when you wake up to night when you sleep, how many hours is a whole day?',
      expectedAnswers: ['24', 'twenty four', 'twenty-four', 'twenty four hours'],
      fuzzyMatch: true,
      hint: 'The clock goes around twice.',
      feedback: {
        correct: 'Wonderful! There are 24 hours in a day!',
        incorrect: 'Not quite. There are 24 hours in a day. Try again!'
      },
      character: 'dragon',
      timeLimit: 15000
    }
  ]
};

export default timeTelling;
