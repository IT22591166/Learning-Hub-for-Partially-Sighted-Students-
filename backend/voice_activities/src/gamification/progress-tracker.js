/* Progress Tracker
   - Manages XP -> Level progression
   - Tracks simple stats: xp, level, correct_count, attempts, streaks
*/

export default class ProgressTracker {
  constructor() {
    this.levelFormula = (xp) => Math.floor(Math.sqrt(xp / 10)); // simple leveling curve
  }

  createNewPlayer() {
    return {
      xp: 0,
      level: 0,
      badges: [],
      correct_count: 0,
      attempts: 0,
      meta: {
        streakDays: 0,
        recentAccuracy: 0
      },
      lastUpdated: Date.now()
    };
  }

  addXpAndMaybeLevel(player, xp) {
    const oldLevel = player.level;
    player.xp += xp;
    player.level = this.levelFormula(player.xp);
    if (player.level > oldLevel) return { leveled: true, from: oldLevel, to: player.level };
    return { leveled: false };
  }

  recordAttempt(player, isCorrect, responseTime = null) {
    player.attempts = (player.attempts || 0) + 1;
    if (isCorrect) player.correct_count = (player.correct_count || 0) + 1;

    // Update recent accuracy (exponential moving average)
    const accPrev = player.meta.recentAccuracy || 0.5;
    const alpha = 0.2;
    const instant = isCorrect ? 1 : 0;
    player.meta.recentAccuracy = alpha * instant + (1 - alpha) * accPrev;

    // Update streak (simple algorithm: if lastUpdated < 48h and today played add else reset)
    const last = player.lastUpdated || Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (!player.meta.lastPlayedDay) player.meta.lastPlayedDay = 0;

    const lastDay = Math.floor(last / oneDay);
    const todayDay = Math.floor(now / oneDay);
    if (todayDay > lastDay) {
      // new day
      if (todayDay - lastDay === 1) player.meta.streakDays = (player.meta.streakDays || 0) + 1;
      else player.meta.streakDays = 1;
    }

    player.lastUpdated = now;
  }
}
