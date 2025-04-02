// Static instance tracker
let uiInstance = null;

export class UI {
    constructor() {
        // Check if UI instance already exists
        if (uiInstance) {
            // Return the existing instance
            return uiInstance;
        }
        
        // Store this instance
        uiInstance = this;
        
        // Create popup container
        this.popup = document.createElement('div');
        this.popup.style.position = 'absolute';
        this.popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.popup.style.color = 'white';
        this.popup.style.padding = '10px';
        this.popup.style.borderRadius = '5px';
        this.popup.style.display = 'none';
        this.popup.style.pointerEvents = 'none';
        this.popup.style.zIndex = '100';
        this.popup.style.maxWidth = '250px';
        this.popup.style.fontFamily = 'Arial, sans-serif';
        
        document.body.appendChild(this.popup);

        // Create tooltip for relics
        this.tooltip = document.createElement('div');
        this.tooltip.style.position = 'absolute';
        this.tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        this.tooltip.style.color = 'white';
        this.tooltip.style.padding = '8px';
        this.tooltip.style.borderRadius = '4px';
        this.tooltip.style.display = 'none';
        this.tooltip.style.zIndex = '150';
        this.tooltip.style.pointerEvents = 'none';
        this.tooltip.style.fontFamily = 'Arial, sans-serif';
        this.tooltip.style.fontSize = '14px';
        this.tooltip.style.whiteSpace = 'pre-line';
        document.body.appendChild(this.tooltip);

        // Create weapon stats container
        const existingWeaponStats = document.getElementById('weapon-stats-container');
        if (!existingWeaponStats) {
            this.weaponStats = document.createElement('div');
            this.weaponStats.id = 'weapon-stats-container';
            this.weaponStats.style.position = 'absolute';
            this.weaponStats.style.top = '10px';
            this.weaponStats.style.left = '150px';
            this.weaponStats.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            this.weaponStats.style.color = 'white';
            this.weaponStats.style.padding = '10px';
            this.weaponStats.style.borderRadius = '5px';
            this.weaponStats.style.fontFamily = 'Arial, sans-serif';
            this.weaponStats.style.zIndex = '100';
            this.weaponStats.innerHTML = `
                <div style="border-bottom: 1px solid #666; margin-bottom: 5px; padding-bottom: 5px;">
                    <span style="color: #FFA500;">Current Weapon</span>
                </div>
                <div>Damage: <span id="current-weapon-damage">1</span></div>
                <div>Fire Rate: <span id="current-weapon-fire-rate">3</span> bullets/sec</div>
                <div>Range: <span id="current-weapon-range">200</span> units</div>
            `;
            document.body.appendChild(this.weaponStats);
        } else {
            this.weaponStats = existingWeaponStats;
        }

        // Create relic slots container
        this.relicSlotsContainer = document.createElement('div');
        this.relicSlotsContainer.style.position = 'absolute';
        this.relicSlotsContainer.style.top = '10px';
        this.relicSlotsContainer.style.left = '50%';
        this.relicSlotsContainer.style.transform = 'translateX(-50%)';
        this.relicSlotsContainer.style.display = 'flex';
        this.relicSlotsContainer.style.gap = '10px';
        this.relicSlotsContainer.style.zIndex = '100';

        // Create 5 relic slots
        this.relicSlots = [];
        for (let i = 0; i < 5; i++) {
            const slot = document.createElement('div');
            slot.style.width = '40px';
            slot.style.height = '40px';
            slot.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            slot.style.border = '2px solid #666';
            slot.style.borderRadius = '5px';
            slot.style.pointerEvents = 'auto';
            slot.style.cursor = 'help';

            // Add hover events for instant tooltip
            slot.addEventListener('mouseover', (e) => {
                const rect = slot.getBoundingClientRect();
                this.tooltip.style.left = `${rect.left}px`;
                this.tooltip.style.top = `${rect.bottom + 5}px`;
                this.tooltip.style.display = 'block';
            });

            slot.addEventListener('mouseout', () => {
                this.tooltip.style.display = 'none';
            });

            this.relicSlots.push(slot);
            this.relicSlotsContainer.appendChild(slot);
        }

        document.body.appendChild(this.relicSlotsContainer);

        // Create message container for temporary messages
        this.messageContainer = document.createElement('div');
        this.messageContainer.style.position = 'absolute';
        this.messageContainer.style.top = '50%';
        this.messageContainer.style.left = '50%';
        this.messageContainer.style.transform = 'translate(-50%, -50%)';
        this.messageContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.messageContainer.style.color = 'white';
        this.messageContainer.style.padding = '10px';
        this.messageContainer.style.borderRadius = '5px';
        this.messageContainer.style.display = 'none';
        this.messageContainer.style.zIndex = '200';
        this.messageContainer.style.fontFamily = 'Arial, sans-serif';
        
        document.body.appendChild(this.messageContainer);

        // Create blood counter
        this.bloodCounter = document.createElement('div');
        this.bloodCounter.style.position = 'absolute';
        this.bloodCounter.style.top = '120px';
        this.bloodCounter.style.right = '20px';
        this.bloodCounter.style.transform = 'none';
        this.bloodCounter.style.color = '#FFFFFF';
        this.bloodCounter.style.fontSize = '24px';
        this.bloodCounter.style.fontWeight = 'bold';
        this.bloodCounter.style.textShadow = '2px 2px 4px #FF0000';
        this.bloodCounter.style.fontFamily = 'Arial, sans-serif';
        this.bloodCounter.style.zIndex = '100';
        this.bloodCounter.innerHTML = 'BLOOD: 0';
        document.body.appendChild(this.bloodCounter);
        
        // Create level indicator for battle levels
        this.levelIndicator = document.createElement('div');
        this.levelIndicator.style.position = 'absolute';
        this.levelIndicator.style.top = '20px';
        this.levelIndicator.style.right = '20px';
        this.levelIndicator.style.color = '#FFFFFF';
        this.levelIndicator.style.fontSize = '28px';
        this.levelIndicator.style.fontWeight = 'bold';
        this.levelIndicator.style.textShadow = '2px 2px 4px #000000';
        this.levelIndicator.style.fontFamily = 'Arial, sans-serif';
        this.levelIndicator.style.zIndex = '100';
        this.levelIndicator.style.display = 'none'; // Hidden by default
        document.body.appendChild(this.levelIndicator);
        
        // Create required blood display
        this.requiredBloodDisplay = document.createElement('div');
        this.requiredBloodDisplay.style.position = 'absolute';
        this.requiredBloodDisplay.style.top = '80px'; // Move down slightly from top
        this.requiredBloodDisplay.style.right = '20px';
        this.requiredBloodDisplay.style.transform = 'none';
        this.requiredBloodDisplay.style.color = '#FFFFFF';
        this.requiredBloodDisplay.style.fontSize = '24px';
        this.requiredBloodDisplay.style.fontWeight = 'bold';
        this.requiredBloodDisplay.style.textShadow = '2px 2px 4px #000000';
        this.requiredBloodDisplay.style.fontFamily = 'Arial, sans-serif';
        this.requiredBloodDisplay.style.zIndex = '100';
        document.body.appendChild(this.requiredBloodDisplay);
    }
    
