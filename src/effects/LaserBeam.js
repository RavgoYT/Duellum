import { Bullet } from '../entities/Bullet.js';
import { Constants } from '../game/Constants.js';

export class LaserBeam {
  constructor(x, y, direction, col, entityType, players, deathParticles, p0Bullets, p1Bullets, screenShake, game) {
    this.startX = x;
    this.startY = y;
    this.direction = direction;
    this.col = col;
    this.entityType = entityType;
    this.players = players;
    this.deathParticles = deathParticles;
    this.p0Bullets = p0Bullets;
    this.p1Bullets = p1Bullets;
    this.screenShake = screenShake;
    this.game = game;
    this.shouldRemove = false;
    this.startTime = millis();
    this.duration = 500;
    this.width = 8;
    this.maxWidth = 15;
    this.hitSomething = false;
    this.lastParticleSpawn = 0;
    this.particleSpawnRate = 8;
    
    this.endX = x + cos(direction) * 2000;
    this.endY = y + sin(direction) * 2000;
    
    this.calculateCollision();
  }
  
  calculateCollision() {
    let steps = 100;
    for (let i = 0; i <= steps; i++) {
      let t = i / steps;
      let checkX = lerp(this.startX, this.endX, t);
      let checkY = lerp(this.startY, this.endY, t);
      
      if (checkX < 0 || checkX > width || checkY < 0 || checkY > height) {
        this.endX = checkX;
        this.endY = checkY;
        break;
      }
    }
  }
  
  checkPlayerCollision() {
    let targetPlayer = this.players[this.entityType];
    if (!targetPlayer || targetPlayer.isDead) return;
    
    let dist = this.distanceFromPointToLine(
      targetPlayer.x, targetPlayer.y,
      this.startX, this.startY,
      this.endX, this.endY
    );
    
    if (dist < targetPlayer.size / 2 + this.width / 2) {
      targetPlayer.isDead = true;
      targetPlayer.x = undefined;
      targetPlayer.y = undefined;
      this.hitSomething = true;
      
      this.createDeathParticles(targetPlayer);
      
      this.game.gameState = "gameOverPending";
      this.game.gameOverDelay = millis();
      this.game.gameOverWinner = this.entityType === 0 ? "You" : "AI";
      
      this.screenShake.intensity = 25;
      this.screenShake.duration = 800;
      this.screenShake.timer = 0;
    }
  }
  
  distanceFromPointToLine(px, py, x1, y1, x2, y2) {
    let A = px - x1;
    let B = py - y1;
    let C = x2 - x1;
    let D = y2 - y1;
    
    let dot = A * C + B * D;
    let lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    let dx = px - xx;
    let dy = py - yy;
    return sqrt(dx * dx + dy * dy);
  }

  createDeathParticles(player) {
    let numParticles = random(40, 50);
    
    for (let i = 0; i < numParticles; i++) {
      let particle = {
        x: player.x + random(-player.size/2, player.size/2),
        y: player.y + random(-player.size/2, player.size/2),
        vx: random(-18, 18),
        vy: random(-18, 18),
        size: random(3, 8),
        color: player.col,
        life: 255,
        decay: random(2, 4),
        rotation: random(0, TWO_PI),
        rotationSpeed: random(-0.3, 0.3),
        gravity: 0
      };
      this.deathParticles.push(particle);
    }
  }

  spawnContinuousParticles() {
    let currentTime = millis();
    let elapsed = currentTime - this.startTime;
    if (elapsed > this.duration * 0.6) return;
    
    if (currentTime - this.lastParticleSpawn > this.particleSpawnRate) {
      this.lastParticleSpawn = currentTime;
      
      let beamLength = dist(this.startX, this.startY, this.endX, this.endY);
      let numSpawnPoints = Math.floor(beamLength / 18);
      
      for (let point = 0; point < numSpawnPoints; point++) {
        if (random() < 0.25) {
          let t = point / numSpawnPoints;
          let spawnX = lerp(this.startX, this.endX, t);
          let spawnY = lerp(this.startY, this.endY, t);
          
          let particleCount = Math.floor(random(1, 4));
          for (let i = 0; i < particleCount; i++) {
            let side = (i % 2 === 0) ? 1 : -1;
            let baseAngle = this.direction + (PI/2 * side);
            let spreadAngle = baseAngle + random(-PI/4, PI/4) * side;
            let speed = random(3, 12);
            let lifespan = random(200, 400);
            
            let forwardMomentum = random(0.2, 0.5);
            let finalAngle = lerp(spreadAngle, this.direction, forwardMomentum);
            
            let particle = new Bullet("child", spawnX, spawnY, this.col,
              spawnX + cos(finalAngle) * speed, 
              spawnY + sin(finalAngle) * speed,
              true, false, lifespan, this.entityType);
            
            let r = red(this.col) + random(-30, 30);
            let g = green(this.col) + random(-30, 30);
            let b = blue(this.col) + random(-30, 30);
            particle.col = color(constrain(r, 0, 255), constrain(g, 0, 255), constrain(b, 0, 255));
            
            if (this.entityType === 0) {
              this.p1Bullets.push(particle);
            } else {
              this.p0Bullets.push(particle);
            }
          }
        }
      }
    }
  }
  
  update() {
    let elapsed = millis() - this.startTime;
    this.checkPlayerCollision();
    this.spawnContinuousParticles();
    if (elapsed > this.duration) {
      this.shouldRemove = true;
    }
  }
  
  display() {
    let elapsed = millis() - this.startTime;
    let progress = elapsed / this.duration;
    let alpha = map(progress, 0, 1, 255, 0);
    
    for (let i = 0; i < 3; i++) {
      stroke(red(this.col), green(this.col), blue(this.col), alpha * (1 - i * 0.3));
      strokeWeight(this.maxWidth - i * 3);
      line(this.startX, this.startY, this.endX, this.endY);
    }
    
    stroke(255, 255, 255, alpha);
    strokeWeight(2);
    line(this.startX, this.startY, this.endX, this.endY);
    
    if (this.hitSomething) {
      push();
      translate(this.endX, this.endY);
      fill(255, 255, 255, alpha);
      noStroke();
      for (let i = 0; i < 5; i++) {
        let size = random(5, 15);
        ellipse(random(-10, 10), random(-10, 10), size);
      }
      pop();
    }
  }
}