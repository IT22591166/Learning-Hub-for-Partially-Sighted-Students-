/**
 * Activity Index
 * Central export point for all learning activities
 */

export { countingAdventure } from './counting-adventure.js';
export { numberRecognition } from './number-recognition.js';
export { basicMath } from './basic-math.js';
export { alphabetLearning } from './alphabet-learning.js';
export { colorsAndShapes } from './colors-and-shapes.js';
export { phonicsAndSounds } from './phonics-and-sounds.js';
export { timeTelling } from './time-telling.js';

/**
 * Activity Registry
 * Maps activity IDs to their configurations
 */
export const activityRegistry = {
  'counting-adventure': () => import('./counting-adventure.js').then(m => m.countingAdventure),
  'number-recognition': () => import('./number-recognition.js').then(m => m.numberRecognition),
  'basic-math': () => import('./basic-math.js').then(m => m.basicMath),
  'alphabet-learning': () => import('./alphabet-learning.js').then(m => m.alphabetLearning),
  'colors-and-shapes': () => import('./colors-and-shapes.js').then(m => m.colorsAndShapes),
  'phonics-and-sounds': () => import('./phonics-and-sounds.js').then(m => m.phonicsAndSounds),
  'time-telling': () => import('./time-telling.js').then(m => m.timeTelling)
};

/**
 * Get all available activities
 */
export const getAllActivities = () => {
  return Object.keys(activityRegistry).map(id => ({
    id,
    name: getActivityName(id)
  }));
};

/**
 * Get activity by ID
 */
export const getActivityById = async (activityId) => {
  const loader = activityRegistry[activityId];
  if (!loader) {
    throw new Error(`Activity not found: ${activityId}`);
  }
  return await loader();
};

/**
 * Get activity name by ID
 */
export const getActivityName = (activityId) => {
  const names = {
    'counting-adventure': 'Story Counting Adventure',
    'number-recognition': 'Number Recognition Quest',
    'basic-math': 'Math Mystery Solver',
    'alphabet-learning': 'Alphabet Adventure',
    'colors-and-shapes': 'Colors & Shapes Explorer',
    'phonics-and-sounds': 'Phonics & Letter Sounds',
    'time-telling': 'Time Telling Adventure'
  };
  return names[activityId] || 'Unknown Activity';
};

/**
 * Get activity description by ID
 */
export const getActivityDescription = (activityId) => {
  const descriptions = {
    'counting-adventure': 'Help Sophie count apples on her adventure through the orchard!',
    'number-recognition': 'Learn to recognize numbers 1-10 with Max the Robot!',
    'basic-math': 'Solve fun math puzzles with Professor Wise Owl!',
    'alphabet-learning': 'Learn letters A-Z with friendly characters!'
  };
  return descriptions[activityId] || 'No description available';
};

/**
 * Get activity by target age
 */
export const getActivitiesByAge = (ageMin, ageMax) => {
  return Object.keys(activityRegistry).filter(id => {
    const names = {
      'counting-adventure': { min: 4, max: 8 },
      'number-recognition': { min: 5, max: 7 },
      'basic-math': { min: 6, max: 8 },
      'alphabet-learning': { min: 4, max: 6 }
    };
    const range = names[id];
    return range && range.min <= ageMax && range.max >= ageMin;
  });
};

/**
 * Activity metadata for quick reference
 */
export const activityMetadata = {
  'counting-adventure': {
    id: 'counting-adventure',
    name: 'Story Counting Adventure',
    description: 'Help Sophie count apples on her adventure through the orchard!',
    icon: '🔢',
    targetAge: [4, 8],
    duration: 600000,
    skillsFocused: ['counting', 'number-recognition', 'number-naming'],
    difficulty: 'adaptive',
    character: 'sophie'
  },
  'number-recognition': {
    id: 'number-recognition',
    name: 'Number Recognition Quest',
    description: 'Learn to recognize numbers 1-10 with Max the Robot!',
    icon: '🎯',
    targetAge: [5, 7],
    duration: 600000,
    skillsFocused: ['number-recognition', 'number-naming', 'visual-counting'],
    difficulty: 'adaptive',
    character: 'max'
  },
  'basic-math': {
    id: 'basic-math',
    name: 'Math Mystery Solver',
    description: 'Solve fun math puzzles with Professor Wise Owl!',
    icon: '➕',
    targetAge: [6, 8],
    duration: 600000,
    skillsFocused: ['addition', 'subtraction', 'mental-math', 'number-sense'],
    difficulty: 'adaptive',
    character: 'owl'
  },
  'alphabet-learning': {
    id: 'alphabet-learning',
    name: 'Alphabet Adventure',
    description: 'Learn letters A-Z with friendly characters!',
    icon: '🔤',
    targetAge: [4, 6],
    duration: 900000,
    skillsFocused: ['letter-recognition', 'letter-sounds', 'phonics', 'letter-naming'],
    difficulty: 'adaptive',
    character: 'dragon'
  }
};
