import * as THREE from 'three';
import { RelicSystem } from './relics.js';
import { satanDialogs } from './satan_dialog.js';

export class Shop {
    constructor(scene, currentLevel) {
        this.scene = scene;
        this.currentLevel = currentLevel;
        this.relicSystem = new RelicSystem();
        this.drops = [];
        this.bloodDrops = []; // Separate array to track blood drops
        this.items = [];
        this.isOpen = true;
        
        // Add talk button as HTML element
        const talkButton = document.createElement('button');
        talkButton.textContent = 'TALK';
        talkButton.style.position = 'absolute';
        talkButton.style.left = '20%';
        talkButton.style.top = '50%';
        talkButton.style.padding = '10px 20px';
        talkButton.style.fontSize = '16px';
        talkButton.style.cursor = 'pointer';
        talkButton.style.backgroundColor = '#ff0000';
        talkButton.style.color = 'white';
        talkButton.style.border = 'none';
        talkButton.style.borderRadius = '5px';
        document.body.appendChild(talkButton);
        this.talkButton = talkButton;

        // Add Satan sprite below button
        const satanImage = document.createElement('img');
        satanImage.src = 'assets/sprites/satan.PNG';
        satanImage.style.position = 'absolute';
        satanImage.style.left = '20%';
        satanImage.style.top = 'calc(50% + 50px)'; // Position below button
        satanImage.style.width = '64px'; // Set appropriate size
        satanImage.style.height = '64px';
        satanImage.onerror = () => {
            console.error('Failed to load Satan image:', satanImage.src);
        };
        satanImage.onload = () => {
            console.log('Satan image loaded successfully');
        };
        document.body.appendChild(satanImage);
        this.satanImage = satanImage;

        // Add click handler
        talkButton.onclick = () => {
            // Remove any existing dialog
            const existingDialog = document.getElementById('dialog');
            if (existingDialog) {
                existingDialog.remove();
            }
            
            const dialogElement = document.createElement('div');
            dialogElement.id = 'dialog';
            dialogElement.style.position = 'absolute';
            dialogElement.style.left = 'calc(20% + 80px)'; // 20% (Satan's left) + 64px (Satan width) + 16px gap
            dialogElement.style.top = 'calc(50% + 30px)'; // Align with Satan's upper portion
            dialogElement.style.backgroundColor = 'white';
            dialogElement.style.color = 'black';
            dialogElement.style.padding = '15px';
            dialogElement.style.borderRadius = '10px';
            dialogElement.style.maxWidth = '300px';
            dialogElement.style.fontFamily = 'Arial';
            dialogElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            dialogElement.style.zIndex = '1000'; // Make sure it appears above other elements
            
            // Create the triangle
            const triangle = document.createElement('div');
            triangle.style.position = 'absolute';
            triangle.style.left = '-10px';
            triangle.style.top = '20px';
            triangle.style.width = '0';
            triangle.style.height = '0';
            triangle.style.borderTop = '10px solid transparent';
            triangle.style.borderBottom = '10px solid transparent';
            triangle.style.borderRight = '10px solid white';
            
            // Add content wrapper to preserve triangle
            const contentWrapper = document.createElement('div');
            contentWrapper.style.position = 'relative';
            contentWrapper.style.minHeight = '20px';
            
            dialogElement.appendChild(triangle);
            dialogElement.appendChild(contentWrapper);
            document.body.appendChild(dialogElement);

            // Keep track of which line we're on (stored as a property of the shop)
            if (this.currentDialogIndex === undefined) {
                this.currentDialogIndex = 0;
            } else {
                // Move to the next dialog in the list
                this.currentDialogIndex = (this.currentDialogIndex + 1) % satanDialogs.length;
            }
            
            // Store the dialog element reference for cleanup
            this.dialogElement = dialogElement;
            
            let text = '';
            let charIndex = 0;
            const interval = setInterval(() => {
                if (charIndex < satanDialogs[this.currentDialogIndex].length) {
                    text += satanDialogs[this.currentDialogIndex][charIndex];
                    contentWrapper.textContent = text;
                    charIndex++;
                } else {
                    clearInterval(interval);
                    // Don't auto-remove, let the user click again to see the next dialog
                }
            }, 50);
        };
        
        // Add gift shop sprite in the center
        const textureLoader = new THREE.TextureLoader();
        const giftShopTexture = textureLoader.load('assets/sprites/giftshop.png', (texture) => {
            // Calculate aspect ratio from the loaded texture
            const aspectRatio = texture.image.width / texture.image.height;
            const height = 200; // Keep height at 200
            const width = height * aspectRatio; // Calculate width based on aspect ratio
            
            // Update geometry to match aspect ratio
            this.giftShopMesh.geometry = new THREE.PlaneGeometry(width, height);
            this.giftShopCollision.geometry = new THREE.BoxGeometry(width, height, 10);
        });
        
        // Create initial geometry (will be updated when texture loads)
        const giftShopGeometry = new THREE.PlaneGeometry(200, 200);
        const giftShopMaterial = new THREE.MeshBasicMaterial({ 
            map: giftShopTexture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false // This can help with transparency issues
        });
        this.giftShopMesh = new THREE.Mesh(giftShopGeometry, giftShopMaterial);
        this.giftShopMesh.position.set(0, 40, 1); // Move up by 40 units (20% of 200)
        this.scene.add(this.giftShopMesh);
        
        // Add collision box for gift shop (will be updated when texture loads)
        const collisionGeometry = new THREE.BoxGeometry(200, 200, 10);
        const collisionMaterial = new THREE.MeshBasicMaterial({ 
            visible: false,
            side: THREE.DoubleSide
        });
        this.giftShopCollision = new THREE.Mesh(collisionGeometry, collisionMaterial);
        this.giftShopCollision.position.set(0, 40, 0); // Move up by 40 units to match sprite
        this.scene.add(this.giftShopCollision);
        
        // For the first shop (level 2), only offer a free Blood Amplifier
        if (currentLevel === 2) {
            // Create the Blood Amplifier relic
            const bloodAmplifier = this.relicSystem.relicDefinitions.find(r => r.id === 'bloodAmplifier');
            
            // Create relic mesh
            const relicGeometry = new THREE.BoxGeometry(20, 20, 5);
            const relicMaterial = new THREE.MeshBasicMaterial({ 
                color: bloodAmplifier.color,
                emissive: 0xFFFFFF,
                emissiveIntensity: 0.5
            });
            const relicMesh = new THREE.Mesh(relicGeometry, relicMaterial);
            
            // Add glow effect
            const glowGeometry = new THREE.BoxGeometry(22, 22, 6);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            relicMesh.add(glowMesh);
            
            // Position the relic mesh in the scene
            relicMesh.position.set(0, 0, 2);
            this.scene.add(relicMesh);
            
            // Add to items array - make it free (price: 0)
            this.items.push({
                type: 'relic',
                data: bloodAmplifier,
                mesh: relicMesh,
                position: new THREE.Vector2(0, 0),
                price: 0,
                description: "This one's on the house!"
            });
        } else {
            // For other shops, generate random items as before
            this.createRelics();
        }
    }
    
