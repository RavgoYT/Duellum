export class DeathParticle {
  constructor(x, y, vx, vy, size, col) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = col;
    this.life = 255;
    this.decay = random(2, 4);
    this.rotation = random(0, TWO_PI);
    this.rotationSpeed = random(-0.3, 0.3);
    this.gravity = 0; // Removed gravity
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.rotation += this.rotationSpeed;
    this.life -= this.decay;
    
    if (this.y > height - this.size/2) {
      this.y = height - this.size/2;
      this.vy *= -0.6;
    }
    
    if (this.x < this.size/2 || this.x > width - this.size/2) {
      this.vx *= -0.6;
      this.x = constrain(this.x, this.size/2, width - this.size/2);
    }
  }
  
  display() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    
    let alpha = map(this.life, 0, 255, 0, 255);
    stroke(red(this.color), green(this.color), blue(this.color), alpha);
    strokeWeight(2);
    noFill();
    
    rectMode(CENTER);
    rect(0, 0, this.size, this.size, 2);
    pop();
  }
  
  isDead() {
    return this.life <= 0;
  }
}