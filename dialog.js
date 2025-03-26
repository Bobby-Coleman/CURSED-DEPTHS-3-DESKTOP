export class Dialog {
    constructor() {
        this.currentLine = 0;
        this.lines = [
            "Hey man. You're probably wondering where you are right now.",
            "Yeah, I know, It's dark and scary.",
            "Well I want you to know you're dead.",
            "Yeah I know, shocker right?",
            "Anyway, welcome to Hell.",
            "I should mention that there's a chance for you to win your life back.",
            "I mean no one's ever done it. You're not going to either.",
            "To be honest you'll probably burn for all of eternity. I'll enjoy that.",
            "What? Don't act like this is my fault. You did this to yourself", 
            "You really were a real piece of sh*t back on earth.",
            "That's why you're here.",
            "Remember when you cheated on your wife? I do.",
            "That was some of my best work. Real proud of that one.",
            "Anyway, I'm gonna make you hang out with every one of your inner demons.",
            "And let me tell you, your inner psyche is f*cked.",
            "Before you go in, wanna stay for a cup of tea?",
            "no?",
            "We've got a lot of time to burn down here.",
            "hah. burn.",
            "You know, because you'll be burning for et- you know what, nevermind.",
            "Good luck. I don't believe in you.",
            "And neither do your parents by the way.",
        ];
        
        // Create audio context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create background music
        this.backgroundMusic = new Audio('assets/audio/background_music.wav');
        this.backgroundMusic.loop = true;
        
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
        
        // Create background image
        this.background = document.createElement('img');
        this.background.src = 'assets/sprites/background.png';
        this.background.style.maxWidth = '80%';
        this.background.style.maxHeight = '60%';
        this.background.style.marginBottom = '20px';
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
        this.container.appendChild(this.dialogBox);
        
        // Create next button
        this.nextButton = document.createElement('button');
        this.nextButton.textContent = 'Next';
        this.nextButton.style.marginTop = '20px';
        this.nextButton.style.padding = '10px 20px';
        this.nextButton.style.fontSize = '16px';
        this.nextButton.style.cursor = 'pointer';
        this.nextButton.style.backgroundColor = '#4CAF50';
        this.nextButton.style.color = 'white';
        this.nextButton.style.border = 'none';
        this.nextButton.style.borderRadius = '5px';
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
        this.container.appendChild(this.enterHellButton);
        
        // Add event listeners
        this.nextButton.addEventListener('click', () => this.nextLine());
        this.enterHellButton.addEventListener('click', () => this.startGame());
        
        // Initialize typing state
        this.currentText = '';
        this.currentWordIndex = 0;
        this.isTyping = false;
        this.typingSpeed = 100; // ms per word
        
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
            // Start background music on first next click
            if (this.currentLine === 0) {
                this.backgroundMusic.volume = 0.3; // Set to 30% volume
                this.backgroundMusic.play();
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
        // Start the game
        window.startGame();
    }
    
    show() {
        document.body.appendChild(this.container);
    }
} 