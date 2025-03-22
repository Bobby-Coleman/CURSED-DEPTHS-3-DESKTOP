import * as THREE from 'three';
import { Player } from './player.js';
import { Level } from './level.js';
import { Enemy } from './enemy.js';
import { UI } from './ui.js';
import { LootSystem } from './loot.js';
import { RelicSystem } from './relics.js';
import { Shop } from './shop.js';

// Game constants
const ROOM_SIZE = 800;

// Game state
let gameState = {
    level: 1,
    gold: 20,
    killStreak: 0,
    gameOver: false,
    isShopLevel: false,
    currentPickup: null,
    hoveredRelicIndex: -1,
    lastRelicSellTime: 0  // Add this to track last sell time
};

// Initialize Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x228B22); // Jungle green background

const camera = new THREE.OrthographicCamera(
    ROOM_SIZE / -2, ROOM_SIZE / 2, 
    ROOM_SIZE / 2, ROOM_SIZE / -2, 
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

function init() {
    // Reset game state
    gameState = {
        level: 1,
        gold: 20,
        killStreak: 0,
        gameOver: false,
        isShopLevel: false,
        currentPickup: null,
        hoveredRelicIndex: -1,
        lastRelicSellTime: 0  // Add this to track last sell time
    };
    
    // Clear previous game objects
    while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
    }
    
    enemies = [];
    
    // Initialize systems
    relicSystem = new RelicSystem();
    lootSystem = new LootSystem(scene);
    
    // Initialize player first
    player = new Player(scene);
    
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
    
    // Initialize level
    currentLevel = new Level(scene, ROOM_SIZE, gameState.level);
    
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
    // Create random number of enemies (3-10)
    const numEnemies = Math.floor(Math.random() * 8) + 3; // 3-10 enemies
    
    for (let i = 0; i < numEnemies; i++) {
        // Spawn enemy at random position (not too close to player)
        let enemyX, enemyY;
        do {
            enemyX = Math.random() * ROOM_SIZE - ROOM_SIZE / 2;
            enemyY = Math.random() * ROOM_SIZE - ROOM_SIZE / 2;
        } while (Math.sqrt(enemyX * enemyX + enemyY * enemyY) < 250); // Increased from 100 to 250 (aggro range is 200)
        
        // Create enemy based on type
        const enemyType = Math.floor(Math.random() * 5); // 0: basic, 1: shooter, 2: fast, 3: bomber, 4: charger
        const enemy = new Enemy(scene, enemyX, enemyY, enemyType, gameState.level);
        enemies.push(enemy);
    }
}

function createShopLevel() {
    // Set shop level flag
    gameState.isShopLevel = true;
    
    // Create shop
    shop = new Shop(scene, relicSystem);
    
    // Activate portal immediately and position it next to the shop
    currentLevel.activatePortal(200, 0); // Position portal 200 units to the right of the shop altar
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
        
        // Create shop
        shop = new Shop(scene, relicSystem);
        
        // Activate portal immediately and position it next to the shop
        currentLevel.activatePortal(200, 0);
    } else {
        // Create normal level
        gameState.isShopLevel = false;
        
        // Create new level
        currentLevel = new Level(scene, ROOM_SIZE, gameState.level);
        
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
        // Update player
        player.update(keys, mouse, enemies);
        
        if (!gameState.isShopLevel) {
            // Update enemies
            for (let i = enemies.length - 1; i >= 0; i--) {
                enemies[i].update(player);
                
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
            
            // Handle relic selling
            if (keys.r && !keys.wasR && gameState.hoveredRelicIndex !== -1) {
                const currentTime = Date.now();
                // Add 500ms cooldown between sells
                if (currentTime - gameState.lastRelicSellTime > 500) {
                    // Try to sell the relic
                    if (relicSystem.canSellRelic(player, player.relics[gameState.hoveredRelicIndex])) {
                        if (relicSystem.sellRelic(player, gameState.hoveredRelicIndex)) {
                            gameState.gold += 5;
                            gameState.lastRelicSellTime = currentTime;  // Update last sell time
                            ui.updateStats(player, gameState);
                            ui.showMessage("Relic sold for 5 gold!");
                        }
                    } else {
                        ui.showMessage("This relic cannot be sold yet!");
                    }
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
        
        // Update UI
        updateUI();
    }
    
    renderer.render(scene, camera);
}

// Event listeners for keyboard
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() in keys) {
        keys[e.key.toLowerCase()] = true;
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
    init();
});

// Initialize and start the game
init();
animate();