import * as THREE from 'three';

export class Player {
    constructor(scene) {
        // Player stats
        this.hp = 6;
        this.maxHp = 6;
        this.ammo = 300;
        this.maxAmmo = 300;
        this.speed = 5;
        this.baseDamage = this.generateRandomDamage();
        this.fireRate = this.generateRandomFireRate();
        this.lastShotTime = 0;
        this.relics = [];
        
        // Create player mesh (red square)
        const geometry = new THREE.PlaneGeometry(32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 0, 1); // Start at center
        scene.add(this.mesh);
        
        // Weapon direction indicator
        const indicatorGeometry = new THREE.PlaneGeometry(20, 5);
        const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        this.indicator.position.set(16, 0, 1.1); // Positioned in front of player
        this.mesh.add(this.indicator);
        
        // Player bullets
        this.bullets = [];
        this.bulletGeometry = new THREE.CircleGeometry(3, 8);
        this.bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        this.scene = scene;
    }
    
    generateRandomDamage() {
        // 70% chance for 1-3 damage, 30% chance for 4-5 damage
        const roll = Math.random();
        if (roll < 0.7) {
            return Math.floor(Math.random() * 3) + 1; // 1-3 damage
        } else {
            return Math.floor(Math.random() * 2) + 4; // 4-5 damage
        }
    }
    
    generateRandomFireRate() {
        // 70% chance for 1-10 bullets/second, 30% chance for 11-20 bullets/second
        const roll = Math.random();
        if (roll < 0.7) {
            return Math.floor(Math.random() * 10) + 1; // 1-10 fire rate
        } else {
            return Math.floor(Math.random() * 10) + 11; // 11-20 fire rate
        }
    }
    
    update(keys, mouse, enemies) {
        // Movement
        let moveX = 0;
        let moveY = 0;
        
        if (keys.w) moveY += this.speed;
        if (keys.s) moveY -= this.speed;
        if (keys.a) moveX -= this.speed;
        if (keys.d) moveX += this.speed;
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            const normalize = 1 / Math.sqrt(2);
            moveX *= normalize;
            moveY *= normalize;
        }
        
        // Update position
        this.mesh.position.x += moveX;
        this.mesh.position.y += moveY;
        
        // Keep player within room bounds
        const roomHalfSize = 400; // Half of ROOM_SIZE
        this.mesh.position.x = Math.max(-roomHalfSize, Math.min(roomHalfSize, this.mesh.position.x));
        this.mesh.position.y = Math.max(-roomHalfSize, Math.min(roomHalfSize, this.mesh.position.y));
        
        // Aim at mouse position
        const dx = mouse.x - this.mesh.position.x;
        const dy = mouse.y - this.mesh.position.y;
        this.mesh.rotation.z = Math.atan2(dy, dx);
        
        // Shooting
        if (mouse.isDown) {
            this.shoot();
        }
        
        // Update bullets
        this.updateBullets(enemies);
    }
    
    shoot() {
        const currentTime = performance.now();
        const shootingInterval = 1000 / this.fireRate; // Convert bullets/second to milliseconds
        
        if (currentTime - this.lastShotTime >= shootingInterval && this.ammo > 0) {
            // Create new bullet
            const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial);
            
            // Set bullet position and direction
            bullet.position.copy(this.mesh.position);
            bullet.rotation.copy(this.mesh.rotation);
            
            // Calculate velocity based on player's rotation
            const speed = 10;
            const velocityX = Math.cos(this.mesh.rotation.z) * speed;
            const velocityY = Math.sin(this.mesh.rotation.z) * speed;
            
            // Add bullet to scene and tracking array
            this.scene.add(bullet);
            this.bullets.push({
                mesh: bullet,
                velocity: { x: velocityX, y: velocityY },
                damage: this.calculateDamage()
            });
            
            // Update last shot time and ammo
            this.lastShotTime = currentTime;
            this.ammo--;
        }
    }
    
    calculateDamage() {
        // Start with base damage
        let damage = this.baseDamage;
        
        // First apply additive bonuses
        for (const relic of this.relics) {
            if (relic.id === 'ragingHeart' && window.gameState) {
                damage += window.gameState.killStreak * 2; // Add +2 damage per kill in streak
            }
            // Add other additive relic effects here
        }
        
        // Then apply multiplicative effects
        for (const relic of this.relics) {
            if (relic.id === 'hemoclawCharm') {
                const missingHP = this.maxHp - this.hp;
                damage *= (1 + (missingHP * 0.25)); // Multiply by (1 + 0.25 per missing HP)
            }
            if (relic.id === 'infernalCore') {
                // +25% damage per equipped relic (including this one)
                damage *= (1 + (this.relics.length * 0.25));
            }
            // Add other multiplicative relic effects here
        }
        
        return Math.floor(damage); // Round down to nearest integer
    }
    
    updateBullets(enemies) {
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
            
            // Check for collision with enemies
            for (const enemy of enemies) {
                const dx = bullet.mesh.position.x - enemy.mesh.position.x;
                const dy = bullet.mesh.position.y - enemy.mesh.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Collision detected (simple circle collision)
                if (distance < 20) {
                    // Apply damage to enemy
                    enemy.takeDamage(bullet.damage);
                    
                    // Remove bullet
                    this.scene.remove(bullet.mesh);
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    takeDamage(amount) {
        // Apply relic effects to damage taken (will be implemented)
        // For example: Doom's Promise - Take +50% damage
        
        this.hp -= amount;
        
        // Reset kill streak and damage bonus if hit
        if (window.gameState) {
            window.gameState.killStreak = 0;
            this.baseDamage = this.generateRandomDamage(); // Reset to original base damage
        }
    }
    
    addRelic(relic) {
        if (this.relics.length < 5) {
            this.relics.push(relic);
            // Apply relic effects (will be implemented)
            return true;
        }
        return false;
    }
}