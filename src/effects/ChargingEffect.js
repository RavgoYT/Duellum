export class ChargingEffect {
  constructor(x, y, col, playerIndex, players) {
    this.x = x;
    this.y = y;
    this.col = col;
    this.playerIndex = playerIndex;
    this.players = players;
    this.rings = [];
    this.particles = [];
    this.shouldRemove = false;
    this.startTime = millis();
    
    for (let i = 0; i < 3; i++) {
      this.rings.push({
        radius: 20 + i * 15,
        speed: 2 + i * 0.5,
        angle: 0
      });
    }
    
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        angle: random(TWO_PI),
        distance: random(40, 80),
        speed: random(0.02, 0.05),
        size: random(2, 6)
      });
    }
  }
  
  update() {
    let elapsed = millis() - this.startTime;
    let progress = elapsed / (this.players[this.playerIndex]?.lethalChargeTime || 600);
    
    for (let ring of this.rings) {
      ring.angle += ring.speed * 0.02;
    }
    
    for (let particle of this.particles) {
      particle.angle += particle.speed;
      particle.distance = lerp(particle.distance, 20, 0.02);
    }
  }
  
  display() {
    let elapsed = millis() - this.startTime;
    let progress = elapsed / (this.players[this.playerIndex]?.lethalChargeTime || 600);
    
    push();
    translate(this.x, this.y);
    
    for (let i = 0; i < this.rings.length; i++) {
      let ring = this.rings[i];
      let alpha = map(sin(ring.angle), -1, 1, 50, 150);
      stroke(red(this.col), green(this.col), blue(this.col), alpha);
      strokeWeight(3);
      noFill();
      let currentRadius = ring.radius * (0.5 + progress * 0.5);
      ellipse(0, 0, currentRadius * 2);
    }
    
    for (let particle of this.particles) {
      let px = cos(particle.angle) * particle.distance;
      let py = sin(particle.angle) * particle.distance;
      fill(red(this.col), green(this.col), blue(this.col), 180);
      noStroke();
      ellipse(px, py, particle.size);
    }
    
    stroke(red(this.col), green(this.col), blue(this.col), 150);
    strokeWeight(3);
    let aimDir = this.players[this.playerIndex]?.aimDirection || 0;
    let laserEndX = cos(aimDir) * 1000;
    let laserEndY = sin(aimDir) * 1000;
    line(0, 0, laserEndX, laserEndY);
    
    let progressRadius = 25;
    stroke(255, 255, 255, 150);
    strokeWeight(2);
    noFill();
    arc(0, 0, progressRadius * 2, progressRadius * 2, 0, TWO_PI * progress);
    pop();
  }
}