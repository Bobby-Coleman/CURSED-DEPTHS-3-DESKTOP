import * as THREE from 'three';

export class Level {
    constructor(scene, roomSize, levelNumber) {
        this.scene = scene;
        this.roomSize = roomSize;
        this.levelNumber = levelNumber;
        this.portalActive = false;
        
        // Create room
        this.createRoom();
        
        // Add obstacles
        this.createObstacles();
        
        // Add tomb in the center
        this.createTomb();
    }
    
    createRoom() {
        // Create floor
        const floorGeometry = new THREE.PlaneGeometry(this.roomSize, this.roomSize);
        const floorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x228B22, // Jungle green
            side: THREE.DoubleSide
        });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.position.z = 0;
        this.scene.add(this.floor);
        
        // Create walls
        const wallThickness = 20;
        const wallColor = 0x654321; // Brown
        
        // Top wall
        const topWallGeometry = new THREE.PlaneGeometry(this.roomSize + wallThickness * 2, wallThickness);
        const topWallMaterial = new THREE.MeshBasicMaterial({ color: wallColor });
        this.topWall = new THREE.Mesh(topWallGeometry, topWallMaterial);
        this.topWall.position.set(0, this.roomSize / 2 + wallThickness / 2, 1);
        this.scene.add(this.topWall);
        
        // Bottom wall
        const bottomWallGeometry = new THREE.PlaneGeometry(this.roomSize + wallThickness * 2, wallThickness);
        const bottomWallMaterial = new THREE.MeshBasicMaterial({ color: wallColor });
        this.bottomWall = new THREE.Mesh(bottomWallGeometry, bottomWallMaterial);
        this.bottomWall.position.set(0, -this.roomSize / 2 - wallThickness / 2, 1);
        this.scene.add(this.bottomWall);
        
        // Left wall
        const leftWallGeometry = new THREE.PlaneGeometry(wallThickness, this.roomSize);
        const leftWallMaterial = new THREE.MeshBasicMaterial({ color: wallColor });
        this.leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
        this.leftWall.position.set(-this.roomSize / 2 - wallThickness / 2, 0, 1);
        this.scene.add(this.leftWall);
        
        // Right wall
        const rightWallGeometry = new THREE.PlaneGeometry(wallThickness, this.roomSize);
        const rightWallMaterial = new THREE.MeshBasicMaterial({ color: wallColor });
        this.rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
        this.rightWall.position.set(this.roomSize / 2 + wallThickness / 2, 0, 1);
        this.scene.add(this.rightWall);
    }
    
    createObstacles() {
        // Create random rocks/obstacles
        const numObstacles = Math.floor(Math.random() * 6) + 4; // 4-9 obstacles
        
        const obstacleGeometry = new THREE.CircleGeometry(20, 6);
        const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 }); // Gray
        
        for (let i = 0; i < numObstacles; i++) {
            // Create obstacle
            const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
            
            // Position randomly, but not in center where player spawns
            let x, y;
            do {
                x = Math.random() * (this.roomSize - 100) - (this.roomSize / 2 - 50);
                y = Math.random() * (this.roomSize - 100) - (this.roomSize / 2 - 50);
            } while (Math.sqrt(x * x + y * y) < 100); // Keep away from center
            
            obstacle.position.set(x, y, 1);
            this.scene.add(obstacle);
        }
    }
    
    createTomb() {
        // Divide the tomb into two parts: the base (bottom part) and the top part
        const tombTexture = new THREE.TextureLoader().load('assets/sprites/tomb.png');
        
        // Get dimensions that will be used for both parts
        const tombWidth = 120;
        const tombHeight = 160; // Total height
        const halfHeight = tombHeight / 2; // Each part is 50% of total height
        
        // Create top part of the tomb (the part players can walk behind)
        const tombTopGeometry = new THREE.PlaneGeometry(tombWidth, halfHeight);
        const tombTopMaterial = new THREE.MeshBasicMaterial({ 
            map: tombTexture,
            transparent: true
        });
        
        // Set top part to use the top 50% of the texture
        const topUvs = tombTopGeometry.attributes.uv;
        const topUvArray = [
            0, 1,           // bottom left
            1, 1,           // bottom right
            0, 0.5,         // top left (50/50 split)
            1, 0.5          // top right (50/50 split)
        ];
        topUvs.set(topUvArray);
        topUvs.needsUpdate = true;
        
        this.tombTop = new THREE.Mesh(tombTopGeometry, tombTopMaterial);
        this.tombTop.position.set(0, halfHeight/2, 1.2); // In front of player (z > 1)
        this.scene.add(this.tombTop);
        
        // Create base part of the tomb (the part players can't walk behind)
        const tombBaseGeometry = new THREE.PlaneGeometry(tombWidth, halfHeight);
        const tombBaseMaterial = new THREE.MeshBasicMaterial({ 
            map: tombTexture,
            transparent: true
        });
        
        // Set base to use only the bottom 50% of the texture
        const baseUvs = tombBaseGeometry.attributes.uv;
        const baseUvArray = [
            0, 0.5,         // bottom left (50/50 split)
            1, 0.5,         // bottom right (50/50 split)
            0, 0,           // top left
            1, 0            // top right
        ];
        baseUvs.set(baseUvArray);
        baseUvs.needsUpdate = true;
        
        this.tombBase = new THREE.Mesh(tombBaseGeometry, tombBaseMaterial);
        this.tombBase.position.set(0, -halfHeight/2, 0.8); // Behind player (z < 1)
        this.scene.add(this.tombBase);
        
        // Store object properties for collision and reference
        this.objectProperties = {
            width: tombWidth,
            height: tombHeight,
            baseHeight: halfHeight,
            baseY: -halfHeight/2
        };
        
        // Create shadow using the same texture
        const shadowGeometry = new THREE.PlaneGeometry(tombWidth, tombHeight);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            map: tombTexture,
            transparent: true,
            opacity: 0.2,
            color: 0x000000, // Makes the texture black
            depthWrite: false // Prevents z-fighting with the floor
        });
        
        this.tombShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        // Position shadow slightly to the top right of the tomb
        this.tombShadow.position.set(12, 12, 0.5); 
        this.scene.add(this.tombShadow);
    }
    
    activateTomb() {
        // Change tomb texture to glowing eyes version when portal is activated
        const glowTexture = new THREE.TextureLoader().load('assets/sprites/tomb_eye_glow.png');
        
        // Update both parts of the tomb
        this.tombTop.material.map = glowTexture;
        this.tombTop.material.needsUpdate = true;
        
        this.tombBase.material.map = glowTexture;
        this.tombBase.material.needsUpdate = true;
        
        // Update shadow texture as well
        this.tombShadow.material.map = glowTexture;
        this.tombShadow.material.needsUpdate = true;
    }
    
    activatePortal(x = 200, y = 0) {
        this.portalActive = true;
        
        // Change tomb appearance
        this.activateTomb();
        
        // Create portal mesh
        const portalGeometry = new THREE.CircleGeometry(30, 32);
        const portalMaterial = new THREE.MeshBasicMaterial({ color: 0x800080 }); // Purple
        this.portal = new THREE.Mesh(portalGeometry, portalMaterial);
        
        // Position portal (default is now at player spawn position)
        this.portal.position.set(x, y, 1);
        
        this.scene.add(this.portal);
    }
    
    checkPortalCollision(player) {
        if (!this.portalActive) return false;
        
        // Check if player is touching portal
        const dx = player.mesh.position.x - this.portal.position.x;
        const dy = player.mesh.position.y - this.portal.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 40; // Portal collision radius
    }
    
    // Check collision between character and object base using only character's feet
    checkObjectCollision(character, object = null) {
        // Default to tomb if no specific object provided
        const objProps = object || this.objectProperties;
        
        // If no object properties available, no collision
        if (!objProps) return false;
        
        // Get character position (center of the character)
        const characterX = character.mesh.position.x;
        const characterY = character.mesh.position.y;
        const characterWidth = character.mesh.geometry.parameters.width;
        const characterHeight = character.mesh.geometry.parameters.height;
        
        // Create a small feet hitbox at the bottom of the character
        // Just a small rectangular area representing the character's feet
        const feetWidth = characterWidth * 0.4;  // 40% of character width
        const feetHeight = characterHeight * 0.15; // 15% of character height
        const feetOffsetY = -characterHeight * 0.35; // Offset from center to bottom
        
        // Calculate feet hitbox boundaries
        const feetLeft = characterX - feetWidth / 2;
        const feetRight = characterX + feetWidth / 2;
        const feetTop = characterY + feetOffsetY;
        const feetBottom = characterY + feetOffsetY - feetHeight;
        
        // Get the actual base mesh position and dimensions
        // Use the real mesh position and size for perfect collision
        const basePos = this.tombBase.position;
        const baseWidth = this.tombBase.geometry.parameters.width * 0.5; // Reduce width to 50% for tighter fit
        const baseHeight = this.tombBase.geometry.parameters.height;
        
        // Object base hitbox boundaries using actual mesh position
        // Shift the hitbox 5 units to the right to make it narrower on the left side
        const baseLeft = basePos.x - (baseWidth / 2) + 5;
        const baseRight = basePos.x + (baseWidth / 2) + 5;
        const baseTop = basePos.y + baseHeight / 2;
        const baseBottom = basePos.y - baseHeight / 2;
        
        // Check for overlap between feet and object base hitboxes
        return (
            feetRight > baseLeft &&
            feetLeft < baseRight &&
            feetTop > baseBottom &&
            feetBottom < baseTop
        );
    }
    
    // Alias method for backward compatibility
    checkTombCollision(character) {
        return this.checkObjectCollision(character);
    }
    
    cleanup() {
        // Remove all level objects from scene
        this.scene.remove(this.floor);
        this.scene.remove(this.topWall);
        this.scene.remove(this.bottomWall);
        this.scene.remove(this.leftWall);
        this.scene.remove(this.rightWall);
        
        // Remove tomb and shadow
        if (this.tombTop) {
            this.scene.remove(this.tombTop);
        }
        
        if (this.tombBase) {
            this.scene.remove(this.tombBase);
        }
        
        if (this.tombShadow) {
            this.scene.remove(this.tombShadow);
        }
        
        if (this.portal) {
            this.scene.remove(this.portal);
        }
        
        // Remove all obstacles and other level objects
        // This is simplified as we're not tracking all objects individually
    }
}