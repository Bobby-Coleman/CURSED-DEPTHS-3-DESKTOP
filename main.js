import * as THREE from 'three';
import { Player } from './player.js';
import { Level } from './level.js';
import { Enemy } from './enemy.js';
import { UI } from './ui.js';
import { LootSystem } from './loot.js';
import { RelicSystem } from './relics.js';
import { Shop } from './shop.js';
import { Dialog } from './dialog.js';
import { Tesseract } from './tesseract.js';
import { PlayerDialogManager } from './playerDialog.js';

// Game constants
const ROOM_SIZE = 800;
const CAMERA_PADDING = 80; // Extra padding to view walls

// Create crosshair mesh
let crosshair;

// Game state
let gameState = {
    level: 1,
    killStreak: 0,
    gameOver: false,
    isShopLevel: false,
    currentPickup: null,
    hoveredRelicIndex: -1,
    lastRelicSellTime: 0,  // Add this to track last sell time
    tutorialShown: false,
    isPaused: false, // Add flag to track if game is paused during tutorial
    blood: 0, // Add blood counter
    enemies: [] // Reference to enemies array
};

// Mobile detection
// Detects touch capabilities and common mobile user agents. Also checks screen size as a fallback.
// The landscape check should happen dynamically via CSS media queries.
const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) 
                 || (window.innerWidth <= 812 && window.innerHeight <= 812); // Fallback size check

// Mobile Input State (initialized regardless, used if isMobile is true)
let mobileInputState = {
    moveVector: { x: 0, y: 0 }, // Normalized vector from left joystick
    aimAngle: 0,       // Angle in radians from right joystick
    aimVector: { x: 0, y: 0 }, // Normalized vector from right joystick (optional)
    isMoving: false,   // True if left joystick is active
    isAiming: false,   // True if right joystick is active
    isShooting: false  // True if right joystick is active (shoot on aim)
};
let mobileDebugOverlay = null; // Reference to the debug overlay element
let leftJoystick = null;
let rightJoystick = null;

// Create game object to expose to window
const game = {
    player: null,
    keys: null,
    mouse: null,
    level: null,
    enemies: [],
    gameState: gameState,
    isMobile: isMobile, // Expose mobile status
    mobileInput: mobileInputState // Expose mobile input state
};

// Expose game object to window for mobile controls
window.game = game;

// Initialize Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x228B22); // Jungle green background

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Create camera with slightly larger view to include walls
const camera = new THREE.OrthographicCamera(
    (ROOM_SIZE + CAMERA_PADDING) / -2, 
    (ROOM_SIZE + CAMERA_PADDING) / 2, 
    (ROOM_SIZE + CAMERA_PADDING) / 2, 
    (ROOM_SIZE + CAMERA_PADDING) / -2, 
    0.1, 1000
);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Update camera aspect ratio and projection matrix if needed
    // This is simplified for an orthographic camera
});

// Input tracking
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    e: false,
    r: false,
    wasE: false,
    wasR: false
};

// Store keys in game object
game.keys = keys;

const mouse = {
    x: 0,
    y: 0,
    isDown: false
};

// Store mouse in game object
game.mouse = mouse;

// Make sellRelic function globally accessible
window.sellRelic = function(index) {
    if (player && player.relics[index]) {
        // Check if relic can be sold
        if (relicSystem.canSellRelic(player, player.relics[index])) {
            // Remove the relic and add HP
            if (relicSystem.sellRelic(player, index)) {
                player.hp = Math.min(player.maxHp, player.hp + 1);
                ui.updateStats(player, gameState);
                ui.showMessage("Relic sold for 1 HP!");
                
                // Reset hovered relic
                gameState.hoveredRelicIndex = -1;
            }
        } else {
            // Show message if relic can't be sold yet
            ui.showMessage("This relic cannot be sold yet!");
        }
    }
};

// Initialize game objects
let player;
let currentLevel;
let ui;
let enemies = [];
let lootSystem;
let relicSystem;
let shop;
let dialog;
let lastTime = 0; // For deltaTime calculation
let tesseract;
let playerDialog;

function startGame() {
    init();
    animate();
}

// Make startGame globally accessible
window.startGame = startGame;

// Make showControlsTutorial globally accessible
window.showControlsTutorial = showControlsTutorial;

function init() {
    // Check for returnToLevel parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const returnLevel = urlParams.get('returnToLevel');
    
    // Reset game state
    gameState = {
        level: returnLevel ? parseInt(returnLevel) : 1, // Use returnLevel if available
        killStreak: 0,
        gameOver: false,
        isShopLevel: false,
        currentPickup: null,
        hoveredRelicIndex: -1,
        lastRelicSellTime: 0,
        tutorialShown: false,
        isPaused: false,
        blood: 0, // Initialize blood counter
        enemies: [] // Reference to enemies array
    };
    
    // Clear previous game objects
    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
    }
    
    enemies = [];
    
    // Create crosshair
    createCrosshair();
    
    // Initialize systems
    relicSystem = new RelicSystem();
    lootSystem = new LootSystem(scene);
    
    // Initialize level first so we know where the hatch is
    currentLevel = new Level(scene, ROOM_SIZE, gameState.level);
    
    // Initialize player - Pass scene, camera, and isMobile flag
    player = new Player(scene, camera, isMobile);
    player.ammo = 3000; // Set initial ammo to 3000
    player.maxAmmo = 3000; // Set max ammo to 3000
    
    // Initialize player dialog
    playerDialog = new PlayerDialogManager(scene, player, camera);
    
    // Create tesseract
    tesseract = new Tesseract(scene);
    
    // Store player in game object for mobile controls
    game.player = player;
    
    // Position player at the hatch in the lower right corner
    player.mesh.position.x = ROOM_SIZE/2 - 80;
    player.mesh.position.y = -ROOM_SIZE/2 + 80;
    
    // Update shadow position if it exists
    if (player.shadow) {
        player.shadow.position.x = player.mesh.position.x + 12;
        player.shadow.position.y = player.mesh.position.y + 12;
    }
    
    // Make gameState globally accessible for relic effects
    window.gameState = gameState;
    
    // Reset UI elements instead of recreating them 
    if (ui) {
        ui.resetUIElements();
        ui.updateRequiredBlood(currentLevel.bloodRequired);
    } else {
        // Initialize UI after player is created if it doesn't exist
        ui = new UI();
        ui.updateRequiredBlood(currentLevel.bloodRequired);
    }
    
    // Always start with a combat level (level 1)
    // Spawn enemies for the current level
    spawnEnemies();
    
    // Show level message and update UI after everything is initialized
    ui.showLevelMessage(gameState.level);
    ui.updateStats(player, gameState);

    // --- Setup Input Listeners Based on Device ---
    if (isMobile) {
        console.log("Mobile device detected, initializing mobile controls.");
        initMobileControls();
    } else {
        console.log("Desktop device detected, initializing desktop controls.");
        initDesktopControls();
    }
}

