export class Dialog {
    constructor() {
        // Dialog system for the game's introduction
        this.currentLine = 0;
        this.lines = [
            "Oh, you're awake?",
            "Hey, champ. Bad news—you died. Real messy. Car crash, blood everywhere. Good news—for me—you're in hell. Welcome.\n\nYou were a real piece of shit, by the way. Cheated on your wife, remember that? I do. Some of my best work. Anyway, now you get to fight your inner demons forever."
        ];
        // Create audio
        
        // Create audio context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create background music
        this.backgroundMusic = new Audio('assets/audio/background_music.wav');
        this.backgroundMusic.loop = true;
        
        // Create intro voice line audio
        this.introVoiceLine = new Audio('assets/audio/satan_death_dialog.mp3');
        
        // Create dialog container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.justifyContent = 'center';
        this.container.style.zIndex = '1000';
        this.container.style.opacity = '0'; // Start with 0 opacity
        
        // Create fog overlay
        this.fogOverlay = document.createElement('div');
        this.fogOverlay.style.position = 'fixed';
        this.fogOverlay.style.top = '0';
        this.fogOverlay.style.left = '0';
        this.fogOverlay.style.width = '100%';
        this.fogOverlay.style.height = '100%';
        this.fogOverlay.style.backgroundColor = '#000';
        this.fogOverlay.style.opacity = '1';
        this.fogOverlay.style.zIndex = '999';
        this.fogOverlay.style.transition = 'opacity 5s ease-in-out';
        document.body.appendChild(this.fogOverlay);
        
        // Create background image
        this.background = document.createElement('img');
        this.background.src = 'assets/sprites/background.png';
        this.background.style.position = 'fixed';
        this.background.style.top = '0';
        this.background.style.left = '0';
        this.background.style.width = '100%';
        this.background.style.height = '100%';
        this.background.style.objectFit = 'cover';
        this.background.style.zIndex = '-1';
        this.container.appendChild(this.background);
        
        // Create dialog box
        this.dialogBox = document.createElement('div');
        this.dialogBox.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        this.dialogBox.style.padding = '20px';
        this.dialogBox.style.borderRadius = '10px';
        this.dialogBox.style.maxWidth = '600px';
        this.dialogBox.style.margin = '0 20px';
        this.dialogBox.style.color = 'white';
        this.dialogBox.style.fontFamily = 'Arial';
        this.dialogBox.style.fontSize = '18px';
        this.dialogBox.style.lineHeight = '1.5';
        this.dialogBox.style.position = 'fixed';
        this.dialogBox.style.bottom = '10%';
        this.dialogBox.style.left = '50%';
        this.dialogBox.style.transform = 'translateX(-50%)';
        this.container.appendChild(this.dialogBox);
        
        // Create next button
        this.nextButton = document.createElement('button');
        this.nextButton.textContent = 'Next';
        this.nextButton.style.marginTop = '20px';
        this.nextButton.style.padding = '10px 20px';
        this.nextButton.style.fontSize = '16px';
        this.nextButton.style.cursor = 'pointer';
        this.nextButton.style.backgroundColor = '#FF0000';
        this.nextButton.style.color = 'white';
        this.nextButton.style.border = 'none';
        this.nextButton.style.borderRadius = '5px';
        this.nextButton.style.position = 'fixed';
        this.nextButton.style.bottom = '5%';
        this.nextButton.style.left = '50%';
        this.nextButton.style.transform = 'translateX(-50%)';
        this.container.appendChild(this.nextButton);
        
        // Create enter hell button (initially hidden)
        this.enterHellButton = document.createElement('button');
        this.enterHellButton.textContent = 'Enter Hell';
        this.enterHellButton.style.marginTop = '20px';
        this.enterHellButton.style.padding = '10px 20px';
        this.enterHellButton.style.fontSize = '16px';
        this.enterHellButton.style.cursor = 'pointer';
        this.enterHellButton.style.backgroundColor = '#FF0000';
        this.enterHellButton.style.color = 'white';
        this.enterHellButton.style.border = 'none';
        this.enterHellButton.style.borderRadius = '5px';
        this.enterHellButton.style.display = 'none';
        this.enterHellButton.style.position = 'fixed';
        this.enterHellButton.style.bottom = '5%';
        this.enterHellButton.style.left = '50%';
        this.enterHellButton.style.transform = 'translateX(-50%)';
        this.container.appendChild(this.enterHellButton);
        
        // Add event listeners
        this.nextButton.addEventListener('click', () => this.nextLine());
        this.enterHellButton.addEventListener('click', () => this.startGame());
        
        // Initialize typing state
        this.currentText = '';
        this.currentWordIndex = 0;
        this.isTyping = true;
        this.typingSpeed = 200; // ms per word
        
        // Show first line
        this.showCurrentLine();
    }
    
