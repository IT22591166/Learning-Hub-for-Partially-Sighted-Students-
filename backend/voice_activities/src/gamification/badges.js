/* Badges Module
   - Defines badges, conditions, and logic to award them
   - Meant to be small, extensible, accessible-friendly badges
*/

export default class Badges {
  constructor() {
    this.badgeDefs = this._createDefaultBadges();
  }

  _createDefaultBadges() {
    return {
      'starter': {
        id: 'starter',
        name: 'Getting Started',
        description: 'Completed the first activity',
        xp: 5,
        icon: '🌟'
      },
      'streak-3': {
        id: 'streak-3',
        name: '3-Day Streak',
        description: 'Played 3 days in a row',
        xp: 10,
        icon: '🔥'
      },
      'accuracy-90': {
        id: 'accuracy-90',
        name: 'Accuracy Ace',
        description: '90%+ accuracy for an activity set',
        xp: 15,
        icon: '🏆'
      },
      'speedy': {
        id: 'speedy',
        name: 'Speedy Solver',
        description: 'Answered quickly multiple times',
        xp: 8,
        icon: '⚡'
      }
    };
  }

  getBadge(id) {
    return this.badgeDefs[id] || null;
  }

  // Check conditions and award badges; returns array of awarded badge ids
  checkAndAward(player, context = {}) {
    const awarded = [];

    // Example conditions
    // 1) starter: first completed activity
    if (!player.meta) player.meta = {};
    if (!player.meta.started && context.reason === 'activity_result') {
      player.meta.started = true;
      awarded.push('starter');
    }

    // 2) accuracy-90: if player has recentAccuracy >= .9
    if (player.meta && player.meta.recentAccuracy && player.meta.recentAccuracy >= 0.9) {
      if (!player.badges.includes('accuracy-90')) awarded.push('accuracy-90');
    }

    // 3) streak-3: last 3 days played
    if (player.meta && player.meta.streakDays && player.meta.streakDays >= 3) {
      if (!player.badges.includes('streak-3')) awarded.push('streak-3');
    }

    // 4) speedy: many quick answers
    if (context.amount && context.amount >= 5 && context.reason === 'activity_result') {
      if (!player.badges.includes('speedy')) awarded.push('speedy');
    }

    // Filter duplicates and return
    const newOnes = [];
    for (const id of awarded) {
      if (!player.badges.includes(id)) {
        newOnes.push(id);
      }
    }

    return newOnes;
  }
}