    showItemPopup(item, x, y) {
        let content = '';
        
        switch (item.type) {
            case 'weapon':
                if (item.price) {
                    // Shop weapon
                    content = `
                        <div style="background: rgba(0,0,0,0.9); padding: 10px; border-radius: 5px;">
                            <h3 style="color: #FF4444; margin: 0 0 5px 0;">Weapon for Sale</h3>
                            <p style="margin: 5px 0;">Damage: ${item.data.damage}</p>
                            <p style="margin: 5px 0;">Fire Rate: ${item.data.fireRate} bullets/sec</p>
                            <p style="margin: 5px 0;">Range: ${item.data.range} units</p>
                            <p style="color: #FFD700; margin: 5px 0;">Price: ${item.price} HP</p>
                            <p style="color: #88FF88; margin: 5px 0;">Press E to buy</p>
                        </div>
                    `;
                } else {
                    // Dropped weapon
                    content = `
                        <h3>Pistol</h3>
                        <p>Damage: ${item.data.damage}</p>
                        <p>Fire Rate: ${item.data.fireRate} bullets/sec</p>
                        <p>Range: ${item.data.range} units</p>
                        <p>Press E to pick up</p>
                    `;
                }
                break;
            case 'heart':
                content = `
                    <h3>Heart</h3>
                    <p>Restores 1 HP</p>
                    <p>Press E to pick up</p>
                `;
                break;
            case 'gold':
                content = `
                    <h3>HP</h3>
                    <p>+3 HP</p>
                    <p>Press E to pick up</p>
                `;
                break;
            case 'ammo':
                content = `
                    <h3>Ammo</h3>
                    <p>+10 Bullets</p>
                    <p>Press E to pick up</p>
                `;
                break;
            case 'relic':
                if (item.price !== undefined) {
                    // Shop relic
                    content = `
                        <div style="background: rgba(0,0,0,0.9); padding: 10px; border-radius: 5px;">
                            <h3 style="color: #FFFFFF; margin: 0 0 5px 0;">${item.data.name}</h3>
                            <p style="margin: 5px 0;">Blessing: ${item.data.blessing}</p>
                            ${item.data.curse ? `<p style="margin: 5px 0;">Curse: ${item.data.curse}</p>` : ''}
                            <p style="color: #FFD700; margin: 5px 0;">Price: 2 HP</p>
                            <p style="color: #88FF88; margin: 5px 0;">Press E to ${item.price === 0 ? 'pick up' : 'buy'}</p>
                        </div>
                    `;
                    this.popup.innerHTML = content;
                    this.popup.style.right = '20px';
                    this.popup.style.left = 'auto';
                    this.popup.style.top = '50%';
                    this.popup.style.transform = 'translateY(-50%)';
                    this.popup.style.display = 'block';
                    return;
                } else {
                    // Dropped relic
                    content = `
                        <h3 style="color: #FFFFFF;">${item.data.name}</h3>
                        <p>Blessing: ${item.data.blessing}</p>
                        ${item.data.curse ? `<p>Curse: ${item.data.curse}</p>` : ''}
                        <p style="color: #FFD700;">Cost: 2 HP</p>
                        <p>Press E to pick up</p>
                    `;
                }
                break;
            case 'curseRemoval':
                content = `
                    <div style="background: rgba(0,0,0,0.9); padding: 10px; border-radius: 5px;">
                        <h3 style="color: #FFD700; margin: 0 0 5px 0;">Curse Removal Shrine</h3>
                        <p style="margin: 5px 0;">25% chance to remove a random curse</p>
                        <p style="color: #FFD700; margin: 5px 0;">Price: ${item.price} HP</p>
                        <p style="color: #88FF88; margin: 5px 0;">Press E to attempt curse removal</p>
                    </div>
                `;
                break;
        }
        
        this.popup.innerHTML = content;
        this.popup.style.left = `${x}px`;
        this.popup.style.top = `${y}px`;
        this.popup.style.right = 'auto';
        this.popup.style.transform = 'none';
        this.popup.style.display = 'block';
    }
    