function spawnEnemies() {
    // For the first level, only spawn two basic enemies
    if (gameState.level === 1) {
        // Create exactly two basic enemies, far from the player
        const enemy1 = new Enemy(scene, -300, -300, 0, gameState.level); // Basic enemy type (0) in bottom left
        const enemy2 = new Enemy(scene, 300, 300, 0, gameState.level); // Basic enemy type (0) in top right
        
        enemies.push(enemy1);
        enemies.push(enemy2);
    } else if (gameState.level === 5) { // Third battle level (level 5 in gameState)
        // Level 5 gets exactly 6 enemies with varied types
        const enemyTypes = [0, 1, 2, 3, 4]; // All enemy types
        const positions = [];
        
        // Calculate hatch position
        const hatchX = ROOM_SIZE/2 - 80;
        const hatchY = -ROOM_SIZE/2 + 80;
        
        // Spawn 6 enemies
        for (let i = 0; i < 6; i++) {
            let x, y;
            do {
                x = Math.random() * (ROOM_SIZE - 100) - (ROOM_SIZE / 2 - 50);
                y = Math.random() * (ROOM_SIZE - 100) - (ROOM_SIZE / 2 - 50);
                
                // Calculate distances
                const distanceToHatch = Math.sqrt(
                    Math.pow(x - hatchX, 2) + 
                    Math.pow(y - hatchY, 2)
                );
                const distanceToStatue = Math.sqrt(x * x + y * y);
                
                // Check distance from other enemies
                const tooCloseToOthers = positions.some(pos => {
                    const dx = x - pos.x;
                    const dy = y - pos.y;
                    return Math.sqrt(dx * dx + dy * dy) < 100;
                });
                
            } while (Math.sqrt(Math.pow(x - hatchX, 2) + Math.pow(y - hatchY, 2)) < 350 || 
                    Math.sqrt(x * x + y * y) < 150 || 
                    positions.some(pos => Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)) < 100));
            
            // Store position to check against for next enemy
            positions.push({ x, y });
            
            // Pick a random enemy type from the available types
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            const enemy = new Enemy(scene, x, y, randomType, gameState.level);
            enemies.push(enemy);
        }
    } else if (gameState.level === 7) { // Fourth battle level
        // Spawn 10 enemies with all types
        const enemyTypes = [0, 1, 2, 3, 4]; // All enemy types available
        const positions = [];
        
        // Calculate hatch position
        const hatchX = ROOM_SIZE/2 - 80;
        const hatchY = -ROOM_SIZE/2 + 80;
        
        // Spawn all 10 enemies
        for (let i = 0; i < 10; i++) {
            let x, y;
            do {
                x = Math.random() * (ROOM_SIZE - 100) - (ROOM_SIZE / 2 - 50);
                y = Math.random() * (ROOM_SIZE - 100) - (ROOM_SIZE / 2 - 50);
                
                // Calculate distances
                const distanceToHatch = Math.sqrt(
                    Math.pow(x - hatchX, 2) + 
                    Math.pow(y - hatchY, 2)
                );
                const distanceToStatue = Math.sqrt(x * x + y * y);
                
                // Check distance from other enemies
                const tooCloseToOthers = positions.some(pos => {
                    const dx = x - pos.x;
                    const dy = y - pos.y;
                    return Math.sqrt(dx * dx + dy * dy) < 100;
                });
                
            } while (Math.sqrt(Math.pow(x - hatchX, 2) + Math.pow(y - hatchY, 2)) < 350 || 
                    Math.sqrt(x * x + y * y) < 150 || 
                    positions.some(pos => Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)) < 100));
            
            // Store position to check against for next enemy
            positions.push({ x, y });
            
            // Pick a random enemy type from all available types
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            const enemy = new Enemy(scene, x, y, randomType, gameState.level);
            enemies.push(enemy);
        }
    } else if (gameState.level === 3) { // Second battle level
        // Level 3 gets exactly 4 specific enemies
        const enemySetup = [
            { type: 1, name: 'shooter' },    // Type 1: Shooter
            { type: 4, name: 'charger' },    // Type 4: Charger
            { type: 2, name: 'fast' },       // Type 2: Fast Enemy
            { type: 3, name: 'bomber' }      // Type 3: Bomber
        ];
        
        // Calculate hatch position
        const hatchX = ROOM_SIZE/2 - 80;
        const hatchY = -ROOM_SIZE/2 + 80;
        
        // Spawn each enemy at least 350 units from the hatch
        enemySetup.forEach(setup => {
            let x, y;
            do {
                x = Math.random() * (ROOM_SIZE - 100) - (ROOM_SIZE / 2 - 50);
                y = Math.random() * (ROOM_SIZE - 100) - (ROOM_SIZE / 2 - 50);
                
                // Calculate distance to hatch
                const distanceToHatch = Math.sqrt(
                    Math.pow(x - hatchX, 2) + 
                    Math.pow(y - hatchY, 2)
                );
                
                // Keep trying until we find a position far enough from the hatch
            } while (Math.sqrt(Math.pow(x - hatchX, 2) + Math.pow(y - hatchY, 2)) < 350);
            
            const enemy = new Enemy(scene, x, y, setup.type, gameState.level);
            enemies.push(enemy);
        });
    } else { // Beyond fourth battle level
        // Also spawn 10 enemies with all types
        const enemyTypes = [0, 1, 2, 3, 4]; // All enemy types available
        const positions = [];
        
        // Calculate hatch position
        const hatchX = ROOM_SIZE/2 - 80;
        const hatchY = -ROOM_SIZE/2 + 80;
        
        // Spawn all 10 enemies
        for (let i = 0; i < 10; i++) {
            let x, y;
            do {
                x = Math.random() * (ROOM_SIZE - 100) - (ROOM_SIZE / 2 - 50);
                y = Math.random() * (ROOM_SIZE - 100) - (ROOM_SIZE / 2 - 50);
                
                // Calculate distances
                const distanceToHatch = Math.sqrt(
                    Math.pow(x - hatchX, 2) + 
                    Math.pow(y - hatchY, 2)
                );
                const distanceToStatue = Math.sqrt(x * x + y * y);
                
                // Check distance from other enemies
                const tooCloseToOthers = positions.some(pos => {
                    const dx = x - pos.x;
                    const dy = y - pos.y;
                    return Math.sqrt(dx * dx + dy * dy) < 100;
                });
                
            } while (Math.sqrt(Math.pow(x - hatchX, 2) + Math.pow(y - hatchY, 2)) < 350 || 
                    Math.sqrt(x * x + y * y) < 150 || 
                    positions.some(pos => Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)) < 100));
            
            // Store position to check against for next enemy
            positions.push({ x, y });
            
            // Pick a random enemy type from all available types
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            const enemy = new Enemy(scene, x, y, randomType, gameState.level);
            enemies.push(enemy);
        }
    }
}