    createRelics() {
        // Create three relics in the center
        const positions = [-40, 0, 40]; // Closer together
        
        positions.forEach((x) => {
            // Get random relic
            const relic = this.relicSystem.getShopRelics(1)[0];
            
            // Create relic mesh
            const relicGeometry = new THREE.BoxGeometry(20, 20, 5);
            
            // Check if this is the Two-Headed Goat relic, use special texture
            let relicMaterial;
            
            if (relic.id === 'twoHeadedGoat') {
                // Use the two-headed goat texture
                const texture = new THREE.TextureLoader().load('assets/sprites/twoheadedgoat.png');
                relicMaterial = new THREE.MeshBasicMaterial({ 
                    map: texture,
                    transparent: true
                });
            } else {
                // Regular colored box for other relics
                relicMaterial = new THREE.MeshBasicMaterial({ 
                    color: relic.color,
                    emissive: 0xFFFFFF,
                    emissiveIntensity: 0.5
                });
            }
            
            const relicMesh = new THREE.Mesh(relicGeometry, relicMaterial);
            
            // Add glow effect
            const glowGeometry = new THREE.BoxGeometry(22, 22, 6);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            relicMesh.add(glowMesh);
            
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
    
    checkItemInteraction(player, mouseX, mouseY, isClick = false) {
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
        // Check if player has enough HP to buy (all relics cost 2 HP)
        if (player.hp <= 2) {
            return { success: false, message: "Not enough HP to buy this relic!" };
        }

        // Add relic to player's inventory
        player.relics.push(item.data);
        
        // Deduct 2 HP cost
        player.hp -= 2;

        // Remove the item from the shop
        this.scene.remove(item.mesh);
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }

        return { success: true, message: `Bought ${item.data.name} for 2 HP` };
    }
    
    cleanup() {
        for (const item of this.items) {
            this.scene.remove(item.mesh);
        }
        this.items = [];
        
        // Remove gift shop sprite and collision
        this.scene.remove(this.giftShopMesh);
        this.scene.remove(this.giftShopCollision);
        
        // Remove HTML elements
        if (this.talkButton) {
            this.talkButton.remove();
        }
        if (this.satanImage) {
            this.satanImage.remove();
        }
        
        // Remove any dialog element if it exists
        if (this.dialogElement) {
            this.dialogElement.remove();
        }
        
        // Reset dialog index to start from the beginning next time
        this.currentDialogIndex = undefined;
        
        // Also check for any dialog element by ID as a fallback
        const existingDialog = document.getElementById('dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
    }
}