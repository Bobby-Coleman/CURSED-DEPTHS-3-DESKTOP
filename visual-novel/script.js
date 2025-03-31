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

let currentLine = 0;
let isTyping = false;
const dialogBox = document.getElementById('dialogBox');
const choiceButton = document.getElementById('choiceButton');
const wifeMad = document.getElementById('wifeMad');
const wifeSad = document.getElementById('wifeSad');
const husband = document.getElementById('husband');

// Initialize the visual novel
function init() {
    updateDialog();
    // Add click event listeners
    document.addEventListener('click', handleClick);
    choiceButton.addEventListener('click', () => {
        window.location.href = '/driving-game/driving.html?playMusic=true&beerCount=3';
    });
}

// Handle click events
function handleClick(event) {
    // Ignore clicks on the choice button
    if (event.target === choiceButton) return;
    
    // Only allow clicks when not typing
    if (!isTyping) {
        currentLine++;
        updateDialog();
    }
}

// Type out text character by character
function typeText(text) {
    isTyping = true;
    dialogBox.classList.add('typing');
    let index = 0;
    dialogBox.textContent = '';
    
    function type() {
        if (index < text.length) {
            dialogBox.textContent += text.charAt(index);
            index++;
            setTimeout(type, 30); // Adjust speed here (lower = faster)
        } else {
            completeTyping();
            // Stop shaking when typing is complete
            wifeMad.classList.remove('shaking');
            wifeSad.classList.remove('shaking');
            husband.classList.remove('shaking');
        }
    }
    
    type();
}

// Complete the current typing animation
function completeTyping() {
    isTyping = false;
    dialogBox.classList.remove('typing');
    if (currentLine < dialog.length) {
        const line = dialog[currentLine];
        dialogBox.textContent = `${line.speaker}: ${line.text}`;
    }
    // Stop shaking when typing is complete
    wifeMad.classList.remove('shaking');
    wifeSad.classList.remove('shaking');
    husband.classList.remove('shaking');
}

// Update character states and start shake animation
function updateCharacterStates(speaker) {
    // Reset all character states
    wifeMad.style.opacity = "0";
    wifeSad.style.opacity = "0";
    husband.style.opacity = "0.8"; // Keep husband always visible at 80% opacity by default
    
    // Remove shake animations first
    wifeMad.classList.remove('shaking');
    wifeSad.classList.remove('shaking');
    husband.classList.remove('shaking');
    
    if (speaker === "W") {
        // Show mad wife by default when speaking
        wifeMad.style.opacity = "1";
        // Start shaking only during typing
        wifeMad.classList.add('shaking');
    } else if (speaker === "H") {
        // When husband speaks, show sad wife in background
        wifeSad.style.opacity = "0.8";
        husband.style.opacity = "1";
        // Start shaking only during typing
        husband.classList.add('shaking');
    }
}

// Update dialog and character visibility
function updateDialog() {
    if (currentLine < dialog.length) {
        const line = dialog[currentLine];
        
        // Special case for the final line where wife is emotional
        if (currentLine === dialog.length - 1) {
            wifeMad.style.opacity = "0";
            wifeSad.style.opacity = "1";
            wifeSad.classList.add('shaking');
            husband.style.opacity = "0.8";
        } else {
            updateCharacterStates(line.speaker);
        }
        
        typeText(`${line.speaker}: ${line.text}`);
    } else {
        dialogBox.textContent = ""; // Remove the text
        choiceButton.style.display = 'block';
        // For the choice, keep husband visible but fade characters slightly
        wifeMad.style.opacity = "0";
        wifeSad.style.opacity = "0";
        husband.style.opacity = "0.6";
    }
}

// Start the visual novel
init(); 