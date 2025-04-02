import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Museum texts for wall sections
const museumTexts = [
        "I told you I'd fix it tomorrow, why are you always on me about it? - You said that last week.",
        "Come on baby, say 'dada'—just once for me. - Dada.",
        "I'm not drunk, I've only had two. - You reek of whiskey and the baby's still awake.",
        "Please don't leave. - I'm not leaving. I just need air.",
        "Daddy, do you remember the blue fish from the aquarium? - Of course I do. You named it Glitterhead.",
        "You threw my laptop, Mark. You actually threw it. - I was angry. I didn't mean to.",
        "It's okay, we can fix it. - You always say that. Not everything can be fixed.",
        "You were the one who told me I could do this. - I still believe that.",
        "What if I mess everything up again? - Then we start over. Again.",
        "Do you remember the day she was born? - Yeah. You cried harder than she did.",
        "I'm sorry I missed your recital. - I waited by the window all night.",
        "You said you'd quit. - I will. I just need to get through this week.",
        "She asked if you're coming to her play. - I'll be there. I swear on my life.",
        "You kissed my forehead and said everything would be okay. - I lied. But I needed to believe it.",
        "Why are we like this, Mark? - Because we both don't know how to let go.",
        "Daddy, I drew you. You're a superhero. - Let me see that. Wow. That's amazing.",
        "You can't keep disappearing like this. - I don't mean to. I just get lost.",
        "You were sober for six months. What happened? - I thought I could have one.",
        "This is the happiest I've ever seen you. - It's because you're both here.",
        "We danced in the kitchen, remember that? - Yeah. The burnt pancakes. The music too loud.",
        "Don't teach her to be afraid of you. - I'm not trying to. I'm trying to be better.",
        "She said she loves you even when you yell. - That breaks me, you know?",
        "You're not a bad dad. Just a tired one. - I don't want tired to be all she remembers.",
        "You used to draw monsters with her. - Yeah, she always made them pink.",
        "It wasn't your fault. - Doesn't feel that way.",
        "Come home. Just come home. - I don't know how.",
        "You didn't ruin everything. - I ruined enough.",
        "You were so gentle with her. Even drunk. - That scares me more than anything.",
        "I'm proud of you. - I don't hear that much.",
        "Remember the night we built her cardboard castle? - She made me sleep in it.",
        "You forgot her birthday. - I was at the meeting. I didn't forget. I messed up.",
        "She asked why you're always sad. - I said sometimes daddies just get quiet.",
        "You held her like she was glass. - She saved me, a little.",
        "I found the letters you wrote and never sent. - I didn't think I deserved to send them.",
        "I still wear the ring, Mark. - Even after all this?",
        "She keeps your photo under her pillow. - I can't even look at myself right now.",
        "Don't disappear on her again. - I won't. I promise.",
        "You missed her first step. - I watched it on video, 100 times.",
        "We made this life together. Don't walk away from it. - I'm not walking away. I'm crawling back.",
        "Remember when she fell asleep on your chest? - I didn't move for hours.",
        "You promised me you'd be better. - And I broke it.",
        "One day at a time, right? - That's the only way I can do it.",
        "You're still her hero. - I don't feel like one.",
        "She forgave you. - How?",
        "I'm scared of what you'll be in 10 years. - I'm scared of tomorrow.",
        "I love you, even when it's hard. - It's always hard.",
        "She said 'Daddy made the monster go away.' - I didn't even know she saw it.",
        "This is the last time. - You said that last time.",
        "You held me like I was the only thing keeping you on Earth. - You were.",
    
];


// Game variables
let camera, scene, renderer, controls;
let hallways = [];
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let font;

// Expose movement variables to window for mobile controls
window.game = {
    moveForward,
    moveBackward,
    moveLeft,
    moveRight
};

// Expose camera globally for mobile controls
window.camera = camera;

// Constants
const HALLWAY_LENGTH = 40;  // Longer segments for better performance
const HALLWAY_WIDTH = 10;
const HALLWAY_HEIGHT = 50;
const PLAYER_HEIGHT = 2;
const PLAYER_SPEED = 150.0;  // Increased for smoother movement
const SEGMENTS_IN_VIEW = 4;  // Keep 4 segments loaded at a time
const WALL_BOUNDARY = HALLWAY_WIDTH/2 - 0.5;

