import * as THREE from 'three';

class DrivingGame {
    constructor() {
        // Game settings
        this.settings = {
            roadWidth: 15,
            roadLength: 300,
            carSpeed: 0.6,
            obstacleSpeed: 0.4,
            cameraHeight: 5,
            cameraDistance: 8,
            buildingCount: 20,
            maxObstacles: 10
        };

        // Game state
        this.playerCar = null;
        this.roadSegments = [];
        this.obstacles = [];
        this.buildings = [];
        this.headlights = [];
        this.gameOver = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.playerPosition = 0; // Horizontal position on the road
        this.distance = 0; // Total distance traveled
        this.time = 0; // For animation timing
        
        // Initialize the scene
        this.initScene();
        this.initLights();
        this.createRoad();
        this.createPlayerCar();
        this.createBuildings();
        this.setupControls();
        
        // Start the animation loop
        this.animate();
    }
    
    initScene() {
        // Create scene, camera, and renderer
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000022); // Dark blue night sky
        this.scene.fog = new THREE.Fog(0x000022, 20, 100); // Add fog for atmosphere
        
        // Set up camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, this.settings.cameraHeight, this.settings.cameraDistance);
        this.camera.lookAt(0, 0, -20);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    initLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Moonlight (directional light)
        const moonlight = new THREE.DirectionalLight(0x8888ff, 0.5);
        moonlight.position.set(10, 20, 10);
        this.scene.add(moonlight);
    }
    
    createRoad() {
        // Create the road surface with segments for movement illusion
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8
        });
        
        const segmentLength = 20;
        const segmentCount = Math.ceil(this.settings.roadLength / segmentLength);
        
        for (let i = 0; i < segmentCount; i++) {
            const roadSegment = new THREE.Mesh(
                new THREE.PlaneGeometry(this.settings.roadWidth, segmentLength),
                roadMaterial
            );
            
            roadSegment.rotation.x = -Math.PI / 2;
            roadSegment.position.z = -i * segmentLength;
            
            // Add lane markings
            const leftLaneMark = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 3),
                new THREE.MeshBasicMaterial({ color: 0xffffff })
            );
            leftLaneMark.position.y = 0.01;
            leftLaneMark.position.x = -2;
            leftLaneMark.rotation.x = -Math.PI / 2;
            roadSegment.add(leftLaneMark);
            
            const rightLaneMark = leftLaneMark.clone();
            rightLaneMark.position.x = 2;
            roadSegment.add(rightLaneMark);
            
            this.scene.add(roadSegment);
            this.roadSegments.push(roadSegment);
        }
    }
    
    createPlayerCar() {
        // Create a simple car using basic shapes
        const carGroup = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        carBody.position.y = 0.5;
        carGroup.add(carBody);
        
        // Car roof
        const roofGeometry = new THREE.BoxGeometry(1.5, 0.7, 2);
        const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xdd0000 });
        const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
        carRoof.position.y = 1.35;
        carRoof.position.z = 0.5;
        carGroup.add(carRoof);
        
        // Car wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        
        const wheelPositions = [
            [-1, 0.5, -1.3],  // front-left
            [1, 0.5, -1.3],   // front-right
            [-1, 0.5, 1.3],   // back-left
            [1, 0.5, 1.3]     // back-right
        ];
        
        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(...position);
            wheel.rotation.z = Math.PI / 2;
            carGroup.add(wheel);
        });
        
        // Headlights
        const headlightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        
        const headlightPositions = [
            [-0.6, 0.7, -2],  // left headlight
            [0.6, 0.7, -2]    // right headlight
        ];
        
        headlightPositions.forEach(position => {
            const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight.position.set(...position);
            carGroup.add(headlight);
            
            // Create headlight beams
            const spotLight = new THREE.SpotLight(0xffffcc, 1);
            spotLight.position.set(position[0], position[1], position[2]);
            spotLight.angle = 0.3;
            spotLight.penumbra = 0.5;
            spotLight.distance = 30;
            spotLight.target.position.set(position[0], 0, -30);
            spotLight.castShadow = true;
            carGroup.add(spotLight);
            carGroup.add(spotLight.target);
            this.headlights.push(spotLight);
        });
        
        // Position the car
        carGroup.position.y = 0.5;
        carGroup.position.z = -5;
        this.scene.add(carGroup);
        this.playerCar = carGroup;
    }
    
    createBuildings() {
        // Create simple buildings on both sides of the road
        const buildingColors = [0x444444, 0x555555, 0x666666, 0x777777];
        const roadHalfWidth = this.settings.roadWidth / 2;
        const buildingMargin = 2;
        
        for (let i = 0; i < this.settings.buildingCount; i++) {
            for (let side = -1; side <= 1; side += 2) {
                if (Math.random() < 0.7) { // 70% chance to place a building
                    const height = 3 + Math.random() * 10;
                    const width = 3 + Math.random() * 5;
                    const depth = 3 + Math.random() * 5;
                    
                    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
                    const buildingMaterial = new THREE.MeshStandardMaterial({
                        color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
                        roughness: 0.8
                    });
                    
                    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
                    
                    const x = side * (roadHalfWidth + buildingMargin + width / 2);
                    const z = -i * 20 - Math.random() * 10;
                    
                    building.position.set(x, height / 2, z);
                    this.scene.add(building);
                    this.buildings.push(building);
                    
                    // Add simple windows (just a pattern on the building)
                    if (Math.random() > 0.3) {
                        const windowPattern = this.createWindowPattern(width, height, depth);
                        windowPattern.position.copy(building.position);
                        this.scene.add(windowPattern);
                    }
                }
            }
        }
    }
    
    createWindowPattern(width, height, depth) {
        const group = new THREE.Group();
        const windowGeometry = new THREE.PlaneGeometry(0.6, 0.8);
        const windowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffcc, 
            opacity: 0.7, 
            transparent: true 
        });
        
        // Calculate rows and columns based on building size
        const rows = Math.floor(height / 1.5);
        const cols = Math.floor(width / 1.2);
        
        // Front windows
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (Math.random() < 0.7) { // Some windows are dark
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    window.position.x = -width/2 + 0.7 + col * 1.2;
                    window.position.y = -height/2 + 1.2 + row * 1.5;
                    window.position.z = depth/2 + 0.01;
                    group.add(window);
                }
            }
        }
        
        // Side windows (fewer)
        const sideRows = Math.floor(height / 2);
        const sideCols = Math.floor(depth / 1.5);
        
        for (let row = 0; row < sideRows; row++) {
            for (let col = 0; col < sideCols; col++) {
                if (Math.random() < 0.5) { // Even fewer windows on sides
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    window.position.z = -depth/2 + 0.7 + col * 1.5;
                    window.position.y = -height/2 + 1.5 + row * 2;
                    window.position.x = width/2 + 0.01;
                    window.rotation.y = Math.PI / 2;
                    group.add(window);
                }
            }
        }
        
        return group;
    }
    
    spawnObstacle() {
        if (this.obstacles.length >= this.settings.maxObstacles) return;
        
        // Only spawn a new obstacle with a certain probability (increased for more action)
        if (Math.random() > 0.05) return;
        
        // Create a simple car as an obstacle
        const obstacleGroup = new THREE.Group();
        
        // Random car color
        const carColors = [0x0000ff, 0x00ff00, 0xffff00, 0x00ffff, 0xff00ff];
        const carColor = carColors[Math.floor(Math.random() * carColors.length)];
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: carColor });
        const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        carBody.position.y = 0.5;
        obstacleGroup.add(carBody);
        
        // Car roof
        const roofGeometry = new THREE.BoxGeometry(1.5, 0.7, 2);
        const roofMaterial = new THREE.MeshStandardMaterial({ color: carColor });
        const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
        carRoof.position.y = 1.35;
        carRoof.position.z = 0.5;
        obstacleGroup.add(carRoof);
        
        // Car wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        
        const wheelPositions = [
            [-1, 0.5, -1.3],  // front-left
            [1, 0.5, -1.3],   // front-right
            [-1, 0.5, 1.3],   // back-left
            [1, 0.5, 1.3]     // back-right
        ];
        
        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(...position);
            wheel.rotation.z = Math.PI / 2;
            obstacleGroup.add(wheel);
        });
        
        // Add brake lights
        const brakeLightGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.1);
        const brakeLightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        const leftBrakeLight = new THREE.Mesh(brakeLightGeometry, brakeLightMaterial);
        leftBrakeLight.position.set(-0.6, 0.7, 1.9);
        obstacleGroup.add(leftBrakeLight);
        
        const rightBrakeLight = new THREE.Mesh(brakeLightGeometry, brakeLightMaterial);
        rightBrakeLight.position.set(0.6, 0.7, 1.9);
        obstacleGroup.add(rightBrakeLight);
        
        // Position the obstacle with random lane
        const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        obstacleGroup.position.set(lane * 4, 0.5, -this.settings.roadLength * 0.9);
        obstacleGroup.rotation.y = Math.PI; // Face toward player
        
        // Add some random movement behavior
        obstacleGroup.userData = {
            lane: lane,
            speed: this.settings.obstacleSpeed * (0.7 + Math.random() * 0.6), // Random speed variation
            changeLaneCounter: 0,
            changeLaneInterval: Math.floor(Math.random() * 300) + 100 // Random interval for lane changes
        };
        
        this.scene.add(obstacleGroup);
        this.obstacles.push(obstacleGroup);
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            switch (event.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    this.moveLeft = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.moveRight = true;
                    break;
                case 'w':
                case 'arrowup':
                    // Increase speed slightly when pressing forward
                    this.settings.carSpeed = Math.min(1.2, this.settings.carSpeed + 0.1);
                    break;
                case 's':
                case 'arrowdown':
                    // Decrease speed slightly when pressing back
                    this.settings.carSpeed = Math.max(0.3, this.settings.carSpeed - 0.1);
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch (event.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    this.moveLeft = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.moveRight = false;
                    break;
            }
        });
    }
    
    updatePlayerPosition() {
        // Update player's horizontal position based on input
        const moveSpeed = 0.15;
        
        if (this.moveLeft) {
            this.playerPosition = Math.max(this.playerPosition - moveSpeed, -1);
        }
        
        if (this.moveRight) {
            this.playerPosition = Math.min(this.playerPosition + moveSpeed, 1);
        }
        
        // Apply the position to the car
        const targetX = this.playerPosition * 4; // Scale position to fit road
        this.playerCar.position.x += (targetX - this.playerCar.position.x) * 0.1;
        
        // Add a slight rotation for visual effect
        const tiltAmount = 0.1;
        if (this.moveLeft && !this.moveRight) {
            this.playerCar.rotation.z = tiltAmount;
        } else if (this.moveRight && !this.moveLeft) {
            this.playerCar.rotation.z = -tiltAmount;
        } else {
            this.playerCar.rotation.z *= 0.9; // Return to upright
        }
    }
    
    updateRoad() {
        // Move road segments to create illusion of forward movement
        this.roadSegments.forEach(segment => {
            segment.position.z += this.settings.carSpeed;
            
            // If segment is behind the camera, move it to the front
            if (segment.position.z > 10) {
                segment.position.z -= this.settings.roadLength;
            }
        });
        
        // Move buildings to create illusion of forward movement
        this.buildings.forEach(building => {
            building.position.z += this.settings.carSpeed;
            
            // If building is behind the camera, remove it
            if (building.position.z > 20) {
                this.scene.remove(building);
                
                // Create a new building at the far end
                const side = Math.random() > 0.5 ? -1 : 1;
                const height = 3 + Math.random() * 10;
                const width = 3 + Math.random() * 5;
                const depth = 3 + Math.random() * 5;
                
                const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
                const buildingColors = [0x444444, 0x555555, 0x666666, 0x777777];
                const buildingMaterial = new THREE.MeshStandardMaterial({
                    color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
                    roughness: 0.8
                });
                
                const newBuilding = new THREE.Mesh(buildingGeometry, buildingMaterial);
                
                const roadHalfWidth = this.settings.roadWidth / 2;
                const buildingMargin = 2;
                const x = side * (roadHalfWidth + buildingMargin + width / 2);
                const z = -this.settings.roadLength + Math.random() * 20;
                
                newBuilding.position.set(x, height / 2, z);
                this.scene.add(newBuilding);
                
                // Replace the old building in the array
                const index = this.buildings.indexOf(building);
                if (index !== -1) {
                    this.buildings[index] = newBuilding;
                }
                
                // Add windows to new building
                if (Math.random() > 0.3) {
                    const windowPattern = this.createWindowPattern(width, height, depth);
                    windowPattern.position.copy(newBuilding.position);
                    this.scene.add(windowPattern);
                }
            }
        });
        
        // Update distance counter
        this.distance += this.settings.carSpeed;
    }
    
    checkCollision(obj1, obj2) {
        // Simple box collision detection
        const box1 = new THREE.Box3().setFromObject(obj1);
        const box2 = new THREE.Box3().setFromObject(obj2);
        
        return box1.intersectsBox(box2);
    }
    
    animate() {
        if (this.gameOver) return;
        
        requestAnimationFrame(() => this.animate());
        
        // Update time counter
        this.time += 0.016; // Roughly 60fps
        
        // Update game elements
        this.updatePlayerPosition();
        this.updateRoad();
        this.updateObstacles();
        this.updateVisualEffects();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    updateVisualEffects() {
        // Headlight flicker effect (subtle)
        this.headlights.forEach(light => {
            // Random flicker intensity based on sine wave + noise
            const flickerAmount = Math.sin(this.time * 10) * 0.1 + Math.random() * 0.1;
            light.intensity = 1 + flickerAmount;
        });
        
        // Add slight camera shake for more immersion
        const shakeAmount = 0.03;
        if (this.settings.carSpeed > 0.8) {
            this.camera.position.y = this.settings.cameraHeight + (Math.random() - 0.5) * shakeAmount;
            this.camera.position.x = (Math.random() - 0.5) * shakeAmount;
        }
    }
    
    playCrashAnimation() {
        // Create a crash effect
        this.gameOver = true;
        
        // Add a flash effect
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = 'white';
        flash.style.opacity = '0';
        flash.style.transition = 'opacity 0.1s ease-in-out';
        flash.style.zIndex = '1000';
        document.body.appendChild(flash);
        
        // Flash effect
        setTimeout(() => {
            flash.style.opacity = '1';
            
            // Add a dramatic text
            const crashText = document.createElement('div');
            crashText.textContent = 'YOU CRASHED';
            crashText.style.position = 'fixed';
            crashText.style.top = '50%';
            crashText.style.left = '50%';
            crashText.style.transform = 'translate(-50%, -50%)';
            crashText.style.color = 'red';
            crashText.style.fontSize = '64px';
            crashText.style.fontWeight = 'bold';
            crashText.style.fontFamily = 'Arial, sans-serif';
            crashText.style.textShadow = '0 0 10px rgba(255, 0, 0, 0.7)';
            crashText.style.opacity = '0';
            crashText.style.transition = 'opacity 0.5s ease-in-out';
            crashText.style.zIndex = '1001';
            document.body.appendChild(crashText);
            
            setTimeout(() => {
                flash.style.opacity = '0.8';
                crashText.style.opacity = '1';
                
                // Add secondary text
                const subText = document.createElement('div');
                subText.textContent = 'Welcome to Hell';
                subText.style.position = 'fixed';
                subText.style.top = '60%';
                subText.style.left = '50%';
                subText.style.transform = 'translate(-50%, -50%)';
                subText.style.color = 'red';
                subText.style.fontSize = '32px';
                subText.style.fontWeight = 'bold';
                subText.style.fontFamily = 'Arial, sans-serif';
                subText.style.opacity = '0';
                subText.style.transition = 'opacity 0.5s ease-in-out';
                subText.style.zIndex = '1001';
                document.body.appendChild(subText);
                
                setTimeout(() => {
                    subText.style.opacity = '1';
                    
                    // After a delay, end the game
                    setTimeout(() => {
                        this.endGame();
                    }, 2000);
                }, 500);
            }, 100);
        }, 50);
    }
    
    updateObstacles() {
        // Move existing obstacles and remove those behind the player
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            const userData = obstacle.userData;
            
            // Move obstacle forward relative to player
            obstacle.position.z += this.settings.carSpeed - userData.speed;
            
            // Random lane changing for some obstacles
            userData.changeLaneCounter++;
            if (userData.changeLaneCounter >= userData.changeLaneInterval) {
                userData.changeLaneCounter = 0;
                
                // Decide whether to change lanes
                if (Math.random() > 0.7) {
                    // Choose a new lane (-1, 0, 1)
                    const possibleLanes = [-1, 0, 1].filter(l => l !== userData.lane);
                    userData.lane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
                }
            }
            
            // Smoothly move to target lane
            const targetX = userData.lane * 4;
            obstacle.position.x += (targetX - obstacle.position.x) * 0.05;
            
            // Check collision with player
            if (this.checkCollision(this.playerCar, obstacle)) {
                this.playCrashAnimation();
                break;
            }
            
            // Remove obstacles that are behind the player
            if (obstacle.position.z > 10) {
                this.scene.remove(obstacle);
                this.obstacles.splice(i, 1);
            }
        }
        
        // Spawn new obstacles
        this.spawnObstacle();
    }
    
    endGame() {
        // Cleanup
        document.body.removeChild(this.renderer.domElement);
        
        // Set a flag in sessionStorage to indicate we're coming from the driving game
        sessionStorage.setItem('fromDrivingGame', 'true');
        
        // Get the root URL of the current server
        const rootUrl = window.location.origin;
        const targetUrl = rootUrl + '/index.html';
        
        // Directly use the calculated URL without showing an alert
        window.location.href = targetUrl;
    }
}

// Initialize game once the page is loaded
window.onload = function() {
    window.startMainGame = function() {
        // Get the root URL of the current server
        const rootUrl = window.location.origin;
        // Load the main game (dialog scene) with absolute server path
        window.location.href = rootUrl + '/index.html';
    };
    
    // Start the driving game
    new DrivingGame();
};

export { DrivingGame }; 