import * as THREE from 'three';

export class Player {
    constructor(scene, camera, isMobile = false) {
        this.scene = scene;
        this.camera = camera;
        this.isMobile = isMobile;
        this.hp = 15;
        this.maxHp = 15;
        this.ammo = 3000;
        this.maxAmmo = 3000;
        this.isDead = false;
        this.relics = [];
        this.canSellRelics = true;
        this.canHeal = true;
        this.baseDamage = 1;
        this.damageMultiplier = 1;
        this.damageTakenMultiplier = 1;
        this.fireRate = 5;
        this.lastFireTime = 0;
        this.weaponRange = 350;
        this.healOnKill = 0;
        
        this.speed = this.isMobile ? 2.5 : 4.5;
        
        this.isInvulnerable = false;
        this.invulnerabilityTime = 250;
        this.lastDamageTime = 0;
        
        const geometry = new THREE.PlaneGeometry(80, 80);
        const material = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: true
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 0, 1);
        scene.add(this.mesh);

        const texture = new THREE.TextureLoader().load('assets/sprites/player.png',
            (loadedTexture) => {
                console.log('Player sprite sheet loaded successfully');
                this.mesh.material.map = loadedTexture;
                this.mesh.material.needsUpdate = true;
                
                this.createShadow(scene, loadedTexture);
            },
            undefined,
            (error) => {
                console.error('Error loading player sprite sheet:', error);
                this.mesh.material.color.setHex(0xFF0000);
            }
        );
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        this.setupAnimationFrames();
        
