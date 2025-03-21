import * as THREE from 'three';

export class Enemy {
    constructor(scene, x, y, type, level) {
        this.scene = scene;
        this.type = type; // 0: basic, 1: shooter, 2: fast
        this.level = level;
        
        // Enemy stats scaled by level (1.1x per level)
        const levelMultiplier = Math.pow(1.1, level - 1);
        
        // Set enemy properties based on type
        if (type === 0) { // Basic monster
            this.baseHp = 15;
            this.speed = 2;
            this.attackDamage = 1;
            this.attackRange = 30;
            this.color = 0x00FF00; // Green
            this.geometry = new THREE.CircleGeometry(16, 3); // Triangle
        } else if (type === 1) { // Shooter
            this.baseHp = 9;
            this.speed = 1;
            this.attackDamage = 1;
            this.attackRange = 200;
            this.color = 0x0000FF; // Blue
            this.geometry = new THREE.CircleGeometry(16, 32); // Circle
            this.shootCooldown = 3000; // 3 seconds
            this.lastShotTime = 0;
        } else { // Fast monster
            this.baseHp = 6;
            this.speed = 4;
            this.attackDamage = 1;
            this.attackRange = 30;
            this.color = 0xFFFF00; // Yellow
            this.geometry = new THREE.CircleGeometry(16, 4); // Diamond
        }
        
        // Apply level scaling
        this.hp = Math.ceil(this.baseHp * levelMultiplier);
        this.maxHp = this.hp;
        this.attackDamage = Math.ceil(this.attackDamage * levelMultiplier);
        
        // Create enemy mesh
        const material = new THREE.MeshBasicMaterial({ color: this.color });
        this.mesh = new THREE.Mesh(this.geometry, material);
        this.mesh.position.set(x, y, 1);
        scene.add(this.mesh);
        
        // Create health bar
        const healthBarWidth = 32;
        const healthBarHeight = 4;
        const healthBarGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 }); // Red for health
        this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        this.healthBar.position.set(0, 24, 0); // Position above enemy
        this.mesh.add(this.healthBar);
        
        // Create health bar background
        const healthBarBgGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
        const healthBarBgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black background
        this.healthBarBg = new THREE.Mesh(healthBarBgGeometry, healthBarBgMaterial);
        this.healthBarBg.position.set(0, 24, -0.1); // Slightly behind health bar
        this.mesh.add(this.healthBarBg);
        
        // Create health number display
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('15/15', 32, 16);
        
        const texture = new THREE.CanvasTexture(canvas);
        const healthNumberMaterial = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true
        });
        const healthNumberGeometry = new THREE.PlaneGeometry(32, 16);
        this.healthNumber = new THREE.Mesh(healthNumberGeometry, healthNumberMaterial);
        this.healthNumber.position.set(0, 30, 0);
        this.mesh.add(this.healthNumber);
        
        // Store canvas context for updates
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Bullets array for shooter type
        this.bullets = [];
        this.bulletGeometry = new THREE.CircleGeometry(5, 8);
        this.bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
        
        // Aggro state
        this.aggroRange = 200;
        this.isAggro = false;
        
        // Update health bar initially
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        const healthPercent = this.hp / this.maxHp;
        this.healthBar.scale.x = Math.max(0, healthPercent);
        this.healthBar.position.x = -16 * (1 - healthPercent);

        // Update health number
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.hp}/${this.maxHp}`, 32, 16);
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
        
        // Set aggro if player is within range
        if (distanceToPlayer <= this.aggroRange) {
            this.isAggro = true;
        }
        
        // Only take action if aggro
        if (this.isAggro) {
            if (this.type === 1) { // Shooter type enemy
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
            } else { // Melee types (basic and fast)
                // Move toward player
                if (distanceToPlayer > this.attackRange) {
                    this.mesh.position.x += (dx / distanceToPlayer) * this.speed;
                    this.mesh.position.y += (dy / distanceToPlayer) * this.speed;
                }
                
                // Face player
                this.mesh.rotation.z = Math.atan2(dy, dx);
                
                // Attack player if in range
                if (distanceToPlayer <= this.attackRange) {
                    this.attack(player);
                }
            }
        }
        
        // Update bullets
        this.updateBullets(player);
    }
    
    shoot(player) {
        const currentTime = performance.now();
        
        if (currentTime - this.lastShotTime >= this.shootCooldown) {
            // Create new bullet
            const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial);
            
            // Set bullet position and direction
            bullet.position.copy(this.mesh.position);
            bullet.rotation.copy(this.mesh.rotation);
            
            // Calculate velocity based on enemy's rotation
            const speed = 5;
            const velocityX = Math.cos(this.mesh.rotation.z) * speed;
            const velocityY = Math.sin(this.mesh.rotation.z) * speed;
            
            // Add bullet to scene and tracking array
            this.scene.add(bullet);
            this.bullets.push({
                mesh: bullet,
                velocity: { x: velocityX, y: velocityY }
            });
            
            // Update last shot time
            this.lastShotTime = currentTime;
        }
    }
    
    updateBullets(player) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Update bullet position
            bullet.mesh.position.x += bullet.velocity.x;
            bullet.mesh.position.y += bullet.velocity.y;
            
            // Check if bullet is out of bounds
            const roomSize = 800;
            if (
                bullet.mesh.position.x < -roomSize / 2 || 
                bullet.mesh.position.x > roomSize / 2 ||
                bullet.mesh.position.y < -roomSize / 2 || 
                bullet.mesh.position.y > roomSize / 2
            ) {
                this.scene.remove(bullet.mesh);
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check for collision with player
            const dx = bullet.mesh.position.x - player.mesh.position.x;
            const dy = bullet.mesh.position.y - player.mesh.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Collision detected (simple circle collision)
            if (distance < 20) {
                // Apply damage to player
                player.takeDamage(this.attackDamage);
                
                // Remove bullet
                this.scene.remove(bullet.mesh);
                this.bullets.splice(i, 1);
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