function createShopLevel() {
    // Set shop level flag
    gameState.isShopLevel = true;
    
    // Create shop with current level number
    shop = new Shop(scene, gameState.level);
    
    // Activate portal immediately in the lower right corner (use default position)
    currentLevel.activatePortal();
}

function nextLevel() {
    // Clean up current level
    currentLevel.cleanup();
    
    // Clean up shop if it exists
    if (gameState.isShopLevel && shop) {
        shop.cleanup();
    }
    
    // Clean up loot
    lootSystem.cleanup();
    
    // Clean up tutorial message if moving from level 1
    if (gameState.level === 1) {
        const tutorialElement = document.getElementById('controls-tutorial');
        if (tutorialElement) {
            tutorialElement.remove();
        }
    }
    
    // Reset blood to zero when moving to a new level (since blood boost triggers on room clear)
    gameState.blood = 0;
    
    // Increment level
    gameState.level++;
    
    // Apply relic effects on room change
    relicSystem.onRoomChange(player);
    
    // Alternate between combat and shop levels (even levels are shops)
    if (gameState.level % 2 === 0) {
        // Create shop level
        gameState.isShopLevel = true;
        
        // Create new level
        currentLevel = new Level(scene, ROOM_SIZE, gameState.level);
        
        // Position player at the hatch
        player.mesh.position.x = ROOM_SIZE/2 - 80;
        player.mesh.position.y = -ROOM_SIZE/2 + 80;
        
        // Update shadow position
        if (player.shadow) {
            player.shadow.position.x = player.mesh.position.x + 12;
            player.shadow.position.y = player.mesh.position.y + 12;
        }
        
        // Create shop
        shop = new Shop(scene, gameState.level);
        
        // Activate portal immediately and position it next to the shop
        currentLevel.activatePortal(200, 0);
    } else {
        // Create normal level
        gameState.isShopLevel = false;
        
        // Create new level
        currentLevel = new Level(scene, ROOM_SIZE, gameState.level);
        
        // Display the required blood amount
        ui.updateRequiredBlood(currentLevel.bloodRequired);
        
        // Position player at the hatch
        player.mesh.position.x = ROOM_SIZE/2 - 80;
        player.mesh.position.y = -ROOM_SIZE/2 + 80;
        
        // Update shadow position
        if (player.shadow) {
            player.shadow.position.x = player.mesh.position.x + 12;
            player.shadow.position.y = player.mesh.position.y + 12;
        }
        
        // Spawn enemies
        enemies = [];
        spawnEnemies();
    }
    
    // Reset UI blood displays
    ui.resetUIElements();
    
    // Update required blood display
    if (!gameState.isShopLevel) {
        ui.updateRequiredBlood(currentLevel.bloodRequired);
    }
    
    // Show level message
    ui.showLevelMessage(gameState.level);
    ui.updateStats(player, gameState);
}

function checkGameOver() {
    if (player.hp <= 0) {
        endGame("You ran out of health!");
    } else if (player.ammo <= 0 && enemies.length > 0) {
        endGame("You ran out of ammo with enemies still remaining!");
    }
}

function endGame(reason) {
    gameState.gameOver = true;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-reason').textContent = reason;
}

