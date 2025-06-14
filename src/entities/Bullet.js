import { Constants } from '../game/Constants.js';

export class Bullet {
  constructor(name, x, y, col, targetX, targetY, isChild, enemyCollision, lifespan, entityType) {
    this.x = x;
    this.y = y;
    this.col = col;
    this.dodged = false;
    this.dodging = false;
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = 9;
    this.name = name || "bullet";
    this.tolerance = 20;
    this.enemyCollision = enemyCollision;
    this.isChild = isChild;
    this.lifespan = lifespan;
    this.entityType = entityType;
    this.creationTime = millis();
    this.remove = false;
    this.width = 15;
    this.height = 8;
    this.angle = 0;
  }

  update(players, p0Bullets, p1Bullets) {
    if (this.remove) {
      return;
    }
    if (this.isChild) {
      this.width = 3;
      this.height = 3;
    }
    let direction = createVector(this.targetX - this.x, this.targetY - this.y);

    if (dist(this.x, this.y, this.targetX, this.targetY) < this.tolerance) {
      this.targetX += direction.x * this.speed;
      this.targetY += direction.y * this.speed;
    }

    this.angle = direction.heading();
    this.x += cos(this.angle) * this.speed;
    this.y += sin(this.angle) * this.speed;

    if (!this.isChild) {
      if (
        this.x > players[this.entityType].x - players[this.entityType].size / 2 &&
        this.x < players[this.entityType].x + players[this.entityType].size / 2 &&
        this.y > players[this.entityType].y - players[this.entityType].size / 2 &&
        this.y < players[this.entityType].y + players[this.entityType].size / 2
      ) {
        if (this.enemyCollision == true) {
          if (!players[this.entityType].isStunned) {
            players[this.entityType].isStunned = true;
            players[this.entityType].stunStartTime = millis();
          }

          let angle = atan2(players[this.entityType].y - this.y, players[this.entityType].x - this.x);
          let recoilDistance = 25;
          let newx = cos(angle) * recoilDistance;
          let newy = sin(angle) * recoilDistance;

          this.shakeEnemy(players[this.entityType], 3, 300, newx, newy);
          let originalEnemyColor = players[this.entityType].originalCol;
          players[this.entityType].col = lerpColor(originalEnemyColor, color(255), 0.6);
          setTimeout(() => {
            players[this.entityType].col = originalEnemyColor;
          }, 150);
          this.remove = true;
        }
      }

      if (this.entityType == 1) {
        for (let enemyBullet of p1Bullets) {
          if (dist(this.x, this.y, enemyBullet.x, enemyBullet.y) < 5 && enemyBullet.name == "bullet") {
            const numParticles = Math.floor(random(1, 4));
            for (let i = 0; i < numParticles; i++) {
              let angle = random(0, TWO_PI);
              let speed = random(5, 10);
              let lifespan = 50;
              let child = new Bullet("child", this.x, this.y, this.col, this.x + cos(angle) * speed, this.y + sin(angle) * speed, true, false, lifespan, this.entityType);
              let child2 = new Bullet("child", enemyBullet.x, enemyBullet.y, enemyBullet.col, enemyBullet.x + cos(random(0, TWO_PI)) * random(5, 10), enemyBullet.y + sin(random(0, TWO_PI)) * random(5, 10), true, false, lifespan, enemyBullet.entityType);
              p0Bullets.push(child);
              p1Bullets.push(child2);
            }
            this.remove = true;
            enemyBullet.remove = true;
          }
        }
      }
      if (this.entityType == 0) {
        for (let enemyBullet of p0Bullets) {
          if (dist(this.x, this.y, enemyBullet.x, enemyBullet.y) < 5 && enemyBullet.name == "bullet") {
            const numParticles = Math.floor(random(1, 4));
            for (let i = 0; i < numParticles; i++) {
              let angle = random(0, TWO_PI);
              let speed = random(5, 10);
              let lifespan = 50;
              let child = new Bullet("child", this.x, this.y, this.col, this.x + cos(angle) * speed, this.y + sin(angle) * speed, true, false, lifespan, this.entityType);
              let child2 = new Bullet("child", enemyBullet.x, enemyBullet.y, enemyBullet.col, enemyBullet.x + cos(random(0, TWO_PI)) * random(5, 10), enemyBullet.y + sin(random(0, TWO_PI)) * random(5, 10), true, false, lifespan, enemyBullet.entityType);
              p1Bullets.push(child);
              p0Bullets.push(child2);
            }
            this.remove = true;
            enemyBullet.remove = true;
          }
        }
      }
    }

    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      if (this.isChild == false) {
        const numParticles = Math.floor(random(4, 8));
        for (let i = 0; i < numParticles; i++) {
          let angle = random(0, TWO_PI);
          let speed = random(5, 10);
          let lifespan = 50;
          let child = new Bullet("child", this.x, this.y, this.col, this.x + cos(angle) * speed, this.y + sin(angle) * speed, true, false, lifespan, this.entityType);
          if (this.entityType == 0) p1Bullets.push(child);
          if (this.entityType == 1) p0Bullets.push(child);
        }
      }
      this.remove = true;
    }
  }

  display() {
    noStroke();
    fill(this.col);
    rectMode(CENTER);
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    rect(0, 0, this.width, this.height, 5);
    pop();
  }

  shakeEnemy(player, intensity, duration, newx, newy) {
    let originalPos = { x: player.x + newx, y: player.y + newy };
    let shakeTimer = 0;
    let originalSpeed = player.speed;
    player.speed = 0;

    const shakeLoop = () => {
      if (shakeTimer < duration) {
        player.size = player.size * (1 + Math.random() * 0.1 - 0.05);
        player.x = originalPos.x + Math.random() * intensity * 2 - intensity;
        player.y = originalPos.y + Math.random() * intensity * 2 - intensity;
        requestAnimationFrame(shakeLoop);
      } else {
        player.x = originalPos.x;
        player.y = originalPos.y;
        player.size = player.originalSize;
        player.speed = originalSpeed;
      }
      shakeTimer += 6;
    };
    shakeLoop();
  }
}