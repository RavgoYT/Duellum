import { Constants } from '../game/Constants.js';
import { Bullet } from './Bullet.js';
import { ChargingEffect } from '../effects/ChargingEffect.js';
import { LaserBeam } from '../effects/LaserBeam.js';
import { DeathParticle } from '../effects/DeathParticle.js';

export class Square {
  constructor(x, y, col, entityType, me) {
    this.x = x;
    this.y = y;
    this.col = col;
    this.originalCol = col;
    this.entityType = entityType;
    this.me = me;
    this.isLightAttacking = false;
    this.canMove = true;
    this.size = 30;
    this.originalSize = 30;
    this.isStunned = false;
    this.lastAttackTime = 0;
    this.stunDuration = 400;
    this.stunStartTime = 0;
    this.angle = 0;
    this.speed = Constants.placeholder;
    this.originalSpeed = Constants.placeholder;
    this.baseSpeed = Constants.placeholder;
    this.burstFactor = 2.2;
    this.direction = createVector(0, 0);
    this.deceleration = 0.05;
    this.isCharging = false;
    this.chargeTime = 2000;
    this.chargeStartTime = 0;
    this.spinSpeed = 0;
    this.targetSpinSpeed = 0;
    this.spinSpeedMultiplier = 1.4;
    this.burstCountdown = 0;
    this.isChargingLethal = false;
    this.lethalChargeTime = 600;
    this.lethalChargeStartTime = 0;
    this.aimDirection = 0;
    this.chargingEffect = null;
    this.isDead = false;
  }

  update(game) {
    if (this.isStunned) {
      let stunTime = millis() - this.stunStartTime;
      if (stunTime >= this.stunDuration) {
        this.isStunned = false;
        this.stunStartTime = 0;
      } else {
        return;
      }
    }

    if (this.isCharging) {
      let chargingTime = millis() - this.chargeStartTime;
      if (chargingTime >= this.chargeTime) {
        this.performHeavyAttack();
        this.isCharging = false;
      }
    }

    if (this.isChargingLethal) {
      let chargingTime = millis() - this.lethalChargeStartTime;
      if (chargingTime >= this.lethalChargeTime) {
        this.fireLethalShot(
          game.laserBeams,
          game.screenShake,
          game.players,
          game.deathParticles,
          game.p0Bullets,
          game.p1Bullets,
          game
        );
      }
      
      let aimSpeed = 0.005;
      if ((this.me === 0 && (keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW))) ||
          (this.me === 1 && (keyIsDown(65) || keyIsDown(68)))) {
        if ((this.me === 0 && keyIsDown(LEFT_ARROW)) || (this.me === 1 && keyIsDown(65))) {
          this.aimDirection -= aimSpeed;
        }
        if ((this.me === 0 && keyIsDown(RIGHT_ARROW)) || (this.me === 1 && keyIsDown(68))) {
          this.aimDirection += aimSpeed;
        }
      }
      
      if (this.chargingEffect) {
        this.chargingEffect.x = this.x;
        this.chargingEffect.y = this.y;
      }
      
      return;
    }

    this.angle += this.calculateSpinSpeed();

    if (this.burstCountdown > 0) {
      let targetSpeed = this.calculateSpeedModifier() + this.burstFactor;
      this.speed = lerp(this.speed, targetSpeed, 0.1);
      this.x += this.direction.x * this.speed;
      this.y += this.direction.y * this.speed;
      this.targetSpinSpeed = this.calculateSpinSpeed();
      this.burstCountdown--;
    } else {
      this.speed = lerp(this.speed, this.baseSpeed, 0.1);
      this.x += this.direction.x * this.speed;
      this.y += this.direction.y * this.speed;
      this.targetSpinSpeed = this.calculateSpinSpeed();
    }

    this.x = constrain(this.x, this.size / 2, width - this.size / 2);
    this.y = constrain(this.y, this.size / 2, height - this.size / 2);
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(radians(this.angle));
    stroke(this.col);
    strokeWeight(6);
    noFill();
    rectMode(CENTER);
    rect(0, 0, this.size, this.size, 3);