function updateUI() {
    // Use the complete UI update method that includes weapon stats
    ui.updateStats(player, gameState, enemies);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update game state references (ensure arrays/objects are current)
    gameState.enemies = enemies;
    game.enemies = enemies; // Update reference in global game object if needed
    game.mobileInput = mobileInputState; // Ensure global ref is up-to-date

    if (!gameState.gameOver) {
        if (!gameState.isPaused) {
            // Calculate delta time (time since last frame in seconds)
            const currentTime = performance.now();
            const deltaTime = (currentTime - (lastTime || currentTime)) / 1000; 
            lastTime = currentTime;

            // Update systems that depend on time
            if (tesseract) tesseract.update(); // Assuming tesseract doesn't need deltaTime
            if (playerDialog) playerDialog.update(); // Assuming playerDialog doesn't need deltaTime
            currentLevel.update(deltaTime); // Pass deltaTime for level animations (e.g., tomb glow)

            // Store player's previous position for collision rollback
            const prevPlayerPos = player.mesh.position.clone();

            // --- Player Update --- 
            if (isMobile) {
                // Mobile path (working)
                player.update(null, null, mobileInputState, enemies, deltaTime);
            } else {
                // --- Restore Desktop Input Update --- 
                player.update(keys, mouse, null, enemies, deltaTime); // Pass desktop keys/mouse
            }

            // Update loot system (auto-pickup, etc.)
            lootSystem.update(player, gameState); // Needs player pos, potentially deltaTime?

            // --- Collision Checks --- 
            // Check player collision with walls and tombs
            const wallCollision = currentLevel.checkWallCollision(player);
            const tombCollision = currentLevel.checkTombCollision(player);
            if (wallCollision || tombCollision) {
                 // Revert player position if collision detected
                 player.mesh.position.copy(prevPlayerPos);
                 // Also revert shadow position
                 if (player.shadow) {
                     player.shadow.position.x = prevPlayerPos.x + 12;
                     player.shadow.position.y = prevPlayerPos.y + 12;
                 }
            } else {
                // Only update shadow position if NO collision occurred
                if (player.shadow) {
                     player.shadow.position.x = player.mesh.position.x + 12;
                     player.shadow.position.y = player.mesh.position.y + 12;
                     // Match player rotation if necessary (unlikely for top-down shadow)
                     // player.shadow.rotation.z = player.mesh.rotation.z;
                }
            }
            
            // --- Portal/Interaction Checks ---
            // Pentagram Portal (to Platformer Game)
            if (currentLevel.checkPentagramPortal(player)) { 
                const hasTwoHeadedGoat = player.relics.some(r => r.id === 'twoHeadedGoat');
                if (hasTwoHeadedGoat) {
                    window.location.href = 'platformer-game/index.html?returnToLevel=' + gameState.level; 
                } else {
                    ui.showMessage("Find the Two Headed Goat relic first.");
                }
            }
            // Hell Door (to Demon Dungeon)
            const hellDoorCollision = currentLevel.checkHellDoorCollision && currentLevel.checkHellDoorCollision(player);
            if (hellDoorCollision) {
                 if (hellDoorCollision.canRedirect) {
                     window.location.href = 'https://demon-dungeon-3d-fc586e1baa7e.herokuapp.com';
                 } else if (hellDoorCollision.message) {
                     ui.showMessage(hellDoorCollision.message);
                 }
            }
             // Museum Portal (to Museum 3D)
             if (currentLevel.isMuseumPortalActive && currentLevel.checkMuseumPortalCollision(player)) {
                 window.location.href = `museum3d/index.html?returnToLevel=${gameState.level}`;
             }

            // --- Enemy Updates & Interactions (Combat Levels Only) ---
            if (!gameState.isShopLevel) {
                for (let i = enemies.length - 1; i >= 0; i--) {
                    const enemy = enemies[i];
                    const prevEnemyPos = enemy.mesh.position.clone(); // Store position before update
                    
                    // Update enemy logic, passing player and deltaTime
                    enemy.update(player, deltaTime); 

                    // Handle Nest Spawning (if applicable)
                    if (enemy.type === 5 && enemy.newSpawnedEnemy) {
                        enemies.push(enemy.newSpawnedEnemy);
                        enemy.newSpawnedEnemy = null; // Reset flag
                    }
                    
                    // Enemy Collision Checks (Tombs/Walls)
                    const enemyWallCollision = currentLevel.checkWallCollision(enemy);
                    const enemyTombCollision = currentLevel.checkTombCollision(enemy);
                    if (enemyWallCollision || enemyTombCollision) {
                        // Revert enemy position on collision
                        enemy.mesh.position.copy(prevEnemyPos);
                        if (enemy.shadow) {
                             enemy.shadow.position.x = prevEnemyPos.x + 12;
                             enemy.shadow.position.y = prevEnemyPos.y + 12;
                        }
                    }

                    // Check if enemy is dead
                    if (enemy.hp <= 0) {
                        const dropX = enemy.mesh.position.x;
                        const dropY = enemy.mesh.position.y;
                        lootSystem.generateDrop(dropX, dropY); // Generate loot
                        
                        enemy.cleanup(); // Remove enemy mesh, etc.
                        enemies.splice(i, 1); // Remove from array
                        
                        gameState.killStreak++; // Increment kill streak
                        player.onKill(); // Notify player (for relics like Heal on Kill)

                        // Blood Amplifier Check (if last enemy killed)
                        if (enemies.length === 0) {
                            const bloodAmplifier = player.relics.find(r => r.id === 'bloodAmplifier');
                            if (bloodAmplifier) {
                                gameState.blood += 20;
                            }
                        }
                    } 
                } // End enemy loop

                // Update loot system aspects (e.g., blood drop animation, pickup checks)
                lootSystem.updateBloodDrops(deltaTime);
                lootSystem.checkBloodPickup(player, gameState); 

                // Check level completion state (tomb activation, blood offering)
                if (enemies.length === 0 && !currentLevel.tombActive) {
                    currentLevel.activateTomb();
                }
                currentLevel.checkBloodOffering(player, gameState, ui);
                
                // Check portal collision to next level
                if (currentLevel.portalActive && currentLevel.checkPortalCollision(player)) {
                    nextLevel(); // Transition to next level
                    return; // Exit animate frame early after level transition
                }
                
                // --- Restore Desktop Pickup Check ---
                 gameState.currentPickup = lootSystem.checkPickup(player, ui); // Check for pickups regardless of device
                 if (!isMobile && keys.e && !keys.wasE && gameState.currentPickup) { 
                     keys.wasE = true; 
                     handleItemPickup();
                 }
                // TODO: Implement touch interaction for pickup on mobile?
                
            } else {
                // --- Shop Level Logic ---
                // --- Restore Desktop Shop Interaction ---
                let shopItem = null;
                if (!isMobile) {
                    shopItem = shop.checkItemInteraction(player, mouse.x, mouse.y, gameState);
                    if (shopItem) {
                        ui.showItemPopup(shopItem, mouse.x, mouse.y);
                    } else {
                        ui.hidePopup(); // Hide if not hovering
                    }
                }
                // Handle purchase (Desktop: E key)
                if (!isMobile && keys.e && !keys.wasE && shopItem) { 
                    keys.wasE = true;
                    handleShopPurchase(shopItem);
                    shopItem = null; // Clear shop item after purchase attempt to prevent re-buy
                    ui.hidePopup(); // Hide popup after purchase attempt
                }
                // TODO: Implement touch interaction for shop purchase on mobile?
                
                 // Check portal collision in shop
                 if (currentLevel.portalActive && currentLevel.checkPortalCollision(player)) {
                     nextLevel();
                     return; 
                 }
            }
            
            // --- Restore Relic Hover/Selling Logic (Desktop only) ---
            if (!isMobile) {
                ui.updateRelicHover(mouse.x, mouse.y, player, gameState);
                // Handle relic selling (Desktop: R key)
                if (keys.r && !keys.wasR && gameState.hoveredRelicIndex !== -1) {
                    keys.wasR = true; // Prevent holding R
                    sellRelic(gameState.hoveredRelicIndex); // Call global sellRelic function
                }
            } else {
                 gameState.hoveredRelicIndex = -1; // Ensure no relic is hovered on mobile
                 // TODO: Implement touch interaction for selling relics on mobile?
            }

            // Check game over conditions
            checkGameOver();

        } // End if (!gameState.isPaused)

        // Update UI regardless of pause state (e.g., to show pause menu, stats)
        updateUI();

    } // End if (!gameState.gameOver)

    // Render the scene
    renderer.render(scene, camera);
}

