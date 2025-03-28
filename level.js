import * as THREE from 'three';

export class Level {
    constructor(scene, roomSize, levelNumber) {
        this.scene = scene;
        this.roomSize = roomSize;
        this.levelNumber = levelNumber;
        this.portalActive = false;
        this.bloodRequired = this.calculateRequiredBlood();
        this.tombActive = false; // Track if the tomb is active/glowing
        
        // Create room
        this.createRoom();
        
        // Add obstacles
        this.createObstacles();
        
        // Add tomb in the center for combat levels (determined by isShopLevel flag)
        if (!window.gameState || !window.gameState.isShopLevel) {
            this.createTomb();
        }
    }
    
    // Calculate required blood based on level number
    calculateRequiredBlood() {
        // Get the effective combat level (ignoring shop levels)
        const combatLevel = Math.ceil(this.levelNumber / 2);
        
        // Start with 10 blood on first combat level
        // Then 50 blood on second combat level
        // Then increase by 50% each combat level after
        if (combatLevel === 1) return 10;
        if (combatLevel === 2) return 50;
        
        // For combat level 3 and beyond, increase by 50% each time
        let blood = 50;
        for (let i = 2; i < combatLevel; i++) {
            blood = Math.ceil(blood * 1.5);
        }
        return blood;
    }
    
    // Helper method to calculate blood for any combat level (used for progression calculation)
    calculateRequiredBloodForCombatLevel(combatLevel) {
        switch (combatLevel) {
            case 1: return 20;
            case 2: return 40;
            case 3: return 150;
            default:
                // Recursively calculate from previous levels
                const prevCombatLevel = combatLevel - 1;
                const prevLevelBlood = this.calculateRequiredBloodForCombatLevel(prevCombatLevel);
                return Math.ceil(prevLevelBlood * 1.5);
        }
    }
    
