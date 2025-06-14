import { Constants } from './Constants.js';
import { ScreenShake } from './ScreenShake.js';
import { Square } from '../entities/Player.js';
import { Bullet } from '../entities/Bullet.js';
import { ChargingEffect } from '../effects/ChargingEffect.js';
import { LaserBeam } from '../effects/LaserBeam.js';
import { DeathParticle } from '../effects/DeathParticle.js';
import { Levels } from './Levels.js';

export class Game {
  constructor() {
    this.players = [];
    this.particles = [];
    this.p1Bullets = [];
    this.p0Bullets = [];
    this.chargingEffects = [];
    this.laserBeams = [];
    this.screenShake = new ScreenShake();
    this.gameState = "countdown"; // Start with countdown
    this.deathParticles = [];
    this.gameOverWinner = "";
    this.gameOverDelay = 0;
    this.levels = new Levels();
    this.countdownTimer = 0;
    this.countdownValue = 3;
    this.countdownDuration = 400; // 0.4 seconds per countdown number
    this.startAnimationTimer = 0;
    this.startAnimationDuration = 0; // Duration for "START!" display
  }

  setup() {
    const resizeCanvasToWindow = () => {
      const canvasWidth = min(windowWidth * 0.9, 1200);
      const canvasHeight = min(windowHeight * 0.9, 900);
      resizeCanvas(canvasWidth, canvasHeight);
    };

    const canvasWidth = min(windowWidth * 0.9, 1200);
    const canvasHeight = min(windowHeight * 0.9, 900);
    createCanvas(canvasWidth, canvasHeight);

    window.addEventListener('resize', resizeCanvasToWindow);
    this.players[1] = new Square((width / 2) + random(-300, 300), height - 50, color(random(180, 255), 150 + random(-105, 105), 150 + random(-105, 105)), 0, 1);
    this.players[0] = new Square((width / 2) + random(-300, 300), 50, color(150 + random(-105, 105), random(180, 255), 150 + random(-105, 105)), 1, 0);
    console.log("Game setup: players initialized", this.players);
    this.countdownTimer = millis(); // Start countdown timer
  }

