export class Levels {
  constructor() {
    this.currentLevel = 1;
    this.winsToNextLevel = 1; // Wins required to level up
    this.currentWins = 0;
  }

  getReactionTimeScale() {
    // Base reaction time scale (1.0 = normal speed), decreases by 0.3 per level
    let baseScale = 5.0 - (this.currentLevel - 1) * 0.3;
    // Cap at 0.3 to avoid reactions becoming too fast, except for boss level
    if (this.currentLevel % 10 !== 0) {
      return Math.max(baseScale, 0.3);
    } else {
      return 0.2; // Faster reactions for boss level
    }
  }

  incrementLevel() {
    this.currentWins++;
    if (this.currentWins >= this.winsToNextLevel) {
      this.currentLevel++;
      this.currentWins = 0;
      console.log(`Level up to ${this.currentLevel}!`);
    }
    return this.currentLevel;
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  reset() {
    this.currentLevel = 1;
    this.currentWins = 0;
  }
}