    // Method used by calculateRequiredBlood
    calculateRequiredBloodForLevel(level) {
        // Convert to combat level first
        const combatLevel = Math.ceil(level / 2);
        return this.calculateRequiredBloodForCombatLevel(combatLevel);
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
        
        // Create closed hatch in the lower right corner
        const hatchGeometry = new THREE.PlaneGeometry(80, 80);
        const hatchMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('assets/sprites/hatch.png'),
            transparent: true
        });
        this.closedHatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
        // Position in the lower right corner
        this.closedHatch.position.set(this.roomSize/2 - 80, -this.roomSize/2 + 80, 0.9);
        this.scene.add(this.closedHatch);
        
        // Create tiled walls
        this.createTiledWalls();
    }
    
    createTiledWalls() {
        // Load wall_tile.png for top wall
        const wallTexture = new THREE.TextureLoader().load('assets/sprites/wall_tile.png', 
            // Success callback
            (loadedTexture) => {
                console.log('Wall tile texture loaded successfully');
            },
            // Progress callback
            undefined,
            // Error callback
            (error) => {
                console.error('Error loading wall tile texture:', error);
            }
        );
        
        // Load grass_tile.png for other walls
        const grassTexture = new THREE.TextureLoader().load('assets/sprites/grass_tile.png', 
            // Success callback
            (loadedTexture) => {
                console.log('Grass tile texture loaded successfully');
            },
            // Progress callback
            undefined,
            // Error callback
            (error) => {
                console.error('Error loading grass tile texture:', error);
            }
        );
        
        // Configure textures
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.magFilter = THREE.NearestFilter;
        wallTexture.minFilter = THREE.NearestFilter;
        
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.magFilter = THREE.NearestFilter;
        grassTexture.minFilter = THREE.NearestFilter;
        
        // Wall dimensions - SMALLER walls (60px instead of 80px)
        const wallHeight = 60;
        const wallTileWidth = 60;
        const halfRoomSize = this.roomSize / 2;
        
        // Calculate how many tiles needed for exact fit
        const fullTileCount = Math.floor(this.roomSize / wallTileWidth);
        // Calculate any remaining space to distribute evenly
        const remainingSpace = this.roomSize - (fullTileCount * wallTileWidth);
        const tileOverlap = remainingSpace / (fullTileCount - 1); // Distribute overlap among tiles
        const adjustedTileSpacing = wallTileWidth + tileOverlap;
        
        // Create arrays to store wall meshes
        this.wallTiles = [];
        // Store wall boundary info for collision detection
        this.wallBoundaries = {
            left: -halfRoomSize,
            right: halfRoomSize,
            top: halfRoomSize,
            bottom: -halfRoomSize
        };
        
        // Bottom wall - use grass_tile.png - should be in front of player
        const bottomZDepth = 1.2; // Higher z-value (in front of player)
        for (let i = 0; i < fullTileCount; i++) {
            const bottomWallTile = this.createWallTile(grassTexture, wallTileWidth, wallHeight);
            // Position evenly across the bottom
            const xPos = -halfRoomSize + (wallTileWidth/2) + (i * adjustedTileSpacing);
            bottomWallTile.position.set(xPos, -halfRoomSize, bottomZDepth);
            this.scene.add(bottomWallTile);
            this.wallTiles.push(bottomWallTile);
        }
        
        // Top wall - use wall_tile.png - should be behind player
        const topZDepth = 0.8; // Lower z-value (behind player)
        for (let i = 0; i < fullTileCount; i++) {
            const topWallTile = this.createWallTile(wallTexture, wallTileWidth, wallHeight);
            // Position evenly across the top
            const xPos = -halfRoomSize + (wallTileWidth/2) + (i * adjustedTileSpacing);
            topWallTile.position.set(xPos, halfRoomSize, topZDepth);
            this.scene.add(topWallTile);
            this.wallTiles.push(topWallTile);
        }
        
        // For side walls, use grass_tile.png
        const sideZDepth = 1.0; // Mid z-value for sides
        
        // Left wall - use grass_tile.png
        for (let i = 0; i < fullTileCount; i++) {
            const leftWallTile = this.createWallTile(grassTexture, wallTileWidth, wallHeight);
            // Rotate the left wall tiles
            leftWallTile.rotation.z = Math.PI / 2;
            // Position evenly along the left side
            const yPos = -halfRoomSize + (wallTileWidth/2) + (i * adjustedTileSpacing);
            leftWallTile.position.set(-halfRoomSize, yPos, sideZDepth);
            this.scene.add(leftWallTile);
            this.wallTiles.push(leftWallTile);
        }
        
        // Right wall - use grass_tile.png
        for (let i = 0; i < fullTileCount; i++) {
            const rightWallTile = this.createWallTile(grassTexture, wallTileWidth, wallHeight);
            // Rotate the right wall tiles
            rightWallTile.rotation.z = Math.PI / 2;
            // Position evenly along the right side
            const yPos = -halfRoomSize + (wallTileWidth/2) + (i * adjustedTileSpacing);
            rightWallTile.position.set(halfRoomSize, yPos, sideZDepth);
            this.scene.add(rightWallTile);
            this.wallTiles.push(rightWallTile);
        }
    }
    
    createWallTile(texture, width, height) {
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.1,
            color: 0xFFFFFF // Ensure the texture is displayed with full brightness
        });
        return new THREE.Mesh(geometry, material);
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
        if (this.tombActive) return; // Already active
        
        this.tombActive = true;
        
        // Create a multi-layered glow for more diffused effect
        // Layer 1: Larger, more transparent outer glow
        const outerGlowGeometry = new THREE.CircleGeometry(100, 32);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xAA0000, // Blood red
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending, // Use additive blending for light-like effect
        });
        this.outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        this.outerGlow.position.set(0, 0, 0.4); // Below inner glow
        this.scene.add(this.outerGlow);
        
        // Layer 2: Medium middle glow
        const midGlowGeometry = new THREE.CircleGeometry(70, 32);
        const midGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xCC0000, // Slightly brighter red
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        this.midGlow = new THREE.Mesh(midGlowGeometry, midGlowMaterial);
        this.midGlow.position.set(0, 0, 0.5); // Between outer and inner
        this.scene.add(this.midGlow);
        
        // Layer 3: Small, brighter inner glow
        const innerGlowGeometry = new THREE.CircleGeometry(40, 32);
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF0000, // Bright red
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        this.innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        this.innerGlow.position.set(0, 0, 0.6); // Above other layers
        this.scene.add(this.innerGlow);
        
        // Initialize animation values
        this.glowTime = 0;
        this.glowPhase = {
            outer: 0,
            mid: Math.PI / 3, // Offset phase for more natural effect
            inner: Math.PI / 1.5 // Different offset
        };
    }
    
    updateTombGlow(deltaTime) {
        if (!this.tombActive) return;
        
        // Update time value
        this.glowTime += deltaTime;
        
        // Create subtle, varied pulsing for each layer
        if (this.outerGlow) {
            const outerPulse = 0.9 + Math.sin(this.glowTime * 0.0015 + this.glowPhase.outer) * 0.15;
            this.outerGlow.scale.set(outerPulse, outerPulse, 1);
            
            // Slowly rotate the outer glow for subtle movement
            this.outerGlow.rotation.z += deltaTime * 0.0001;
        }
        
        if (this.midGlow) {
            const midPulse = 0.85 + Math.sin(this.glowTime * 0.002 + this.glowPhase.mid) * 0.2;
            this.midGlow.scale.set(midPulse, midPulse, 1);
            
            // Rotate in opposite direction
            this.midGlow.rotation.z -= deltaTime * 0.00015;
        }
        
        if (this.innerGlow) {
            const innerPulse = 0.8 + Math.sin(this.glowTime * 0.0025 + this.glowPhase.inner) * 0.25;
            this.innerGlow.scale.set(innerPulse, innerPulse, 1);
        }
    }
    
    activatePortal(x, y) {
        this.portalActive = true;
        
        // Only update tomb textures if they exist (in combat levels)
        if (this.tombTop && this.tombBase && this.tombShadow) {
            // Change tomb texture to glowing eyes version
            const glowTexture = new THREE.TextureLoader().load('assets/sprites/statue_eyes_glow.png');
            
            // Update both parts of the tomb
            this.tombTop.material.map = glowTexture;
            this.tombTop.material.needsUpdate = true;
            
            this.tombBase.material.map = glowTexture;
            this.tombBase.material.needsUpdate = true;
            
            // Update shadow texture as well
            this.tombShadow.material.map = glowTexture;
            this.tombShadow.material.needsUpdate = true;
        }
        
        // Remove the closed hatch
        if (this.closedHatch) {
            this.scene.remove(this.closedHatch);
        }
        
        // Create hatch (portal) using hatch_open.png
        const hatchGeometry = new THREE.PlaneGeometry(100, 100);
        const hatchMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('assets/sprites/hatch_open.png'),
            transparent: true
        });
        this.portal = new THREE.Mesh(hatchGeometry, hatchMaterial);
        
        // If no specific position provided, use the same position as the closed hatch
        if (x === undefined || y === undefined) {
            // Use the same position as the closed hatch was in
            this.portal.position.set(this.roomSize/2 - 80, -this.roomSize/2 + 80, 0.9);
        } else {
            // Position portal at provided coordinates
            this.portal.position.set(x, y, 0.9);
        }
        
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
    
    // Add method to check wall collisions
    checkWallCollision(character) {
        if (!this.wallBoundaries) return false;
        
        // Get character center position
        const characterX = character.mesh.position.x;
        const characterY = character.mesh.position.y;
        
        // Get character dimensions
        const characterWidth = character.mesh.geometry.parameters.width / 2;
        const characterHeight = character.mesh.geometry.parameters.height / 2;
        
        // Character boundary box
        const characterLeft = characterX - characterWidth;
        const characterRight = characterX + characterWidth;
        const characterTop = characterY + characterHeight;
        const characterBottom = characterY - characterHeight;
        
        // Check collision with wall boundaries
        if (characterLeft <= this.wallBoundaries.left) {
            return { axis: 'x', direction: 'left' };
        }
        if (characterRight >= this.wallBoundaries.right) {
            return { axis: 'x', direction: 'right' };
        }
        if (characterTop >= this.wallBoundaries.top) {
            return { axis: 'y', direction: 'top' };
        }
        if (characterBottom <= this.wallBoundaries.bottom) {
            return { axis: 'y', direction: 'bottom' };
        }
        
        return false;
    }
    
    // Check if player has offered enough blood to activate the portal
    checkBloodOffering(player, gameState, ui) {
        if (this.portalActive) return false; // Already active
        
        // Check if player is close to tomb and has enough blood
        if (this.checkTombProximity(player)) {
            // Only accept blood offerings when all enemies are dead
            const allEnemiesDead = window.gameState && window.gameState.enemies && window.gameState.enemies.length === 0;
            
            if (allEnemiesDead) {
                if (gameState.blood >= this.bloodRequired) {
                    // Activate portal
                    this.activatePortal();
                    // Remove the blood from player's total
                    gameState.blood -= this.bloodRequired;
                    return true;
                } else {
                    // Check if there are any active blood drops
                    const hasActiveBloodDrops = window.lootSystem && window.lootSystem.bloodDrops && window.lootSystem.bloodDrops.length > 0;
                    
                    if (!hasActiveBloodDrops) {
                        // No blood drops left, show message and kill player
                        ui.showNotEnoughBloodMessage();
                        // Delay player death by 1 second to let them see the message first
                        setTimeout(() => {
                            player.hp = 0; // Kill the player
                        }, 1000);
                        return false;
                    } else {
                        // There are still blood drops to collect
                        ui.showMessage("Collect the remaining blood drops!");
                        return false;
                    }
                }
            } else if (gameState.blood >= this.bloodRequired) {
                // If they have enough blood but enemies remain, just show a message
                ui.showMessage("Defeat all enemies first!");
                return false;
            }
        }
        return false;
    }
    
    // Check if player is close to the tomb (for blood offering)
    checkTombProximity(player) {
        const dx = player.mesh.position.x;
        const dy = player.mesh.position.y;
        // Tomb is at (0,0) - check if player is within 50 units
        return Math.sqrt(dx * dx + dy * dy) < 70;
    }
    
    cleanup() {
        // Remove all level objects from scene
        this.scene.remove(this.floor);
        
        // Remove wall tiles
        if (this.wallTiles) {
            this.wallTiles.forEach(tile => {
                this.scene.remove(tile);
            });
        }
        
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
        
        // Remove portal (open hatch) and closed hatch
        if (this.portal) {
            this.scene.remove(this.portal);
        }
        
        if (this.closedHatch) {
            this.scene.remove(this.closedHatch);
        }
        
        // Remove tomb glow if it exists
        if (this.outerGlow) {
            this.scene.remove(this.outerGlow);
            this.outerGlow = null;
        }
        
        if (this.midGlow) {
            this.scene.remove(this.midGlow);
            this.midGlow = null;
        }
        
        if (this.innerGlow) {
            this.scene.remove(this.innerGlow);
            this.innerGlow = null;
        }
        
        // Remove all obstacles and other level objects
        // This is simplified as we're not tracking all objects individually
    }
}