  draw() {
    background(0);

    if (this.gameState === "countdown") {
      let elapsed = millis() - this.countdownTimer;
      let currentCount = Math.floor(3 - elapsed / this.countdownDuration);
      let fadeProgress = (elapsed % this.countdownDuration) / this.countdownDuration;

      if (currentCount < 0) {
        if (this.startAnimationTimer === 0) {
          this.startAnimationTimer = millis();
        }
        let startElapsed = millis() - this.startAnimationTimer;
        if (startElapsed < this.startAnimationDuration) {
          // Display "START!"
          fill(255, 255, 255, map(startElapsed, 0, this.startAnimationDuration, 255, 0));
          textAlign(CENTER, CENTER);
          textSize(64);
          textStyle(BOLD);
          text("START!", width / 2, height / 2);
        } else {
          // Transition to playing state
          this.gameState = "playing";
          this.countdownTimer = 0;
          this.startAnimationTimer = 0;
        }
      } else {
        // Display countdown number
        fill(255, 255, 255, map(fadeProgress, 0, 1, 255, 50));
        textAlign(CENTER, CENTER);
        textSize(96);
        textStyle(BOLD);
        text(currentCount + 1, width / 2, height / 2);
      }
      return; // Don't draw game elements during countdown
    }

    if (this.gameState === "playing" || this.gameState === "gameOverPending") {
      if (this.screenShake.timer < this.screenShake.duration) {
        push();
        translate(random(-this.screenShake.intensity, this.screenShake.intensity), 
                 random(-this.screenShake.intensity, this.screenShake.intensity));
        this.screenShake.timer += 16;
      }

      if (!this.players[0].isDead) {
        this.players[0].aiMove(this.players, this.p1Bullets, this.p0Bullets, this.chargingEffects, this.levels.getReactionTimeScale());
        this.players[0].update(this);
        this.players[0].display();
      }

      if (!this.players[1].isDead) {
        this.players[1].update(this);
        this.players[1].display();
      }

      if (
        keyIsDown(79) &&
        !this.players[1].isCharging &&
        (millis() - this.players[1].lastAttackTime) > Constants.attackCooldown
      ) {
        console.log('Light Attack 1');
        this.players[1].lightAttack(this.players, this.p0Bullets, this.p1Bullets);
        this.players[1].lightAttack(this.players, this.p1Bullets, this.p0Bullets);
        this.players[1].isLightAttacking = true;
        this.players[1].lastAttackTime = millis();
      }

      if (
        keyIsDown(88) &&
        !this.players[0].isCharging &&
        (millis() - this.players[0].lastAttackTime) > Constants.attackCooldown
      ) {
        console.log('Light Attack 3');
        this.players[0].lightAttack(this.players, this.p1Bullets, this.p0Bullets);
        this.players[0].isLightAttacking = true;
        this.players[0].lastAttackTime = millis();
      }

      for (let i = this.chargingEffects.length - 1; i >= 0; i--) {
        this.chargingEffects[i].update();
        this.chargingEffects[i].display();
        if (this.chargingEffects[i].shouldRemove) {
          this.chargingEffects.splice(i, 1);
        }
      }

      for (let i = this.laserBeams.length - 1; i >= 0; i--) {
        this.laserBeams[i].update();
        this.laserBeams[i].display();
        if (this.laserBeams[i].shouldRemove) {
          this.laserBeams.splice(i, 1);
        }
      }

      for (let i = this.p1Bullets.length - 1; i >= 0; i--) {
        this.p1Bullets[i].update(this.players, this.p0Bullets, this.p1Bullets);
        this.p1Bullets[i].display();
        if (this.p1Bullets[i].remove) {
          this.p1Bullets.splice(i, 1);
        }
        if (this.p1Bullets[i] && this.p1Bullets[i].name == "child" && millis() - this.p1Bullets[i].creationTime > random(100, 300)) {
          this.p1Bullets.splice(i, 1);
        }
      }

      for (let i = this.p0Bullets.length - 1; i >= 0; i--) {                                                                                                                                                                                   
        this.p0Bullets[i].update(this.players, this.p0Bullets, this.p1Bullets);
        this.p0Bullets[i].display();
        if (this.p0Bullets[i].remove) {
          this.p0Bullets.splice(i, 1);
        }
        if (this.p0Bullets[i] && this.p0Bullets[i].name == "child" && millis() - this.p0Bullets[i].creationTime > 140) {
          this.p0Bullets.splice(i, 1);
        }
      }

      if (this.screenShake.timer < this.screenShake.duration) {
        pop();
      }
    }
    
    for (let i = this.deathParticles.length - 1; i >= 0; i--) {
      let particle = this.deathParticles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.rotation += particle.rotationSpeed;
      particle.life -= particle.decay;
      
      if (particle.y > height - particle.size/2) {
        particle.y = height - particle.size/2;
        particle.vy *= -0.6;
      }
      
      if (particle.x < particle.size/2 || particle.x > width - particle.size/2) {
        particle.vx *= -0.6;
        particle.x = constrain(particle.x, particle.size/2, width - particle.size/2);
      }
      
      push();
      translate(particle.x, particle.y);
      rotate(particle.rotation);
      
      let alpha = map(particle.life, 0, 255, 0, 255);
      stroke(red(particle.color), green(particle.color), blue(particle.color), alpha);
      strokeWeight(2);
      noFill();
      
      rectMode(CENTER);
      rect(0, 0, particle.size, particle.size, 2);
      
      pop();
      
      if (particle.life <= 0) {
        this.deathParticles.splice(i, 1);
      }
    }
    
    if (this.gameState === "gameOverPending" && millis() - this.gameOverDelay >= Constants.gameOverDelayDuration) {
      if (this.gameOverWinner === "You") {
        this.levels.incrementLevel();
        this.resetGameState();
        this.gameState = "countdown"; // Restart countdown for next level
        this.countdownTimer = millis();
      } else {
        this.gameState = "gameOver";
      }
    }
    
    if (this.gameState === "gameOver") {
      fill(0, 0, 0, 180);
      rect(0, 0, width, height);
      
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(48);
      text("GAME OVER", width/2, height/2 - 40);
      
      let winnerColor = this.players[this.gameOverWinner === "You" ? 1 : 0]?.col || color(255);
      fill(winnerColor);
      textSize(24);
      let winText = this.gameOverWinner === "AI" ? "Wins!" : "Win!";
      text(this.gameOverWinner + " " + winText, width/2, height/2);
      
      fill(255);
      textSize(16);
      text("Press SPACE to restart", width/2, height/2 + 40);
    }

    fill(255);
    textAlign(RIGHT, BOTTOM);
    textSize(16);
    text(`Level: ${this.levels.getCurrentLevel()}`, width - 10, height - 10);
  }

  keyPressed() {
    if (this.gameState === "countdown") {
      return; // Disable input during countdown
    }

    if (keyCode === UP_ARROW) {
      this.players[0].setDirection(this.players[0].direction.x, -1);
    } else if (keyCode === DOWN_ARROW) {
      this.players[0].setDirection(this.players[0].direction.x, 1);
    } else if (keyCode === LEFT_ARROW) {
      this.players[0].setDirection(-1, this.players[0].direction.y);
    } else if (keyCode === RIGHT_ARROW) {
      this.players[0].setDirection(1, this.players[0].direction.y);
    } else if (key === 'p') {
      if (!this.players[0].isChargingLethal && !this.players[0].isCharging) {
        this.players[0].startLethalCharge(this.players, this.chargingEffects);
      }
    } else if (key === 'x' || keyCode === 88) {
      if (!this.players[0].isCharging && !this.players[0].isChargingLethal && millis() - this.players[0].lastAttackTime > Constants.attackCooldown) {
        console.log('Light Attack 0');
        this.players[0].lightAttack(this.players, this.p1Bullets, this.p0Bullets);
        this.players[0].lastAttackTime = millis();
      }
    }

    if (key === 'w' || keyCode === 87) {
      this.players[1].setDirection(this.players[1].direction.x, -1);
    } else if (key === 's' || keyCode === 83) {
      this.players[1].setDirection(this.players[1].direction.x, 1);
    } else if (key === 'a' || keyCode === 65) {
      this.players[1].setDirection(-1, this.players[1].direction.y);
    } else if (key === 'd' || keyCode === 68) {
      this.players[1].setDirection(1, this.players[1].direction.y);
    } else if (key === 'c') {
      if (!this.players[1].isChargingLethal && !this.players[1].isCharging) {
        this.players[1].startLethalCharge(this.players, this.chargingEffects);
      }
    } else if (key === 'o' || keyCode === 79) {
      if (!this.players[1].isCharging && !this.players[1].isChargingLethal && millis() - this.players[1].lastAttackTime > Constants.attackCooldown) {
        console.log('first light attack');
        this.players[1].lightAttack(this.players, this.p1Bullets, this.p0Bullets);
        this.players[1].lastAttackTime = millis();
      }
    }

    if (this.gameState === "gameOver" && (key === ' ' || keyCode === 32)) {
      this.restartGame();
    }
  }