        const indicatorGeometry = new THREE.PlaneGeometry(25, 6);
        const indicatorMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            visible: false
        });
        this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        this.indicator.position.set(40, 0, 1.1);
        this.mesh.add(this.indicator);
        
        this.bullets = [];
        this.bulletGeometry = new THREE.CircleGeometry(4, 8);
        this.bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        this.bulletSpeed = 12;
        
        this.autoAimEnabled = false;
        this.autoAimRange = 250;
        this.currentAimAngle = 0;
        
        this.createFloatingHPText();
    }
    
    createShadow(scene, texture) {
        const shadowGeometry = new THREE.PlaneGeometry(80, 80);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            color: 0x000000,
            transparent: true,
            opacity: 0.2,
            alphaTest: 0.1,
            side: THREE.DoubleSide
        });
        
        this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.shadow.position.set(
            this.mesh.position.x + 12,
            this.mesh.position.y + 12,
            0.5
        );
        
        scene.add(this.shadow);
    }
    
    generateRandomDamage() {
        return 3;
    }
    
    generateRandomFireRate() {
        return 5;
    }
    
    generateRandomRange() {
        return 350;
    }
    
    setupAnimationFrames() {
        this.frameCount = 4;
        this.currentFrame = 0;
        this.frameTime = 0;
        this.animationSpeed = 150;
        this.lastDirection = 0;
        
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
        
        this.updateUVs(0);
    }

    updateUVs(frameIndex) {
        if (!this.mesh.geometry.attributes.uv) return;
        
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
        
        if (this.shadow && this.shadow.geometry.attributes.uv) {
            const shadowUvs = this.shadow.geometry.attributes.uv;
            shadowUvs.set(uvArray);
            shadowUvs.needsUpdate = true;
        }
    }

    update(keys, mouse, mobileInput, enemies, deltaTime) {
        if (this.isInvulnerable) {
            const currentTime = performance.now();
            if (currentTime - this.lastDamageTime > this.invulnerabilityTime) {
                this.isInvulnerable = false;
                this.mesh.visible = true;
                this.mesh.material.opacity = 1.0;
            } else {
                const flashPhase = Math.floor((currentTime - this.lastDamageTime) / 100) % 2; 
                this.mesh.visible = flashPhase === 0;
            }
        } else {
            this.mesh.visible = true;
            this.mesh.material.opacity = 1.0; 
        }
        
        let moveX = 0;
        let moveY = 0;
        let aimAngle = this.currentAimAngle;
        let shootInput = false;
        
        if (this.isMobile && mobileInput) {
            if (mobileInput.isMoving) {
                moveX = mobileInput.moveVector.x * this.speed * (deltaTime * 60);
                moveY = mobileInput.moveVector.y * this.speed * (deltaTime * 60);
            }
            if (mobileInput.isAiming) {
                aimAngle = mobileInput.aimAngle;
            }
            shootInput = mobileInput.isShooting;
            
        } else if (keys && mouse) {
            let dx = 0, dy = 0;
            if (keys.w) dy += 1;
            if (keys.s) dy -= 1;
            if (keys.a) dx -= 1;
            if (keys.d) dx += 1;

            const magnitude = Math.sqrt(dx * dx + dy * dy);
            if (magnitude > 0) {
                moveX = (dx / magnitude) * this.speed * (deltaTime * 60);
                moveY = (dy / magnitude) * this.speed * (deltaTime * 60);
            }
            
            const aimDX = mouse.x - this.mesh.position.x;
            const aimDY = mouse.y - this.mesh.position.y;
            aimAngle = Math.atan2(aimDY, aimDX);

            shootInput = mouse.isDown;
        }
        
        this.mesh.position.x += moveX;
        this.mesh.position.y += moveY;
        
        this.currentAimAngle = aimAngle;
        
        this.updateAnimation(moveX, moveY, aimAngle, deltaTime);
        
        if (shootInput) {
            this.shoot();
        }
        
        this.updateBullets(enemies, deltaTime);
        
        this.updateHPTextPosition();
    }
    
    updateAnimation(moveX, moveY, aimAngle, deltaTime) {
        this.frameTime += deltaTime * 1000;

        if (this.frameTime >= this.animationSpeed) {
            this.frameTime = 0;

            if (moveX !== 0 || moveY !== 0) {
                this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            }

            const degrees = ((aimAngle * 180 / Math.PI) + 360) % 360;
            let direction;
            if (degrees >= 45 && degrees < 135) {
                direction = 0;
            } else if (degrees >= 135 && degrees < 225) {
                direction = 3;
            } else if (degrees >= 225 && degrees < 315) {
                direction = 2;
            } else {
                direction = 1;
            }
            
            const frameIndex = direction * this.frameCount + this.currentFrame;
            this.updateUVs(frameIndex);
        }

        this.indicator.rotation.z = aimAngle;
    }

    shoot() {
        const currentTime = performance.now();
        const shootingInterval = 1000 / this.fireRate;
        
        if (currentTime - this.lastFireTime >= shootingInterval && this.ammo > 0) {
            this.lastFireTime = currentTime;
            this.ammo--;

            const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial.clone());
            bullet.position.copy(this.mesh.position);
            bullet.position.z = 0.8;

            const velocityX = Math.cos(this.currentAimAngle) * this.bulletSpeed;
            const velocityY = Math.sin(this.currentAimAngle) * this.bulletSpeed;
            
            const bulletDamage = this.calculateDamage();
            
            this.scene.add(bullet);
            this.bullets.push({
                mesh: bullet,
                velocity: { x: velocityX, y: velocityY },
                damage: bulletDamage,
                range: this.weaponRange,
                distanceTraveled: 0
            });
        }
    }
    
    calculateDamage() {
        let damage = this.baseDamage;
        console.log('Starting base damage:', damage);
        console.log('Current kill streak:', window.gameState?.killStreak);
        
        for (const relic of this.relics) {
            if (relic.id === 'ragingHeart' && window.gameState) {
                damage += window.gameState.killStreak * 2;
            }
        }
        
        let multiplier = 1;
        for (const relic of this.relics) {
            console.log('Checking relic:', relic.id);
            if (relic.id === 'hemoclawCharm') {
                const missingHP = this.maxHp - this.hp;
                multiplier *= (1 + (missingHP * 0.25));
            }
            if (relic.id === 'infernalCore') {
                multiplier *= (1 + (this.relics.length * 0.25));
            }
            if (relic.id === 'executionersSeal') {
                console.log('Found Executioners Seal');
                if (window.gameState && window.gameState.killStreak > 20) {
                    console.log('Kill streak > 20, applying 3x multiplier');
                    multiplier *= 3;
                }
            }
        }
        
        console.log('Final multiplier:', multiplier);
        damage *= multiplier;
        console.log('Final damage after multiplier:', damage);
        
        return Math.floor(damage);
    }
    
    updateBullets(enemies, deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            const speedScale = deltaTime * 60;
            
            bullet.mesh.position.x += bullet.velocity.x * speedScale;
            bullet.mesh.position.y += bullet.velocity.y * speedScale;
            
            const distanceThisFrame = Math.sqrt(
                (bullet.velocity.x * speedScale) ** 2 + 
                (bullet.velocity.y * speedScale) ** 2
            );
            bullet.distanceTraveled += distanceThisFrame;
            
            const roomSize = 800;
            if (bullet.distanceTraveled >= bullet.range ||
                Math.abs(bullet.mesh.position.x) > roomSize / 2 ||
                Math.abs(bullet.mesh.position.y) > roomSize / 2)
            {
                this.scene.remove(bullet.mesh);
                this.bullets.splice(i, 1);
                continue;
            }
            
            for (const enemy of enemies) {
                if (!enemy || !enemy.mesh) continue;
                
                const dx = bullet.mesh.position.x - enemy.mesh.position.x;
                const dy = bullet.mesh.position.y - enemy.mesh.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const collisionThreshold = (enemy.collisionRadius || 20) + (this.bulletGeometry.parameters.radius || 3); 
                
                if (distance < collisionThreshold) {
                    enemy.takeDamage(bullet.damage);
                    
                    this.scene.remove(bullet.mesh);
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    takeDamage(amount) {
        if (this.isInvulnerable) {
            return;
        }
        
        let damageMultiplier = 1;
        for (const relic of this.relics) {
            if (relic.id === 'executionersSeal') {
                damageMultiplier *= 2;
            }
            if (relic.id === 'doomsPromise') {
                damageMultiplier *= 1.5;
            }
        }

        this.hp -= Math.ceil(amount * damageMultiplier);
        this.hp = Math.max(0, this.hp);
        
        if (window.gameState) {
            window.gameState.killStreak = 0;
        }
        
        this.playDamageSound();
        
        this.mesh.material.color.set(0xFF0000);
        
        setTimeout(() => {
            this.mesh.material.color.set(0xFFFFFF);
        }, 200);
        
        this.isInvulnerable = true;
        this.lastDamageTime = performance.now();
    }
    
    playDamageSound() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    addRelic(relic) {
        this.relics.push(relic);
        
        if (relic.onEquip) {
            relic.onEquip(this);
        }
        
        if (relic.apply) {
            relic.apply(this);
        }
    }
    
    removeRelic(index) {
        const relic = this.relics[index];
        if (relic) {
            if (relic.onUnequip) {
                relic.onUnequip(this);
            }
            this.relics.splice(index, 1);
        }
    }
    
    onKill() {
        if (this.healOnKill > 0) {
            this.hp = Math.min(this.maxHp, this.hp + this.healOnKill);
        }
    }

    cleanup() {
        for (const bullet of this.bullets) {
            if (bullet.mesh) {
                this.scene.remove(bullet.mesh);
            }
        }
        this.bullets = [];
        
        if (this.shadow) {
            this.scene.remove(this.shadow);
        }
        
        this.scene.remove(this.mesh);
        
        if (this.hpText) {
            document.body.removeChild(this.hpText);
        }
    }

    createFloatingHPText() {
        this.hpText = document.createElement('div');
        this.hpText.style.position = 'absolute';
        this.hpText.style.color = '#FF0000';
        this.hpText.style.fontFamily = 'Arial, sans-serif';
        this.hpText.style.fontWeight = 'bold';
        this.hpText.style.fontSize = '20px';
        this.hpText.style.textShadow = '2px 2px 2px #000000';
        this.hpText.style.pointerEvents = 'none';
        this.hpText.style.zIndex = '1000';
        this.hpText.textContent = this.hp.toString();
        document.body.appendChild(this.hpText);
        
        this.updateHPTextPosition();
    }
    
    updateHPTextPosition() {
        if (!this.hpText || !this.mesh || !this.camera) return;
        
        const width = window.innerWidth, height = window.innerHeight;
        const vector = this.mesh.position.clone().project(this.camera);

        const x = (vector.x * 0.5 + 0.5) * width;
        const y = (-vector.y * 0.5 + 0.5) * height;

        this.hpText.style.left = `${x - this.hpText.offsetWidth / 2}px`;
        this.hpText.style.top = `${y - 50}px`;

        this.hpText.textContent = this.hp.toString();
    }
}