/* Gamification Engine
   - Central coordinator for awarding XP, badges, levels
   - Persists to localStorage and optionally syncs to backend
*/

import Badges from './badges.js';
import ProgressTracker from './progress-tracker.js';
import Leaderboard from './leaderboard.js';

const STORAGE_KEY = 'vlm_gamification_state_v1';
const GLOVE_API = 'http://localhost:5001/api/smart-glove';

/** Fire a single motor pulse (fire-and-forget) */
function hapticPulse(command = '3') {
  fetch(`${GLOVE_API}/motor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command })
  }).catch(() => {});
}

/** Celebration pattern: 3 rapid pulses */
function hapticCelebration() {
  hapticPulse();
  setTimeout(() => hapticPulse(), 300);
  setTimeout(() => hapticPulse(), 600);
}

export default class GamificationEngine {
  constructor(options = {}) {
    this.options = Object.assign({
      backendUrl: null, // e.g. 'http://localhost:5001/api/gamification'
      syncEnabled: false,
      autoSave: true
    }, options);

    this.badges = new Badges();
    this.progress = new ProgressTracker();
    this.leaderboard = new Leaderboard({ backendUrl: this.options.backendUrl });

    this.state = this._loadState();
  }

  // Internal state structure example:
  // { players: { <studentId>: { xp, level, badges: [], lastUpdated } } }
  _loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load gamification state', e);
    }
    return { players: {} };
  }

  _saveState() {
    if (!this.options.autoSave) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save gamification state', e);
    }
  }

  ensurePlayer(studentId) {
    if (!this.state.players[studentId]) {
      this.state.players[studentId] = this.progress.createNewPlayer();
      this._saveState();
    }
    return this.state.players[studentId];
  }

  awardXP(studentId, amount, reason = '') {
    const player = this.ensurePlayer(studentId);
    player.xp += amount;
    player.lastUpdated = Date.now();

    const leveledUp = this.progress.addXpAndMaybeLevel(player, amount);

    // Haptic: celebration pattern on level-up
    if (leveledUp.leveled) hapticCelebration();

    // Check for badge grants based on reason or totals
    const newBadges = this.badges.checkAndAward(player, { reason, amount });
    newBadges.forEach(b => player.badges.push(b));

    // Haptic: celebration pattern for new badges
    if (newBadges.length > 0) {
      setTimeout(() => hapticCelebration(), leveledUp.leveled ? 1000 : 0);
    }

    this._saveState();

    if (this.options.syncEnabled && this.options.backendUrl) {
      this._syncPlayer(studentId).catch(e => console.warn('Sync failed', e));
    }

    return { player, leveledUp, newBadges };
  }

  grantBadge(studentId, badgeId) {
    const player = this.ensurePlayer(studentId);
    if (!player.badges.includes(badgeId)) {
      const badge = this.badges.getBadge(badgeId);
      if (badge) {
        player.badges.push(badgeId);
        player.lastUpdated = Date.now();
        this._saveState();
        // Haptic: celebration for badge grant
        hapticCelebration();
        return badge;
      }
    }
    return null;
  }

  getPlayer(studentId) {
    return this.ensurePlayer(studentId);
  }

  getPlayerBadges(studentId) {
    const player = this.ensurePlayer(studentId);
    return player.badges.map(id => this.badges.getBadge(id));
  }

  getLeaderboard(top = 10) {
    // Local leaderboard based on XP
    return this.leaderboard.getLocalLeaderboard(this.state.players, top);
  }

  async _syncPlayer(studentId) {
    if (!this.options.backendUrl) return;

    const player = this.getPlayer(studentId);
    const url = `${this.options.backendUrl}/player-sync`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, player })
    });

    if (!resp.ok) throw new Error(`Sync failed: ${resp.status}`);
    return resp.json();
  }

  // Utility: reward for activity outcome
  rewardForActivity(studentId, activityResult) {
    // activityResult example: { correct: true, timeTaken: 4.2, difficulty: 0.5 }
    let xp = 0;
    if (activityResult.correct) xp += 10;
    // faster responses get small bonus
    if (activityResult.timeTaken && activityResult.timeTaken < 5) xp += 2;
    // scale with difficulty
    xp += Math.round((activityResult.difficulty || 0) * 5);

    return this.awardXP(studentId, xp, 'activity_result');
  }

  resetAll() {
    this.state = { players: {} };
    this._saveState();
  }
}