// Initialize the game
function init() {
    // Scene setup with fog
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 60, 100);  // Add fog for distance fade-out
    
    // Initialize background music
    const backgroundMusic = document.getElementById('backgroundMusic');
    if (backgroundMusic) {
        backgroundMusic.volume = 0.5; // Set volume to 50%
        // Try to play the music
        backgroundMusic.play().catch(error => {
            console.log("Autoplay prevented:", error);
            // Add click handler to start music on user interaction
            document.addEventListener('click', function startMusic() {
                backgroundMusic.play();
                document.removeEventListener('click', startMusic);
            }, { once: true });
        });
    }
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = PLAYER_HEIGHT;
    
    // Expose camera globally for mobile controls
    window.camera = camera;

    // Basic ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // Floor with repeating texture for movement perception
    const floorGeometry = new THREE.PlaneGeometry(HALLWAY_WIDTH, HALLWAY_LENGTH * SEGMENTS_IN_VIEW);
    const floorMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x808080,
        transparent: true,
        opacity: 0.5
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));  // Cap pixel ratio for performance
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Expose renderer globally for mobile controls
    window.renderer = renderer;
    renderer.domElement._threeCamera = camera;

    // Controls setup
    controls = new PointerLockControls(camera, document.body);
    
    // Expose controls to window for mobile controls
    window.controls = controls;

    // Automatically lock controls when game starts
    document.addEventListener('click', () => {
        controls.lock();
    });

    controls.addEventListener('unlock', () => {
        // Re-lock on next click
        document.addEventListener('click', () => {
            controls.lock();
        }, { once: true });
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);

    // Create initial hallway segments
    for (let i = 0; i < SEGMENTS_IN_VIEW; i++) {
        createHallwaySegment(i);
    }
}

function createHallwaySegment(index) {
    const segment = {
        walls: [],
        zPosition: index * HALLWAY_LENGTH
    };

    // Create walls with basic material
    const wallGeometry = new THREE.BoxGeometry(0.2, HALLWAY_HEIGHT, HALLWAY_LENGTH);
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-HALLWAY_WIDTH/2, HALLWAY_HEIGHT/2, segment.zPosition);
    segment.walls.push(leftWall);
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(HALLWAY_WIDTH/2, HALLWAY_HEIGHT/2, segment.zPosition);
    segment.walls.push(rightWall);
    scene.add(rightWall);

    // Add text to walls if font is loaded
    if (font) {
        // Calculate base text index for this segment
        const baseTextIndex = Math.abs(Math.floor(segment.zPosition / HALLWAY_LENGTH)) * 8;
        
        // Add 8 texts to each wall (more texts to fill the space)
        for (let i = 0; i < 8; i++) {
            // Left wall texts
            addTextToWall(leftWall, museumTexts[(baseTextIndex + i) % museumTexts.length], -1, i);
            // Right wall texts
            addTextToWall(rightWall, museumTexts[(baseTextIndex + i + 4) % museumTexts.length], 1, i);
        }
    }

    hallways.push(segment);
}

