let players = [];
let particles = [];
let p1Bullets = [];
let p0Bullets = [];
let attackCooldown = 280; // in milliseconds
let placeholder = 4.5; // this is the speed
let chargingEffects = []; // For storing charging visual effects
let laserBeams = []; // For storing active laser beams
let screenShake = { intensity: 0, duration: 0, timer: 0 };
let gameState = "playing"; // "playing", "gameOver"
let deathParticles = [];
let gameOverWinner = "";
let gameOverDelay = 0; // Timer for delayed game over
let gameOverDelayDuration = 1000; // 1000ms delay before game over

function setup() {
  createCanvas(800, 600);
  players[1] = new Square((width / 2) + random(-300, 300), height - 50, color(random(180, 255), 150 + random(-105, 105), 150 + random(-105, 105)), 0, 1);
  players[0] = new Square((width / 2) + random(-300, 300), 50, color(150 + random(-105, 105), random(180, 255), 150 + random(-105, 105)), 1, 0);
}

function draw() {
  background(0);

  if (gameState === "playing" || gameState === "gameOverPending") {
    // Apply screen shake BEFORE drawing anything
    if (screenShake.timer < screenShake.duration) {
      push(); // Save the current transformation matrix
      translate(random(-screenShake.intensity, screenShake.intensity), 
               random(-screenShake.intensity, screenShake.intensity));
      screenShake.timer += 16; // Assuming 60fps
    }

    // Only update and display players if they're not dead
    if (!players[0].isDead) {
      players[0].aiMove();
      players[0].update();
      players[0].display();
    }

    if (!players[1].isDead) {
      players[1].update();
      players[1].display();
    }

    // Update and display charging effects
    for (let i = chargingEffects.length - 1; i >= 0; i--) {
      chargingEffects[i].update();
      chargingEffects[i].display();
      if (chargingEffects[i].shouldRemove) {
        chargingEffects.splice(i, 1);
      }
    }

    // Update and display laser beams
    for (let i = laserBeams.length - 1; i >= 0; i--) {
      laserBeams[i].update();
      laserBeams[i].display();
      if (laserBeams[i].shouldRemove) {
        laserBeams.splice(i, 1);
      }
    }

    // Update and display p1 bullets
    for (let i = p1Bullets.length - 1; i >= 0; i--) {
      p1Bullets[i].update();
      p1Bullets[i].display();
      if (p1Bullets[i].remove) {
        p1Bullets.splice(i, 1);
      }
      if (p1Bullets[i] && p1Bullets[i].name == "child" && millis() - p1Bullets[i].creationTime > random(100, 300)) {
        p1Bullets.splice(i, 1);
      }
    }

    // Update and display p0 bullets
    for (let i = p0Bullets.length - 1; i >= 0; i--) {                                                                                                                                                                                   
      p0Bullets[i].update();
      p0Bullets[i].display();
      if (p0Bullets[i].remove) {
        p0Bullets.splice(i, 1);
      }
      if (p0Bullets[i] && p0Bullets[i].name == "child" && millis() - p0Bullets[i].creationTime > 140) {
        p0Bullets.splice(i, 1);
      }
    }

    // Close the screen shake transformation
    if (screenShake.timer < screenShake.duration) {
      pop(); // Restore the transformation matrix
    }
  }
  
  // Update and display death particles (always, even during game over)
  for (let i = deathParticles.length - 1; i >= 0; i--) {
    let particle = deathParticles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    // Removed gravity: particle.vy += particle.gravity;
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
      deathParticles.splice(i, 1);
    }
  }
  
  // Handle game over delay
  if (gameState === "gameOverPending" && millis() - gameOverDelay >= gameOverDelayDuration) {
    gameState = "gameOver";
  }
  
  // Draw game over screen
  if (gameState === "gameOver") {
    // Semi-transparent overlay
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    
    // Game Over text
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("GAME OVER", width/2, height/2 - 40);
    
    // Winner text colored as the winning player's color
    let winnerColor = this.entityType === 0 ? players[1].col : players[0].col;
    fill(winnerColor);
    textSize(24);
    text(gameOverWinner + " Wins!", width/2, height/2);
    
    fill(255);
    textSize(16);
    text("Press SPACE to restart", width/2, height/2 + 40);
  }
}