    hidePopup() {
        this.popup.style.display = 'none';
    }
    
    showLevelMessage(level) {
        // Create level message
        const message = document.createElement('div');
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        message.style.color = 'white';
        message.style.padding = '20px';
        message.style.borderRadius = '5px';
        message.style.fontSize = '24px';
        message.style.textAlign = 'center';
        message.style.zIndex = '200';
        message.style.fontFamily = 'Arial, sans-serif';
        
        message.innerHTML = `Level ${level}`;
        
        document.body.appendChild(message);
        
        // Remove after 2 seconds
        setTimeout(() => {
            document.body.removeChild(message);
        }, 2000);
    }
    
    updateStats(player, gameState) {
        // Update basic stats
        document.getElementById('hp').textContent = player.hp;
        document.getElementById('max-hp').textContent = player.maxHp;
        document.getElementById('ammo').textContent = player.ammo;
        document.getElementById('max-ammo').textContent = player.maxAmmo;
        document.getElementById('level').textContent = gameState.level;
        document.getElementById('kill-streak').textContent = gameState.killStreak;
        document.getElementById('relics').textContent = player.relics.length;

        // Update weapon stats with calculated values
        const calculatedDamage = player.calculateDamage();
        document.getElementById('current-weapon-damage').textContent = calculatedDamage;
        document.getElementById('current-weapon-fire-rate').textContent = player.fireRate;
        document.getElementById('current-weapon-range').textContent = player.weaponRange;

        // Update level indicator visibility and content
        if (this.levelIndicator) {
            if (!gameState.isShopLevel) {
                this.levelIndicator.style.display = 'block';
                const battleLevel = Math.ceil(gameState.level / 2);
                this.levelIndicator.innerHTML = `BATTLE: ${battleLevel}`;
            } else {
                this.levelIndicator.style.display = 'none';
            }
        }
        
        // Update blood counter
        if (this.bloodCounter) {
            this.bloodCounter.innerHTML = `BLOOD: ${gameState.blood || 0}`;
        }

        // Update relic slots
        for (let i = 0; i < 5; i++) {
            const slot = this.relicSlots[i];
            const relic = player.relics[i];
            
            // Clear previous listeners to avoid duplicates
            const newSlot = slot.cloneNode(true);
            slot.parentNode.replaceChild(newSlot, slot);
            this.relicSlots[i] = newSlot; // Update reference in the array
            const currentSlot = this.relicSlots[i]; // Use the new slot for adding listeners
            
            currentSlot.dataset.relicIndex = i; // Store index for click listener

            if (relic) {
                const color = '#' + relic.color.toString(16).padStart(6, '0');
                currentSlot.style.backgroundColor = color;
                currentSlot.style.border = '2px solid #888';
                currentSlot.style.cursor = window.isMobile ? 'pointer' : 'help'; // Indicate clickable on mobile

                // Tooltip content based on platform
                const sellInstruction = window.isMobile 
                    ? "Tap to sell for 1 HP" 
                    : "Press R to sell for 1 HP";

                // Add hover events for tooltip
                currentSlot.addEventListener('mouseover', (e) => {
                    gameState.hoveredRelicIndex = i;  // Track which relic is being hovered (still useful for desktop 'R')
                    this.tooltip.innerHTML = `
                        <div style="color: #FFFFFF;">${relic.name}</div>
                        <div>Blessing: ${relic.blessing}</div>
                        ${relic.curse ? `<div style="color: #FF4444;">Curse: ${relic.curse}</div>` : ''}
                        <div style="color: #88FF88; font-size: 12px; margin-top: 5px;">${sellInstruction}</div> 
                    `;
                    const rect = currentSlot.getBoundingClientRect();
                    this.tooltip.style.left = `${rect.left}px`;
                    this.tooltip.style.top = `${rect.bottom + 5}px`;
                    this.tooltip.style.display = 'block';
                });
                
                currentSlot.addEventListener('mouseout', () => {
                    gameState.hoveredRelicIndex = -1;  // Clear hovered relic
                    this.tooltip.style.display = 'none';
                });

                // Add click listener for mobile selling
                currentSlot.addEventListener('click', (e) => {
                    if (window.isMobile) {
                        const index = parseInt(e.currentTarget.dataset.relicIndex);
                        console.log(`Attempting to sell relic at index ${index} via tap.`);
                        // Use the globally defined sell function
                        if (typeof window.sellRelic === 'function') {
                           window.sellRelic(index);
                        } else {
                            console.error("sellRelic function not found on window.");
                        }
                    }
                });

            } else {
                currentSlot.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                currentSlot.style.border = '2px solid #666';
                currentSlot.style.cursor = 'default';

                // Add hover events for empty slot tooltip
                currentSlot.addEventListener('mouseover', () => {
                    gameState.hoveredRelicIndex = -1;  // No relic being hovered
                    this.tooltip.textContent = 'Empty Relic Slot';
                    const rect = currentSlot.getBoundingClientRect();
                    this.tooltip.style.left = `${rect.left}px`;
                    this.tooltip.style.top = `${rect.bottom + 5}px`;
                    this.tooltip.style.display = 'block';
                });
                
                currentSlot.addEventListener('mouseout', () => {
                    gameState.hoveredRelicIndex = -1;  // Clear hovered relic
                    this.tooltip.style.display = 'none';
                });
            }
        }
    }

