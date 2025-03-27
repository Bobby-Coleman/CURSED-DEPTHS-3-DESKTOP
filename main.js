import * as THREE from 'three';
import { Player } from './player.js';
import { Level } from './level.js';
import { Enemy } from './enemy.js';
import { UI } from './ui.js';
import { LootSystem } from './loot.js';
import { RelicSystem } from './relics.js';
import { Shop } from './shop.js';
import { Dialog } from './dialog.js';

// Game constants
const ROOM_SIZE = 800;

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
    isPaused: false // Add flag to track if game is paused during tutorial
};

// Initialize Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x228B22); // Jungle green background

// Create camera with slightly larger view to include walls
const CAMERA_PADDING = 80; // Extra padding to view walls
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

const mouse = {
    x: 0,
    y: 0,
    isDown: false
};

// Make sellRelic function globally accessible
window.sellRelic = function(index) {
    if (player && player.relics[index]) {
        // Check if relic can be sold
        if (relicSystem.canSellRelic(player, player.relics[index])) {
            // Remove the relic and add gold
            if (relicSystem.sellRelic(player, index)) {
                gameState.gold += 5;
                ui.updateStats(player, gameState);
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

function startGame() {
    init();
    animate();
}

// Make startGame globally accessible
window.startGame = startGame;

function init() {
    // Reset game state
    gameState = {
        level: 1,
        killStreak: 0,
        gameOver: false,
        isShopLevel: false,
        currentPickup: null,
        hoveredRelicIndex: -1,
        lastRelicSellTime: 0,
        tutorialShown: false,
        isPaused: false
    };
    
    // Clear previous game objects
    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
    }
    
    enemies = [];
    
    // Initialize systems
    relicSystem = new RelicSystem();
    lootSystem = new LootSystem(scene);
    
    // Initialize level first so we know where the hatch is
    currentLevel = new Level(scene, ROOM_SIZE, gameState.level);
    
    // Initialize player
    player = new Player(scene);
    
    // Position player at the hatch in the lower right corner
    player.mesh.position.x = ROOM_SIZE/2 - 80;
    player.mesh.position.y = -ROOM_SIZE/2 + 80;
    
    // Update shadow position if it exists
    if (player.shadow) {
        player.shadow.position.x = player.mesh.position.x + 12;
        player.shadow.position.y = player.mesh.position.y + 12;
    }
    
    // Add Executioner's Seal for testing
    player.relics.push({
        id: 'executionersSeal',
        name: "Executioner's Seal",
        blessing: 'x3 damage if Kill Streak > 20',
        curse: 'Take x2 damage',
        color: 0x000000
    });
    
    // Set initial kill streak for testing
    gameState.killStreak = 15;
    
    // Make gameState globally accessible for relic effects
    window.gameState = gameState;
    
    // Initialize UI after player is created
    ui = new UI();
    
    // Decide if first level is a shop (20% chance)
    if (Math.random() < 0.2) {
        createShopLevel();
    } else {
        // Spawn enemies for the current level
        spawnEnemies();
    }
    
    // Show level message and update UI after everything is initialized
    ui.showLevelMessage(gameState.level);
    ui.updateStats(player, gameState);
}

function spawnEnemies() {
    // For the first level, only spawn two basic enemies
    if (gameState.level === 1) {
        // Create exactly two basic enemies, far from the player
        const enemy1 = new Enemy(scene, -300, -300, 0, gameState.level); // Basic enemy type (0) in bottom left
        const enemy2 = new Enemy(scene, 300, 300, 0, gameState.level); // Basic enemy type (0) in top right
        
        enemies.push(enemy1);
        enemies.push(enemy2);
        
        // Show controls tutorial message on first level
        showControlsTutorial();
    } else {
        // Always create exactly 10 enemies for non-tutorial levels
        
        // Calculate hatch position (in lower right corner)
        const hatchX = ROOM_SIZE/2 - 80;
        const hatchY = -ROOM_SIZE/2 + 80;
        
        // Always add one nest enemy for variety
        let nestX, nestY;
        do {
            // Higher chance of spawning on left side (70% chance of negative X)
            const leftSideBias = Math.random() < 0.7 ? -1 : 1;
            nestX = leftSideBias * (Math.random() * ROOM_SIZE / 2);
            nestY = (Math.random() * ROOM_SIZE - ROOM_SIZE / 2);
            
            // Calculate distance to hatch
            const distanceToHatch = Math.sqrt(
                Math.pow(nestX - hatchX, 2) + 
                Math.pow(nestY - hatchY, 2)
            );
            
            // Ensure nest doesn't spawn too close to player or hatch
        } while (Math.sqrt(nestX * nestX + nestY * nestY) < 350 || 
                Math.sqrt(Math.pow(nestX - hatchX, 2) + Math.pow(nestY - hatchY, 2)) < 325);
        
        const nestEnemy = new Enemy(scene, nestX, nestY, 5, gameState.level);
        enemies.push(nestEnemy);
        
        // Create the remaining 9 enemies
        for (let i = 0; i < 9; i++) {
            // Spawn enemy at random position with bias toward left side
            let enemyX, enemyY;
            do {
                // Higher chance of spawning on left side (70% chance of negative X)
                const leftSideBias = Math.random() < 0.7 ? -1 : 1;
                enemyX = leftSideBias * (Math.random() * ROOM_SIZE / 2);
                enemyY = (Math.random() * ROOM_SIZE - ROOM_SIZE / 2);
                
                // Calculate distance to hatch
                const distanceToHatch = Math.sqrt(
                    Math.pow(enemyX - hatchX, 2) + 
                    Math.pow(enemyY - hatchY, 2)
                );
                
                // Ensure enemies don't spawn too close to player or hatch
            } while (Math.sqrt(enemyX * enemyX + enemyY * enemyY) < 350 || 
                    Math.sqrt(Math.pow(enemyX - hatchX, 2) + Math.pow(enemyY - hatchY, 2)) < 325);
            
            // Create enemy based on type
            const enemyType = Math.floor(Math.random() * 5); // 0: basic, 1: shooter, 2: fast, 3: bomber, 4: charger
            const enemy = new Enemy(scene, enemyX, enemyY, enemyType, gameState.level);
            enemies.push(enemy);
        }
        
        // Set a random initial aggro delay for each enemy (between 1-3 seconds)
        setTimeout(() => {
            for (const enemy of enemies) {
                // Random delay between 1000-3000ms
                const randomDelay = 1000 + Math.random() * 2000;
                setTimeout(() => {
                    if (enemy && !enemy.isDead) {
                        enemy.isAggro = true;
                    }
                }, randomDelay);
            }
        }, 100); // Small initial delay to ensure enemies are fully created
    }
}

function createShopLevel() {
    // Set shop level flag
    gameState.isShopLevel = true;
    
    // Create shop
    shop = new Shop(scene, relicSystem);
    
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
    
    // Increment level
    gameState.level++;
    
    // Apply relic effects on room change
    relicSystem.onRoomChange(player);
    
    // Decide if next level is a shop (20% chance after level 2, or guaranteed every 5 levels)
    if ((gameState.level % 5 === 0) || (gameState.level > 2 && Math.random() < 0.2)) {
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
        shop = new Shop(scene, relicSystem);
        
        // Activate portal immediately and position it next to the shop
        currentLevel.activatePortal(200, 0);
    } else {
        // Create normal level
        gameState.isShopLevel = false;
        
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
        
        // Spawn enemies
        enemies = [];
        spawnEnemies();
    }
    
    // Show level message
    ui.showLevelMessage(gameState.level);
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
    
    if (!gameState.gameOver) {
        // Only update player and enemies if game is not paused
        if (!gameState.isPaused) {
            // Store player's previous position for collision rollback
            const prevPlayerPosX = player.mesh.position.x;
            const prevPlayerPosY = player.mesh.position.y;
            
            // Update player
            player.update(keys, mouse, enemies);
            
            // Check tomb/wall collisions for player
            if (currentLevel.checkTombCollision(player)) {
                // Collision occurred, revert player position
                player.mesh.position.x = prevPlayerPosX;
                player.mesh.position.y = prevPlayerPosY;
                
                // Update shadow position
                if (player.shadow) {
                    player.shadow.position.x = prevPlayerPosX + 12;
                    player.shadow.position.y = prevPlayerPosY + 12;
                }
            }
            
            // Check exact wall collision
            const wallCollision = currentLevel.checkWallCollision(player);
            if (wallCollision) {
                // Handle collision based on which wall was hit
                if (wallCollision.axis === 'x') {
                    // X-axis collision (left/right walls)
                    player.mesh.position.x = prevPlayerPosX;
                    if (player.shadow) player.shadow.position.x = prevPlayerPosX + 12;
                } else if (wallCollision.axis === 'y') {
                    // Y-axis collision (top/bottom walls)
                    player.mesh.position.y = prevPlayerPosY;
                    if (player.shadow) player.shadow.position.y = prevPlayerPosY + 12;
                }
            }
            
            if (!gameState.isShopLevel) {
                // Update enemies
                for (let i = enemies.length - 1; i >= 0; i--) {
                    // Store enemy's position before updates
                    const prevEnemyPosX = enemies[i].mesh.position.x;
                    const prevEnemyPosY = enemies[i].mesh.position.y;
                    
                    enemies[i].update(player);
                    
                    // Check if the nest has spawned a new enemy
                    if (enemies[i].type === 5 && enemies[i].newSpawnedEnemy) {
                        // Add the newly spawned enemy to the main enemies array
                        enemies.push(enemies[i].newSpawnedEnemy);
                        // Reset the newSpawnedEnemy property
                        enemies[i].newSpawnedEnemy = null;
                    }
                    
                    // Check for tomb collision for enemies too
                    if (currentLevel.checkTombCollision(enemies[i])) {
                        // Collision occurred, revert enemy position
                        enemies[i].mesh.position.x = prevEnemyPosX;
                        enemies[i].mesh.position.y = prevEnemyPosY;
                        
                        // Update shadow position if it exists
                        if (enemies[i].shadow) {
                            enemies[i].shadow.position.x = prevEnemyPosX + 12;
                            enemies[i].shadow.position.y = prevEnemyPosY + 12;
                        }
                    }
                    
                    // Also check wall collision for enemies
                    const enemyWallCollision = currentLevel.checkWallCollision(enemies[i]);
                    if (enemyWallCollision) {
                        // Revert enemy position based on collision axis
                        if (enemyWallCollision.axis === 'x') {
                            enemies[i].mesh.position.x = prevEnemyPosX;
                            if (enemies[i].shadow) enemies[i].shadow.position.x = prevEnemyPosX + 12;
                        } else if (enemyWallCollision.axis === 'y') {
                            enemies[i].mesh.position.y = prevEnemyPosY;
                            if (enemies[i].shadow) enemies[i].shadow.position.y = prevEnemyPosY + 12;
                        }
                    }
                    
                    // Check if enemy is dead
                    if (enemies[i].hp <= 0) {
                        // Generate loot drop
                        const dropX = enemies[i].mesh.position.x;
                        const dropY = enemies[i].mesh.position.y;
                        lootSystem.generateDrop(dropX, dropY);
                        
                        // Remove enemy
                        enemies[i].cleanup();
                        enemies.splice(i, 1);
                        
                        // Increment kill streak
                        gameState.killStreak++;
                    }
                }
                
                // Check if all enemies are defeated
                if (enemies.length === 0 && !currentLevel.portalActive) {
                    currentLevel.activatePortal();
                }
                
                // Check for portal collision
                if (currentLevel.portalActive && currentLevel.checkPortalCollision(player)) {
                    nextLevel();
                }
                
                // Check for item pickups
                gameState.currentPickup = lootSystem.checkPickup(player, ui);
                
                // Handle pickup button (E key)
                if (keys.e && gameState.currentPickup) {
                    const result = lootSystem.pickupDrop(player, gameState.currentPickup, gameState);
                    
                    if (result) {
                        // Show pickup message
                        console.log(result.message);
                        
                        // Hide popup
                        ui.hidePopup();
                        
                        // Reset pickup
                        gameState.currentPickup = null;
                        
                        // Update UI with new weapon stats
                        ui.updateStats(player, gameState);
                    }
                }
                
            } else {
                // Shop level logic
                // Check for shop item interaction
                const shopItem = shop.checkItemInteraction(player, mouse.x, mouse.y, gameState);
                
                if (shopItem) {
                    // Show item popup
                    ui.showItemPopup(shopItem, mouse.x, mouse.y);
                    
                    // Handle purchase with E key
                    if (keys.e && !keys.wasE) {
                        const result = shop.buyItem(player, shopItem, gameState);
                        
                        if (result) {
                            // Show purchase message
                            ui.showMessage(result.message);
                            
                            // Update UI
                            ui.updateStats(player, gameState);
                        }
                    }
                } else {
                    ui.hidePopup();
                }
                
                // Check for portal collision
                if (currentLevel.portalActive && currentLevel.checkPortalCollision(player)) {
                    nextLevel();
                }
            }
            
            // Track previous mouse state
            mouse.wasDown = mouse.isDown;
            
            // Check game over conditions
            checkGameOver();
        }
        
        // Update UI regardless of pause state
        updateUI();
    }
    
    renderer.render(scene, camera);
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
            const relic = player.relics[gameState.hoveredRelicIndex];
            
            // Check if the relic has a selling restriction
            if (relic.canSell === false) {
                ui.showMessage("This relic cannot be sold due to its curse!");
            } else {
                // Remove the relic and add HP
                player.relics.splice(gameState.hoveredRelicIndex, 1);
                player.hp = Math.min(player.maxHp, player.hp + 5);
                
                // Update UI
                ui.updateRelics(player.relics);
                ui.showMessage("Relic sold for 5 HP!");
                
                // Reset hovered relic
                gameState.hoveredRelicIndex = -1;
                gameState.lastRelicSellTime = currentTime;
            }
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

// Restart button event listener
document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    restartGame();
});

// Function to restart game from level 2
function restartGame() {
    // Reset game state but start at level 2
    gameState = {
        level: 2, // Start at level 2 instead of 1
        killStreak: 0,
        gameOver: false,
        isShopLevel: false,
        currentPickup: null,
        hoveredRelicIndex: -1,
        lastRelicSellTime: 0,
        tutorialShown: true, // Mark tutorial as already shown
        isPaused: false
    };
    
    // Clear previous game objects
    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
    }
    
    enemies = [];
    
    // Initialize systems
    relicSystem = new RelicSystem();
    lootSystem = new LootSystem(scene);
    
    // Initialize level first
    currentLevel = new Level(scene, ROOM_SIZE, gameState.level);
    
    // Initialize player
    player = new Player(scene);
    
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
    
    // Initialize UI after player is created
    ui = new UI();
    
    // Spawn enemies for the level (always regular level since we're starting at level 2)
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
    tutorialOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
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
    
    const line3 = document.createElement('div');
    line3.style.marginBottom = '40px';
    line3.style.height = '30px';
    
    // Create Good Luck button
    const goodLuckButton = document.createElement('button');
    goodLuckButton.textContent = "GOOD LUCK";
    goodLuckButton.style.padding = '10px 20px';
    goodLuckButton.style.fontSize = '20px';
    goodLuckButton.style.backgroundColor = '#800000'; // Dark red
    goodLuckButton.style.color = 'white';
    goodLuckButton.style.border = '2px solid #ff0000';
    goodLuckButton.style.borderRadius = '5px';
    goodLuckButton.style.cursor = 'pointer';
    goodLuckButton.style.fontFamily = 'monospace, sans-serif';
    goodLuckButton.style.marginTop = '20px';
    
    // Button hover effect
    goodLuckButton.addEventListener('mouseover', () => {
        goodLuckButton.style.backgroundColor = '#ff0000';
    });
    goodLuckButton.addEventListener('mouseout', () => {
        goodLuckButton.style.backgroundColor = '#800000';
    });
    
    // Button click handler
    goodLuckButton.addEventListener('click', () => {
        // Fade out animation
        tutorialOverlay.style.transition = 'opacity 0.5s';
        tutorialOverlay.style.opacity = '0';
        setTimeout(() => {
            tutorialOverlay.remove();
            // Resume the game after tutorial is removed
            gameState.isPaused = false;
        }, 500);
    });
    
    // Add all elements to the overlay
    tutorialOverlay.appendChild(line1);
    tutorialOverlay.appendChild(line2);
    tutorialOverlay.appendChild(line3);
    tutorialOverlay.appendChild(goodLuckButton);
    
    document.body.appendChild(tutorialOverlay);
    
    // Type out text animation
    const text1 = "Controls: Use WASD to move";
    const text2 = "Point and click to shoot in that direction";
    const text3 = "Kill demons to collect blood. Bring enough blood to the altar to progress";
    let charIndex1 = 0;
    let charIndex2 = 0;
    let charIndex3 = 0;
    
    // Type first line
    const typeFirstLine = setInterval(() => {
        if (charIndex1 < text1.length) {
            line1.textContent += text1.charAt(charIndex1);
            charIndex1++;
        } else {
            clearInterval(typeFirstLine);
            // Start typing second line after first is complete
            const typeSecondLine = setInterval(() => {
                if (charIndex2 < text2.length) {
                    line2.textContent += text2.charAt(charIndex2);
                    charIndex2++;
                } else {
                    clearInterval(typeSecondLine);
                    // Start typing third line after second is complete
                    const typeThirdLine = setInterval(() => {
                        if (charIndex3 < text3.length) {
                            line3.textContent += text3.charAt(charIndex3);
                            charIndex3++;
                        } else {
                            clearInterval(typeThirdLine);
                            // Make button visible after all text is displayed
                            goodLuckButton.style.display = 'block';
                        }
                    }, 30);
                }
            }, 30);
        }
    }, 30);
    
    // Initially hide the button until text is done typing
    goodLuckButton.style.display = 'none';
    
    // Set flag that tutorial has been shown
    gameState.tutorialShown = true;
}