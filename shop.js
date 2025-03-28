import * as THREE from 'three';
import { RelicSystem } from './relics.js';

export class Shop {
    constructor(scene, currentLevel) {
        this.scene = scene;
        this.currentLevel = currentLevel;
        this.relicSystem = new RelicSystem();
        this.drops = [];
        this.bloodDrops = []; // Separate array to track blood drops
        this.items = [];
        this.isOpen = true;
        
        // For the first shop (level 2), only offer a free Blood Amplifier
        if (currentLevel === 2) {
            // Create the Blood Amplifier relic
            const bloodAmplifier = this.relicSystem.relicDefinitions.find(r => r.id === 'bloodAmplifier');
            
            // Create relic mesh
            const relicGeometry = new THREE.CircleGeometry(20, 16);
            const relicMaterial = new THREE.MeshBasicMaterial({ 
                color: bloodAmplifier.color,
                transparent: true,
                opacity: 0.8
            });
            const relicMesh = new THREE.Mesh(relicGeometry, relicMaterial);
            
            // Position the relic mesh in the scene
            relicMesh.position.set(0, 0, 2); // Centered at origin, slightly above floor
            this.scene.add(relicMesh);
            
            // Add to items array - make it free (price: 0)
            this.items.push({
                type: 'relic',
                data: bloodAmplifier,
                mesh: relicMesh,
                position: new THREE.Vector2(0, 0),
                price: 0, // Free
                description: "This one's on the house!" // Special message
            });
        } else {
            // For other shops, generate random items as before
            this.generateItems();
        }
    }
    
    generateItems() {
        // Create three relics in the center
        const positions = [-40, 0, 40]; // Closer together
        
        positions.forEach((x) => {
            // Get random relic
            const relic = this.relicSystem.getShopRelics(1)[0];
            
            // Create relic mesh
            const relicGeometry = new THREE.BoxGeometry(20, 20, 5);
            const relicMaterial = new THREE.MeshBasicMaterial({ color: relic.color });
            const relicMesh = new THREE.Mesh(relicGeometry, relicMaterial);
            
            // Position relic
            relicMesh.position.set(x, 0, 2); // Centered at y=0
            this.scene.add(relicMesh);
            
            // Add to items array
            this.items.push({
                type: 'relic',
                data: relic,
                mesh: relicMesh,
                position: new THREE.Vector2(x, 0),
                price: 15
            });
        });
    }
    
    checkItemInteraction(player, mouseX, mouseY) {
        // Simple distance check from player to shop center
        const playerDistance = Math.sqrt(
            Math.pow(player.mesh.position.x, 2) + 
            Math.pow(player.mesh.position.y, 2)
        );
        
        if (playerDistance > 100) { // Reduced interaction range
            return null;
        }
        
        // Check each relic
        for (const item of this.items) {
            const distance = Math.sqrt(
                Math.pow(mouseX - item.position.x, 2) + 
                Math.pow(mouseY - item.position.y, 2)
            );
            
            if (distance < 20) { // Smaller interaction radius
                return item;
            }
        }
        
        return null;
    }
    
    buyItem(player, item, gameState) {
        // Check if player has enough HP
        if (player.hp <= item.price) {
            return {
                success: false,
                message: "Not enough HP!"
            };
        }
        
        // Check if player has max relics
        if (player.relics.length >= 5) {
            return {
                success: false,
                message: "Cannot carry more than 5 relics!"
            };
        }
        
        // Add relic to player and deduct HP
        player.addRelic(item.data);
        player.hp -= item.price;
        
        // Remove item from shop
        this.scene.remove(item.mesh);
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }
        
        return {
            success: true,
            message: `Purchased ${item.data.name}!`
        };
    }
    
    cleanup() {
        for (const item of this.items) {
            this.scene.remove(item.mesh);
        }
        this.items = [];
    }
}