    showMessage(text) {
        this.messageContainer.textContent = text;
        this.messageContainer.style.display = 'block';
        
        // Hide message after 2 seconds
        setTimeout(() => {
            this.messageContainer.style.display = 'none';
        }, 2000);
    }

    updateRelics(relics) {
        // Update relic slots with the current relics
        for (let i = 0; i < 5; i++) {
            const slot = this.relicSlots[i];
            const relic = relics[i];
            
            if (relic) {
                const color = '#' + relic.color.toString(16).padStart(6, '0');
                slot.style.backgroundColor = color;
                slot.style.border = '2px solid #888';
            } else {
                slot.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                slot.style.border = '2px solid #666';
            }
        }
        
        // Update relics count
        document.getElementById('relics').textContent = relics.length;
    }

    showNotEnoughBloodMessage() {
        // Create "NOT ENOUGH BLOOD" message
        const bloodMessage = document.createElement('div');
        bloodMessage.style.position = 'absolute';
        bloodMessage.style.top = '50%';
        bloodMessage.style.left = '50%';
        bloodMessage.style.transform = 'translate(-50%, -50%)';
        bloodMessage.style.color = '#FF0000';
        bloodMessage.style.fontSize = '48px';
        bloodMessage.style.fontWeight = 'bold';
        bloodMessage.style.textShadow = '2px 2px 4px #000';
        bloodMessage.style.fontFamily = 'Arial, sans-serif';
        bloodMessage.style.zIndex = '200';
        bloodMessage.innerHTML = 'NOT ENOUGH BLOOD';
        
        document.body.appendChild(bloodMessage);
        
        // Fade out and remove after 2 seconds
        setTimeout(() => {
            bloodMessage.style.transition = 'opacity 1s';
            bloodMessage.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(bloodMessage);
            }, 1000);
        }, 2000);
    }

    // Update the required blood display
    updateRequiredBlood(amount) {
        if (this.requiredBloodDisplay) {
            this.requiredBloodDisplay.innerHTML = `REQUIRED BLOOD: ${amount}`;
        }
    }
    
    // Reset UI elements when restarting or moving to a new level
    resetUIElements() {
        // Reset blood counter value only
        if (this.bloodCounter) {
            this.bloodCounter.innerHTML = 'BLOOD: 0';
        }
        
        // Don't reset required blood - it will be set separately
    }

    // Add the missing updateRelicHover method definition
    updateRelicHover(mouseX, mouseY, player, gameState) {
        // This function is called in main.js animate loop for desktop hover effects.
        // The actual logic for showing tooltips and setting gameState.hoveredRelicIndex
        // is currently handled by mouseover/mouseout listeners added directly to 
        // the relic slots in the updateStats method. 
        // So, this function can remain empty for now just to prevent the TypeError.
        // If more complex hover logic based on raw coordinates is needed later, 
        // it can be added here.
    }
}