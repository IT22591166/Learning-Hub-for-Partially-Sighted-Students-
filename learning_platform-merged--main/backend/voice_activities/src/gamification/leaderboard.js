/* Leaderboard Module
   - Local leaderboard and optional backend syncing
*/

export default class Leaderboard {
  constructor(options = {}) {
    this.options = Object.assign({ backendUrl: null }, options);
  }

  getLocalLeaderboard(playersObj, top = 10) {
    // playersObj: { id: playerObj }
    const arr = Object.keys(playersObj).map(id => ({ id, xp: playersObj[id].xp || 0 }));
    arr.sort((a, b) => b.xp - a.xp);
    return arr.slice(0, top);
  }

  async fetchRemoteLeaderboard(top = 10) {
    if (!this.options.backendUrl) throw new Error('No backend configured');
    const url = `${this.options.backendUrl}/leaderboard?top=${top}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Failed to fetch remote leaderboard');
    return resp.json();
  }

  async pushScore(studentId, xp) {
    if (!this.options.backendUrl) return null;
    const url = `${this.options.backendUrl}/submit-score`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, xp })
    });
    if (!resp.ok) throw new Error('Failed to push score');
    return resp.json();
  }
}
