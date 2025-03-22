import * as THREE from 'three';
import { Enemy } from './enemy.js';

export class Spawner {
    constructor(scene, x, y, level) {
        this.scene = scene;
        this.level = level;
        
        // Fixed stats
        this.baseHp = 50;
        this.speed = 0;
        this.attackDamage = 0;
        
        // Spawn timer
        this.lastSpawnTime = 0;
        this.spawnCooldown = 5000; // 5 seconds
        
        // Create simple block mesh
        const geometry = new THREE.BoxGeometry(50, 50, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0x800080, // Purple color
        });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Set position
        this.mesh.position.set(x, y, 0);
        scene.add(this.mesh);
        
        // Health setup
        this.maxHp = this.baseHp;
        this.currentHp = this.maxHp;
    }
    
    update(currentTime, player) {
        // Only spawn if alive
        if (this.currentHp <= 0) return;
        
        // Check if it's time to spawn
        if (currentTime - this.lastSpawnTime > this.spawnCooldown) {
            // Spawn a yellow enemy (type 2)
            const enemy = new Enemy(this.scene, this.mesh.position.x, this.mesh.position.y, 2, this.level);
            this.lastSpawnTime = currentTime;
            return enemy; // Return the new enemy to be added to the game's enemy list
        }
        return null;
    }
    
    takeDamage(amount) {
        this.currentHp -= amount;
        if (this.currentHp <= 0) {
            this.scene.remove(this.mesh);
        }
    }
} 