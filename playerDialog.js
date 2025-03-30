export const playerDialogLines = [
    "Hell's a lot greener than I expected...",
    "I should've been nicer to my wife...",
    "But man oh man, was she a nag!",
    "The demons here are more polite than my mother-in-law.",
    "At least the weather's consistent down here.",
    "Didn't expect Hell to have such good lighting.",
    "Wonder if they got my good side in my obituary...",
    "Should've read the fine print on that contract...",
    "The wife would've loved redecorating this place.",
    "Eternal damnation ain't so bad once you get used to it.",
    "These blood offerings remind me of my ex's cooking.",
    "Never thought I'd miss traffic jams up there.",
    "Hell's got better interior design than I expected.",
    "Maybe I shouldn't have cheated on my taxes... all of them."
];

export class PlayerDialogManager {
    constructor(scene, player, camera) {
        this.scene = scene;
        this.player = player;
        this.camera = camera;
        this.lastDialogTime = 0;
        this.dialogInterval = 15000; // 15 seconds
        this.currentDialog = null;
        
        // Create dialog bubble
        this.dialogElement = document.createElement('div');
        this.dialogElement.style.position = 'absolute';
        this.dialogElement.style.padding = '10px';
        this.dialogElement.style.backgroundColor = '#FFFFFF'; // White background
        this.dialogElement.style.color = '#000000'; // Black text
        this.dialogElement.style.borderRadius = '5px';
        this.dialogElement.style.fontFamily = 'Arial, sans-serif';
        this.dialogElement.style.fontSize = '14px';
        this.dialogElement.style.pointerEvents = 'none';
        this.dialogElement.style.display = 'none';
        document.body.appendChild(this.dialogElement);
    }
    
    update() {
        const currentTime = Date.now();
        
        // Check if it's time for new dialog
        if (currentTime - this.lastDialogTime > this.dialogInterval) {
            this.showRandomDialog();
            this.lastDialogTime = currentTime;
        }
        
        // Update dialog position if visible
        if (this.dialogElement.style.display === 'block') {
            // Convert player position to screen coordinates
            const vector = this.player.mesh.position.clone();
            vector.project(this.camera);
            
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-vector.y * 0.5 + 0.5) * window.innerHeight - 50; // 50px above player
            
            this.dialogElement.style.left = x + 'px';
            this.dialogElement.style.top = y + 'px';
            this.dialogElement.style.transform = 'translate(-50%, -100%)';
        }
    }
    
    showRandomDialog() {
        const randomLine = playerDialogLines[Math.floor(Math.random() * playerDialogLines.length)];
        this.dialogElement.textContent = '';
        this.dialogElement.style.display = 'block';
        
        // Type out the text
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < randomLine.length) {
                this.dialogElement.textContent += randomLine[index];
                index++;
            } else {
                clearInterval(typeInterval);
                // Hide dialog after typing is complete (wait 5 seconds)
                setTimeout(() => {
                    this.dialogElement.style.display = 'none';
                }, 5000);
            }
        }, 50); // Type a character every 50ms
    }
    
    cleanup() {
        if (this.dialogElement && this.dialogElement.parentNode) {
            this.dialogElement.parentNode.removeChild(this.dialogElement);
        }
    }
} 