function addTextToWall(wall, text, side, textIndex) {
    // Split text into words and create lines of 5 words
    const words = text.split(' ');
    const lines = [];
    for (let i = 0; i < words.length; i += 5) {
        lines.push(words.slice(i, i + 5).join(' '));
    }

    // Create and position each line of text
    lines.forEach((line, lineIndex) => {
        const textGeometry = new TextGeometry(line, {
            font: font,
            size: 0.12,
            height: 0.01,
        });
        textGeometry.computeBoundingBox();
        
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        // Position text in a continuous strip
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        textMesh.position.set(
            side * -0.15,
            -(HALLWAY_HEIGHT/2) + PLAYER_HEIGHT + 0.5 - (lineIndex * 0.15), // Vertical position stays consistent
            -HALLWAY_LENGTH/2 + (HALLWAY_LENGTH * (textIndex/8)) // Evenly space across entire wall length
        );
        textMesh.rotation.y = -Math.PI/2 * side;
        wall.add(textMesh);
    });
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * PLAYER_SPEED * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * PLAYER_SPEED * delta;

        // Improved wall collision detection
        const nextX = camera.position.x - velocity.x * delta;
        const nextZ = camera.position.z - velocity.z * delta;
        
        // Calculate distances to walls after potential movement
        const distanceToLeftWall = nextX + WALL_BOUNDARY;
        const distanceToRightWall = WALL_BOUNDARY - nextX;
        
        // Check wall collisions with buffer zone
        const COLLISION_BUFFER = 0.1; // Small buffer to prevent wall touching
        
        let canMoveX = true;
        let canMoveZ = true;
        
        // Prevent X movement if too close to walls
        if (distanceToLeftWall < COLLISION_BUFFER || distanceToRightWall < COLLISION_BUFFER) {
            canMoveX = false;
            velocity.x = 0; // Stop horizontal momentum
        }
        
        // Apply allowed movement
        if (canMoveX) {
            controls.moveRight(-velocity.x * delta);
        }
        if (canMoveZ) {
            controls.moveForward(-velocity.z * delta);
        }

        // Enforce absolute boundaries (failsafe)
        if (Math.abs(camera.position.x) >= WALL_BOUNDARY) {
            camera.position.x = Math.sign(camera.position.x) * WALL_BOUNDARY;
            velocity.x = 0;
        }

        // Recycle hallway segments
        const cameraZ = camera.position.z;
        hallways.forEach((segment, index) => {
            const distanceFromCamera = segment.zPosition - cameraZ;
            
            // If segment is too far behind, move it to the front
            if (distanceFromCamera < -HALLWAY_LENGTH * 2) {
                const newPosition = segment.zPosition + (HALLWAY_LENGTH * SEGMENTS_IN_VIEW);
                segment.zPosition = newPosition;
                segment.walls.forEach(wall => {
                    wall.position.z = newPosition;
                    
                    // Update text on recycled segment
                    const textIndex = Math.abs(Math.floor(newPosition / HALLWAY_LENGTH)) % museumTexts.length;
                    // Remove old text
                    wall.children.forEach(child => wall.remove(child));
                    // Add new text
                    if (font) {
                        // Left wall gets current index, right wall gets next index
                        const isLeftWall = wall.position.x < 0;
                        addTextToWall(wall, museumTexts[isLeftWall ? textIndex : (textIndex + 1) % museumTexts.length], isLeftWall ? -1 : 1);
                    }
                });
            }
            
            // If segment is too far ahead, move it to the back
            if (distanceFromCamera > HALLWAY_LENGTH * 2) {
                const newPosition = segment.zPosition - (HALLWAY_LENGTH * SEGMENTS_IN_VIEW);
                segment.zPosition = newPosition;
                segment.walls.forEach(wall => {
                    wall.position.z = newPosition;
                    
                    // Update text on recycled segment
                    const textIndex = Math.abs(Math.floor(newPosition / HALLWAY_LENGTH)) % museumTexts.length;
                    // Remove old text
                    wall.children.forEach(child => wall.remove(child));
                    // Add new text
                    if (font) {
                        // Left wall gets current index, right wall gets next index
                        const isLeftWall = wall.position.x < 0;
                        addTextToWall(wall, museumTexts[isLeftWall ? textIndex : (textIndex + 1) % museumTexts.length], isLeftWall ? -1 : 1);
                    }
                });
            }
        });

        // If mobile controls moved the camera directly, sync controls position with it
        if (window.innerWidth <= 768 && window.movePlayerMoved) {
            window.movePlayerMoved = false;
            controls.getObject().position.copy(camera.position);
        }

        prevTime = time;
    }

    // Re-attach camera to canvas element for direct access
    if (renderer && renderer.domElement) {
        renderer.domElement._threeCamera = camera;
    }

    renderer.render(scene, camera);
}

// Load font and initialize game
const fontLoader = new FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(loadedFont) {
    font = loadedFont;
    init();
    animate();
    
    // Initialize audio with multiple approaches and fallbacks
    initAudio();
});

