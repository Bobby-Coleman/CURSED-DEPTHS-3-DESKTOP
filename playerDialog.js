export const playerDialogLines = [
    "Hell has better lighting than our living room. And less screaming, somehow.",
    "Hell's a lot greener than I expected...",
    "I should've been nicer to my wife...",
    "The demons here are more polite than my mother-in-law.",
    "At least the weather's consistent down here.",
    "Didn't expect Hell to have such good lighting.",
    "Wonder if they got my good side in my obituary...",
    "The wife would've loved redecorating this place.",
    "Eternal damnation ain't so bad once you get used to it.",
    "These blood offerings remind me of my ex's cooking.",
    "Hell's got better interior design than I expected.",
    "Hell has better lighting than our living room. And less screaming, somehow.",
    "Turns out eternal torment’s easier to sit through than couples therapy.",
    "I guess I have an eternity to think about all the things I should have said.",
    "Good news: there’s no alcohol in Hell. Bad news: I still want it.",
    "You’d be surprised how many dads are down here.",
    "Satan said I could leave whenever I forgave myself. I said, ‘Guess I live here now.’",
    "I told a demon I had a kid once. He said, ‘Still do. He just doesn’t have you.’",
    "There’s a lot less screaming down here than I thought… just a lot of silence and remembering.",
    "You know what Hell really is? It’s knowing I had a choice. And still walking out.",
    "Back on Earth, I kept saying ‘I’m trying.’ Down here, they make you prove it.",
    "Hell has central AC. My apartment didn’t even have a working fan.",
    "Met my anxiety down here. Real guy. Kind of a dick.",
    "They gave me a name tag that says ‘Mark, Bad Dad, Floor 7.’ Feels fair.",
    "Apparently I qualified for the Deluxe Regret Package. It comes with surround sound in the eternal screaming room.",
    "Good news: no more baby crying. Bad news: it’s me crying now.",
    "They play a laugh track when I try to justify anything.",
    "I finally journaled. The pages burst into flames. Very encouraging.",
    "Found a support group. Just me, six mirrors, and a PowerPoint titled ‘You Blew It.’",
    "My punishment is basically just being sober with a perfect memory. So. That’s neat.",
    "I’m making a list of everyone I disappointed. Not sure I’m gonna have enough time down here to finish it.",
    "I used to think hell was fire. Turns out it’s self-awareness… with excellent acoustics.",
    "Time doesn’t exist down here. Which is great, because I wasted enough of it alive.",
    "In the grand tapestry of the universe, I was a loose thread someone finally snipped.",
    "Met the meaning of life. It was bored and kind of rude.",
    "Eternity’s weird. You cry, you scream, you reflect, and then you start making shadow puppets to pass some of the time.",
    "I asked the Devil if this was a punishment. He said, ‘No, just consequences.’",
    "Free will is real. That’s the joke.",
    "I used to think I was the main character. Then the credits rolled and nobody clapped.",
    "Eventually you stop asking why you’re here. You just wonder why you ever thought you wouldn’t be.",
    "What’s the point? There is no point. And that’s kind of the point.",
    "When I asked Satan about God he laughed for three minutes straight and said, ‘Oh sweetheart, religion’s just our best prank.’",
    "Weird thing—meeting Satan actually made me believe in God. He said, ‘That’s adorable,’ and offered me a complimentary tinfoil hat.",
    "I said, ‘Wait, if you’re real, then God must be too, right?’ Satan just rolled his eyes and said, ‘Religion? Oh, that old marketing stunt?’",
    "I finally found myself in the afterlife. Unfortunately, he was also lost.",
    "Turns out the universe does have a plan. It’s just written in an old divine language no one speaks and filed under ‘miscellaneous.’",
    "I am a speck on a speck orbiting a speck. And somehow, I still managed to disappoint people.",
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