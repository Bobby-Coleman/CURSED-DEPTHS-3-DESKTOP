import * as THREE from 'three';

export class Level {
    constructor(scene, roomSize, levelNumber) {
        this.scene = scene;
        this.roomSize = roomSize;
        this.levelNumber = levelNumber;
        this.portalActive = false;
        
        // Create room
        this.createRoom();
        
        // Add obstacles
        this.createObstacles();
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
        
        // Create walls
        const wallThickness = 20;
        const wallColor = 0x654321; // Brown
        
        // Top wall
        const topWallGeometry = new THREE.PlaneGeometry(this.roomSize + wallThickness * 2, wallThickness);
        const topWallMaterial = new THREE.MeshBasicMaterial({ color: wallColor });
        this.topWall = new THREE.Mesh(topWallGeometry, topWallMaterial);
        this.topWall.position.set(0, this.roomSize / 2 + wallThickness / 2, 1);
        this.scene.add(this.topWall);
        
        // Bottom wall
        const bottomWallGeometry = new THREE.PlaneGeometry(this.roomSize + wallThickness * 2, wallThickness);
        const bottomWallMaterial = new THREE.MeshBasicMaterial({ color: wallColor });
        this.bottomWall = new THREE.Mesh(bottomWallGeometry, bottomWallMaterial);
        this.bottomWall.position.set(0, -this.roomSize / 2 - wallThickness / 2, 1);
        this.scene.add(this.bottomWall);
        
        // Left wall
        const leftWallGeometry = new THREE.PlaneGeometry(wallThickness, this.roomSize);
        const leftWallMaterial = new THREE.MeshBasicMaterial({ color: wallColor });
        this.leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
        this.leftWall.position.set(-this.roomSize / 2 - wallThickness / 2, 0, 1);
        this.scene.add(this.leftWall);
        
        // Right wall
        const rightWallGeometry = new THREE.PlaneGeometry(wallThickness, this.roomSize);
        const rightWallMaterial = new THREE.MeshBasicMaterial({ color: wallColor });
        this.rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
        this.rightWall.position.set(this.roomSize / 2 + wallThickness / 2, 0, 1);
        this.scene.add(this.rightWall);
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
    
    activatePortal(x = 0, y = 0) {
        this.portalActive = true;
        
        // Create portal mesh
        const portalGeometry = new THREE.CircleGeometry(30, 32);
        const portalMaterial = new THREE.MeshBasicMaterial({ color: 0x800080 }); // Purple
        this.portal = new THREE.Mesh(portalGeometry, portalMaterial);
        
        // Position portal
        this.portal.position.set(x, y, 1);
        
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
    
    cleanup() {
        // Remove all level objects from scene
        this.scene.remove(this.floor);
        this.scene.remove(this.topWall);
        this.scene.remove(this.bottomWall);
        this.scene.remove(this.leftWall);
        this.scene.remove(this.rightWall);
        
        if (this.portal) {
            this.scene.remove(this.portal);
        }
        
        // Remove all obstacles and other level objects
        // This is simplified as we're not tracking all objects individually
    }
}