// --- Helper Functions ---

function handleItemPickup() {
    if (!gameState.currentPickup) return;
    const result = lootSystem.pickupDrop(player, gameState.currentPickup, gameState);
    if (result) {
        ui.showMessage(result.message); // Use consistent message display
        ui.hidePopup();
        gameState.currentPickup = null;
        updateUI(); // Update UI after pickup
    }
}

function handleShopPurchase(shopItem) {
    if (!shopItem || !shop) return;
    const result = shop.buyItem(player, shopItem, gameState);
    if (result) {
        ui.showMessage(result.message); // Use consistent message display
        updateUI(); // Update UI after purchase
    }
    // Popup hiding is handled in the main loop based on hover state
}

// Event listeners for keyboard
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase()] = true;
    }
    
    // Handle relic selling
    if ((e.key === 'r' || e.key === 'R') && gameState.hoveredRelicIndex >= 0) {
        const currentTime = Date.now();
        // Add 500ms cooldown between sells
        if (currentTime - gameState.lastRelicSellTime > 500) {
            // Use the window.sellRelic function which properly handles onUnequip
            window.sellRelic(gameState.hoveredRelicIndex);
                gameState.lastRelicSellTime = currentTime;
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase()] = false;
    }
    // Track previous key states
    if (e.key.toLowerCase() === 'e') {
        keys.wasE = false;
    }
    if (e.key.toLowerCase() === 'r') {
        keys.wasR = false;
    }
});

// Event listeners for mouse
window.addEventListener('mousemove', (e) => {
    // Convert mouse position to scene coordinates
    mouse.x = (e.clientX / window.innerWidth) * ROOM_SIZE - ROOM_SIZE / 2;
    mouse.y = -(e.clientY / window.innerHeight) * ROOM_SIZE + ROOM_SIZE / 2;
});

window.addEventListener('mousedown', () => {
    mouse.isDown = true;
});

window.addEventListener('mouseup', () => {
    mouse.isDown = false;
});

window.addEventListener('mouseout', () => {
    // Show cursor when mouse leaves the game window
    renderer.domElement.style.cursor = 'default';
    if (crosshair) crosshair.visible = false;
});

window.addEventListener('mouseover', () => {
    // Hide cursor when mouse enters the game window
    renderer.domElement.style.cursor = 'none';
    if (crosshair) crosshair.visible = true;
});

// Restart button event listener
document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    restartGame();
});