function keyPressed() {
  if (keyCode === UP_ARROW) {
    players[0].setDirection(players[0].direction.x, -1);
  } else if (keyCode === DOWN_ARROW) {
    players[0].setDirection(players[0].direction.x, 1);
  } else if (keyCode === LEFT_ARROW) {
    players[0].setDirection(-1, players[0].direction.y);
  } else if (keyCode === RIGHT_ARROW) {
    players[0].setDirection(1, players[0].direction.y);
  } else if (key === 'p') {
    if (!players[0].isChargingLethal && !players[0].isCharging) {
      players[0].startLethalCharge();
    }
  } else if (key === 'x' && !players[0].isCharging && !players[0].isChargingLethal && millis() - players[0].lastAttackTime > attackCooldown) {
    console.log('Light Attack 0')
    players[0].lightAttack();
    players[0].lastAttackTime = millis();
  }

  if (key === 'w') {
    players[1].setDirection(players[1].direction.x, -1);
  } else if (key === 's') {
    players[1].setDirection(players[1].direction.x, 1);
  } else if (key === 'a') {
    players[1].setDirection(-1, players[1].direction.y);
  } else if (key === "d") {
    players[1].setDirection(1, players[1].direction.y);
  } else if (key === 'c') {
    if (!players[1].isChargingLethal && !players[1].isCharging) {
      players[1].startLethalCharge();
    }
  } else if (key === 'o' && !players[1].isCharging && !players[1].isChargingLethal && millis() - players[1].lastAttackTime > attackCooldown) {
    players[1].lightAttack();
    players[1].lastAttackTime = millis();
  }

  if (gameState === "gameOver" && key === ' ') {
    restartGame();
  }
}

function keyReleased() {
  if (keyCode === UP_ARROW && players[0].direction.y === -1 ||
    keyCode === DOWN_ARROW && players[0].direction.y === 1 ||
    keyCode === LEFT_ARROW && players[0].direction.x === -1 ||
    keyCode === RIGHT_ARROW && players[0].direction.x === 1) {
    let newPlayerDirection = createVector(0, 0);

    // Check if other keys in the same direction are still pressed
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

    // Smoothly reset the direction using lerp on each component
    players[0].direction.x = lerp(players[0].direction.x, newPlayerDirection.x, 1);
    players[0].direction.y = lerp(players[0].direction.y, newPlayerDirection.y, 1);
  } else if (key === 'p') {
    players[0].releaseCharge();
  }

  if (key === "w" && players[1].direction.y === -1 ||
    key === "s" && players[1].direction.y === 1 ||
    key === "a" && players[1].direction.x === -1 ||
    key === "d" && players[1].direction.x === 1) {
    let newEnemyDirection = createVector(0, 0);

    // Check if other keys in the same direction are still pressed
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

    // Smoothly reset the direction using lerp on each component
    players[1].direction.x = lerp(players[1].direction.x, newEnemyDirection.x, 1);
    players[1].direction.y = lerp(players[1].direction.y, newEnemyDirection.y, 1);
  } else if (key === 'c') {
    players[1].releaseCharge();
  }
}

function restartGame() {
  gameState = "playing";
  deathParticles = [];
  p1Bullets = [];
  p0Bullets = [];
  chargingEffects = [];
  laserBeams = [];
  screenShake = { intensity: 0, duration: 0, timer: 0 };
  
  // Reset players
  players[1] = new Square((width / 2) + random(-300, 300), height - 50, color(random(180, 255), 150 + random(-105, 105), 150 + random(-105, 105)), 0, 1);
  players[0] = new Square((width / 2) + random(-300, 300), 50, color(150 + random(-105, 105), random(180, 255), 150 + random(-105, 105)), 1, 0);
}

