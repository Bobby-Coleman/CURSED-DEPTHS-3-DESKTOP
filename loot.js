import { RelicSystem } from './relics.js';
import * as THREE from 'three';

export class LootSystem {
    constructor(scene) {
        this.scene = scene;
        this.relicSystem = new RelicSystem();
        this.drops = [];
    }
    
    generateDrop(x, y) {
        // Roll for drop type
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
            // No drop
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
        const maxRange = roomSize;
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
                // Add gold
                gameState.gold += drop.data.amount;
                break;
                
            case 'relic':
                // Check if player has room for another relic
                if (player.relics.length >= 5) {
                    return {
                        success: false,
                        message: "Cannot carry more than 5 relics!"
                    };
                }
                
                // Add relic to player
                player.relics.push(drop.data);
                drop.data.apply(player);
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
        }
        
        // Remove drop
        this.removeDrop(drop);
        
        return {
            success: true,
            message: `Picked up ${drop.type}!`
        };
    }
    
    removeDrop(drop) {
        // Remove drop's mesh from scene
        this.scene.remove(drop.mesh);
        
        // Remove from drops array
        const index = this.drops.findIndex(d => d === drop);
        if (index !== -1) {
            this.drops.splice(index, 1);
        }
    }
    
    cleanup() {
        // Remove all drops from scene
        for (const drop of this.drops) {
            this.scene.remove(drop.mesh);
        }
        
        this.drops = [];
    }
}