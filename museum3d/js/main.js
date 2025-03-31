import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Museum texts for wall sections
const museumTexts = [
    "Exhibit #1: The Nature of Time\n'Time is not a line, but a series of now-points.'",
    "Exhibit #2: The Digital Revolution\n'Every pixel tells a story, every byte holds a memory.'",
    "Exhibit #3: Human Consciousness\n'We are the universe experiencing itself.'",
    "Exhibit #4: The Art of Code\n'Programming is poetry for machines.'",
    "Exhibit #5: Virtual Reality\n'Reality is merely an illusion, albeit a very persistent one.'",
    "Exhibit #6: Digital Dreams\n'In the space between 0 and 1, infinite possibilities exist.'",
    "Exhibit #7: The Future of AI\n'We shape our tools, and thereafter our tools shape us.'",
    "Exhibit #8: Quantum Computing\n'In the quantum realm, everything is everywhere, always.'",
    "Exhibit #9: The Internet Age\n'We are all connected in the great digital web.'",
    "Exhibit #10: Digital Identity\n'In cyberspace, we are both everyone and no one.'",
    "Exhibit #11: The Matrix\n'What is real? How do you define real?'",
    "Exhibit #12: Cybernetic Philosophy\n'The medium is the message.'"
];

// Game variables
let camera, scene, renderer, controls;
let player;
let hallways = [];
let currentHallwayIndex = 0;
let forwardHallwayIndex = 0;  // For positive direction
let backwardHallwayIndex = -1;  // For negative direction
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let font;

// Constants
const HALLWAY_LENGTH = 30;
const HALLWAY_WIDTH = 10;
const HALLWAY_HEIGHT = 50;
const PLAYER_HEIGHT = 2;
const PLAYER_SPEED = 100.0;
const HALLWAY_SPAWN_DISTANCE = 60;
const WALL_BOUNDARY = HALLWAY_WIDTH/2 - 0.5; // Boundary offset from walls

// Load font and initialize game
const fontLoader = new FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(loadedFont) {
    font = loadedFont;
    init();
    animate();
});

// Initialize the game
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = PLAYER_HEIGHT;

    // Enhanced Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);  // Brighter ambient light
    scene.add(ambientLight);

    // Add some directional light for better definition
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(1, 1, 1);
    scene.add(dirLight);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(HALLWAY_WIDTH, 2000);  // Adjusted floor width
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Controls
    controls = new PointerLockControls(camera, document.body);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', () => {
        console.log('Instructions clicked');
        controls.lock();
    });

    controls.addEventListener('lock', () => {
        console.log('Controls locked');
        blocker.style.display = 'none';
        instructions.style.display = 'none';
    });

    controls.addEventListener('unlock', () => {
        console.log('Controls unlocked');
        blocker.style.display = 'flex';
        instructions.style.display = '';
    });

    // Event listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);

    // Create initial hallways in both directions
    createHallway(0);  // Center
    createHallway(1);  // Forward
    createHallway(-1); // Backward
}

function createHallway(direction) {
    const index = direction >= 0 ? forwardHallwayIndex++ : backwardHallwayIndex--;
    const hallway = {
        walls: [],
        text: museumTexts[Math.abs(index) % museumTexts.length]
    };

    // Create walls with enhanced material
    const wallGeometry = new THREE.BoxGeometry(0.2, HALLWAY_HEIGHT, HALLWAY_LENGTH);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.1
    });

    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-HALLWAY_WIDTH/2, HALLWAY_HEIGHT/2, index * HALLWAY_LENGTH);
    hallway.walls.push(leftWall);
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(HALLWAY_WIDTH/2, HALLWAY_HEIGHT/2, index * HALLWAY_LENGTH);
    hallway.walls.push(rightWall);
    scene.add(rightWall);

    // Add text plaques to walls
    if (font) {
        addPlaque(leftWall, hallway.text, -1);
        addPlaque(rightWall, hallway.text, 1);
    }

    hallways.push(hallway);
}

function addPlaque(wall, text, side) {
    // Create multiple text instances along the wall
    const textsPerWall = 3; // Number of text instances per wall section
    const spacing = HALLWAY_LENGTH / textsPerWall;
    
    for(let i = 0; i < textsPerWall; i++) {
        // Add text directly to wall
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 0.15,
            height: 0.01,
        });
        textGeometry.computeBoundingBox();
        
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black text, no lighting needed
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        // Position text on wall at eye level
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        textMesh.position.set(
            side * -0.15, // Inward from wall
            -(HALLWAY_HEIGHT/2) + PLAYER_HEIGHT - 0.3, // At eye level
            -HALLWAY_LENGTH/2 + spacing/2 + i * spacing // Spread along wall length
        );
        textMesh.rotation.y = -Math.PI/2 * side; // Reversed rotation for inside viewing
        wall.add(textMesh);
    }
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

        // Apply wall boundaries
        const potentialX = camera.position.x - velocity.x * delta;
        if (Math.abs(potentialX) < WALL_BOUNDARY) {
            controls.moveRight(-velocity.x * delta);
        }
        controls.moveForward(-velocity.z * delta);

        // Check if we need to spawn new hallway sections in either direction
        if (camera.position.z < (backwardHallwayIndex * HALLWAY_LENGTH + HALLWAY_SPAWN_DISTANCE)) {
            createHallway(-1); // Spawn backward section
        }
        if (camera.position.z > (forwardHallwayIndex * HALLWAY_LENGTH - HALLWAY_SPAWN_DISTANCE)) {
            createHallway(1);  // Spawn forward section
        }

        // Remove far hallway sections
        const cameraZ = camera.position.z;
        hallways = hallways.filter(hallway => {
            const tooFar = Math.abs(cameraZ - hallway.walls[0].position.z) > HALLWAY_LENGTH * 3;
            if (tooFar) {
                hallway.walls.forEach(wall => {
                    scene.remove(wall);
                    wall.geometry.dispose();
                    wall.material.dispose();
                });
            }
            return !tooFar;
        });

        prevTime = time;
    }

    renderer.render(scene, camera);
} 