class Square {
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
    this.stunDuration = 400; // in milliseconds
    this.stunStartTime = 0;
    this.angle = 0;
    this.speed = placeholder;
    this.originalSpeed = placeholder;
    this.baseSpeed = placeholder; // Store the base speed
    this.burstFactor = 2.2;
    this.direction = createVector(0, 0);
    this.deceleration = 0.05; // Adjust as needed
    this.isCharging = false;
    this.chargeTime = 2000; // in milliseconds
    this.chargeStartTime = 0;
    this.spinSpeed = 0; // Initialize spin speed
    this.targetSpinSpeed = 0; // Initialize target spin speed
    this.spinSpeedMultiplier = 1.4; // Adjust as needed
    this.burstCountdown = 0;
    this.isChargingLethal = false;
    this.lethalChargeTime = 600; // 800 milliseconds to charge
    this.lethalChargeStartTime = 0;
    this.aimDirection = 0; // Angle for aiming lethal shot
    this.chargingEffect = null;
    this.isDead = false;
  }

  update() {
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
        this.fireLethalShot();
      }
      
      // Manual aiming with left/right controls only - NO auto-aim
      let aimSpeed = 0.005; // Adjust this for aiming speed
      if ((this.me === 0 && (keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW))) ||
          (this.me === 1 && (keyIsDown(65) || keyIsDown(68)))) { // 65 = 'a', 68 = 'd'
        
        if ((this.me === 0 && keyIsDown(LEFT_ARROW)) || (this.me === 1 && keyIsDown(65))) {
          this.aimDirection -= aimSpeed; // Aim left
        }
        if ((this.me === 0 && keyIsDown(RIGHT_ARROW)) || (this.me === 1 && keyIsDown(68))) {
          this.aimDirection += aimSpeed; // Aim right
        }
      }
      
      // Update charging effect position
      if (this.chargingEffect) {
        this.chargingEffect.x = this.x;
        this.chargingEffect.y = this.y;
      }
      
      // Can't move while charging lethal
      return;
    }

    if (keyIsDown(79) && !players[1].isCharging && (millis() - players[1].lastAttackTime) > attackCooldown && this.entityType === 1) {
      console.log('Light Attack 1')
      players[1].lightAttack();
      players[1].isLightAttacking = true;
      players[1].lastAttackTime = millis(); // Record the time of the last attack
    }

    if (keyIsDown(88) && !players[0].isCharging && (millis() - players[0].lastAttackTime) > attackCooldown && this.entityType === 0) {
      console.log('Light Attack 3')
      players[0].lightAttack();
      players[0].isLightAttacking = true;
      players[0].lastAttackTime = millis(); // Record the time of the last attack
    }

    // Update spinning based on movement speed
    this.angle += this.calculateSpinSpeed();

    // Update position based on direction and speed
    if (this.burstCountdown > 0) {
      // Burst acceleration
      let targetSpeed = this.calculateSpeedModifier() + this.burstFactor;
      this.speed = lerp(this.speed, targetSpeed, 0.1);
      this.x += this.direction.x * this.speed;
      this.y += this.direction.y * this.speed;

      // Update target spin speed during burst acceleration
      this.targetSpinSpeed = this.calculateSpinSpeed();
      this.burstCountdown--;
    } else {
      // Regular movement
      this.speed = lerp(this.speed, this.baseSpeed, 0.1); // Smoothly return to base speed
      this.x += this.direction.x * this.speed;
      this.y += this.direction.y * this.speed;

      // Update target spin speed during regular movement
      this.targetSpinSpeed = this.calculateSpinSpeed();
    }

    // Ensure the square stays within the canvas boundaries
    this.x = constrain(this.x, this.size / 2, width - this.size / 2);
    this.y = constrain(this.y, this.size / 2, height - this.size / 2);
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(radians(this.angle));

    // Set the stroke (outline) color to the random color
    stroke(this.col);
    strokeWeight(6);
    noFill();

    // Draw the square with rounded corners
    rectMode(CENTER);
    rect(0, 0, this.size, this.size, 3); // 10 is the radius for rounded corners

    // Draw death effect if dead
    if (this.isDead) {
      // Make the square flash and break apart
      if (frameCount % 4 < 2) {
        stroke(255, 0, 0);
        strokeWeight(8);
      }
    }
    pop();
  }

  setDirection(xdir, ydir) {
    if (this.direction.x === 0 && this.direction.y === 0) {
      this.burstCountdown = 7.5; // Adjust as needed
    }
    this.direction.set(xdir, ydir);
  }

  startCharging() {
    this.isCharging = true;
    this.chargeStartTime = millis();
  }

  releaseCharge() {
    this.isCharging = false;
  }

  performHeavyAttack() {
    // Implement heavy attack logic
  }

  lightAttack() {
    let distanceToEnemy = dist(players[this.entityType].x, players[this.entityType].y, this.x, this.y);
    let predictionFactor;
    if (this.speed > this.baseSpeed + 0.01) {
      predictionFactor = (map(distanceToEnemy, 0, width, 0, 10));
    } else {  
      predictionFactor = (map(distanceToEnemy, 0, width, 0, 90));
    }
    let futureEnemyX = this.x + this.direction.x * this.speed * predictionFactor;
    let futureEnemyY = this.y + this.direction.y * this.speed * predictionFactor;
    let bullet = new Bullet("bullet", players[this.entityType].x, players[this.entityType].y, players[this.entityType].col, futureEnemyX, futureEnemyY, false, true, 200, this.me);
    if (this.entityType == 1) p1Bullets.push(bullet);
    if (this.entityType == 0) p0Bullets.push(bullet);
    players[this.entityType].speed *= 0.4;
    players[this.entityType].baseSpeed *= 0.4;
    setTimeout(() => {
      players[this.entityType].baseSpeed = placeholder;
      players[this.entityType].speed = placeholder;
    }, attackCooldown);
  }

  calculateSpeedModifier() {
    if (this.direction.x !== 0 && this.direction.y !== 0) {
      return this.baseSpeed * 1.9; // Diagonal movement
    } else if (this.direction.x !== 0 && this.direction.y === 0) {
      return this.baseSpeed * 1.6; // Horizontal movement
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

  startLethalCharge() {
    this.isChargingLethal = true;
    this.lethalChargeStartTime = millis();
    this.canMove = false; // Can't move while charging
    
    // Set initial aim direction toward enemy
    let targetPlayer = players[this.entityType];
    this.aimDirection = atan2(targetPlayer.y - this.y, targetPlayer.x - this.x);
    
    // Create charging effect
    this.chargingEffect = new ChargingEffect(this.x, this.y, this.col, this.me);
    chargingEffects.push(this.chargingEffect);
  }

  releaseLethalCharge() {
    if (this.isChargingLethal) {
      this.isChargingLethal = false;
      this.canMove = true;
      
      // Remove charging effect
      if (this.chargingEffect) {
        this.chargingEffect.shouldRemove = true;
        this.chargingEffect = null;
      }
    }
  }

  fireLethalShot() {
    // Create devastating laser beam
    let laserBeam = new LaserBeam(
      this.x, this.y, 
      this.aimDirection, 
      this.col, 
      this.entityType
    );
    laserBeams.push(laserBeam);
    
    // Add knockback to the firing player (opposite direction of shot)
    let knockbackDistance = 35; // Increased for more dramatic effect
    let knockbackAngle = this.aimDirection + PI; // Opposite direction of shot
    let knockbackX = Math.cos(knockbackAngle) * knockbackDistance;
    let knockbackY = Math.sin(knockbackAngle) * knockbackDistance;
    
    // Apply immediate knockback to position
    this.x += knockbackX;
    this.y += knockbackY;
    
    // Ensure player stays within bounds after knockback
    this.x = constrain(this.x, this.size / 2, width - this.size / 2);
    this.y = constrain(this.y, this.size / 2, height - this.size / 2);
    
    // Add visual knockback effect (brief color change)
    let originalColor = this.col;
    this.col = lerpColor(originalColor, color(255, 255, 255), 0.7);
    setTimeout(() => {
      this.col = originalColor;
    }, 200);
    
    // Screen shake
    screenShake.intensity = 15;
    screenShake.duration = 500;
    screenShake.timer = 0;
    
    this.releaseLethalCharge();
  }
}

Square.prototype.aiMove = function () {
  let eT = this.entityType; // entityType = 1 for AI (targets player 1)
  let targetPlayer = players[eT];
  
  // Stop AI if player's location is undefined (player is dead)
  if (typeof targetPlayer.x === 'undefined' || typeof targetPlayer.y === 'undefined') {
    if (players[0].aiState) {
      players[0].aiState.movementDir.set(0, 0);
      players[0].setDirection(0, 0);
    }
    return; // Skip all actions
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
      if (timeToFire < 300 && !players[0].isCharging && !players[0].isChargingLethal && !players[0].isStunned) {
        isDodgingLethal = true;
        let aimDir = players[eT].aimDirection;
        let perpendicularDir = createVector(-sin(aimDir), cos(aimDir)).normalize();
        if (players[0].x < width / 2) perpendicularDir.mult(-1);
        state.movementDir.lerp(perpendicularDir, 0.2);
        setTimeout(() => {
          state.movementDir.lerp(createVector(0, 0), 0.2);
        }, random(150, 250));
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
        if (millis() - players[1].lastAttackTime > attackCooldown) {
          players[1].lightAttack();
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
        }, random(110, 150));
        enemyBullet.dodged = true;
        break;
      }
    }
  }
  players[0].dodging = isDodgingBullet || isDodgingLethal;

  if ((targetPlayer.isStunned || state.stationaryTime > 1500) && !players[0].isCharging && !players[0].isChargingLethal && !players[0].dodging && !players[0].isStunned) {
    players[0].startLethalCharge();
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
          players[0].startLethalCharge();
        }
      }
    }, random(1000, 2000));
  }

  if (!players[0].dodging && !players[0].isCharging && !players[0].isChargingLethal && !players[0].isStunned && !state.isBaiting) {
    let preferredDistance = 200; // Ideal distance
    let tolerance = 50; // Acceptable range
    let angleToPlayer = atan2(targetPlayer.y - players[0].y, targetPlayer.x - players[0].x);
    let moveDir;
    
    if (distanceToPlayer < preferredDistance - tolerance) {
      // Too close: retreat with slight randomness
      moveDir = createVector(-cos(angleToPlayer), -sin(angleToPlayer)).rotate(random(-PI/6, PI/6));
    } else if (distanceToPlayer > preferredDistance + tolerance) {
      // Too far: approach with slight circling
      moveDir = createVector(cos(angleToPlayer), sin(angleToPlayer)).rotate(random(-PI/4, PI/4));
    } else {
      // Ideal distance: circle randomly with occasional pause
      moveDir = createVector(cos(angleToPlayer), sin(angleToPlayer)).rotate(PI/2 * (random() > 0.5 ? 1 : -1));
      if (random() < 0.03) {
        moveDir.set(0, 0); // Brief pause for flow
        setTimeout(() => {
          state.movementDir.lerp(createVector(cos(angleToPlayer + PI/2), sin(angleToPlayer + PI/2)), 0.15);
        }, random(300, 600));
      }
    }
    
    state.movementDir.lerp(moveDir, 0.15); // Smoother transitions
  }

  let dodgeDirection = createVector(0, 0);
  let distanceToTopWall = players[0].y;
  let distanceToBottomWall = height - players[0].y;
  let distanceToLeftWall = players[0].x;
  let distanceToRightWall = width - players[0].x;
  let needsToMove = false;
  let minDistanceToWall = random(60, 100); // Increased to avoid corner-trapping
  
  if (distanceToTopWall < minDistanceToWall) {
    dodgeDirection.add(0, 0.5); // Reduced influence
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
    }, minDistanceToWall + 30);
  }

  players[0].baseSpeed = map(distanceToPlayer, 100, 400, 5.5, 3.5, true);
  players[0].speed = players[0].baseSpeed;

  players[0].setDirection(state.movementDir.x, state.movementDir.y);

  if (!players[0].dodging && !players[0].isCharging && !players[0].isChargingLethal && !players[0].isStunned) {
    if (state.isBursting && state.burstCount > 0 && millis() - state.lastBurstShot > 150) {
      console.log("Light Attack 4");
      players[1].lightAttack();
      players[1].lastAttackTime = millis();
      state.lastBurstShot = millis();
      state.burstCount--;
      if (state.burstCount == 0) {
        state.isBursting = false;
      }
    } else if (!state.isBursting) {
      let shootProbability = map(distanceToPlayer, 0, 400, 0.03, 0.01);
      if (movementPredictability > 0.7 && random() < 0.02 && millis() - players[1].lastAttackTime > attackCooldown) {
        console.log("Light Attack 5");
        state.isBursting = true;
        state.burstCount = 3;
        state.lastBurstShot = millis() - 150;
      } else if (random() < shootProbability && millis() - players[1].lastAttackTime > attackCooldown) {
        console.log("Light Attack 6");
        players[1].lightAttack();
        players[1].lastAttackTime = millis();
      }
    }
  }
};

