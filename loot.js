import { RelicSystem } from './relics.js';
import * as THREE from 'three';

export class LootSystem {
    constructor(scene) {
        this.scene = scene;
        this.relicSystem = new RelicSystem();
        this.drops = [];
        this.bloodDrops = []; // Separate array to track blood drops
    }
    
    generateDrop(x, y) {
        // Always drop blood when enemy dies
        this.createBloodDrop(x, y);
        
        // 30% chance to drop a heart, otherwise only blood
        const roll = Math.random();
        if (roll < 0.3) {
            // Add LARGER random offset to prevent overlap with blood
            const offsetX = (Math.random() - 0.5) * 80; // -40 to +40 pixels X offset
            const offsetY = (Math.random() - 0.5) * 80; // -40 to +40 pixels Y offset
            
            // Always offset heart 10 units to the right to ensure it's not under blood
            const heartDrop = this.createHeartDrop(x + offsetX + 10, y + offsetY);
            if (heartDrop) {
                this.drops.push(heartDrop);
            }
            return heartDrop;
        }
        
        // No additional drop
        return null;
    }
    
    createBloodDrop(x, y) {
        // Create blood drop group to hold both the blood and glow
        const group = new THREE.Group();
        group.position.set(x, y, 0.5); // Lower z-index to 0.5 (below hearts at 1000)
        
        // Create glow effect
        const glowGeometry = new THREE.CircleGeometry(24, 32); // Larger radius for glow
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF0000, // Bright red for the glow
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending // Makes it look more like a glow
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glowMesh);
        
