import { Constants } from './Constants.js';
import { ScreenShake } from './ScreenShake.js';
import { Square } from '../entities/Player.js';
import { Bullet } from '../entities/Bullet.js';
import { ChargingEffect } from '../effects/ChargingEffect.js';
import { LaserBeam } from '../effects/LaserBeam.js';
import { DeathParticle } from '../effects/DeathParticle.js';

export class Game {
  constructor() {
    this.players = [];
    this.particles = [];
    this.p1Bullets = [];
    this.p0Bullets = [];
    this.chargingEffects = [];
    this.laserBeams = [];
    this.screenShake = new ScreenShake();
    this.gameState = "playing";
    this.deathParticles = [];
    this.gameOverWinner = "";
    this.gameOverDelay = 0;
  }

  setup() {
    createCanvas(800, 600);
    this.players[1] = new Square((width / 2) + random(-300, 300), height - 50, color(random(180, 255), 150 + random(-105, 105), 150 + random(-105, 105)), 0, 1);
    this.players[0] = new Square((width / 2) + random(-300, 300), 50, color(150 + random(-105, 105), random(180, 255), 150 + random(-105, 105)), 1, 0);
    console.log("Game setup: players initialized", this.players);
  }

  draw() {
    background(0);

    if (this.gameState === "playing" || this.gameState === "gameOverPending") {
      // Apply screen shake BEFORE drawing anything
      if (this.screenShake.timer < this.screenShake.duration) {
        push();
        translate(random(-this.screenShake.intensity, this.screenShake.intensity), 
                 random(-this.screenShake.intensity, this.screenShake.intensity));
        this.screenShake.timer += 16;
      }

      // Only update and display players if they're not dead
      if (!this.players[0].isDead) {
        this.players[0].aiMove(this.players, this.p1Bullets, this.p0Bullets, this.chargingEffects);
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

  // AND REMOVE THIS BLOCK
  // Hold-to-fire for Player 0 ('x', keyCode 88)
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

      // Update and display charging effects
      for (let i = this.chargingEffects.length - 1; i >= 0; i--) {
        this.chargingEffects[i].update();
        this.chargingEffects[i].display();
        if (this.chargingEffects[i].shouldRemove) {
          this.chargingEffects.splice(i, 1);
        }
      }

      // Update and display laser beams
      for (let i = this.laserBeams.length - 1; i >= 0; i--) {
        this.laserBeams[i].update();
        this.laserBeams[i].display();
        if (this.laserBeams[i].shouldRemove) {
          this.laserBeams.splice(i, 1);
        }
      }

      // Update and display p1 bullets
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

      // Update and display p0 bullets
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

      // Close the screen shake transformation
      if (this.screenShake.timer < this.screenShake.duration) {
        pop();
      }
    }
    
    // Update and display death particles
    for (let i = this.deathParticles.length - 1; i >= 0; i--) {
      let particle = this.deathParticles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.rotation += particle.rotationSpeed;
      particle.life -= particle.decay;
      
      // Bounce off ground
      if (particle.y > height - particle.size/2) {
        particle.y = height - particle.size/2;
        particle.vy *= -0.6;
      }
      
      // Bounce off walls
      if (particle.x < particle.size/2 || particle.x > width - particle.size/2) {
        particle.vx *= -0.6;
        particle.x = constrain(particle.x, particle.size/2, width - particle.size/2);
      }
      
      // Display particle
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
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.deathParticles.splice(i, 1);
      }
    }
    
    // Handle game over delay
    if (this.gameState === "gameOverPending" && millis() - this.gameOverDelay >= Constants.gameOverDelayDuration) {
      this.gameState = "gameOver";
    }
    
    // Draw game over screen
    if (this.gameState === "gameOver") {
      // Semi-transparent overlay
      fill(0, 0, 0, 180);
      rect(0, 0, width, height);
      
      // Game Over text
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(48);
      text("GAME OVER", width/2, height/2 - 40);
      
      // Winner text colored as the winning player's color
      let winnerColor = this.players[this.gameOverWinner === "You" ? 1 : 0]?.col || color(255);
      fill(winnerColor);
      textSize(24);
    let winText = this.gameOverWinner === "AI" ? "Wins!" : "Win!";
    text(this.gameOverWinner + " " + winText, width/2, height/2);
      
      fill(255);
      textSize(16);
      text("Press SPACE to restart", width/2, height/2 + 40);
    }
  }

  keyPressed() {
    // Player 0 (AI-controlled, but allow manual override for testing)
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

    // Player 1
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
    // Player 0
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

    // Player 1
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

  restartGame() {
    this.gameState = "playing";
    this.deathParticles = [];
    this.p1Bullets = [];
    this.p0Bullets = [];
    this.chargingEffects = [];
    this.laserBeams = [];
    this.screenShake = new ScreenShake();
    
    // Reset players
    this.players[1] = new Square((width / 2) + random(-300, 300), height - 50, color(random(180, 255), 150 + random(-105, 105), 150 + random(-105, 105)), 0, 1);
    this.players[0] = new Square((width / 2) + random(-300, 300), 50, color(150 + random(-105, 105), random(180, 255), 150 + random(-105, 105)), 1, 0);
  }
}