class Bullet {
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

  update() {
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
          if (!this.isStunned) {
            players[this.entityType].isStunned = true;
            players[this.entityType].stunStartTime = millis();
          }

          let angle = Math.atan2(players[this.entityType].y - this.y, players[this.entityType].x - this.x);
          let recoilDistance = 25;
          let newx = Math.cos(angle) * recoilDistance;
          let newy = Math.sin(angle) * recoilDistance;

          this.shakeEnemy(3, 300, newx, newy);
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
              let child = new Bullet("child", this.x, this.y, this.col, this.x + cos(angle) * speed, this.y + sin(angle) * speed, true, false, lifespan);
              let child2 = new Bullet("child", enemyBullet.x, enemyBullet.y, enemyBullet.col, enemyBullet.x + cos(random(0, TWO_PI)) * random(5, 10), enemyBullet.y + sin(random(0, TWO_PI)) * random(5, 10), true, false, lifespan);
              if (this.entityType == 1) {
                p0Bullets.push(child);
                p1Bullets.push(child2);
              }
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
              let child = new Bullet("child", this.x, this.y, this.col, this.x + cos(angle) * speed, this.y + sin(angle) * speed, true, false, lifespan);
              let child2 = new Bullet("child", enemyBullet.x, enemyBullet.y, enemyBullet.col, enemyBullet.x + cos(random(0, TWO_PI)) * random(5, 10), enemyBullet.y + sin(random(0, TWO_PI)) * random(5, 10), true, false, lifespan);
              if (this.entityType == 0) {
                p1Bullets.push(child);
                p0Bullets.push(child2);
              }
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
          let child = new Bullet("child", this.x, this.y, this.col, this.x + cos(angle) * speed, this.y + sin(angle) * speed, true, false, lifespan);
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

  shakeEnemy(intensity, duration, newx, newy) {
    let originalPos = { x: players[this.entityType].x += newx, y: players[this.entityType].y += newy };
    let shakeTimer = 0;
    let originalSpeed = players[this.entityType].speed;
    players[1].speed = 0;

    const shakeLoop = () => {
      if (shakeTimer < duration) {
        players[this.entityType].size = players[this.entityType].size * (1 + Math.random() * 0.1 - 0.05);
        players[this.entityType].x = originalPos.x + Math.random() * intensity * 2 - intensity;
        players[this.entityType].y = originalPos.y + Math.random() * intensity * 2 - intensity;
        requestAnimationFrame(shakeLoop);
      } else {
        players[this.entityType].x = originalPos.x + newx;
        players[this.entityType].y = originalPos.y + newy;
        players[this.entityType].size = players[this.entityType].originalSize;
        players[this.entityType].speed = players[this.entityType].originalSpeed;
      }
      shakeTimer += 6;
    };
    shakeLoop();
  }
}

class ChargingEffect {
  constructor(x, y, col, playerIndex) {
    this.x = x;
    this.y = y;
    this.col = col;
    this.playerIndex = playerIndex;
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
    let progress = elapsed / players[this.playerIndex].lethalChargeTime;
    
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
    let progress = elapsed / players[this.playerIndex].lethalChargeTime;
    
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
    let aimDir = players[this.playerIndex].aimDirection;
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

class LaserBeam {
  constructor(x, y, direction, col, entityType) {
    this.startX = x;
    this.startY = y;
    this.direction = direction;
    this.col = col;
    this.entityType = entityType;
    this.shouldRemove = false;
    this.startTime = millis();
    this.duration = 500; // Increased from 300ms to 500ms for longer lingering
    this.width = 8;
    this.maxWidth = 15;
    this.hitSomething = false;
    this.lastParticleSpawn = 0;
    this.particleSpawnRate = 8; // Spawn particles every 8ms
    
    this.endX = x + cos(direction) * 2000;
    this.endY = y + sin(direction) * 2000;
    
    this.calculateCollision();
    this.checkPlayerCollision();
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
    let targetPlayer = players[this.entityType];
    
    let dist = this.distanceFromPointToLine(
      targetPlayer.x, targetPlayer.y,
      this.startX, this.startY,
      this.endX, this.endY
    );
    
    if (dist < targetPlayer.size / 2 + this.width / 2) {
      targetPlayer.isDead = true;
      targetPlayer.x = undefined; // Set position to undefined
      targetPlayer.y = undefined; // Set position to undefined
      this.hitSomething = true;
      
      this.createDeathParticles(targetPlayer);
      
      // Set pending game over state with delay
      gameState = "gameOverPending";
      gameOverDelay = millis();
      gameOverWinner = this.entityType === 0 ? "Player 2" : "Player 1";
      
      screenShake.intensity = 25;
      screenShake.duration = 800;
      screenShake.timer = 0;
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
    // Increased number of particles from 25-35 to 40-50
    let numParticles = random(40, 50);
    
    for (let i = 0; i < numParticles; i++) {
      let particle = {
        x: player.x + random(-player.size/2, player.size/2),
        y: player.y + random(-player.size/2, player.size/2),
        // Increased velocity range for higher energy
        vx: random(-18, 18), // Was -12, 12
        vy: random(-18, 18), // Was -12, 12
        size: random(3, 8),
        color: player.col,
        life: 255,
        decay: random(2, 4),
        rotation: random(0, TWO_PI),
        rotationSpeed: random(-0.3, 0.3),
        gravity: 0 // Removed gravity
      };
      deathParticles.push(particle);
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
              p1Bullets.push(particle);
            } else {
              p0Bullets.push(particle);
            }
          }
        }
      }
    }
  }
  
  update() {
    let elapsed = millis() - this.startTime;
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

class DeathParticle {
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