    if (this.isDead) {
      if (frameCount % 4 < 2) {
        stroke(255, 0, 0);
        strokeWeight(8);
      }
    }
    pop();
  }

  setDirection(xdir, ydir) {
    if (this.direction.x === 0 && this.direction.y === 0) {
      this.burstCountdown = 7.5;
    }
    this.direction.set(xdir, ydir);
  }

  startCharging() {
    this.isCharging = true;
    this.chargeStartTime = millis();
  }

  releaseCharge() {
    this.isCharging = false;
    if (this.isChargingLethal) {
      this.isChargingLethal = false;
      this.canMove = true;
      if (this.chargingEffect) {
        this.chargingEffect.shouldRemove = true;
        this.chargingEffect = null;
      }
    }
  }

  lightAttack(players, p1Bullets, p0Bullets) {
    let distanceToEnemy = dist(players[this.entityType].x, players[this.entityType].y, this.x, this.y);
    let predictionFactor;
    if (this.speed > this.baseSpeed + 0.01) {
      predictionFactor = map(distanceToEnemy, 0, width, 0, 10);
    } else {  
      predictionFactor = map(distanceToEnemy, 0, width, 0, 90);
    }
    let futureEnemyX = this.x + this.direction.x * this.speed * predictionFactor;
    let futureEnemyY = this.y + this.direction.y * this.speed * predictionFactor;
    let bullet = new Bullet("bullet", players[this.entityType].x, players[this.entityType].y, players[this.entityType].col, futureEnemyX, futureEnemyY, false, true, 200, this.me);
    if (this.entityType == 1) p1Bullets.push(bullet);
    if (this.entityType == 0) p0Bullets.push(bullet);
    players[this.entityType].speed *= 0.4;
    players[this.entityType].baseSpeed *= 0.4;
    setTimeout(() => {
      players[this.entityType].baseSpeed = Constants.placeholder;
      players[this.entityType].speed = Constants.placeholder;
    }, Constants.attackCooldown);
  }

  calculateSpeedModifier() {
    if (this.direction.x !== 0 && this.direction.y !== 0) {
      return this.baseSpeed * 1.9;
    } else if (this.direction.x !== 0 && this.direction.y === 0) {
      return this.baseSpeed * 1.6;
    } else if (this.isLightAttacking) {
      return this.baseSpeed * 0.6;
    } else {
      return this.speed;
    }
  }

  calculateSpinSpeed() {
    if (this.direction.x === 0 && this.direction.y === 0) {
      return this.calculateSpeedModifier() + this.burstFactor * 0.2;
    } else {
      return this.calculateSpeedModifier() + this.burstFactor * this.spinSpeedMultiplier;
    }
  }

  startLethalCharge(players, chargingEffects) {
    this.isChargingLethal = true;
    this.lethalChargeStartTime = millis();
    this.canMove = false;
    let targetPlayer = players[this.entityType];
    this.aimDirection = atan2(targetPlayer.y - this.y, targetPlayer.x - this.x);
    this.chargingEffect = new ChargingEffect(this.x, this.y, this.col, this.me, players);
    chargingEffects.push(this.chargingEffect);
  }

  fireLethalShot(laserBeams, screenShake, players, deathParticles, p0Bullets, p1Bullets, game) {
    let laserBeam = new LaserBeam(
      this.x, this.y, 
      this.aimDirection, 
      this.col, 
      this.entityType,
      players,
      deathParticles,
      p0Bullets,
      p1Bullets,
      screenShake,
      game
    );
    laserBeams.push(laserBeam);
    let knockbackDistance = 35;
    let knockbackAngle = this.aimDirection + PI;
    let knockbackX = Math.cos(knockbackAngle) * knockbackDistance;
    let knockbackY = Math.sin(knockbackAngle) * knockbackDistance;
    this.x += knockbackX;
    this.y += knockbackY;
    this.x = constrain(this.x, this.size / 2, width - this.size / 2);
    this.y = constrain(this.y, this.size / 2, height - this.size / 2);
    let originalColor = this.col;
    this.col = lerpColor(originalColor, color(255, 255, 255), 0.7);
    setTimeout(() => {
      this.col = originalColor;
    }, 200);
    screenShake.intensity = 15;
    screenShake.duration = 500;
    screenShake.timer = 0;
    this.releaseCharge();
  }

  aiMove(players, p1Bullets, p0Bullets, chargingEffects, reactionTimeScale) {
    console.log(reactionTimeScale)
    let eT = this.entityType;
    let targetPlayer = players[eT];
    if (typeof targetPlayer.x === 'undefined' || typeof targetPlayer.y === 'undefined') {
      if (players[0].aiState) {
        players[0].aiState.movementDir.set(0, 0);
        players[0].setDirection(0, 0);
      }
      return;
    }

    let distanceToPlayer = dist(players[0].x, players[0].y, targetPlayer.x, targetPlayer.y);
    
    if (!players[0].aiState) {
      players[0].aiState = {
        lastPlayerPos: { x: targetPlayer.x, y: targetPlayer.y, time: millis() },
        stationaryTime: 0,
        movementDir: createVector(0, 0),
        isBursting: false,
        burstCount: 0,
        lastBurstShot: 0,
        isBaiting: false,
        baitStartTime: 0
      };
    }
    let state = players[0].aiState;

    let currentTime = millis();
    let playerMoved = dist(targetPlayer.x, targetPlayer.y, state.lastPlayerPos.x, state.lastPlayerPos.y);
    if (playerMoved < 5) {
      state.stationaryTime += currentTime - state.lastPlayerPos.time;
    } else {
      state.stationaryTime = 0;
    }
    let movementPredictability = playerMoved < 50 ? map(playerMoved, 0, 50, 1, 0) : 0;
    state.lastPlayerPos = { x: targetPlayer.x, y: targetPlayer.y, time: currentTime };

    let isDodgingLethal = false;
    for (let effect of chargingEffects) {
      if (effect.playerIndex === eT) {
        let timeToFire = players[eT].lethalChargeTime - (millis() - players[eT].lethalChargeStartTime);
        if (timeToFire < 300 * reactionTimeScale && !players[0].isCharging && !players[0].isChargingLethal && !players[0].isStunned) {
          isDodgingLethal = true;
          let aimDir = players[eT].aimDirection;
          let perpendicularDir = createVector(-sin(aimDir), cos(aimDir)).normalize();
          if (players[0].x < width / 2) perpendicularDir.mult(-1);
          state.movementDir.lerp(perpendicularDir, 0.2);
          setTimeout(() => {
            state.movementDir.lerp(createVector(0, 0), 0.2);
          }, random(150, 250) * reactionTimeScale);
        }
      }
    }

    let isDodgingBullet = false;
    for (let enemyBullet of p1Bullets) {
      let distanceToBullet = dist(players[0].x, players[0].y, enemyBullet.x, enemyBullet.y);
      let dodgeDistance = 59;
      if (distanceToBullet < dodgeDistance && !enemyBullet.isChild) {
        let angle = atan2(players[0].y - enemyBullet.y, players[0].x - enemyBullet.x);
        let forceMagnitude = map(distanceToBullet, 0, dodgeDistance, 5, 0);
        players[0].x += cos(angle) * forceMagnitude * 3.8;
        players[0].y += sin(angle) * forceMagnitude * 0.7;
      }

      if (!enemyBullet.isChild && !enemyBullet.dodged) {
        let numEnemyBullets = p1Bullets.filter(bullet => !bullet.isChild && !bullet.dodged).length;
        if (numEnemyBullets >= Math.floor(Math.random() * 3) + 2 && !players[0].isCharging) {
          console.log("Light Attack 8");
          if (millis() - players[1].lastAttackTime > Constants.attackCooldown) {
            players[1].lightAttack(players, p1Bullets, p0Bullets);
            players[1].lastAttackTime = millis();
          }
        }

        let timeToImpact = distanceToBullet / enemyBullet.speed;
        if (distanceToBullet > 40 && distanceToBullet < random(60, 100) && !players[0].isCharging && !players[0].isChargingLethal) {
          isDodgingBullet = true;
          let bulletToSquare = createVector(players[0].x - enemyBullet.x, players[0].y - enemyBullet.y);
          let bulletAngle = atan2(enemyBullet.y - players[0].y, enemyBullet.x - players[0].x);
          let perpendicularDirection = createVector(-bulletToSquare.y, bulletToSquare.x).normalize();
          if (bulletAngle <= random(0.98, 1.3)) {
            state.movementDir.lerp(perpendicularDirection, 0.2);
          } else {
            state.movementDir.lerp(perpendicularDirection.mult(-1), 0.2);
          }
          setTimeout(() => {
            state.movementDir.lerp(createVector(0, 0), 0.2);
          }, random(110, 150) * reactionTimeScale);
          enemyBullet.dodged = true;
          break;
        }
      }
    }
    players[0].dodging = isDodgingBullet || isDodgingLethal;

    this.baseSpeed = map(distanceToPlayer, 100, 400, 5.5, 3.5, true);
    this.speed = this.baseSpeed;

    if ((targetPlayer.isStunned || state.stationaryTime > 1500) && !players[0].isCharging && !players[0].isChargingLethal && !players[0].dodging && !players[0].isStunned) {
        players[0].startLethalCharge(players, chargingEffects);
    }

    if (players[0].isChargingLethal && !players[0].isStunned) {
      let aimSpeed = 0.005;
      let desiredAngle = atan2(targetPlayer.y - players[0].y, targetPlayer.x - players[0].x);
      let angleDiff = desiredAngle - players[0].aimDirection;
      while (angleDiff > PI) angleDiff -= TWO_PI;
      while (angleDiff < -PI) angleDiff += TWO_PI;
      players[0].aimDirection += constrain(angleDiff, -aimSpeed, aimSpeed);
    }

    if (!players[0].dodging && !players[0].isCharging && !players[0].isChargingLethal && !players[0].isStunned && !state.isBaiting && random() < 0.01) {
      state.isBaiting = true;
      state.baitStartTime = millis();
      state.movementDir.lerp(createVector(0, 0), 0.2);
      setTimeout(() => {
        state.isBaiting = false;
        if (!players[0].isCharging && !players[0].isChargingLethal && !players[0].isStunned) {
          if (random() < 0.5 && !targetPlayer.isStunned && state.stationaryTime < 1500) {
            state.isBursting = true;
            state.burstCount = 3;
          } else {
            players[0].startLethalCharge(players, chargingEffects);
          }
        }
      }, random(1000, 2000) * reactionTimeScale);
    }

    if (!players[0].dodging && !players[0].isCharging && !players[0].isChargingLethal && !players[0].isStunned && !state.isBaiting) {
      let preferredDistance = 200;
      let tolerance = 50;
      let angleToPlayer = atan2(targetPlayer.y - players[0].y, targetPlayer.x - players[0].x);
      let moveDir;
      
      if (distanceToPlayer < preferredDistance - tolerance) {
        moveDir = createVector(-cos(angleToPlayer), -sin(angleToPlayer)).rotate(random(-PI/6, PI/6));
      } else if (distanceToPlayer > preferredDistance + tolerance) {
        moveDir = createVector(cos(angleToPlayer), sin(angleToPlayer)).rotate(random(-PI/4, PI/4));
      } else {
        moveDir = createVector(cos(angleToPlayer), sin(angleToPlayer)).rotate(PI/2 * (random() > 0.5 ? 1 : -1));
        if (random() < 0.03) {
          moveDir.set(0, 0);
          setTimeout(() => {
            state.movementDir.lerp(createVector(cos(angleToPlayer + PI/2), sin(angleToPlayer + PI/2)), 0.15);
          }, random(300, 600));
        }
      }
      
      state.movementDir.lerp(moveDir, 0.15);
    }

    let dodgeDirection = createVector(0, 0);
    let distanceToTopWall = players[0].y;
    let distanceToBottomWall = height - players[0].y;
    let distanceToLeftWall = players[0].x;
    let distanceToRightWall = width - players[0].x;
    let needsToMove = false;
    let minDistanceToWall = random(60, 100);
    
    if (distanceToTopWall < minDistanceToWall) {
      dodgeDirection.add(0, 0.5);
      needsToMove = true;
    }
    if (distanceToBottomWall < minDistanceToWall) {
      dodgeDirection.add(0, -0.5);
      needsToMove = true;
    }
    if (distanceToLeftWall < minDistanceToWall) {
      dodgeDirection.add(0.5, 0);
      needsToMove = true;
    }
    if (distanceToRightWall < minDistanceToWall) {
      dodgeDirection.add(-0.5, 0);
      needsToMove = true;
    }
    
    dodgeDirection.normalize();
    
    if (needsToMove && !players[0].dodging && !players[0].isCharging && !players[0].isChargingLethal && !state.isBaiting && distanceToPlayer > 100) {
      state.movementDir.lerp(dodgeDirection, 0.1);
      setTimeout(() => {
        state.movementDir.lerp(createVector(0, 0), 0.1);
      }, (minDistanceToWall + 30) * reactionTimeScale);
    }

    players[0].setDirection(state.movementDir.x, state.movementDir.y);

    if (!players[0].dodging && !players[0].isCharging && !players[0].isChargingLethal && !players[0].isStunned) {
      if (state.isBursting && state.burstCount > 0 && millis() - state.lastBurstShot > 150 * reactionTimeScale) {
        console.log("Light Attack 4");
        players[1].lightAttack(players, p1Bullets, p0Bullets);
        players[1].lastAttackTime = millis();
        state.lastBurstShot = millis();
        state.burstCount--;
        if (state.burstCount == 0) {
          state.isBursting = false;
        }
      } else if (!state.isBursting) {
        let shootProbability = map(distanceToPlayer, 0, 400, 0.03, 0.01);
        if (movementPredictability > 0.7 && random() < 0.02 && millis() - players[1].lastAttackTime > Constants.attackCooldown) {
          console.log("Light Attack 5");
          state.isBursting = true;
          state.burstCount = 3;
          state.lastBurstShot = millis() - 150;
        } else if (random() < shootProbability && millis() - players[1].lastAttackTime > Constants.attackCooldown) {
          console.log("Light Attack 6");
          players[1].lightAttack(players, p1Bullets, p0Bullets);
          players[1].lastAttackTime = millis();
        }
      }
    }
  }
}