import * as THREE from 'three';

export class Enemy {
    constructor(scene, x, y, type, level) {
        this.scene = scene;
        this.type = type; // 0: basic, 1: shooter, 2: fast, 3: bomber
        this.level = level;
        
        // Enemy stats scaled by level (1.1x per level)
        const levelMultiplier = Math.pow(1.1, level - 1);
        
        // Set enemy properties based on type
        if (type === 0) { // Basic monster
            this.baseHp = 15;
            this.speed = 2;
            this.attackDamage = 1;
            this.attackRange = 30;
            
            // Create mesh first
            const geometry = new THREE.PlaneGeometry(64, 64);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00FF00, // Temporary color until texture loads
                transparent: true,
                alphaTest: 0.1,
                side: THREE.DoubleSide,
                depthTest: true,
                depthWrite: true
            });
            this.mesh = new THREE.Mesh(geometry, material);
            
            // Load basic monster sprite sheet
            const texture = new THREE.TextureLoader().load('assets/sprites/basic_monster.png', 
                // Success callback
                (loadedTexture) => {
                    console.log('Sprite sheet loaded successfully');
                    this.mesh.material.map = loadedTexture;
                    this.mesh.material.needsUpdate = true;
                    this.mesh.material.color.setHex(0xFFFFFF); // Reset to white when texture loads
                },
                // Progress callback
                undefined,
                // Error callback
                (error) => {
                    console.error('Error loading sprite sheet:', error);
                }
            );
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            
            // Animation setup for basic monster
            this.setupAnimationFrames();
            
        } else if (type === 1) { // Shooter
            this.baseHp = 9;
            this.speed = 1;
            this.attackDamage = 1;
            this.attackRange = 200;
            this.shootCooldown = 3000; // 3 seconds
            this.lastShotTime = 0;
            
            const geometry = new THREE.CircleGeometry(16, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0x0000FF,
                transparent: true
            });
            this.mesh = new THREE.Mesh(geometry, material);
            
        } else if (type === 3) { // Bomber
            this.baseHp = 12;
            this.speed = 1.5;
            this.attackDamage = 1;
            this.explosionDamage = 3;
            this.attackRange = 250;
            this.shootCooldown = 4000;
            this.lastShotTime = 0;
            
            const geometry = new THREE.CircleGeometry(20, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0xFF6600,
                transparent: true
            });
            this.mesh = new THREE.Mesh(geometry, material);
            
            // Create explosion effect mesh
            const explosionGeometry = new THREE.CircleGeometry(50, 32);
            const explosionMaterial = new THREE.MeshBasicMaterial({
                color: 0xFF0000,
                transparent: true,
                opacity: 0.5
            });
            this.explosionMesh = new THREE.Mesh(explosionGeometry, explosionMaterial);
            this.explosionMesh.visible = false;
            scene.add(this.explosionMesh);
            
        } else { // Fast monster
            this.baseHp = 6;
            this.speed = 4;
            this.attackDamage = 1;
            this.attackRange = 30;
            
            const geometry = new THREE.CircleGeometry(16, 4);
            const material = new THREE.MeshBasicMaterial({
                color: 0xFFFF00,
                transparent: true
            });
            this.mesh = new THREE.Mesh(geometry, material);
        }
        
        // Position mesh
        this.mesh.position.set(x, y, 1);
        scene.add(this.mesh);
        
        // Apply level scaling
        this.hp = Math.ceil(this.baseHp * levelMultiplier);
        this.maxHp = this.hp;
        this.attackDamage = Math.ceil(this.attackDamage * levelMultiplier);
        
        // Create health bar and UI elements
        this.createHealthUI();
        
        // Bullets array for shooter type
        this.bullets = [];
        this.bulletGeometry = new THREE.CircleGeometry(5, 8);
        this.bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
        
        // Aggro state
        this.aggroRange = 200;
        this.isAggro = false;
        
        // Add random movement properties
        this.randomMoveTimer = 0;
        this.randomMoveInterval = 3000; // Change direction every 3 seconds
        this.randomDirection = { x: 0, y: 0 };
        this.setNewRandomDirection();
    }
    
    setupAnimationFrames() {
        this.frameCount = 4;
        this.currentFrame = 0;
        this.frameTime = 0;
        this.animationSpeed = 150;
        
        // Create UV coordinates for each frame
        this.frames = [];
        const frameWidth = 1/4;
        const frameHeight = 1/4;
        
        for (let dir = 0; dir < 4; dir++) {
            for (let frame = 0; frame < 4; frame++) {
                this.frames.push({
                    x: frame * frameWidth,
                    y: dir * frameHeight,
                    width: frameWidth,
                    height: frameHeight
                });
            }
        }
        
        // Set initial UV coordinates
        this.updateUVs(0);
    }
    
    createHealthUI() {
        // Create health bar
        const healthBarWidth = 64;
        const healthBarHeight = 6;
        const healthBarGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
        this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        this.healthBar.position.set(0, 48, 0);
        this.mesh.add(this.healthBar);
        
        // Create health bar background
        const healthBarBgGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
        const healthBarBgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.healthBarBg = new THREE.Mesh(healthBarBgGeometry, healthBarBgMaterial);
        this.healthBarBg.position.set(0, 48, -0.1);
        this.mesh.add(this.healthBarBg);
        
        // Create health number display
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.hp}/${this.maxHp} ATK:${this.attackDamage}`, 64, 16);
        
        const texture = new THREE.CanvasTexture(canvas);
        const healthNumberMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });
        const healthNumberGeometry = new THREE.PlaneGeometry(64, 16);
        this.healthNumber = new THREE.Mesh(healthNumberGeometry, healthNumberMaterial);
        this.healthNumber.position.set(0, 56, 0);
        this.mesh.add(this.healthNumber);
        
        // Store canvas context for updates
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Update health bar initially
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        const healthPercent = this.hp / this.maxHp;
        this.healthBar.scale.x = Math.max(0, healthPercent);
        this.healthBar.position.x = -32 * (1 - healthPercent);

        // Update health and attack number
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.hp}/${this.maxHp} ATK:${this.attackDamage}`, 64, 16);
        this.healthNumber.material.map.needsUpdate = true;
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        this.updateHealthBar();
    }
    
    cleanup() {
        // Remove bullets
        for (const bullet of this.bullets) {
            this.scene.remove(bullet.mesh);
        }
        this.bullets = [];
        
        // Remove enemy mesh (which will also remove health bar, background, and text)
        this.scene.remove(this.mesh);
    }
    
    updateUVs(frameIndex) {
        const frame = this.frames[frameIndex];
        const uvs = this.mesh.geometry.attributes.uv;
        const uvArray = [
            frame.x, frame.y + frame.height,
            frame.x + frame.width, frame.y + frame.height,
            frame.x, frame.y,
            frame.x + frame.width, frame.y
        ];
        uvs.set(uvArray);
        uvs.needsUpdate = true;
    }

    getDirectionFrame(dx, dy) {
        // Calculate angle to player
        const angle = Math.atan2(dy, dx);
        
        // Convert angle to direction index (0: down, 1: left, 2: right, 3: up)
        // Offset by PI/4 to create 90-degree segments centered on each direction
        const normalized = ((angle + Math.PI * 5/4) % (Math.PI * 2)) / (Math.PI * 2);
        const direction = Math.floor(normalized * 4);
        
        // Map angle to sprite sheet rows
        switch(direction) {
            case 0: return 0; // Down
            case 1: return 1; // Left
            case 2: return 2; // Right
            case 3: return 3; // Up
            default: return 0;
        }
    }

    setNewRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        this.randomDirection.x = Math.cos(angle);
        this.randomDirection.y = Math.sin(angle);
    }

    update(player) {
        // Make text always face camera at the start of each update
        if (this.healthText) {
            this.healthText.rotation.copy(this.mesh.rotation);
            this.healthText.rotation.z = 0;
        }
        
        // Update stats display position
        this.updateHealthBar();
        
        // Check aggro range
        const dx = player.mesh.position.x - this.mesh.position.x;
        const dy = player.mesh.position.y - this.mesh.position.y;
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
        
        // Set aggro if player is within range, or de-aggro if player is too far
        const deAggroRange = this.aggroRange * 1.5; // De-aggro at 1.5x aggro range
        if (distanceToPlayer <= this.aggroRange) {
            this.isAggro = true;
        } else if (distanceToPlayer > deAggroRange) {
            this.isAggro = false;
        }
        
        const currentTime = performance.now();
        
        // Only take action if aggro
        if (this.isAggro) {
            if (this.type === 1) {
                // Move to maintain distance if too close or too far
                const optimalRange = 150;
                if (distanceToPlayer < optimalRange - 30) {
                    // Move away from player
                    this.mesh.position.x -= (dx / distanceToPlayer) * this.speed * 0.5;
                    this.mesh.position.y -= (dy / distanceToPlayer) * this.speed * 0.5;
                } else if (distanceToPlayer > optimalRange + 30) {
                    // Move toward player
                    this.mesh.position.x += (dx / distanceToPlayer) * this.speed * 0.5;
                    this.mesh.position.y += (dy / distanceToPlayer) * this.speed * 0.5;
                }
                
                // Face player
                this.mesh.rotation.z = Math.atan2(dy, dx);
                
                // Shoot at player if in range and cooldown is over
                if (distanceToPlayer <= this.attackRange) {
                    this.shoot(player);
                }
            } else if (this.type === 3) { // Bomber
                // Move to maintain distance if too close or too far
                const optimalRange = 200;
                if (distanceToPlayer < optimalRange - 50) {
                    // Move away from player
                    this.mesh.position.x -= (dx / distanceToPlayer) * this.speed;
                    this.mesh.position.y -= (dy / distanceToPlayer) * this.speed;
                } else if (distanceToPlayer > optimalRange + 50) {
                    // Move toward player
                    this.mesh.position.x += (dx / distanceToPlayer) * this.speed;
                    this.mesh.position.y += (dy / distanceToPlayer) * this.speed;
                }
                
                // Face player
                this.mesh.rotation.z = Math.atan2(dy, dx);
                
                // Shoot bombs at player if in range
                if (distanceToPlayer <= this.attackRange) {
                    this.shoot(player);
                }
            } else { // Melee types (basic and fast)
                // Move toward player if not in attack range
                if (distanceToPlayer > this.attackRange) {
                    this.mesh.position.x += (dx / distanceToPlayer) * this.speed;
                    this.mesh.position.y += (dy / distanceToPlayer) * this.speed;
                    
                    // Update animation for basic monster
                    if (this.type === 0) {
                        if (currentTime - this.frameTime > this.animationSpeed) {
                            this.frameTime = currentTime;
                            this.currentFrame = (this.currentFrame + 1) % 4;
                            
                            // Calculate direction based on movement
                            let direction;
                            const angle = Math.atan2(dy, dx);
                            const degrees = ((angle * 180 / Math.PI) + 360) % 360;
                            
                            // Map angles to directions:
                            // Up: 225-315 degrees (row 0)
                            // Right: 315-45 degrees (row 1)
                            // Down: 45-135 degrees (row 2)
                            // Left: 135-225 degrees (row 3)
                            if (degrees >= 225 && degrees < 315) {
                                direction = 1; // Right (when going up)
                            } else if (degrees >= 315 || degrees < 45) {
                                direction = 2; // Down (when going right)
                            } else if (degrees >= 45 && degrees < 135) {
                                direction = 3; // Left (when going down)
                            } else {
                                direction = 0; // Up (when going left)
                            }
                            
                            this.updateUVs(direction * 4 + this.currentFrame);
                        }
                    } else {
                        // For fast monster, keep the rotation
                        this.mesh.rotation.z = Math.atan2(dy, dx);
                    }
                }
                
                // Attack player if in range
                if (distanceToPlayer <= this.attackRange) {
                    this.attack(player);
                }
            }
        } else if (this.type === 0 || this.type === 2) { // Random movement for non-aggro basic monster and yellow monster
            // Update random movement direction
            if (currentTime - this.randomMoveTimer > this.randomMoveInterval) {
                this.setNewRandomDirection();
                this.randomMoveTimer = currentTime;
            }
            
            // Move in random direction at half speed (quarter speed for yellow monster when not aggro'd)
            const nonAggroSpeed = this.type === 2 ? this.speed * 0.15 : this.speed * 0.5;
            this.mesh.position.x += this.randomDirection.x * nonAggroSpeed;
            this.mesh.position.y += this.randomDirection.y * nonAggroSpeed;
            
            // Update animation based on random movement (only for basic monster)
            if (this.type === 0 && currentTime - this.frameTime > this.animationSpeed) {
                this.frameTime = currentTime;
                this.currentFrame = (this.currentFrame + 1) % 4;
                
                // Calculate direction based on random movement
                const angle = Math.atan2(this.randomDirection.y, this.randomDirection.x);
                const degrees = ((angle * 180 / Math.PI) + 360) % 360;
                
                let direction;
                if (degrees >= 225 && degrees < 315) {
                    direction = 1; // Right (when going up)
                } else if (degrees >= 315 || degrees < 45) {
                    direction = 2; // Down (when going right)
                } else if (degrees >= 45 && degrees < 135) {
                    direction = 3; // Left (when going down)
                } else {
                    direction = 0; // Up (when going left)
                }
                
                this.updateUVs(direction * 4 + this.currentFrame);
            }
        }
        
        // Keep enemies within bounds (assuming room size of 800)
        const roomSize = 800;
        const boundaryPadding = 50;
        if (this.mesh.position.x < -roomSize/2 + boundaryPadding || 
            this.mesh.position.x > roomSize/2 - boundaryPadding ||
            this.mesh.position.y < -roomSize/2 + boundaryPadding || 
            this.mesh.position.y > roomSize/2 - boundaryPadding) {
            
            // If near boundary, keep the enemy inside
            this.mesh.position.x = Math.max(-roomSize/2 + boundaryPadding, 
                Math.min(roomSize/2 - boundaryPadding, this.mesh.position.x));
            this.mesh.position.y = Math.max(-roomSize/2 + boundaryPadding, 
                Math.min(roomSize/2 - boundaryPadding, this.mesh.position.y));
            
            if (!this.isAggro) {
                // Only change random direction if not aggro'd
                this.setNewRandomDirection();
                this.randomMoveTimer = currentTime;
                
                // Ensure the new direction points away from the boundary
                if (this.mesh.position.x < -roomSize/2 + boundaryPadding && this.randomDirection.x < 0) {
                    this.randomDirection.x *= -1;
                }
                if (this.mesh.position.x > roomSize/2 - boundaryPadding && this.randomDirection.x > 0) {
                    this.randomDirection.x *= -1;
                }
                if (this.mesh.position.y < -roomSize/2 + boundaryPadding && this.randomDirection.y < 0) {
                    this.randomDirection.y *= -1;
                }
                if (this.mesh.position.y > roomSize/2 - boundaryPadding && this.randomDirection.y > 0) {
                    this.randomDirection.y *= -1;
                }
            }
        }
        
        // Update bullets
        this.updateBullets(player);
    }
    
    shoot(player) {
        const currentTime = performance.now();
        
        if (this.type === 1) { // Regular shooter
            if (currentTime - this.lastShotTime > this.shootCooldown) {
                this.lastShotTime = currentTime;
                
                // Create bullet
                const bullet = {
                    mesh: new THREE.Mesh(this.bulletGeometry, this.bulletMaterial),
                    dx: 0,
                    dy: 0,
                    speed: 5,
                    damage: this.attackDamage
                };
                
                // Position bullet at enemy
                bullet.mesh.position.copy(this.mesh.position);
                
                // Calculate direction to player
                const dx = player.mesh.position.x - this.mesh.position.x;
                const dy = player.mesh.position.y - this.mesh.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Set bullet velocity
                bullet.dx = (dx / distance) * bullet.speed;
                bullet.dy = (dy / distance) * bullet.speed;
                
                // Add to scene and bullets array
                this.scene.add(bullet.mesh);
                this.bullets.push(bullet);
            }
        } else if (this.type === 3) { // Bomber
            if (currentTime - this.lastShotTime > this.shootCooldown) {
                this.lastShotTime = currentTime;
                
                // Create bomb
                const bomb = {
                    mesh: new THREE.Mesh(this.bulletGeometry, this.bulletMaterial),
                    dx: 0,
                    dy: 0,
                    speed: 3,
                    damage: this.attackDamage,
                    explosionDamage: this.explosionDamage,
                    timeCreated: currentTime
                };
                
                // Position bomb at enemy
                bomb.mesh.position.copy(this.mesh.position);
                
                // Calculate direction to player
                const dx = player.mesh.position.x - this.mesh.position.x;
                const dy = player.mesh.position.y - this.mesh.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Set bomb velocity
                bomb.dx = (dx / distance) * bomb.speed;
                bomb.dy = (dy / distance) * bomb.speed;
                
                // Add to scene and bullets array
                this.scene.add(bomb.mesh);
                this.bullets.push(bomb);
            }
        }
    }
    
    updateBullets(player) {
        const roomSize = 800;
        const boundaryPadding = 50;
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Move bullet
            bullet.mesh.position.x += bullet.dx;
            bullet.mesh.position.y += bullet.dy;
            
            if (this.type === 1) { // Regular shooter bullets
                // Check if bullet hits boundary
                if (bullet.mesh.position.x < -roomSize/2 + boundaryPadding || 
                    bullet.mesh.position.x > roomSize/2 - boundaryPadding ||
                    bullet.mesh.position.y < -roomSize/2 + boundaryPadding || 
                    bullet.mesh.position.y > roomSize/2 - boundaryPadding) {
                    // Remove bullet
                    this.scene.remove(bullet.mesh);
                    this.bullets.splice(i, 1);
                    continue;
                }
            } else if (this.type === 3) { // Bomber's bombs
                const currentTime = performance.now();
                
                // Check if bomb should stop (after 2 seconds of movement)
                const shouldStop = currentTime - bullet.timeCreated > 2000;
                
                // Check if bomb hits wall and should bounce
                const hitLeftWall = bullet.mesh.position.x < -roomSize/2 + boundaryPadding;
                const hitRightWall = bullet.mesh.position.x > roomSize/2 - boundaryPadding;
                const hitTopWall = bullet.mesh.position.y > roomSize/2 - boundaryPadding;
                const hitBottomWall = bullet.mesh.position.y < -roomSize/2 + boundaryPadding;
                
                // Bounce off walls if still moving
                if (!bullet.timeStopped) {
                    if (hitLeftWall || hitRightWall) {
                        bullet.dx *= -1;
                    }
                    if (hitTopWall || hitBottomWall) {
                        bullet.dy *= -1;
                    }
                    
                    // Keep bomb in bounds
                    bullet.mesh.position.x = Math.max(-roomSize/2 + boundaryPadding, 
                        Math.min(roomSize/2 - boundaryPadding, bullet.mesh.position.x));
                    bullet.mesh.position.y = Math.max(-roomSize/2 + boundaryPadding, 
                        Math.min(roomSize/2 - boundaryPadding, bullet.mesh.position.y));
                }
                
                // Stop the bomb after 2 seconds of movement
                if (shouldStop && !bullet.timeStopped) {
                    bullet.dx = 0;
                    bullet.dy = 0;
                    bullet.timeStopped = currentTime;
                }
                
                // Explode only after stopping and waiting 2 seconds
                if (bullet.timeStopped && currentTime - bullet.timeStopped > 2000) {
                    // Show explosion effect
                    this.explosionMesh.position.copy(bullet.mesh.position);
                    this.explosionMesh.visible = true;
                    
                    // Check for player in explosion radius
                    const dx = player.mesh.position.x - bullet.mesh.position.x;
                    const dy = player.mesh.position.y - bullet.mesh.position.y;
                    const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distanceToPlayer < 50) {
                        player.takeDamage(3);
                        console.log("BOOM! Player took explosion damage!");
                    }
                    
                    // Remove bomb
                    this.scene.remove(bullet.mesh);
                    this.bullets.splice(i, 1);
                    
                    // Hide explosion effect after 200ms
                    setTimeout(() => {
                        this.explosionMesh.visible = false;
                    }, 200);
                    
                    continue;
                }
            }
        }
    }
    
    attack(player) {
        // Basic melee attack logic - attacks happen automatically when in range
        // We'll use a simple cooldown system for melee attacks too
        const currentTime = performance.now();
        
        if (!this.lastAttackTime || currentTime - this.lastAttackTime >= 1000) {
            player.takeDamage(this.attackDamage);
            this.lastAttackTime = currentTime;
        }
    }
}