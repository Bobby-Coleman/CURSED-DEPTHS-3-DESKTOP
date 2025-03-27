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
        
        // Roll for additional drops
        const roll = Math.random();
        let dropType;
        
        if (roll < 0.15) {
            dropType = 'weapon';
        } else if (roll < 0.30) {
            dropType = 'heart';
        } else if (roll < 0.45) {
            dropType = 'gold';
        } else if (roll < 0.55) {
            dropType = 'relic';
        } else if (roll < 0.75) {
            dropType = 'ammo';
        } else {
            // No additional drop
            return null;
        }
        
        // Create drop based on type
        let drop;
        
        switch (dropType) {
            case 'weapon':
                drop = this.createWeaponDrop(x, y);
                break;
            case 'heart':
                drop = this.createHeartDrop(x, y);
                break;
            case 'gold':
                drop = this.createGoldDrop(x, y);
                break;
            case 'relic':
                drop = this.createRelicDrop(x, y);
                break;
            case 'ammo':
                drop = this.createAmmoDrop(x, y);
                break;
        }
        
        if (drop) {
            this.drops.push(drop);
        }
        
        return drop;
    }
    
    createBloodDrop(x, y) {
        // Create blood
        const geometry = new THREE.CircleGeometry(12, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xAA0000, // Dark red
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, 1);
        this.scene.add(mesh);
        
        const bloodDrop = {
            type: 'blood',
            data: {
                amount: 10, // Base blood amount
                creationTime: performance.now(), // Track when the blood was created
                blinking: false
            },
            mesh: mesh
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
        // Create heart
        const geometry = new THREE.CircleGeometry(10, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xFF69B4 }); // Pink
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, 1);
        this.scene.add(mesh);
        
        return {
            type: 'heart',
            data: {
                amount: 1
            },
            mesh: mesh
        };
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
        const material = new THREE.MeshBasicMaterial({ color: relic.color });
        const mesh = new THREE.Mesh(geometry, material);
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
    
    // Update blood drops (call this in the game loop)
    updateBloodDrops() {
        const currentTime = performance.now();
        
        // Process each blood drop
        for (let i = this.bloodDrops.length - 1; i >= 0; i--) {
            const bloodDrop = this.bloodDrops[i];
            const lifespan = currentTime - bloodDrop.data.creationTime;
            
            // Start blinking after 7 seconds
            if (lifespan > 7000 && !bloodDrop.data.blinking) {
                bloodDrop.data.blinking = true;
            }
            
            // Make it blink
            if (bloodDrop.data.blinking) {
                // Blink at 8 times per second
                bloodDrop.mesh.visible = Math.floor(currentTime / 125) % 2 === 0;
            }
            
            // Remove after 10 seconds
            if (lifespan > 10000) {
                this.scene.remove(bloodDrop.mesh);
                this.bloodDrops.splice(i, 1);
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
}