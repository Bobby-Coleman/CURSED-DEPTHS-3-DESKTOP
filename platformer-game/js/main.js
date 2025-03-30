// Dark Platformer - A simple side-scrolling platformer game
// Inspired by Limbo and Inside

// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to fill the window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Generate seamless hill path
    generatePath();
}

// Ground path data - will be generated as an array of y-positions for each x position
let groundPath = [];
const PATH_SEGMENT_WIDTH = 5; // Width between each point on path

// Generate a seamless hill path
function generatePath() {
    groundPath = [];
    
    // Base height is 75% of the canvas height
    const baseHeight = canvas.height * 0.75;
    
    // Generate a flat ground path for a long distance
    const totalWidth = 50000; // Very long path for "endless" feel
    
    // Generate completely flat segments
    for (let x = 0; x < totalWidth; x += PATH_SEGMENT_WIDTH) {
        groundPath.push(baseHeight);
    }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game state
const gameState = {
    running: true,
    scrollX: 0,
    level: 1,
    portalAnimTime: 0, // For portal animation
    showInstructions: true,
    instructionFade: 1.0
};

// Player properties
const player = {
    x: 0, // This will be set to screen center
    y: 0,
    width: 15,
    height: 40,
    velocityX: 0,
    velocityY: 0,
    speed: 2.5, // Reduced from 5 to 2.5 (half speed)
    jumpForce: 12,
    gravity: 0.5,
    grounded: false,
    doubleJump: false,
    distanceTraveled: 0, // Track actual distance traveled
    currentGroundHeight: 0 // Added for debugging
};

// Background layers for parallax effect
const backgrounds = [];
let currentBackgroundIndex = 0;
let hasMoreBackgrounds = true;

// Add memory text system
const memoryTexts = [
    "The first time I saw the darkness, it was just a shadow in the corner of my eye.",
    "The whispers started as gentle murmurs, growing louder with each step.",
    "The ground beneath my feet felt different here, like walking on memories.",
    "The air was thick with the scent of old books and forgotten dreams.",
    "The walls seemed to breathe, pulsing with an ancient rhythm."
];

let currentMemoryText = "";
let isTyping = false;
let typeIndex = 0;
let typeSpeed = 30;
let currentMemoryIndex = 0;
let backgroundWidths = []; // Store the scaled widths of all backgrounds

// Calculate and store background widths when they load
function calculateBackgroundWidths() {
    backgroundWidths = [];
    let totalWidth = 0;
    
    for (let i = 0; i < backgrounds.length; i++) {
        const img = backgrounds[i];
        if (!img.complete || img.naturalWidth === 0) continue;
        
        const scale = canvas.height / img.height;
        const scaledWidth = img.width * scale;
        backgroundWidths.push({
            width: scaledWidth,
            startX: totalWidth,
            endX: totalWidth + scaledWidth
        });
        totalWidth += scaledWidth;
    }
}

// Update loadBackgrounds to calculate widths when images load
function loadBackgrounds() {
    // Clear backgrounds array
    backgrounds.length = 0;
    
    // Start with the first two backgrounds
    const initialBackgrounds = [
        'assets/images/background_1.PNG',
        'assets/images/background_2.png'
    ];
    
    // Load initial backgrounds
    initialBackgrounds.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        img.onload = function() {
            console.log(`Background ${index + 1} loaded successfully`);
            calculateBackgroundWidths();
        };
        img.onerror = function() {
            console.log(`Background ${index + 1} failed to load`);
        };
        backgrounds.push(img);
    });
    
    // Try to load additional backgrounds
    let nextIndex = 3;
    function tryLoadNextBackground() {
        const img = new Image();
        img.src = `assets/images/background_${nextIndex}.png`;
        img.onload = function() {
            console.log(`Background ${nextIndex} loaded successfully`);
            backgrounds.push(img);
            calculateBackgroundWidths();
            nextIndex++;
            tryLoadNextBackground();
        };
        img.onerror = function() {
            console.log(`No more backgrounds found after ${nextIndex - 1}`);
            hasMoreBackgrounds = false;
            showExitDoor();
        };
    }
    
    tryLoadNextBackground();
}