        // Create blood
        const bloodGeometry = new THREE.CircleGeometry(12, 16);
        const bloodMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xAA0000, // Dark red for the blood
            transparent: true,
            opacity: 0.9
        });
        const bloodMesh = new THREE.Mesh(bloodGeometry, bloodMaterial);
        bloodMesh.position.z = 0.1; // Slightly in front of the glow
        group.add(bloodMesh);
        
        this.scene.add(group);
        
        const bloodDrop = {
            type: 'blood',
            data: {
                amount: 10, // Base blood amount
                creationTime: performance.now(), // Track when the blood was created
                blinking: false
            },
            mesh: group,
            bloodMesh: bloodMesh,
            glowMesh: glowMesh
        };
        
        this.bloodDrops.push(bloodDrop);
        return bloodDrop;
    }
    
    createWeaponDrop(x, y) {
        // Create random weapon
        const damage = this.generateRandomDamage();
        const fireRate = this.generateRandomFireRate();
        const range = this.generateRandomRange();
        
        console.log('Creating weapon drop with range:', range);
        
        // Create mesh
        const geometry = new THREE.BoxGeometry(20, 10, 5);
        const material = new THREE.MeshBasicMaterial({ color: 0xD3D3D3 }); // Light gray
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, 1);
        this.scene.add(mesh);
        
        const weaponDrop = {
            type: 'weapon',
            data: {
                damage,
                fireRate,
                range
            },
            mesh: mesh
        };
        
        console.log('Weapon drop created:', weaponDrop);
        return weaponDrop;
    }
    
    createHeartDrop(x, y) {
        // Create a heart shape using custom geometry
        const heartShape = new THREE.Shape();
        
        // Draw heart shape - make it larger and simpler
        const scale = 2.5; // Make heart larger
        heartShape.moveTo(0, 0);
        heartShape.bezierCurveTo(0, -5 * scale, -10 * scale, -15 * scale, -20 * scale, 0);
        heartShape.bezierCurveTo(-30 * scale, 15 * scale, -10 * scale, 35 * scale, 0, 20 * scale);
        heartShape.bezierCurveTo(10 * scale, 35 * scale, 30 * scale, 15 * scale, 20 * scale, 0);
        heartShape.bezierCurveTo(10 * scale, -15 * scale, 0, -5 * scale, 0, 0);
        
        // Create geometry from heart shape
        const geometry = new THREE.ShapeGeometry(heartShape);
        
        // Create material with brighter purple color and higher opacity
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xBF00FF, // Bright purple
            transparent: true,
            opacity: 0.9, // Higher opacity
            depthTest: false,
            side: THREE.DoubleSide // Render both sides
        });
        
        // Create mesh with very high z-index to ensure visibility
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, 50); // Increase z-index to 50
        
        // Rotate to orient properly
        mesh.rotation.z = Math.PI;
        
        this.scene.add(mesh);
        
        // Play heart drop sound
        this.playHeartDropSound();
        
        return {
            type: 'heart',
            data: {
                amount: 1
            },
            mesh: mesh
        };
    }
    
    // Play sound when heart drops
    playHeartDropSound() {
        // Create audio context if it doesn't exist
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Create oscillator for a short chime sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Configure sound - higher pitch chime sound
        oscillator.type = 'sine'; // Sine wave for smooth chime
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5 note
        oscillator.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.1); // Up to E6
        
        // Set volume with slight fade-in and fade-out
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        // Play sound
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    createGoldDrop(x, y) {
        // Create gold
        const geometry = new THREE.CircleGeometry(8, 6);
        const material = new THREE.MeshBasicMaterial({ color: 0xFFD700 }); // Gold
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, 1);
        this.scene.add(mesh);
        
        return {
            type: 'gold',
            data: {
                amount: 3
            },
            mesh: mesh
        };
    }
    
    createRelicDrop(x, y) {
        // Get random relic
        const relic = this.relicSystem.getRandomRelic();
        
        // Create mesh
        const geometry = new THREE.BoxGeometry(15, 15, 5);
        const material = new THREE.MeshBasicMaterial({ 
            color: relic.color,
            emissive: 0xFFFFFF,
            emissiveIntensity: 0.5
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Add glow effect
        const glowGeometry = new THREE.BoxGeometry(17, 17, 6);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glowMesh);
        
        mesh.position.set(x, y, 1);
        this.scene.add(mesh);
        
        return {
            type: 'relic',
            data: relic,
            mesh: mesh
        };
    }
    
    createAmmoDrop(x, y) {
        // Create ammo
        const geometry = new THREE.BoxGeometry(10, 15, 5);
        const material = new THREE.MeshBasicMaterial({ color: 0xC0C0C0 }); // Silver
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, 1);
        this.scene.add(mesh);
        
        return {
            type: 'ammo',
            data: {
                amount: 10
            },
            mesh: mesh
        };
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
    
    generateRandomRange() {
        const roomSize = 800;
        const minRange = Math.floor(roomSize / 4);
        const maxRange = 350; // Changed from roomSize (800) to 350 as requested
        return Math.floor(Math.random() * (maxRange - minRange) + minRange);
    }
    
    checkPickup(player, ui) {
        // Check if player is close enough to any drops
        for (let i = this.drops.length - 1; i >= 0; i--) {
            const drop = this.drops[i];
            
            // Calculate distance to player
            const dx = player.mesh.position.x - drop.mesh.position.x;
            const dy = player.mesh.position.y - drop.mesh.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If player is close enough, show popup
            if (distance < 30) {
                // Always show popup in top right corner
                const screenX = window.innerWidth - 200; // 200 pixels from right edge
                const screenY = 100; // 100 pixels from top
                
                // Show popup
                ui.showItemPopup(drop, screenX, screenY);
                
                return drop;
            }
        }
        
        // No drops nearby
        ui.hidePopup();
        return null;
    }
    
    pickupDrop(player, drop, gameState) {
        // Process pickup based on drop type
        switch (drop.type) {
            case 'weapon':
                // Replace player's weapon
                console.log('Attempting to pick up weapon:', drop);
                console.log('Weapon data:', drop.data);
                console.log('Weapon range:', drop.data.range);
                player.baseDamage = drop.data.damage;
                player.fireRate = drop.data.fireRate;
                player.weaponRange = drop.data.range;
                console.log('Player weapon range after pickup:', player.weaponRange);
                break;
                
            case 'heart':
                // Cannot pickup hearts if Hemoclaw Charm is equipped
                if (player.canHeal === false) {
                    return {
                        success: false,
                        message: "You cannot pick up hearts due to Hemoclaw Charm's curse!"
                    };
                }
                
                // Heal player
                if (player.hp < player.maxHp) {
                    player.hp = Math.min(player.maxHp, player.hp + drop.data.amount);
                    // Show +1 HP text effect
                    this.showHeartPickupText();
                } else {
                    return {
                        success: false,
                        message: "Already at max HP!"
                    };
                }
                break;
                
            case 'gold':
                // Add HP instead of gold
                player.hp = Math.min(player.maxHp, player.hp + drop.data.amount);
                break;
                
            case 'ammo':
                // Add ammo
                if (player.ammo < player.maxAmmo) {
                    player.ammo = Math.min(player.maxAmmo, player.ammo + drop.data.amount);
                } else {
                    return {
                        success: false,
                        message: "Already at max ammo!"
                    };
                }
                break;
                
            case 'relic':
                // Check if player has enough HP to pick up relic
                if (player.hp <= 4) {
                    return {
                        success: false,
                        message: "Need 4 HP to pick up relic!"
                    };
                }
                
                // Check if player has max relics already
                if (player.relics.length >= 5) {
                    return {
                        success: false,
                        message: "You already have the maximum number of relics!"
                    };
                }
                
                // Deduct HP and add relic to player
                player.hp -= 4;
                player.addRelic(drop.data);
                break;
        }
        
        // Remove drop from scene and array
        this.scene.remove(drop.mesh);
        const index = this.drops.indexOf(drop);
        if (index > -1) {
            this.drops.splice(index, 1);
        }
        
        return {
            success: true
        };
    }
    
    // Show +1 HP text in the middle of the screen
    showHeartPickupText() {
        // Create the text element
        const textElement = document.createElement('div');
        textElement.textContent = '+1 HP!';
        textElement.style.position = 'absolute';
        textElement.style.left = '50%';
        textElement.style.top = '50%';
        textElement.style.transform = 'translate(-50%, -50%)';
        textElement.style.color = '#FF0000'; // Bright red
        textElement.style.fontFamily = 'Arial, sans-serif';
        textElement.style.fontSize = '48px'; // Medium-large text
        textElement.style.fontWeight = 'bold';
        textElement.style.textShadow = '2px 2px 4px #000000'; // Black shadow for visibility
        textElement.style.zIndex = '1000'; // Make sure it appears on top
        textElement.style.pointerEvents = 'none'; // Don't interfere with game input
        
        // Add to the document
        document.body.appendChild(textElement);
        
        // Remove after 500ms (half a second)
        setTimeout(() => {
            if (textElement.parentNode) {
                textElement.parentNode.removeChild(textElement);
            }
        }, 500);
    }
    
    // Update blood drops (call this in the game loop)
    updateBloodDrops() {
        const currentTime = performance.now();
        
        for (let i = this.bloodDrops.length - 1; i >= 0; i--) {
            const blood = this.bloodDrops[i];
            const age = currentTime - blood.data.creationTime;
            
            // Start blinking when blood is about to disappear (last 2 seconds)
            if (age > 8000 && !blood.data.blinking) {
                blood.data.blinking = true;
            }
            
            // Remove blood after 10 seconds
            if (age > 10000) {
                this.scene.remove(blood.mesh);
                this.bloodDrops.splice(i, 1);
                continue;
            }
            
            // Animate glow
            if (blood.glowMesh) {
                // Pulse the glow
                const pulseSpeed = 0.003;
                const pulseAmount = 0.2;
                const baseOpacity = 0.4;
                const pulseFactor = Math.sin(currentTime * pulseSpeed) * pulseAmount + baseOpacity;
                blood.glowMesh.material.opacity = blood.data.blinking ? pulseFactor * 2 : pulseFactor;
                
                // Scale the glow slightly
                const scaleBase = 1;
                const scalePulse = Math.sin(currentTime * pulseSpeed) * 0.1 + scaleBase;
                blood.glowMesh.scale.set(scalePulse, scalePulse, 1);
            }
            
            // Blink the blood drop if it's about to disappear
            if (blood.data.blinking) {
                const blinkSpeed = 0.01;
                blood.bloodMesh.material.opacity = (Math.sin(currentTime * blinkSpeed) + 1) / 2;
            }
        }
    }
    
    checkBloodPickup(player) {
        // Check if player is close enough to any blood drops
        for (let i = this.bloodDrops.length - 1; i >= 0; i--) {
            const bloodDrop = this.bloodDrops[i];
            
            // Calculate distance to player
            const dx = player.mesh.position.x - bloodDrop.mesh.position.x;
            const dy = player.mesh.position.y - bloodDrop.mesh.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If player is close enough, collect the blood
            if (distance < 30) {
                // Add blood to player's total
                if (window.gameState) {
                    window.gameState.blood = (window.gameState.blood || 0) + bloodDrop.data.amount;
                }
                
                // Remove blood drop
                this.scene.remove(bloodDrop.mesh);
                this.bloodDrops.splice(i, 1);
            }
        }
    }
    
    cleanup() {
        // Remove drops
        for (const drop of this.drops) {
            this.scene.remove(drop.mesh);
        }
        this.drops = [];
        
        // Remove blood drops
        for (const bloodDrop of this.bloodDrops) {
            this.scene.remove(bloodDrop.mesh);
        }
        this.bloodDrops = [];
    }
    
    update(player, gameState) {
        // Update existing drops
        for (let i = this.drops.length - 1; i >= 0; i--) {
            const drop = this.drops[i];
            
            // Check distance to player
            const dx = drop.mesh.position.x - player.mesh.position.x;
            const dy = drop.mesh.position.y - player.mesh.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Auto-pickup hearts when close enough
            if (drop.type === 'heart' && distance < 30) {
                const result = this.pickupDrop(player, drop, gameState);
                if (result.success) {
                    this.scene.remove(drop.mesh);
                    this.drops.splice(i, 1);
                }
            }
        }
    }
}