// Multiple approaches to ensure audio plays successfully
function initAudio() {
    console.log("Initializing audio system...");
    
    // Store status for debugging
    let audioStatus = {
        elementFound: false,
        playAttempted: false,
        playSucceeded: false,
        playError: null,
        redirectScheduled: false
    };
    
    // Get the audio element from the DOM
    const audioElement = document.getElementById('introVoice');
    if (!audioElement) {
        console.error("Audio element not found in the DOM!");
        return;
    }
    audioStatus.elementFound = true;
    
    // Get the button for manual playback
    const audioButton = document.getElementById('audioButton');
    if (audioButton) {
        // Hide button initially, show if autoplay fails
        audioButton.style.display = 'none';
        
        // Add click handler to the button
        audioButton.addEventListener('click', function() {
            console.log("Audio button clicked");
            playAudioWithElement(audioElement);
            audioButton.style.display = 'none'; // Hide after click
        });
    }
    
    // Helper function to actually play the audio
    function playAudioWithElement(element) {
        if (audioStatus.playSucceeded) {
            console.log("Audio already playing, not starting again");
            return;
        }
        
        console.log("Attempting to play audio...");
        audioStatus.playAttempted = true;
        
        // First check if the audio source is valid
        if (!element.src && element.getElementsByTagName('source').length === 0) {
            console.error("No audio source found!");
            audioStatus.playError = "No source";
            return;
        }
        
        // Enforce volume setting
        element.volume = 1.0;
        
        // Play with detailed error handling
        element.play()
            .then(() => {
                console.log("Audio playback started successfully!");
                audioStatus.playSucceeded = true;
                
                // Schedule the redirect only once we confirm audio is playing
                if (!audioStatus.redirectScheduled) {
                    scheduleRedirect();
                }
            })
            .catch(error => {
                console.error("Audio playback failed:", error);
                audioStatus.playError = error.message || "Unknown error";
                
                // Show the manual play button if autoplay fails
                if (audioButton) {
                    audioButton.style.display = 'block';
                }
                
                // Schedule redirect even if audio fails
                if (!audioStatus.redirectScheduled) {
                    scheduleRedirect();
                }
            });
    }
    
    // Schedule the redirect to visual novel
    function scheduleRedirect() {
        console.log("Scheduling redirect to visual novel...");
        audioStatus.redirectScheduled = true;
        
        // Redirect after 26 seconds
        setTimeout(() => {
            console.log("Redirecting to visual novel now");
            window.location.href = 'https://cursed-depths-3-de6de9e234ae.herokuapp.com/visual-novel/index.html';
        }, 36000);
    }
    
    // Try to play automatically after 4 seconds
    setTimeout(() => {
        console.log("4-second timer elapsed, attempting to play audio...");
        playAudioWithElement(audioElement);
    }, 4000);
    
    // Add countdown timer
    const countdownElement = document.getElementById('countdown');
    let timeLeft = 36;
    
    const countdownInterval = setInterval(() => {
        timeLeft--;
        countdownElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            countdownElement.textContent = "0";
        }
    }, 1000);
    
    // Provide a global function for debugging
    window.debugAudioStatus = function() {
        console.log("Audio Status:", audioStatus);
        console.log("Audio Element:", audioElement);
        return audioStatus;
    };
    
    // Attempt to play when user interacts with the page
    document.addEventListener('click', function playOnInteraction() {
        console.log("User interaction detected, attempting to play audio...");
        playAudioWithElement(audioElement);
        document.removeEventListener('click', playOnInteraction);
    });
    
    // Also attempt to play on keydown if other methods fail
    document.addEventListener('keydown', function playOnKey(event) {
        if (!audioStatus.playSucceeded && (event.code === 'KeyW' || event.code === 'KeyA' || 
            event.code === 'KeyS' || event.code === 'KeyD')) {
            console.log("Key press detected, attempting to play audio...");
            playAudioWithElement(audioElement);
            document.removeEventListener('keydown', playOnKey);
        }
    });
} 