// Track player input
const keys = {
    left: false,
    right: false,
    up: false
};

// Set up event listeners for player input
window.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'd':
            keys.right = true;
            break;
        case 'ArrowUp':
        case 'w':
        case ' ':
            keys.up = true;
            if (player.grounded) {
                player.velocityY = -player.jumpForce;
                player.grounded = false;
            } else if (!player.doubleJump) {
                player.velocityY = -player.jumpForce * 0.8;
                player.doubleJump = true;
            }
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'd':
            keys.right = false;
            break;
        case 'ArrowUp':
        case 'w':
        case ' ':
            keys.up = false;
            break;
        case 'Escape':
            // Exit platformer and return to main game
            window.location.href = '../index.html';
            break;
    }
});

// Draw the stick figure player - completely rewritten for precise ground alignment
function drawPlayer() {
    ctx.save();
    
    // Add a subtle glow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 10;
    
    // Screen center for horizontal position
    const screenCenterX = canvas.width / 2;
    
    // Calculate the exact path index for the player's current position
    const exactPathIndex = player.distanceTraveled / PATH_SEGMENT_WIDTH;
    const pathIndex = Math.floor(exactPathIndex);
    
    // Calculate slope for leaning effect
    let slopeAngle = 0;
    if (pathIndex > 0 && pathIndex < groundPath.length - 1) {
        // Use three points to get a smoother slope calculation
        const prevHeight = groundPath[pathIndex - 1];
        const currHeight = groundPath[pathIndex];
        const nextHeight = groundPath[pathIndex + 1];
        
        // Calculate average slope using neighboring points
        const slope1 = (currHeight - prevHeight) / PATH_SEGMENT_WIDTH;
        const slope2 = (nextHeight - currHeight) / PATH_SEGMENT_WIDTH;
        const avgSlope = (slope1 + slope2) / 2;
        
        // Convert slope to angle (in radians)
        slopeAngle = Math.atan(avgSlope) * 0.7; // Scale down for subtle effect
    }
    
    // Base all drawing from the player's feet position
    const feetY = player.y + player.height;
    
    // Body
    ctx.beginPath();
    ctx.moveTo(screenCenterX, feetY - player.height + 10); // Top of body (near head)
    ctx.lineTo(screenCenterX + Math.sin(slopeAngle) * 20, feetY - 10); // Bottom of body
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Head
    ctx.beginPath();
    ctx.arc(screenCenterX, feetY - player.height + 5, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    
    // Arms with running animation
    const speedFactor = Math.abs(player.velocityX) / player.speed;
    const armPhase = player.distanceTraveled * 0.1 * (player.velocityX > 0 ? 1 : -1);
    
    ctx.beginPath();
    // Middle of body
    ctx.moveTo(screenCenterX, feetY - player.height + 20); 
    
    // Left arm with running movement
    const leftArmOffsetX = Math.sin(armPhase) * 8 * speedFactor;
    const leftArmOffsetY = Math.abs(Math.cos(armPhase)) * 5 * speedFactor;
    ctx.lineTo(
        screenCenterX - 8 + leftArmOffsetX, 
        feetY - player.height + 20 + leftArmOffsetY
    );
    
    // Right arm with opposite phase
    ctx.moveTo(screenCenterX, feetY - player.height + 20);
    const rightArmOffsetX = Math.sin(armPhase + Math.PI) * 8 * speedFactor;
    const rightArmOffsetY = Math.abs(Math.cos(armPhase + Math.PI)) * 5 * speedFactor;
    ctx.lineTo(
        screenCenterX + 8 + rightArmOffsetX, 
        feetY - player.height + 20 + rightArmOffsetY
    );
    
    ctx.stroke();
    
    // Legs with improved running animation
    const legBaseX = screenCenterX + Math.sin(slopeAngle) * 20;
    const legBaseY = feetY - 10; // Bottom of body
    
    ctx.beginPath();
    ctx.moveTo(legBaseX, legBaseY);
    
    // More natural running cycle for legs
    // Left leg
    const leftLegPhase = armPhase + Math.PI; // Opposite arms for natural look
    const leftLegOffsetX = Math.sin(leftLegPhase) * 8 * speedFactor;
    const leftLegOffsetY = Math.max(0, Math.cos(leftLegPhase) * 5) * speedFactor;
    ctx.lineTo(legBaseX - 8 + leftLegOffsetX, feetY - leftLegOffsetY);
    
    // Right leg
    ctx.moveTo(legBaseX, legBaseY);
    const rightLegPhase = armPhase;
    const rightLegOffsetX = Math.sin(rightLegPhase) * 8 * speedFactor;
    const rightLegOffsetY = Math.max(0, Math.cos(rightLegPhase) * 5) * speedFactor;
    ctx.lineTo(legBaseX + 8 + rightLegOffsetX, feetY - rightLegOffsetY);
    
    ctx.stroke();
    
    ctx.restore();
    
    // For debugging: draw a small hitbox indicator
    if (false) { // Set to true to see hitbox
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(
            screenCenterX - player.width/2, 
            player.y, 
            player.width, 
            player.height
        );
        
        // Draw ground point
        ctx.fillStyle = 'yellow';
        ctx.fillRect(screenCenterX, player.y + player.height - 2, 4, 4);
    }
}

// Draw the seamless path
function drawPath() {
    ctx.save();
    
    // Create gradient for the ground - solid black now
    const gradient = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height);
    gradient.addColorStop(0, '#000000');
    gradient.addColorStop(1, '#000000');
    
    // Draw ground
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    // Move to the start of the visible path
    const startIndex = Math.floor(gameState.scrollX / PATH_SEGMENT_WIDTH);
    const offsetX = gameState.scrollX % PATH_SEGMENT_WIDTH;
    
    // Start from just off screen
    ctx.moveTo(-20, canvas.height);
    
    // Draw visible portion of the path
    const screenWidth = canvas.width + 40; // Add some padding
    const pointCount = Math.ceil(screenWidth / PATH_SEGMENT_WIDTH) + 1;
    
    for (let i = 0; i < pointCount; i++) {
        const pathIndex = startIndex + i;
        if (pathIndex >= 0 && pathIndex < groundPath.length) {
            const x = i * PATH_SEGMENT_WIDTH - offsetX;
            const y = groundPath[pathIndex];
            ctx.lineTo(x, y);
        }
    }
    
    // Close the path to the bottom of the screen
    ctx.lineTo(screenWidth, canvas.height);
    ctx.lineTo(-20, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // Remove highlight on the path edge
    ctx.restore();
}

// Check if player is on ground - completely rewritten with hitbox approach
function checkGroundCollision() {
    player.grounded = false;
    
    // Calculate the exact index in the groundPath for the player's current world position
    const exactPathIndex = player.distanceTraveled / PATH_SEGMENT_WIDTH;
    const pathIndex = Math.floor(exactPathIndex);
    
    // Safety check - make sure we're not out of bounds
    if (pathIndex >= 0 && pathIndex < groundPath.length - 1) {
        // Get the two closest ground heights and interpolate between them for precise placement
        const nextPathIndex = pathIndex + 1;
        const fraction = exactPathIndex - pathIndex;
        
        // Linear interpolation between closest points for smooth ground level
        const groundHeight1 = groundPath[pathIndex];
        const groundHeight2 = groundPath[nextPathIndex];
        const exactGroundHeight = groundHeight1 * (1 - fraction) + groundHeight2 * fraction;
        
        // Store ground height for debugging and drawing
        player.currentGroundHeight = exactGroundHeight;
        
        // Check if player is on or below ground level
        const playerFeet = player.y + player.height;
        
        if (playerFeet >= exactGroundHeight - 2 && player.velocityY >= 0) {
            // Player is on ground - snap precisely to ground
            player.grounded = true;
            player.doubleJump = false;
            player.y = exactGroundHeight - player.height;
            player.velocityY = 0;
        }
    }
}

// Draw the parallax background - completely rewritten for sequential display
function drawBackground() {
    // Clear the canvas with a dark background
    ctx.fillStyle = '#0A0A14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (backgrounds.length === 0) {
        drawFallbackBackground();
        return;
    }
    
    // Calculate total width of all previous backgrounds
    let previousBackgroundsWidth = 0;
    let currentBackgroundWidth = 0;
    let currentImageIndex = 0;
    
    // Find which background should be showing based on player position
    for (let i = 0; i < backgrounds.length; i++) {
        const img = backgrounds[i];
        if (!img.complete || img.naturalWidth === 0) continue;
        
        // Scale image to fill screen height
        const scale = canvas.height / img.height;
        const scaledWidth = img.width * scale;
        
        // If player hasn't reached the end of this background yet
        if (player.distanceTraveled < previousBackgroundsWidth + scaledWidth) {
            currentBackgroundWidth = scaledWidth;
            currentImageIndex = i;
            break;
        }
        
        // Otherwise, move to the next background
        previousBackgroundsWidth += scaledWidth;
        
        // If this was the last background, loop back to the first one
        if (i === backgrounds.length - 1) {
            currentImageIndex = 0;
            previousBackgroundsWidth = 0;
        }
    }
    
    // Draw the current background image
    if (currentImageIndex < backgrounds.length) {
        const img = backgrounds[currentImageIndex];
        if (img.complete && img.naturalWidth > 0) {
            const scale = canvas.height / img.height;
            const scaledWidth = img.width * scale;
            
            // Position the background based on player's distance into this background
            const distanceIntoBackground = player.distanceTraveled - previousBackgroundsWidth;
            const xPos = -distanceIntoBackground;
            
            ctx.drawImage(img, xPos, 0, scaledWidth, canvas.height);
            
            // Check if we need to draw the next background
            if (xPos + scaledWidth < canvas.width && currentImageIndex < backgrounds.length - 1) {
                const nextImg = backgrounds[currentImageIndex + 1];
                if (nextImg && nextImg.complete && nextImg.naturalWidth > 0) {
                    const nextScale = canvas.height / nextImg.height;
                    const nextScaledWidth = nextImg.width * nextScale;
                    ctx.drawImage(nextImg, xPos + scaledWidth, 0, nextScaledWidth, canvas.height);
                }
            } else if (xPos + scaledWidth < canvas.width && currentImageIndex === backgrounds.length - 1) {
                // If we've reached the end of the last background, draw the first background next
                const firstImg = backgrounds[0];
                if (firstImg && firstImg.complete && firstImg.naturalWidth > 0) {
                    const firstScale = canvas.height / firstImg.height;
                    const firstScaledWidth = firstImg.width * firstScale;
                    ctx.drawImage(firstImg, xPos + scaledWidth, 0, firstScaledWidth, canvas.height);
                }
            }
        } else {
            drawFallbackBackground();
        }
    } else {
        drawFallbackBackground();
    }
}

