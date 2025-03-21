export class UI {
    constructor() {
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
        this.weaponStats = document.createElement('div');
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
            <div>Damage: <span id="current-weapon-damage">0</span></div>
            <div>Fire Rate: <span id="current-weapon-fire-rate">0</span> bullets/sec</div>
        `;
        
        document.body.appendChild(this.weaponStats);

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
    }
    
    showItemPopup(item, x, y) {
        // Set popup content based on item type
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
                            <p style="color: #FFD700; margin: 5px 0;">Price: ${item.price} Gold</p>
                            <p style="color: #88FF88; margin: 5px 0;">Press E to buy</p>
                        </div>
                    `;
                } else {
                    // Dropped weapon
                    content = `
                        <h3>Pistol</h3>
                        <p>Damage: ${item.data.damage}</p>
                        <p>Fire Rate: ${item.data.fireRate} bullets/sec</p>
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
                    <h3>Gold</h3>
                    <p>+3 Gold Coins</p>
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
                if (item.price) {
                    // Shop relic
                    content = `
                        <div style="background: rgba(0,0,0,0.9); padding: 10px; border-radius: 5px;">
                            <h3 style="color: #${item.data.color.toString(16).padStart(6, '0')}; margin: 0 0 5px 0;">${item.data.name}</h3>
                            <p style="margin: 5px 0;">Blessing: ${item.data.blessing}</p>
                            ${item.data.curse ? `<p style="margin: 5px 0;">Curse: ${item.data.curse}</p>` : ''}
                            <p style="color: #FFD700; margin: 5px 0;">Price: ${item.price} Gold</p>
                            <p style="color: #88FF88; margin: 5px 0;">Press E to buy</p>
                        </div>
                    `;
                } else {
                    // Dropped relic
                    content = `
                        <h3>${item.data.name}</h3>
                        <p>Blessing: ${item.data.blessing}</p>
                        ${item.data.curse ? `<p>Curse: ${item.data.curse}</p>` : ''}
                        <p>Press E to pick up</p>
                    `;
                }
                break;
            case 'curseRemoval':
                content = `
                    <div style="background: rgba(0,0,0,0.9); padding: 10px; border-radius: 5px;">
                        <h3 style="color: #FFD700; margin: 0 0 5px 0;">Curse Removal Shrine</h3>
                        <p style="margin: 5px 0;">25% chance to remove a random curse</p>
                        <p style="color: #FFD700; margin: 5px 0;">Price: ${item.price} Gold</p>
                        <p style="color: #88FF88; margin: 5px 0;">Press E to attempt curse removal</p>
                    </div>
                `;
                break;
        }
        
        // Update popup content and position
        this.popup.innerHTML = content;
        this.popup.style.left = `${x}px`;
        this.popup.style.top = `${y}px`;
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
    
    updateStats(player, gameState, enemies) {
        document.getElementById('hp').textContent = player.hp;
        document.getElementById('max-hp').textContent = player.maxHp;
        document.getElementById('ammo').textContent = player.ammo;
        document.getElementById('max-ammo').textContent = player.maxAmmo;
        document.getElementById('level').textContent = gameState.level;
        document.getElementById('gold').textContent = gameState.gold;
        document.getElementById('kill-streak').textContent = gameState.killStreak;
        document.getElementById('relics').textContent = player.relics.length;

        // Update weapon stats with calculated values
        document.getElementById('current-weapon-damage').textContent = `${player.calculateDamage()}`;
        document.getElementById('current-weapon-fire-rate').textContent = `${player.fireRate}`;

        // Update relic slots
        for (let i = 0; i < 5; i++) {
            const slot = this.relicSlots[i];
            const relic = player.relics[i];
            
            if (relic) {
                const color = '#' + relic.color.toString(16).padStart(6, '0');
                slot.style.backgroundColor = color;
                slot.style.border = '2px solid #888';
                
                // Update tooltip content
                slot.onmouseover = () => {
                    this.tooltip.innerHTML = `
                        <div style="color: ${color};">${relic.name}</div>
                        <div>Blessing: ${relic.blessing}</div>
                        ${relic.curse ? `<div style="color: #FF4444;">Curse: ${relic.curse}</div>` : ''}
                        <div style="color: #888; font-size: 12px; margin-top: 5px;">Press R to sell for 5 gold</div>
                    `;
                };
            } else {
                slot.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                slot.style.border = '2px solid #666';
                
                // Update tooltip content for empty slot
                slot.onmouseover = () => {
                    this.tooltip.textContent = 'Empty Relic Slot';
                };
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
}