  keyReleased() {
    if (this.gameState === "countdown") {
      return; // Disable input during countdown
    }

    if ((keyCode === UP_ARROW && this.players[0].direction.y === -1) ||
        (keyCode === DOWN_ARROW && this.players[0].direction.y === 1) ||
        (keyCode === LEFT_ARROW && this.players[0].direction.x === -1) ||
        (keyCode === RIGHT_ARROW && this.players[0].direction.x === 1)) {
      let newPlayerDirection = createVector(0, 0);

      if (keyIsDown(UP_ARROW)) {
        newPlayerDirection.add(0, -1);
      } else if (keyIsDown(DOWN_ARROW)) {
        newPlayerDirection.add(0, 1);
      }

      if (keyIsDown(LEFT_ARROW)) {
        newPlayerDirection.add(-1, 0);
      } else if (keyIsDown(RIGHT_ARROW)) {
        newPlayerDirection.add(1, 0);
      }

      this.players[0].direction.x = lerp(this.players[0].direction.x, newPlayerDirection.x, 1);
      this.players[0].direction.y = lerp(this.players[0].direction.y, newPlayerDirection.y, 1);
    } else if (key === 'p') {
      this.players[0].releaseCharge();
    }

    if ((key === 'w' && this.players[1].direction.y === -1) ||
        (key === 's' && this.players[1].direction.y === 1) ||
        (key === 'a' && this.players[1].direction.x === -1) ||
        (key === 'd' && this.players[1].direction.x === 1) ||
        (keyCode === 87 && this.players[1].direction.y === -1) ||
        (keyCode === 83 && this.players[1].direction.y === 1) ||
        (keyCode === 65 && this.players[1].direction.x === -1) ||
        (keyCode === 68 && this.players[1].direction.x === 1)) {
      let newEnemyDirection = createVector(0, 0);

      if (keyIsDown(87)) {
        newEnemyDirection.add(0, -1);
      } else if (keyIsDown(83)) {
        newEnemyDirection.add(0, 1);
      }

      if (keyIsDown(65)) {
        newEnemyDirection.add(-1, 0);
      } else if (keyIsDown(68)) {
        newEnemyDirection.add(1, 0);
      }

      this.players[1].direction.x = lerp(this.players[1].direction.x, newEnemyDirection.x, 1);
      this.players[1].direction.y = lerp(this.players[1].direction.y, newEnemyDirection.y, 1);
    } else if (key === 'c') {
      this.players[1].releaseCharge();
    }
  }

  resetGameState() {
    this.deathParticles = [];
    this.p1Bullets = [];
    this.p0Bullets = [];
    this.chargingEffects = [];
    this.laserBeams = [];
    this.screenShake = new ScreenShake();
    this.gameOverWinner = "";
    this.gameOverDelay = 0;
    this.gameState = "countdown"; // Start countdown after reset
    this.countdownTimer = millis();
    this.startAnimationTimer = 0;
    
    // Respawn players with new positions
    this.players[1] = new Square((width / 2) + random(-300, 300), height - 50, color(random(180, 255), 150 + random(-105, 105), 150 + random(-105, 105)), 0, 1);
    this.players[0] = new Square((width / 2) + random(-300, 300), 50, color(150 + random(-105, 105), random(180, 255), 150 + random(-105, 105)), 1, 0);
  }

  restartGame() {
    this.gameState = "countdown"; // Start countdown for restart
    this.levels.reset();
    this.deathParticles = [];
    this.p1Bullets = [];
    this.p0Bullets = [];
    this.chargingEffects = [];
    this.laserBeams = [];
    this.screenShake = new ScreenShake();
    this.gameOverWinner = "";
    this.countdownTimer = millis();
    this.startAnimationTimer = 0;
    
    this.players[1] = new Square((width / 2) + random(-300, 300), height - 50, color(random(180, 255), 150 + random(-105, 105), 150 + random(-105, 105)), 0, 1);
    this.players[0] = new Square((width / 2) + random(-300, 300), 50, color(150 + random(-105, 105), random(180, 255), 150 + random(-105, 105)), 1, 0);
  }
}