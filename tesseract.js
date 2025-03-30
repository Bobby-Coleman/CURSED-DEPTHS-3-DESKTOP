import * as THREE from 'three';

export class Tesseract {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        
        // Create pentagram plane under tesseract
        const pentagramTexture = new THREE.TextureLoader().load('pentagram.png');
        const pentagramGeometry = new THREE.PlaneGeometry(80, 80);
        const pentagramMaterial = new THREE.MeshBasicMaterial({
            map: pentagramTexture,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const pentagram = new THREE.Mesh(pentagramGeometry, pentagramMaterial);
        pentagram.rotation.x = -Math.PI / 2; // Lay flat on ground
        pentagram.position.y = -5; // Slightly below tesseract
        this.group.add(pentagram);
        
        // Create inner cube (bigger size)
        const innerGeometry = new THREE.BoxGeometry(30, 30, 30);
        const innerEdges = new THREE.EdgesGeometry(innerGeometry);
        const innerMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 1.0,
            linewidth: 3
        });
        this.innerCube = new THREE.LineSegments(innerEdges, innerMaterial);
        
        // Create outer cube
        const outerGeometry = new THREE.BoxGeometry(60, 60, 60);
        const outerEdges = new THREE.EdgesGeometry(outerGeometry);
        const outerMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 1.0,
            linewidth: 3
        });
        this.outerCube = new THREE.LineSegments(outerEdges, outerMaterial);
        
        // Create connecting lines between vertices
        const connectingLines = new THREE.Group();
        const vertices = [
            [-15, -15, -15], [15, -15, -15], [15, 15, -15], [-15, 15, -15],
            [-15, -15, 15], [15, -15, 15], [15, 15, 15], [-15, 15, 15]
        ];
        
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.8,
            linewidth: 3
        });
        
        vertices.forEach(([x, y, z]) => {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x, y, z),
                new THREE.Vector3(x * 2, y * 2, z * 2)
            ]);
            const line = new THREE.Line(lineGeometry, lineMaterial);
            connectingLines.add(line);
        });
        
        // Add everything to the group
        this.group.add(this.innerCube);
        this.group.add(this.outerCube);
        this.group.add(connectingLines);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(65, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.group.add(glowMesh);
        
        // Position the tesseract on the left side of the room, slightly above ground
        this.group.position.set(-300, 0, 5);
        
        // Add to scene
        this.scene.add(this.group);
        
        // Animation properties
        this.rotationSpeed = {
            x: 0.005,
            y: 0.003,
            z: 0.002
        };
    }
    
    update() {
        // Rotate the entire tesseract
        this.group.rotation.x += this.rotationSpeed.x;
        this.group.rotation.y += this.rotationSpeed.y;
        this.group.rotation.z += this.rotationSpeed.z;
        
        // Counter-rotate the inner cube
        this.innerCube.rotation.x -= this.rotationSpeed.x * 0.5;
        this.innerCube.rotation.y -= this.rotationSpeed.y * 0.5;
        
        // Pulse the glow
        const time = Date.now() * 0.001;
        const pulse = Math.sin(time) * 0.2 + 0.8;
        this.group.scale.set(pulse, pulse, pulse);
    }
} 