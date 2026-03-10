/* Gamification Demo & Quick Start
   Run this to see how the gamification engine works
*/

import GamificationEngine from './gamification-engine.js';

// 1. Create instance
const gamification = new GamificationEngine({
  backendUrl: 'http://localhost:5001/api/gamification', // optional
  syncEnabled: false, // set to true if backend is running
  autoSave: true // persist to localStorage
});

// 2. Example: Create a new student
const studentId = 'student_alice';
const player = gamification.ensurePlayer(studentId);
console.log('New player:', player);

// 3. Award XP for activity
console.log('\n--- Rewarding XP for activity ---');
const result = gamification.rewardForActivity(studentId, {
  correct: true,
  timeTaken: 3.5,
  difficulty: 0.7
});
console.log('Result:', result);
console.log('Player after:', gamification.getPlayer(studentId));

// 4. Manually award more XP and check badges
console.log('\n--- Awarding more XP ---');
for (let i = 0; i < 15; i++) {
  gamification.awardXP(studentId, 5, 'practice');
}
const updated = gamification.getPlayer(studentId);
console.log('Player after many XP:', updated);
console.log('Badges earned:', gamification.getPlayerBadges(studentId));

// 5. Get leaderboard
console.log('\n--- Leaderboard ---');
const student2 = 'student_bob';
gamification.ensurePlayer(student2);
gamification.awardXP(student2, 100, 'challenge');

const lb = gamification.getLeaderboard(5);
console.log('Top 5:', lb);

// 6. Record activity attempt
console.log('\n--- Recording attempts ---');
const p = gamification.getPlayer(studentId);
gamification.progress.recordAttempt(p, true, 4.2); // correct, took 4.2s
gamification.progress.recordAttempt(p, true, 3.8);
gamification.progress.recordAttempt(p, false, 5.1); // incorrect
console.log('Stats:', {
  attempts: p.attempts,
  correct: p.correct_count,
  accuracy: (p.correct_count / p.attempts * 100).toFixed(1) + '%',
  recentAccuracy: (p.meta.recentAccuracy * 100).toFixed(1) + '%'
});

// 7. Check localStorage
console.log('\n--- Saved to localStorage ---');
const saved = localStorage.getItem('vlm_gamification_state_v1');
console.log('State size:', saved ? saved.length + ' bytes' : 'empty');

console.log('\n✅ Gamification demo complete!');