// Function to restart game from level 3 (second battle level)
function restartGame() {
    // Clean up existing objects
    if (player) {
        player.cleanup();
    }
    if (playerDialog) {
        playerDialog.cleanup();
    }
    if (currentLevel) {
        currentLevel.cleanup();
    }
    if (lootSystem) {
        lootSystem.cleanup();
    }
    
    // Reset game state but start at level 3 (to skip tutorial and first shop)
    gameState = {
        level: 3, // Start at level 3 (second battle level)
        killStreak: 0,
        gameOver: false,
        isShopLevel: false,
        currentPickup: null,
        hoveredRelicIndex: -1,
        lastRelicSellTime: 0,
        tutorialShown: true,
        isPaused: false,
        blood: 0,
        enemies: []
    };
    
    // Clear previous game objects
    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
    }
    
    enemies = [];
    
    // Create crosshair
    createCrosshair();
    
    // Initialize systems
    relicSystem = new RelicSystem();
    lootSystem = new LootSystem(scene);
    
    // Initialize level first
    currentLevel = new Level(scene, ROOM_SIZE, gameState.level);
    
    // Initialize player
    player = new Player(scene, camera, isMobile);
    player.ammo = 3000; // Set initial ammo to 3000
    player.maxAmmo = 3000; // Set max ammo to 3000
    
    // Initialize player dialog with new player instance
    playerDialog = new PlayerDialogManager(scene, player, camera);
    
    // Position player at the hatch in the lower right corner
    player.mesh.position.x = ROOM_SIZE/2 - 80;
    player.mesh.position.y = -ROOM_SIZE/2 + 80;
    
    // Update shadow position if it exists
    if (player.shadow) {
        player.shadow.position.x = player.mesh.position.x + 12;
        player.shadow.position.y = player.mesh.position.y + 12;
    }
    
    // Make gameState globally accessible for relic effects
    window.gameState = gameState;
    
    // Reset UI elements instead of recreating them
    if (ui) {
        ui.resetUIElements();
        ui.updateRequiredBlood(currentLevel.bloodRequired);
    } else {
        // Initialize UI after player is created if it doesn't exist
        ui = new UI();
        ui.updateRequiredBlood(currentLevel.bloodRequired);
    }
    
    // Spawn enemies for level 3 (second battle level)
    spawnEnemies();
    
    // Show level message and update UI after everything is initialized
    ui.showLevelMessage(gameState.level);
    ui.updateStats(player, gameState);
}

// Initialize and start the game
dialog = new Dialog();
dialog.show();

// Display controls tutorial message on first level
function showControlsTutorial() {
    // Pause the game while tutorial is showing
    gameState.isPaused = true;
    
    // Create a full-screen overlay
    const tutorialOverlay = document.createElement('div');
    tutorialOverlay.id = 'controls-tutorial';
    tutorialOverlay.style.position = 'absolute';
    tutorialOverlay.style.top = '0';
    tutorialOverlay.style.left = '0';
    tutorialOverlay.style.width = '100%';
    tutorialOverlay.style.height = '100%';
    tutorialOverlay.style.backgroundColor = 'rgba(0, 0, 0, 1)'; // Changed to fully opaque black
    tutorialOverlay.style.color = 'white';
    tutorialOverlay.style.fontFamily = 'monospace, sans-serif';
    tutorialOverlay.style.fontSize = '24px';
    tutorialOverlay.style.display = 'flex';
    tutorialOverlay.style.flexDirection = 'column';
    tutorialOverlay.style.justifyContent = 'center';
    tutorialOverlay.style.alignItems = 'center';
    tutorialOverlay.style.zIndex = '1000';
    
    // Create text containers
    const line1 = document.createElement('div');
    line1.style.marginBottom = '20px';
    line1.style.height = '30px';
    
    const line2 = document.createElement('div');
    line2.style.marginBottom = '20px';
    line2.style.height = '30px';
    line2.style.display = 'none'; // Initially hidden
    
    const line3 = document.createElement('div');
    line3.style.marginBottom = '20px';
    line3.style.height = '30px';
    line3.style.display = 'none'; // Initially hidden
    
    // Create next button 
    const createNextButton = () => {
        const nextButton = document.createElement('button');
        nextButton.textContent = "NEXT";
        nextButton.style.padding = '10px 20px';
        nextButton.style.fontSize = '20px';
        nextButton.style.backgroundColor = '#800000'; // Dark red
        nextButton.style.color = 'white';
        nextButton.style.border = '2px solid #ff0000';
        nextButton.style.borderRadius = '5px';
        nextButton.style.cursor = 'pointer';
        nextButton.style.fontFamily = 'monospace, sans-serif';
        nextButton.style.marginTop = '20px';
    
        // Button hover effect
        nextButton.addEventListener('mouseover', () => {
            nextButton.style.backgroundColor = '#ff0000';
        });
        nextButton.addEventListener('mouseout', () => {
            nextButton.style.backgroundColor = '#800000';
        });
        
        return nextButton;
    };
    
    // Create Start button
    const startButton = document.createElement('button');
    startButton.textContent = "START";
    startButton.style.padding = '10px 20px';
    startButton.style.fontSize = '20px';
    startButton.style.backgroundColor = '#800000';
    startButton.style.color = 'white';
    startButton.style.border = '2px solid #ff0000';
    startButton.style.borderRadius = '5px';
    startButton.style.cursor = 'pointer';
    startButton.style.fontFamily = 'monospace, sans-serif';
    startButton.style.marginTop = '20px';
    startButton.style.display = 'none';
    
    startButton.addEventListener('mouseover', () => {
        startButton.style.backgroundColor = '#ff0000';
    });
    startButton.addEventListener('mouseout', () => {
        startButton.style.backgroundColor = '#800000';
    });
    
    // Start button click handler
    startButton.addEventListener('click', () => {
        tutorialOverlay.style.transition = 'opacity 1s';
        tutorialOverlay.style.opacity = '0';
        setTimeout(() => {
            tutorialOverlay.remove();
            gameState.isPaused = false;
        }, 1000);
    });
    
    // Next buttons for each line
    const nextButton1 = createNextButton();
    const nextButton2 = createNextButton();
    
    // Add all elements to the overlay
    tutorialOverlay.appendChild(line1);
    tutorialOverlay.appendChild(nextButton1);
    tutorialOverlay.appendChild(line2);
    tutorialOverlay.appendChild(nextButton2);
    tutorialOverlay.appendChild(line3);
    tutorialOverlay.appendChild(startButton);
    
    document.body.appendChild(tutorialOverlay);
    
    // Define text for each line
    const text1 = "Kill demons and collect their blood before it DISAPPEARS";
    const text2 = "Gather the required amount of blood each level and bring it to the altar statue to progress";
    const text3 = "Use WASD to move around. Point and click to shoot. Good luck, you'll need it";
    
    // Initially hide all buttons
    nextButton1.style.display = 'none';
    nextButton2.style.display = 'none';
    
    // Button click handlers
    nextButton1.addEventListener('click', () => {
        nextButton1.style.display = 'none';
        line2.style.display = 'block';
        typeOutText(line2, text2, () => {
            nextButton2.style.display = 'block';
        });
    });
    
    nextButton2.addEventListener('click', () => {
        nextButton2.style.display = 'none';
        line3.style.display = 'block';
        typeOutText(line3, text3, () => {
            startButton.style.display = 'block';
        });
    });
    
    // Function to type out text with a blinking effect
    function typeOutText(element, text, onComplete) {
        let index = 0;
        
        // Create a span for the text
        const textSpan = document.createElement('span');
        element.appendChild(textSpan);
        
        // If this is line 1, handle the "DISAPPEARS" in red
        if (text === text1) {
            const interval = setInterval(() => {
                if (index < text.length) {
                    // Check if we're at "DISAPPEARS"
                    if (index === text.indexOf("DISAPPEARS")) {
                        // Add the red text
                        const redText = document.createElement('span');
                        redText.style.color = '#ff0000';
                        redText.textContent = "DISAPPEARS";
                        element.appendChild(redText);
                        index += "DISAPPEARS".length;
                    } else {
                        textSpan.textContent += text.charAt(index);
                        index++;
                    }
                } else {
                    clearInterval(interval);
                    if (onComplete) onComplete();
                }
            }, 30);
        } else {
            const interval = setInterval(() => {
                if (index < text.length) {
                    textSpan.textContent += text.charAt(index);
                    index++;
                } else {
                    clearInterval(interval);
                    if (onComplete) onComplete();
                }
            }, 30);
        }
    }
    
    // Start typing the first line
    typeOutText(line1, text1, () => {
        nextButton1.style.display = 'block';
    });
    
    // Set flag that tutorial has been shown
    gameState.tutorialShown = true;
}