// Fallback background with stars and mountains when images aren't loaded
function drawFallbackBackground() {
    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 100; i++) {
        const x = (Math.random() * canvas.width + gameState.scrollX * 0.1) % canvas.width;
        const y = Math.random() * canvas.height * 0.7; // Only in the sky area
        const size = Math.random() * 2;
        ctx.fillRect(x, y, size, size);
    }
    
    // Distant mountains
    ctx.fillStyle = '#1A1A24';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.6);
    
    // Generate a mountain silhouette
    const mountainWidth = canvas.width * 2;
    const segmentWidth = mountainWidth / 20;
    
    for (let i = 0; i <= 20; i++) {
        const x = i * segmentWidth;
        let height = Math.sin(i * 0.5 + gameState.scrollX * 0.0005) * canvas.height * 0.15;
        height += Math.sin(i * 0.2 - gameState.scrollX * 0.0002) * canvas.height * 0.05;
        const y = canvas.height * 0.6 - height;
        ctx.lineTo(x, y);
    }
    
    ctx.lineTo(mountainWidth, canvas.height * 0.7);
    ctx.lineTo(0, canvas.height * 0.7);
    ctx.closePath();
    ctx.fill();
}

// Draw the end level portal
function drawEndPortal() {
    const portalX = 3000 - gameState.scrollX;
    // Only draw if on screen
    if (portalX < -100 || portalX > canvas.width + 100) return;
    
    // Draw portal
    ctx.save();
    ctx.translate(portalX, canvas.height * 0.7);
    
    // Pulsing glow
    const glowSize = 60 + Math.sin(gameState.portalAnimTime) * 10;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(128, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(64, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Portal center
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(0, 0, 20 + Math.sin(gameState.portalAnimTime * 2) * 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Portal runes (pentagram-like)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = i * Math.PI * 2 / 5 + gameState.portalAnimTime * 0.1;
        const x1 = Math.cos(angle) * 30;
        const y1 = Math.sin(angle) * 30;
        const x2 = Math.cos(angle + Math.PI * 2 / 5 * 2) * 30;
        const y2 = Math.sin(angle + Math.PI * 2 / 5 * 2) * 30;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    
    // Portal label
    ctx.font = '14px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', 0, 50);
    
    ctx.restore();
}

// Update player position and state
function updatePlayer() {
    // Apply gravity
    player.velocityY += player.gravity;
    
    // Handle horizontal movement
    if (keys.left) {
        player.velocityX = -player.speed;
    } else if (keys.right) {
        player.velocityX = player.speed;
    } else {
        player.velocityX = 0;
    }
    
    // Prevent moving left of the starting point
    if (player.distanceTraveled + player.velocityX < 0) {
        player.velocityX = -player.distanceTraveled;
        if (player.velocityX < 0) {
            // Show a visual indicator for the wall
            drawLeftWall();
        }
    }
    
    // Update player's distance traveled (for world scrolling)
    player.distanceTraveled += player.velocityX;
    
    // Apply vertical velocity
    player.y += player.velocityY;
    
    // Set horizontal scroll based on distance traveled
    gameState.scrollX = player.distanceTraveled;
    
    // Check for ground collision - must happen after position update
    checkGroundCollision();
    
    // Check if player fell off the bottom of the screen
    if (player.y > canvas.height) {
        // Reset player position
        player.y = 0;
        player.velocityY = 0;
    }
}

// Draw a wall indicator when player tries to move too far left
function drawLeftWall() {
    const wallX = -gameState.scrollX; // This will be at the left edge of the screen
    
    // Only draw if close to the wall (within 50 pixels)
    if (wallX > 50) return;
    
    ctx.save();
    
    // Draw a subtle wall indicator
    const gradient = ctx.createLinearGradient(wallX, 0, wallX + 20, 0);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(wallX, 0, 20, canvas.height);
    
    ctx.restore();
}

function checkMemoryTrigger() {
    // Find which background we're currently in based on player position
    for (let i = 0; i < backgroundWidths.length; i++) {
        const bg = backgroundWidths[i];
        
        // Calculate the player's position relative to this background
        const playerRelativeX = player.distanceTraveled - bg.startX;
        const screenBuffer = canvas.width / 2; // Half screen width buffer
        
        // Trigger when player overlaps with the left edge of the background, plus screen buffer
        if (playerRelativeX >= -screenBuffer && 
            playerRelativeX < -screenBuffer + 5 && // Small window to trigger
            i < memoryTexts.length && 
            !isTyping && 
            currentMemoryIndex !== i) {
            
            currentMemoryIndex = i;
            startTypingMemory();
            break;
        }
    }
}

function startTypingMemory() {
    currentMemoryText = "";
    isTyping = true;
    typeIndex = 0;
    typeNextCharacter();
}

function typeNextCharacter() {
    if (!isTyping) return;
    
    if (typeIndex < memoryTexts[currentMemoryIndex].length) {
        currentMemoryText += memoryTexts[currentMemoryIndex][typeIndex];
        typeIndex++;
        setTimeout(typeNextCharacter, typeSpeed);
    } else {
        isTyping = false;
    }
}

function drawMemoryText() {
    if (currentMemoryText) {
        ctx.save();
        
        // Add a subtle dark background for better readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, 100);
        
        // Draw the text with a nice style
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Draw the text
        ctx.fillText(currentMemoryText, canvas.width / 2, 50);
        
        ctx.restore();
    }
}

// Game loop
function gameLoop() {
    if (!gameState.running) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw backgrounds
    drawBackground();
    
    // Draw ground path
    drawPath();
    
    // Draw player
    drawPlayer();
    
    // Check for memory trigger and draw memory text
    checkMemoryTrigger();
    drawMemoryText();
    
    // Update player position
    updatePlayer();
    
    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start the game when all backgrounds load
function positionPlayerOnGround() {
    // Position player on the path
    const startPathIndex = 0;
    if (groundPath.length > 0) {
        player.y = groundPath[startPathIndex] - player.height;
    }
}

// Initialize the game
function init() {
    // Load all background images
    loadBackgrounds();
    
    // Generate the path first
    generatePath();
    
    // Start at the beginning
    gameState.scrollX = 0;
    player.distanceTraveled = 0;
    
    // Position player correctly on the initial ground level
    player.x = canvas.width / 2; // Center horizontally on screen
    
    // Set initial Y position to be on ground
    positionPlayerOnGround();
    
    // Center the first background on the player
    if (backgrounds.length > 0 && backgrounds[0].complete) {
        const firstBg = backgrounds[0];
        const scale = canvas.height / firstBg.height;
        const scaledWidth = firstBg.width * scale;
        gameState.scrollX = (scaledWidth - canvas.width) / 2;
    }
    
    // Trigger first memory text immediately
    currentMemoryIndex = 0;
    startTypingMemory();
    
    // Start game loop immediately
    gameLoop();
}

// Start the game
init();

// Draw instructions
function drawInstructions() {
    ctx.save();
    
    // Semi-transparent background
    ctx.fillStyle = `rgba(0, 0, 0, ${gameState.instructionFade * 0.7})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Instructions text
    ctx.font = '24px Arial';
    ctx.fillStyle = `rgba(255, 255, 255, ${gameState.instructionFade})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Title
    ctx.font = '32px Arial';
    ctx.fillText('Dark Platformer', canvas.width/2, canvas.height/2 - 100);
    
    // Controls
    ctx.font = '20px Arial';
    ctx.fillText('Use A/D or Arrow Keys to move', canvas.width/2, canvas.height/2 - 20);
    ctx.fillText('Use W/Up/Space to jump', canvas.width/2, canvas.height/2 + 20);
    ctx.fillText('Press Escape to return to main game', canvas.width/2, canvas.height/2 + 60);
    
    // Goal
    ctx.font = '18px Arial';
    ctx.fillText('Explore the endless world', canvas.width/2, canvas.height/2 + 120);
    
    ctx.restore();
}

// Add this function to show the exit door
function showExitDoor() {
    // Create exit door element
    const exitDoor = document.createElement('div');
    exitDoor.style.position = 'fixed';
    exitDoor.style.right = '20px';
    exitDoor.style.top = '50%';
    exitDoor.style.transform = 'translateY(-50%)';
    exitDoor.style.padding = '20px';
    exitDoor.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    exitDoor.style.color = 'white';
    exitDoor.style.borderRadius = '10px';
    exitDoor.style.cursor = 'pointer';
    exitDoor.textContent = 'Exit Game';
    exitDoor.onclick = function() {
        window.location.href = '../index.html';
    };
    document.body.appendChild(exitDoor);
} 