    createScrambledSound() {
        // Create multiple oscillators for a richer sound
        const numOscillators = 4; // Increased number of oscillators
        const oscillators = [];
        const gainNodes = [];
        
        for (let i = 0; i < numOscillators; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Use higher frequency ranges for each oscillator
            const baseFreq = 400 + (i * 200); // Base frequencies: 400, 600, 800, 1000
            oscillator.frequency.value = baseFreq + (Math.random() * 300);
            
            // Add more intense frequency modulation
            const modOsc = this.audioContext.createOscillator();
            const modGain = this.audioContext.createGain();
            modOsc.frequency.value = 15 + Math.random() * 25; // 15-40 Hz modulation
            modGain.gain.value = 30 + Math.random() * 40; // Increased modulation depth
            
            // Connect modulation
            modOsc.connect(modGain);
            modGain.connect(oscillator.frequency);
            
            // Use different waveforms for each oscillator
            const waveforms = ['sine', 'triangle', 'square'];
            oscillator.type = waveforms[Math.floor(Math.random() * waveforms.length)];
            
            // Connect to gain node
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Set different volumes for each oscillator
            gainNode.gain.value = 0.03 / (i + 1); // Slightly lower volume for higher frequencies
            
            // Start oscillators
            oscillator.start();
            modOsc.start();
            
            // Store references for cleanup
            oscillators.push(oscillator);
            gainNodes.push(gainNode);
        }
        
        // Stop all oscillators after a short duration
        setTimeout(() => {
            oscillators.forEach(osc => osc.stop());
            gainNodes.forEach(gain => gain.disconnect());
        }, 80); // Slightly shorter duration for more "scrambled" effect
    }
    
    async typeWord(word) {
        this.currentText += word + ' ';
        this.dialogBox.textContent = this.currentText;
        this.createScrambledSound();
        await new Promise(resolve => setTimeout(resolve, this.typingSpeed));
    }
    
    async showCurrentLine() {
        // Reset typing state
        this.currentText = '';
        this.currentWordIndex = 0;
        this.isTyping = true;
        
        // Disable next button while typing
        this.nextButton.disabled = true;
        
        // Type each word
        const words = this.lines[this.currentLine].split(' ');
        for (const word of words) {
            await this.typeWord(word);
        }
        
        // Re-enable next button
        this.nextButton.disabled = false;
        this.isTyping = false;
        
        // Show/hide buttons based on current line
        if (this.currentLine === this.lines.length - 1) {
            this.nextButton.style.display = 'none';
            this.enterHellButton.style.display = 'block';
        } else {
            this.nextButton.style.display = 'block';
            this.enterHellButton.style.display = 'none';
        }
    }
    
    nextLine() {
        if (this.currentLine < this.lines.length - 1) {
            // Start background music on first *actual* next click (going to line 1)
            if (this.currentLine === 0) {
                this.backgroundMusic.volume = 0.3; 
                this.backgroundMusic.play().catch(e => console.error("BG music error:", e));

                // Play the intro voice line when advancing to the main dialog
                this.introVoiceLine.play().catch(error => {
                    console.error("Error playing intro voice line on nextLine:", error);
                });
            }
            this.currentLine++;
            this.showCurrentLine();
        }
    }
    
    startGame() {
        // Increase volume before starting game
        this.backgroundMusic.volume = 1.0; // Set to 100% volume
        // Remove dialog container
        document.body.removeChild(this.container);
        // Start the game and show tutorial
        window.startGame();
        window.showControlsTutorial();
    }
    
    show() {
        document.body.appendChild(this.container);
        
        // Start the fog reveal effect
        setTimeout(() => {
            // Fade out the fog overlay
            this.fogOverlay.style.opacity = '0';
            
            // Fade in the dialog container
            this.container.style.opacity = '1';
            this.container.style.transition = 'opacity 5s ease-in-out';
            
            // Remove the fog overlay after the transition
            setTimeout(() => {
                document.body.removeChild(this.fogOverlay);
            }, 5000);
        }, 100);
    }
} 