// Create a crosshair that follows the mouse
function createCrosshair() {
    // Create a group to hold the crosshair elements
    crosshair = new THREE.Group();
    
    // Create crosshair lines
    const lineThickness = 2;
    const lineLength = 12;
    const gapSize = 4;
    
    // Horizontal line (left and right parts)
    const horizontalLeft = new THREE.Mesh(
        new THREE.PlaneGeometry(lineLength, lineThickness),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    );
    horizontalLeft.position.x = -gapSize - lineLength/2;
    
    const horizontalRight = new THREE.Mesh(
        new THREE.PlaneGeometry(lineLength, lineThickness),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    );
    horizontalRight.position.x = gapSize + lineLength/2;
    
    // Vertical line (top and bottom parts)
    const verticalTop = new THREE.Mesh(
        new THREE.PlaneGeometry(lineThickness, lineLength),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    );
    verticalTop.position.y = gapSize + lineLength/2;
    
    const verticalBottom = new THREE.Mesh(
        new THREE.PlaneGeometry(lineThickness, lineLength),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    );
    verticalBottom.position.y = -gapSize - lineLength/2;
    
    // Center dot
    const centerDot = new THREE.Mesh(
        new THREE.CircleGeometry(2, 8),
        new THREE.MeshBasicMaterial({ color: 0xFF0000 })
    );
    
    // Add all parts to the crosshair group
    crosshair.add(horizontalLeft);
    crosshair.add(horizontalRight);
    crosshair.add(verticalTop);
    crosshair.add(verticalBottom);
    crosshair.add(centerDot);
    
    // Set crosshair position in front of everything
    crosshair.position.z = 5;
    
    // Add to scene
    scene.add(crosshair);
    
    // Only hide cursor on the canvas, not the entire page
    renderer.domElement.style.cursor = 'none';
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', startGame);

// Export game object for mobile controls
export { game };

// --- Desktop Input Handling ---
function initDesktopControls() {
    document.addEventListener('keydown', (event) => {
        switch (event.key.toLowerCase()) { // Use toLowerCase for consistency
            case 'w': keys.w = true; break;
            case 'a': keys.a = true; break;
            case 's': keys.s = true; break;
            case 'd': keys.d = true; break;
            case 'e': keys.e = true; break;
            case 'r': keys.r = true; break;
        }
    });

    document.addEventListener('keyup', (event) => {
        switch (event.key.toLowerCase()) { // Use toLowerCase for consistency
            case 'w': keys.w = false; break;
            case 'a': keys.a = false; break;
            case 's': keys.s = false; break;
            case 'd': keys.d = false; break;
            case 'e': keys.e = false; keys.wasE = false; break; // Reset wasE on key up
            case 'r': keys.r = false; keys.wasR = false; break; // Reset wasR on key up
        }
    });

    document.addEventListener('mousemove', (event) => {
        // Convert mouse position to world coordinates relative to canvas center
        const rect = renderer.domElement.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Project mouse coords to world space (using orthographic camera properties)
        const worldX = (mouseX / window.innerWidth) * (camera.right - camera.left) + camera.left;
        const worldY = -(mouseY / window.innerHeight) * (camera.top - camera.bottom) + camera.top;

        mouse.x = worldX;
        mouse.y = worldY;

        // Update crosshair position
        if (crosshair) {
            crosshair.position.set(mouse.x, mouse.y, 2); // Keep crosshair slightly above player
        }
    });

    document.addEventListener('mousedown', () => {
        mouse.isDown = true;
    });

    document.addEventListener('mouseup', () => {
        mouse.isDown = false;
    });

    // Prevent context menu on right-click for the canvas
    renderer.domElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
}

// --- Mobile Input Handling ---
function initMobileControls() {
    const leftJoystickZone = document.getElementById('left-joystick');
    const rightJoystickZone = document.getElementById('right-joystick');
    mobileDebugOverlay = document.getElementById('mobile-debug-overlay');

    if (!leftJoystickZone || !rightJoystickZone) {
        console.error("Joystick container elements not found! Aborting mobile controls init.");
        return;
    }
    if (!mobileDebugOverlay) {
        console.warn("Mobile debug overlay element not found.");
    }

    const joystickOptions = {
        mode: 'static',             // Keep joystick fixed in its zone
        position: { left: '50%', top: '50%' }, // Center nipple in the div
        size: 100,                  // Base size of the joystick
        color: 'grey',             // Default color
        threshold: 0.1,             // Minimum movement threshold
        fadeTime: 150,              // Faster fade time
        dynamicPage: true,          // Adjusts to resizing/orientation changes
        restJoystick: true          // Return joystick to center when released
    };

    // --- Left Joystick (Movement) ---
    try {
        leftJoystick = nipplejs.create({
            ...joystickOptions,
            zone: leftJoystickZone,
            color: 'rgba(255, 255, 255, 0.5)' // Semi-transparent white
        });

        leftJoystick.on('start move', (evt, data) => {
            if (data.vector) {
                mobileInputState.moveVector.x = data.vector.x;
                mobileInputState.moveVector.y = data.vector.y;
                mobileInputState.isMoving = true;
            } else {
                 mobileInputState.isMoving = false;
                 mobileInputState.moveVector = { x: 0, y: 0 };
            }
            updateDebugOverlay();
        });

        leftJoystick.on('end', (evt, data) => {
            mobileInputState.isMoving = false;
            mobileInputState.moveVector = { x: 0, y: 0 };
            updateDebugOverlay();
        });
        console.log("Left joystick initialized.");
    } catch (error) {
        console.error("Error initializing left joystick:", error);
    }

    // --- Right Joystick (Aiming & Shooting) ---
    try {
        rightJoystick = nipplejs.create({
            ...joystickOptions,
            zone: rightJoystickZone,
            color: 'rgba(255, 0, 0, 0.5)' // Semi-transparent red
        });

        rightJoystick.on('start move', (evt, data) => {
            if (data.angle && data.angle.radian && data.distance > joystickOptions.threshold * joystickOptions.size * 0.5) { // Check distance threshold
                // NippleJS angle: 0=right, PI/2=up, PI=left, -PI/2=down
                // THREE.js angle (atan2): Same convention
                mobileInputState.aimAngle = data.angle.radian;
                mobileInputState.aimVector = data.vector; // Store normalized vector
                mobileInputState.isAiming = true;
                mobileInputState.isShooting = true; // Shoot while aiming
            } else {
                // If joystick is touched but not moved beyond threshold, consider it aiming center?
                // Or treat as not aiming/shooting?
                mobileInputState.isAiming = false;
                mobileInputState.isShooting = false; // Don't shoot if not aiming actively
                // Keep last aimAngle? Reset?
            }
            updateDebugOverlay();
        });

        rightJoystick.on('end', (evt, data) => {
            mobileInputState.isShooting = false; // Stop shooting when released
            mobileInputState.isAiming = false;
            // Keep the last aim angle? Let's reset the vector for clarity.
            mobileInputState.aimVector = { x: 0, y: 0 };
            updateDebugOverlay();
        });
         console.log("Right joystick initialized.");
    } catch (error) {
        console.error("Error initializing right joystick:", error);
    }
}

// --- Debug Overlay Update ---
function updateDebugOverlay() {
    if (!mobileDebugOverlay || !isMobile) return;

    const moveVec = mobileInputState.moveVector;
    const aimVec = mobileInputState.aimVector;
    const aimAngleDeg = (mobileInputState.aimAngle * 180 / Math.PI).toFixed(1);

    mobileDebugOverlay.innerHTML = `
        Move: (${moveVec.x.toFixed(2)}, ${moveVec.y.toFixed(2)}) ${mobileInputState.isMoving ? 'MOVING' : ''}<br>
        Aim: (${aimVec.x.toFixed(2)}, ${aimVec.y.toFixed(2)}) ${mobileInputState.isAiming ? 'AIMING' : ''}<br>
        Angle: ${aimAngleDeg}°<br>
        ${mobileInputState.isShooting ? 'SHOOTING' : ''}
    `;
}

// --- Window Resize Handling ---
function onWindowResize() {
    // Update camera aspect ratio & projection
    const aspect = window.innerWidth / window.innerHeight;
    const viewSizeY = ROOM_SIZE + CAMERA_PADDING; // Base vertical view size
    const viewSizeX = viewSizeY * aspect; 

    camera.left = -viewSizeX / 2;
    camera.right = viewSizeX / 2;
    camera.top = viewSizeY / 2;
    camera.bottom = -viewSizeY / 2;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update floating text positions 
    if (player && player.updateHPTextPosition) {
         player.updateHPTextPosition();
    }
    // Update other UI elements if necessary
    if (ui && ui.onResize) {
        ui.onResize(window.innerWidth, window.innerHeight);
    }
    
    // Re-initialize or update joysticks if necessary on resize/orientation change
    // Nipplejs dynamicPage handles some resizing, but zone position might need manual update
    // if layout changes significantly.
}