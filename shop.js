import * as THREE from 'three';

export class Shop {
    constructor(scene, relicSystem) {
        this.scene = scene;
        this.relicSystem = relicSystem;
        this.items = [];
        this.isOpen = true;
        
        // Create shop items
        this.createShopItems();
    }
    
    createShopItems() {
        // Create shop altar
        const altarGeometry = new THREE.BoxGeometry(200, 100, 10);
        const altarMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 }); // Brown
        this.altar = new THREE.Mesh(altarGeometry, altarMaterial);
        this.altar.position.set(0, 0, 0.5);
        this.scene.add(this.altar);
        
        // Add text labels for shop items
        const labelContainer = document.createElement('div');
        labelContainer.style.position = 'absolute';
        labelContainer.style.top = '50%';
        labelContainer.style.left = '50%';
        labelContainer.style.transform = 'translate(-50%, -50%)';
        labelContainer.style.display = 'flex';
        labelContainer.style.gap = '80px';
        labelContainer.style.color = 'white';
        labelContainer.style.fontFamily = 'Arial';
        labelContainer.style.textAlign = 'center';
        labelContainer.style.textShadow = '2px 2px black';
        labelContainer.style.userSelect = 'none';
        labelContainer.style.pointerEvents = 'none';
        labelContainer.innerHTML = `
            <div>
                <div>Weapon (10g)</div>
                <div style="color: #88FF88">Press E</div>
            </div>
            <div>
                <div>Relic (15g)</div>
                <div style="color: #88FF88">Press E</div>
            </div>
            <div>
                <div>Remove Curse (10g)</div>
                <div style="color: #88FF88">Press E</div>
            </div>
        `;
        document.body.appendChild(this.labelContainer = labelContainer);
        
        // Create item pedestals
        const pedestalGeometry = new THREE.BoxGeometry(30, 10, 5);
        const pedestalMaterial = new THREE.MeshBasicMaterial({ color: 0xD3D3D3 }); // Light gray

        // Create weapon pedestal
        const weaponPedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        weaponPedestal.position.set(-50, -20, 2);
        this.scene.add(weaponPedestal);

        // Create relic pedestal
        const relicPedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        relicPedestal.position.set(0, -20, 2);
        this.scene.add(relicPedestal);

        // Create curse removal shrine
        const shrineGeometry = new THREE.CylinderGeometry(15, 15, 30, 32);
        const shrineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 }); // Gold
        const shrine = new THREE.Mesh(shrineGeometry, shrineMaterial);
        shrine.position.set(50, -20, 2);
        this.scene.add(shrine);
        
        // Create weapons for sale
        this.createWeapons();
        
        // Create relics for sale
        this.createRelics();
        
        // Create curse removal option
        this.createCurseRemoval();
    }
    
    createWeapons() {
        // Create random weapon for sale
        const weapon = {
            type: 'weapon',
            price: 10,
            damage: this.generateRandomDamage(),
            fireRate: this.generateRandomFireRate()
        };
        
        // Create weapon mesh
        const weaponGeometry = new THREE.BoxGeometry(20, 10, 5);
        const weaponMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 }); // Red
        const weaponMesh = new THREE.Mesh(weaponGeometry, weaponMaterial);
        
        // Position on pedestal
        weaponMesh.position.set(-50, -10, 5);
        
        // Add to scene
        this.scene.add(weaponMesh);
        
        // Add to items array
        this.items.push({
            type: 'weapon',
            data: weapon,
            mesh: weaponMesh,
            position: { x: -50, y: -10 },
            price: 10
        });
    }
    
    createRelics() {
        // Get random relic from relic system
        const shopRelic = this.relicSystem.getShopRelics(1)[0];
        
        // Create relic mesh
        const relicGeometry = new THREE.BoxGeometry(20, 20, 5);
        const relicMaterial = new THREE.MeshBasicMaterial({ color: shopRelic.color });
        const relicMesh = new THREE.Mesh(relicGeometry, relicMaterial);
        
        // Position on pedestal
        relicMesh.position.set(0, -10, 5);
        
        // Add to scene
        this.scene.add(relicMesh);
        
        // Add to items array
        this.items.push({
            type: 'relic',
            data: shopRelic,
            mesh: relicMesh,
            position: { x: 0, y: -10 },
            price: 15
        });
    }
    
    createCurseRemoval() {
        // Create curse removal option
        const removalGeometry = new THREE.SphereGeometry(10, 32, 32);
        const removalMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 }); // Gold
        const removalMesh = new THREE.Mesh(removalGeometry, removalMaterial);
        
        // Position on shrine
        removalMesh.position.set(50, -10, 5);
        
        // Add to scene
        this.scene.add(removalMesh);
        
        // Add to items array
        this.items.push({
            type: 'curseRemoval',
            data: {
                successChance: 0.25
            },
            mesh: removalMesh,
            position: { x: 50, y: -10 },
            price: 10
        });
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
    
    checkItemInteraction(player, mouseX, mouseY, gameState) {
        // Check if player is near altar
        const distanceToAltar = Math.sqrt(
            Math.pow(player.mesh.position.x - this.altar.position.x, 2) +
            Math.pow(player.mesh.position.y - this.altar.position.y, 2)
        );
        
        if (distanceToAltar > 150) {
            return null;
        }
        
        // Convert world coordinates to screen coordinates
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        
        // Check if mouse is over an item
        for (const item of this.items) {
            // Convert item position to screen coordinates
            const screenX = (item.position.x / 400 + 0.5) * canvasWidth;
            const screenY = (-item.position.y / 400 + 0.5) * canvasHeight;
            
            // Check if mouse is over item (simple circle)
            const distance = Math.sqrt(
                Math.pow(mouseX - screenX, 2) +
                Math.pow(mouseY - screenY, 2)
            );
            
            if (distance < 30) {
                return item;
            }
        }
        
        return null;
    }
    
    buyItem(player, item, gameState) {
        // Check if player has enough gold
        if (gameState.gold < item.price) {
            return {
                success: false,
                message: "Not enough gold!"
            };
        }
        
        // Process purchase based on item type
        switch (item.type) {
            case 'weapon':
                // Replace player's weapon
                player.baseDamage = item.data.damage;
                player.fireRate = item.data.fireRate;
                gameState.gold -= item.price;
                
                return {
                    success: true,
                    message: `Purchased new pistol with ${item.data.damage} damage and ${item.data.fireRate} fire rate!`
                };
                
            case 'relic':
                // Check if player has room for another relic
                if (player.relics.length >= 5) {
                    return {
                        success: false,
                        message: "Cannot carry more than 5 relics!"
                    };
                }
                
                // Add relic to player
                player.relics.push(item.data);
                item.data.apply(player);
                gameState.gold -= item.price;
                
                // Remove item from shop
                this.removeItem(item);
                
                return {
                    success: true,
                    message: `Purchased ${item.data.name}!`
                };
                
            case 'curseRemoval':
                // Check if player has any cursed relics
                const cursedRelics = player.relics.filter(r => r.curse);
                if (cursedRelics.length === 0) {
                    return {
                        success: false,
                        message: "You don't have any cursed relics!"
                    };
                }
                
                // Roll for success
                if (Math.random() < item.data.successChance) {
                    // Success - remove a random curse
                    const randomCursedRelic = cursedRelics[Math.floor(Math.random() * cursedRelics.length)];
                    randomCursedRelic.curse = null;
                    gameState.gold -= item.price;
                    
                    return {
                        success: true,
                        message: `Successfully removed curse from ${randomCursedRelic.name}!`
                    };
                } else {
                    // Failure - still costs gold
                    gameState.gold -= item.price;
                    
                    return {
                        success: false,
                        message: "Failed to remove curse! Better luck next time."
                    };
                }
        }
    }
    
    removeItem(item) {
        // Remove item's mesh from scene
        this.scene.remove(item.mesh);
        
        // Remove from items array
        const index = this.items.findIndex(i => i === item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    }
    
    cleanup() {
        // Remove all shop objects from scene
        this.scene.remove(this.altar);
        
        for (const item of this.items) {
            this.scene.remove(item.mesh);
        }
        
        // Remove labels
        if (this.labelContainer) {
            document.body.removeChild(this.labelContainer);
        }
        
        this.items = [];
    }
}