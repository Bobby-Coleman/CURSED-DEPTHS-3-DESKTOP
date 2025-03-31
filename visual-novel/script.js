// Dialog data
const dialog = [
    { speaker: "W", text: "He's crying every night. I'm drowning here trying to take care of us—and you vanish." },
    { speaker: "H", text: "I didn't vanish, Jesus. I'm right here, alright?" },
    { speaker: "W", text: "You show up at 2AM reeking of bars. You hear him cry and just… sit there." },
    { speaker: "H", text: "It's a couple drinks after work, okay?" },
    { speaker: "W", text: "Couple? There are bottles everywhere. The trash smells like a liquor store. Oh and I found your messages. All of them. Cursor? Who the hell is she??" },
    { speaker: "H", text: "So you're spying on me now? What—digging through my computer?" },
    { speaker: "W", text: "You left it unlocked. You want to lie to me, be smarter about it." },
    { speaker: "H", text: "[furious] That's not your place! I need something, alright? Something that isn't this." },
    { speaker: "W", text: "Oh, this? You mean your child? Me? The wreckage you made?" },
    { speaker: "H", text: "Don't talk to me like you know. Like you know what it's like to wake up and wish you hadn't." },
    { speaker: "W", text: "I do. You don't think I don't think about what happened every day too? I look at you now and wonder where the man I married went." },
    { speaker: "H", text: "[quiet, venomous] You sound just like my mother." },
    { speaker: "W", text: "And you sound just like your father." },
    { speaker: "H", text: "Don't go there. I dare you, say that again." },
    { speaker: "W", text: "[cold] You heard me." },
    { speaker: "H", text: "[stepping forward, unsteady] You know what, I'm fucking done. I'm leaving." },
    { speaker: "W", text: "You're wasted. You can't drive right now. Sit down." },
    { speaker: "H", text: "[cold, controlled] I said I'm done. Back off." },
    { speaker: "W", text: "[cracking] Don't do this. You can't drive. You're gonna abandon another thing that needed you? You know what? Go to HELL." }
];

// Three.js setup
let scene, camera, renderer, plane;
let madTexture, sadTexture, madMaterial, sadMaterial;
let currentLine = 0;
const dialogBox = document.getElementById('dialogBox');
const choiceButton = document.getElementById('choiceButton');

// Initialize Three.js scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    madTexture = textureLoader.load('assets/mad.jpg', adjustPlaneSize);
    sadTexture = textureLoader.load('assets/sad.jpg');

    // Create materials
    madMaterial = new THREE.MeshBasicMaterial({ map: madTexture });
    sadMaterial = new THREE.MeshBasicMaterial({ map: sadTexture });

    // Create plane (temporary size, will be adjusted when texture loads)
    const geometry = new THREE.PlaneGeometry(2, 2);
    plane = new THREE.Mesh(geometry, madMaterial);
    scene.add(plane);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();

    // Show first line of dialog
    updateDialog();
}

// Adjust plane size to match screen aspect ratio and fill screen
function adjustPlaneSize() {
    const imageAspect = madTexture.image.width / madTexture.image.height;
    const screenAspect = window.innerWidth / window.innerHeight;
    
    let planeWidth, planeHeight;
    
    if (screenAspect > imageAspect) {
        // Screen is wider than image
        planeWidth = 2;
        planeHeight = 2 / screenAspect * imageAspect;
    } else {
        // Screen is taller than image
        planeHeight = 2;
        planeWidth = 2 * screenAspect / imageAspect;
    }
    
    plane.scale.set(planeWidth, planeHeight, 1);
}

// Update dialog text and background
function updateDialog() {
    if (currentLine < dialog.length) {
        const line = dialog[currentLine];
        dialogBox.textContent = `${line.speaker}: ${line.text}`;
        
        // Switch background based on speaker
        plane.material = line.speaker === "W" ? madMaterial : sadMaterial;
    } else {
        dialogBox.textContent = "What will you do?";
        choiceButton.style.display = 'block';
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    adjustPlaneSize();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Event listeners
document.addEventListener('click', (event) => {
    // Ignore clicks on the choice button
    if (event.target === choiceButton) return;
    
    currentLine++;
    updateDialog();
});

choiceButton.addEventListener('click', () => {
    window.location.href = '/driving-game/driving.html?playMusic=true&beerCount=3';
});

// Start the visual novel
init(); 