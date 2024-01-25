let players = []
let particles = [];
let p1Bullets = [];
let p0Bullets = [];
let attackCooldown = 280; // in milliseconds
let placeholder = 3.5

function setup() {
  createCanvas(800, 600);
  players[1] = new Square((width / 2) + random(-300, 300), height - 50, color(random(180, 255), 150 + random(-105, 105), 150 + random(-105, 105)), 0, 1);
  players[0] = new Square((width / 2) + random(-300, 300), 50, color(150 + random(-105, 105), random(180, 255), 150 + random(-105, 105)), 1, 0);
}

function draw() {
  background(0);

  players[0].aiMove();
  players[0].update();
  players[0].display();


  //players[1].aiMove();
  players[1].update();
  players[1].display();

  // Update and display p1 bullets
  
  for (let i = p1Bullets.length - 1; i >= 0; i--) {
    p1Bullets[i].update();
    p1Bullets[i].display();
    if (p1Bullets[i].remove) {
      p1Bullets.splice(i, 1);
    }
    if (p1Bullets[i] && p1Bullets[i].name == "child" && millis() - p1Bullets[i].creationTime > random(100, 300)) {
        //console.log("p1")
      p1Bullets.splice(i, 1);
    }
  }

    // Update and display p2 bullets
    for (let i = p0Bullets.length - 1; i >= 0; i--) {                                                                                                                                                                                   
      p0Bullets[i].update();
      p0Bullets[i].display();
      if (p0Bullets[i].remove) {
        p0Bullets.splice(i, 1);
      }
      if (p0Bullets[i] && p0Bullets[i].name == "child" && millis() - p0Bullets[i].creationTime > 140) {
            //console.log("p0")
        p0Bullets.splice(i, 1);
      }
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
  } else if (key === 'c') {
    players[0].startCharging();
  } else if (key === 'x' && !players[0].isCharging && millis() - players[0].lastAttackTime > attackCooldown) {
    players[0].lightAttack();
    players[0].lastAttackTime = millis(); // Record the time of the last attack
  }


  if (key === 'w') {
    players[1].setDirection(players[1].direction.x, -1);
  } else if (key === 's') {
    players[1].setDirection(players[1].direction.x, 1);
  } else if (key === 'a') {
    players[1].setDirection(-1, players[1].direction.y);
  } else if (key === "d") {
    players[1].setDirection(1, players[1].direction.y);
  } else if (key === 'p') {
    players[1].startCharging();
  } else if (key === 'o' && !players[1].isCharging && millis() - players[1].lastAttackTime > attackCooldown) {
    players[1].lightAttack();
    players[1].lastAttackTime = millis(); // Record the time of the last attack
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

class Square {
  constructor(x, y, col, entityType, me) {
    this.x = x;
    this.y = y;
    this.col = col;
    this.originalCol = col;
    this.entityType = entityType
    this.me = me
    this.isLightAttacking = false;
    this.canMove = true;
    this.size = 30;
    this.originalSize = 30
    //if (this.me == 0) this.size = 60;
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
  }

  update() {

    if (this.isStunned) {
        let stunTime = millis() - this.stunStartTime;
        if (stunTime >= this.stunDuration) {
          // Stunning duration elapsed, reset stunning state
          this.isStunned = false;
          this.stunStartTime = 0;
        } else {
          // Still in stunning state, prevent movement and attacks
          return;
        }
      }

    if (this.isCharging) {
      let chargingTime = millis() - this.chargeStartTime;
      if (chargingTime >= this.chargeTime) {
        // Perform heavy attack
        this.performHeavyAttack();
        this.isCharging = false;
      }
    }

    if (keyIsDown(79) && !players[1].isCharging && (millis() - players[1].lastAttackTime) > attackCooldown && this.entityType === 1) {
      players[1].lightAttack();
      players[1].isLightAttacking = true;
      players[1].lastAttackTime = millis(); // Record the time of the last attack
    }

    if (keyIsDown(88) && !players[0].isCharging && (millis() - players[0].lastAttackTime) > attackCooldown && this.entityType === 0) {
      
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
      //this.spinSpeed = lerp(this.spinSpeed, this.targetSpinSpeed, 0.05);


      this.burstCountdown--;
    } else {
      // Regular movement
      this.speed = lerp(this.speed, this.baseSpeed, 0.1); // Smoothly return to base speed
      this.x += this.direction.x * this.speed;
      this.y += this.direction.y * this.speed;

      // Update target spin speed during regular movement
      this.targetSpinSpeed = this.calculateSpinSpeed();
      //this.spinSpeed = lerp(this.spinSpeed, this.targetSpinSpeed, 0.1);
    }

    // // Modify the enemy's movement to strafe left and right
    // if (players[1].x < width / 3) {
    //   players[1].direction.set(1, 0); // Move right
    // } else if (players[1].x > (2.7 * width) / 3) {
    //   players[1].direction.set(-1, 0); // Move left
    // }

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
    // No fill for the inside of the square

    strokeWeight(6);
    noFill();

    // Draw the square with rounded corners
    rectMode(CENTER);
    rect(0, 0, this.size, this.size, 3); // 10 is the radius for rounded corners, adjust as needed

    pop();
  }

  setDirection(xdir, ydir) {
    if (this.direction.x === 0 && this.direction.y === 0) {
      // Only start burst countdown if transitioning from near stationary to moving
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
      // entity type was 1

      let distanceToEnemy = dist(players[this.entityType].x, players[this.entityType].y, this.x, this.y);
      //let speedScaling = map(players[1].speed, 0, players[1].baseSpeed, 0.3, 0.8); // Adjust the range as needed


      let predictionFactor;
      if (this.speed > this.baseSpeed + 0.01) {
        predictionFactor = (map(distanceToEnemy, 0, width, 0, 10)); // Adjust the range (10 to 50) as needed
      }
      else {  
      predictionFactor = (map(distanceToEnemy, 0, width, 0, 90)); // Adjust the range (10 to 50) as needed
      }
      // Predict the future position of the enemy based on its current position, speed, and direction
      let futureEnemyX = this.x + this.direction.x * this.speed * predictionFactor; // Adjust the multiplier as needed, higher = further prediction
      let futureEnemyY = this.y + this.direction.y * this.speed * predictionFactor;

      // Create a new bullet with the player's color and direction towards the predicted position
      let bullet = new Bullet("bullet", players[this.entityType].x, players[this.entityType].y, players[this.entityType].col, futureEnemyX, futureEnemyY, false, true, 200, this.me);
      if (this.entityType == 1) p1Bullets.push(bullet);
      if (this.entityType == 0) p0Bullets.push(bullet);
      players[this.entityType].speed *= 0.4;
      players[this.entityType].baseSpeed *= 0.4;
      // wait the same amount of time the bullet cooldown is, and then reset base speed to normal
        setTimeout(() => {
            players[this.entityType].baseSpeed = placeholder;
            players[this.entityType].speed = placeholder;
        }, attackCooldown);
    



    
    //this.speed *= 0.7; // Adjust as needed

  }

  calculateSpeedModifier() {
    // Adjust speed based on direction to meet your specifications
    if (this.direction.x !== 0 && this.direction.y !== 0) {
      // Diagonal movement
      return this.baseSpeed * 1.9; // Adjust as needed
    } else if (this.direction.x !== 0 && this.direction.y === 0) {
      // Horizontal movement
      return this.baseSpeed * 1.6; // Adjust as needed
    } else if (this.isLightAttacking) {
        return this.baseSpeed * 0.6;
    }
    else {
      // Non-diagonal movement
      return this.speed;
    }
  }

  calculateSpinSpeed() {
    // Adjust spinning speed based on movement speed
    if (this.direction.x === 0 && this.direction.y === 0) {
      return this.calculateSpeedModifier() + this.burstFactor * 0.2; // I can use this to change spinny speed heh
    } else {
      return this.calculateSpeedModifier() + this.burstFactor * this.spinSpeedMultiplier; // Adjust as needed
    }
  }
}

Square.prototype.aiMove = function () {

  let distanceToPlayer = dist(this.x, this.y, players[this.entityType].x, players[this.entityType].y);
  
  // ------------------------------------------------------------------------------ This section covers Defense

  // Dodge bullets
  for (let enemyBullet of p1Bullets) {

    // if all else fails
    let distanceToBullet = dist(this.x, this.y, enemyBullet.x, enemyBullet.y);
    let dodgeDistance = 59
    if (distanceToBullet < dodgeDistance && !enemyBullet.isChild) {
      // Calculate the angle and direction of the force
      let angle = atan2(this.y - enemyBullet.y, this.x - enemyBullet.x);
      let forceMagnitude = map(distanceToBullet, 0, dodgeDistance, 5, 0); // Adjust force strength as needed

      // Apply the force to the square's position
      this.x += cos(angle) * forceMagnitude * 3.8;
      this.y += sin(angle) * forceMagnitude * 0.7;
    }



    if (!enemyBullet.isChild && !enemyBullet.dodged) {

      let numEnemyBullets = p1Bullets.filter(bullet => !bullet.isChild && !bullet.dodged).length // get all actual bullets

      if (numEnemyBullets >= Math.floor(Math.random() * 3) + 2 && !this.isCharging) { // if there's too many stand your ground
        let eT = this.entityType
            if (millis() - players[eT].lastAttackTime > attackCooldown) {
            players[eT].lightAttack();
            players[eT].lastAttackTime = millis(); // Record the time of the last attack
            }

        
      }

        let distanceToBullet = dist(this.x, this.y, enemyBullet.x, enemyBullet.y);

        let timeToImpact = distanceToBullet / enemyBullet.speed;
    
    
        // Dodge bullets when moving far distances
        if (distanceToBullet > 40 && distanceToBullet < random(60, 100) && !this.isCharging) {
                // you're dodging, tell the game that so it cant stop you from doing it
      this.dodging = true;
          // AI can move and dodge bullets simultaneously
          let bulletToSquare = createVector(this.x - enemyBullet.x, this.y - enemyBullet.y);
          let bulletAngle = atan2(enemyBullet.y - this.y, enemyBullet.x - this.x);
          //console.log(bulletAngle) // if angle is -2 go left, otherwise just do that
          if (bulletAngle <= random(0.98, 1.3)) {
          let perpendicularDirection = createVector(-bulletToSquare.y, bulletToSquare.x).normalize();
          this.setDirection(perpendicularDirection.x, perpendicularDirection.y);
          setTimeout(() => {
          this.setDirection(0,0)
          }, random(110, 150))
        } else {
           let perpendicularDirection = createVector(-bulletToSquare.y, bulletToSquare.x).normalize();
           this.setDirection(-perpendicularDirection.x, -perpendicularDirection.y);
           setTimeout(() => {
             this.setDirection(0,0)
             }, random(110, 150))
        }
          enemyBullet.dodged = true;
          break;
    
        } else this.dodging = false; // no risk, restrictions back in place.
      
    }
  }

  //Stay away from bounds
  // Check proximity to game bounds
  let dodgeDirection = createVector(0,0);
  let distanceToTopWall = this.y;
  let distanceToBottomWall = height - this.y;
  let distanceToLeftWall = this.x;
  let distanceToRightWall = width - this.x;
  let needsToMove = false;
  let minDistanceToWall = random(40, 90); // Adjust the minimum distance to the wall as needed
  
  // Adjust direction to move away from the bounds
  if (distanceToTopWall < minDistanceToWall) {
      dodgeDirection.add(0, 1);
      needsToMove = true;
  }
  if (distanceToBottomWall < minDistanceToWall) {
      dodgeDirection.add(0, -1);
      needsToMove = true;
  }
  if (distanceToLeftWall < minDistanceToWall) {
      dodgeDirection.add(1, 0);
      needsToMove = true;
  }
  if (distanceToRightWall < minDistanceToWall) {
      dodgeDirection.add(-1, 0);
      needsToMove = true;
  }
  
  //console.log(needsToMove)
    // Normalize the dodge direction vector
  dodgeDirection.normalize();
  
  // Set the direction to move away from bounds
  if (needsToMove && this.dodging == false) {
      this.setDirection(dodgeDirection.x, dodgeDirection.y) 
      setTimeout(() => {
        this.setDirection(0,0)
        }, minDistanceToWall + 30)
  }
  
  // ------------------------------------------------------------------------------ This section covers Offense

  /*
  Kinda just brainstorming

  If the enemy isn't shooting the best course of action might be to get into a close vicinity to the enemy and shoot aggressively
  This can be checked by looking at how many bullets have been fired in the last few seconds, or how many bullets are out right now.
  
  If the enemy is shooting, maintain a distance to allow for more reaction time. 

  Gotta figure out someway to stop from being pushed into corners or walls by the player. If you're maintaining a distance, the player moving forward will push you back.
  Maybe at a certain interval or condition, try to prioritize moving into a widely open space. Might be calculated by getting its position, comparing how close it would be to the player at those x coordinates, and then making that check for each location that is:
    opposite x, same y
    opposite y, same x,
    opposite x, opposite x
    opposite y, opposite y

  and then get the top choice, move to it.
  
  
  */

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
    this.width = 15;  // Adjust the width of the rounded rectangle
    this.height = 8; // Adjust the height of the rounded rectangle
    this.angle = 0;   // New property to store the angle
  }


  update() {




    if (this.remove) {
      return;
    }
    if (this.isChild) {
      this.width = 3;
      this.height = 3;
    }
    // Calculate the direction vector towards the target
    let direction = createVector(this.targetX - this.x, this.targetY - this.y);

    // Check if the particle has reached the target
    if (dist(this.x, this.y, this.targetX, this.targetY) < this.tolerance) {
      // Update target position based on the current direction
      this.targetX += direction.x * this.speed;
      this.targetY += direction.y * this.speed;
    }


    this.angle = direction.heading(); // Calculate the angle of the vector

    // Move the bullet by a fixed amount in the calculated direction
    this.x += cos(this.angle) * this.speed;
    this.y += sin(this.angle) * this.speed;

    // Check for collisions with the enemy square, only if not child


    if (!this.isChild) {
      if (
        this.x > players[this.entityType].x - players[this.entityType].size / 2 &&
        this.x < players[this.entityType].x + players[this.entityType].size / 2 &&
        this.y > players[this.entityType].y - players[this.entityType].size / 2 &&
        this.y < players[this.entityType].y + players[this.entityType].size / 2
      ) {
        // Collision detected
        if (this.enemyCollision == true) {

                    // Check if the stunning effect is not active
      if (!this.isStunned) {
        // Apply stunning effect to the enemy
        players[this.entityType].isStunned = true;
        players[this.entityType].stunStartTime = millis();
      }

          // Get the angle of the bullet
          let angle = Math.atan2(players[this.entityType].y - this.y, players[this.entityType].x - this.x);

          // Calculate recoil distance based on bullet speed
          let recoilDistance = 25; // adjust this based on desired recoil intensity

          // Apply recoil based on angle
          let newx = Math.cos(angle) * recoilDistance;
          let newy = Math.sin(angle) * recoilDistance;

          this.shakeEnemy(3, 300, newx, newy);
          let originalEnemyColor = players[this.entityType].originalCol
          players[this.entityType].col = lerpColor(originalEnemyColor, color(255), 0.6)
          setTimeout(() => {
            players[this.entityType].col = originalEnemyColor; // Reset to original color
          }, 150); // Change this value to adjust the duration

          this.remove = true;
        }
      }

      if (this.entityType == 1) {
      for (let enemyBullet of p1Bullets) {
        if (dist(this.x, this.y, enemyBullet.x, enemyBullet.y) < 5 && enemyBullet.name == "bullet") {
          const numParticles = Math.floor(random(1, 4)); // Generate a random number between 3 and 5
          for (let i = 0; i < numParticles; i++) {
            // Create a new particle with random initial direction and short lifespan
            let angle = random(0, TWO_PI);
            let speed = random(5, 10);
            let lifespan = 50; // Set a short lifespan for child particles
            let child = new Bullet("child", this.x, this.y, this.col, this.x + cos(angle) * speed, this.y + sin(angle) * speed, true, false, lifespan);
            let child2 = new Bullet("child", enemyBullet.x, enemyBullet.y, enemyBullet.col, enemyBullet.x + cos(random(0, TWO_PI)) * random(5, 10), enemyBullet.y + sin(random(0, TWO_PI)) * random(5, 10), true, false, lifespan);
            if (this.entityType == 1) {
              p0Bullets.push(child)
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
            const numParticles = Math.floor(random(1, 4)); // Generate a random number between 3 and 5
            for (let i = 0; i < numParticles; i++) {
              // Create a new particle with random initial direction and short lifespan
              let angle = random(0, TWO_PI);
              let speed = random(5, 10);
              let lifespan = 50; // Set a short lifespan for child particles
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

    // Check for collisions with canvas bounds
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      // Collision with canvas bounds
      // Spawn smaller particles but only if it isn't already a child
      if (this.isChild == false) {
        const numParticles = Math.floor(random(4, 8)); // Generate a random number between 3 and 5
        for (let i = 0; i < numParticles; i++) {
          // Create a new particle with random initial direction and short lifespan
          let angle = random(0, TWO_PI);
          let speed = random(5, 10);
          let lifespan = 50; // Set a short lifespan for child particles
          let child = new Bullet("child", this.x, this.y, this.col, this.x + cos(angle) * speed, this.y + sin(angle) * speed, true, false, lifespan);
          if (this.entityType == 0) p1Bullets.push(child);
          if (this.entityType == 1) p0Bullets.push(child)
          
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
    rect(0, 0, this.width, this.height, 5); // Adjust the corner radius as needed
    pop();
  }

  shakeEnemy(intensity, duration, newx, newy) {

    let originalPos = { x: players[this.entityType].x += newx, y: players[this.entityType].y += newy };
    let shakeTimer = 0;
    let originalSpeed = players[this.entityType].speed;
    players[1].speed = 0;

    const shakeLoop = () => {
      if (shakeTimer < duration) {
        // Randomly offset enemy position
        players[this.entityType].size = players[this.entityType].size * (1 + Math.random() * 0.1 - 0.05);
        players[this.entityType].x = originalPos.x + Math.random() * intensity * 2 - intensity;
        players[this.entityType].y = originalPos.y + Math.random() * intensity * 2 - intensity;

        // Schedule next shake iteration
        requestAnimationFrame(shakeLoop);
      } else {
        // Reset enemy position after shaking
        players[this.entityType].x = originalPos.x + newx;
        players[this.entityType].y = originalPos.y + newy;
        players[this.entityType].size = players[this.entityType].originalSize;
        players[this.entityType].speed = players[this.entityType].originalSpeed;
      }

      shakeTimer += 6; // Adjust delay between shake steps
    };

    shakeLoop();
  }

}

/*
Checklist:

get squares: done
movement: done
bullets: done
hit animations: done
both players playable: done
bullet collision: done
stunning: done
aimbot that is harder to strafe: done 
adding basic defense ai: done
adding lethal attack:
adding basic offense ai:


add a start screen:
add a end screen:
making the game not ugly: 


*/

