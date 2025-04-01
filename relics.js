export class RelicSystem {
    constructor() {
        // Define all available relics
        this.relicDefinitions = [
            {
                id: 'twoHeadedGoat',
                name: 'Two Headed Goat',
                blessing: 'Allows access to the Pentagram Portal',
                curse: 'None',
                color: 0x330066, // Deep purple
                apply: (player) => {
                    // No direct effects, just enables pentagram access
                    player.hasTwoHeadedGoat = true;
                }
            },
            {
                id: 'colossusHeart',
                name: 'Colossus Heart',
                blessing: '+50% max HP',
                curse: '-20% max ammo',
                color: 0xFF0000, // Red
                apply: (player) => {
                    // Apply blessing
                    const hpBonus = Math.floor(player.maxHp * 0.5);
                    player.maxHp += hpBonus;
                    player.hp += hpBonus;
                    
                    // Apply curse
                    const ammoReduction = Math.floor(player.maxAmmo * 0.2);
                    player.maxAmmo -= ammoReduction;
                    if (player.ammo > player.maxAmmo) {
                        player.ammo = player.maxAmmo;
                    }
                }
            },
            {
                id: 'hemoclawCharm',
                name: 'Hemoclaw Charm',
                blessing: '+0.25x weapon damage multiplier per missing HP',
                curse: 'Cannot pick up hearts (cannot heal)',
                color: 0x8B0000, // Dark red
                apply: (player) => {
                    // The blessing is applied dynamically in damage calculations
                    player.canHeal = false;
                }
            },
            {
                id: 'brassHeart',
                name: 'Brass Heart',
                blessing: 'Adds 5 ammo per kill',
                curse: 'None',
                color: 0xD4AF37, // Gold
                apply: (player) => {
                    // The blessing is applied on kill events
                }
            },
            {
                id: 'bloodPact',
                name: 'Blood Pact',
                blessing: '+5% max ammo per kill during Kill Streak',
                curse: 'Lose 10% max ammo if streak resets',
                color: 0x8B0000, // Dark red
                apply: (player) => {
                    // The blessing and curse are applied on kill/hit events
                }
            },
            {
                id: 'jestersDie',
                name: "Jester's Die",
                blessing: 'Randomizes weapon stats every room',
                curse: 'Cannot sell until room is cleared',
                color: 0x9400D3, // Purple
                apply: (player) => {
                    // The blessing is applied on room transitions
                    player.canSellRelics = false;
                }
            },
            {
                id: 'mirrorsEdge',
                name: "Mirror's Edge",
                blessing: 'Selling has 30% chance to remove a random relic\'s curse',
                curse: 'Must hold for 5 rooms before selling',
                color: 0xC0C0C0, // Silver
                roomsHeld: 0,
                apply: (player) => {
                    // The blessing and curse are applied on sell events
                }
            },
            {
                id: 'ragingHeart',
                name: 'Raging Heart',
                blessing: '+2 base damage per kill in Kill Streak',
                curse: '-10 base damage per hit taken',
                color: 0xFF4500, // Orange-red
                apply: (player) => {
                    // The blessing and curse are applied on kill/hit events
                }
            },
            {
                id: 'executionersSeal',
                name: "Executioner's Seal",
                blessing: 'x3 damage if Kill Streak > 20',
                curse: 'Take x2 damage',
                color: 0x000000, // Black
                apply: (player) => {
                    // The blessing is applied in damage calculations
                    player.damageTakenMultiplier = (player.damageTakenMultiplier || 1) * 2;
                }
            },
            {
                id: 'infernalCore',
                name: 'Infernal Core',
                blessing: '+25% base damage per equipped relic',
                curse: 'None',
                color: 0xFF4500, // Orange-red
                apply: (player) => {
                    // The blessing is applied in damage calculations
                }
            },
            {
                id: 'doomsPromise',
                name: "Doom's Promise",
                blessing: 'x2 base damage when HP < 25%',
                curse: 'Take +50% damage',
                color: 0x8B0000, // Dark red
                apply: (player) => {
                    // The blessing is applied in damage calculations
                    player.damageTakenMultiplier = (player.damageTakenMultiplier || 1) * 1.5;
                }
            },
            {
                id: 'bloodAmplifier',
                name: 'Blood Amplifier',
                blessing: '+20 Blood when clearing a room',
                curse: 'None',
                color: 0xAA0000,
                onUnequip: (player) => {
                    if (window.gameState) {
                        window.gameState.blood = Math.max(0, window.gameState.blood - 20);
                    }
                }
            }
        ];
    }
    
    getRandomRelic() {
        const index = Math.floor(Math.random() * this.relicDefinitions.length);
        return this.createRelic(this.relicDefinitions[index]);
    }
    
    getShopRelics(num) {
        // Get random relics for shop
        const shopRelics = [];
        const availableRelics = [...this.relicDefinitions];
        
        // First shop: give Two-Headed Goat a 10% chance to appear (no longer 100%)
        if (window.gameState && window.gameState.level === 2) {
            const roll = Math.random();
            if (roll < 0.1) { // 10% chance
                const twoHeadedGoatRelic = this.relicDefinitions.find(r => r.id === 'twoHeadedGoat');
                if (twoHeadedGoatRelic) {
                    shopRelics.push(this.createRelic(twoHeadedGoatRelic));
                    
                    // Remove it from available relics
                    const index = availableRelics.findIndex(r => r.id === 'twoHeadedGoat');
                    if (index !== -1) {
                        availableRelics.splice(index, 1);
                    }
                    
                    // Get one less relic than requested since we already added the goat
                    num--;
                }
            }
        } else {
            // For other shops, give Two-Headed Goat a 5% chance to appear
            const roll = Math.random();
            if (roll < 0.05) { // 5% chance
                const twoHeadedGoatRelic = this.relicDefinitions.find(r => r.id === 'twoHeadedGoat');
                if (twoHeadedGoatRelic) {
                    shopRelics.push(this.createRelic(twoHeadedGoatRelic));
                    
                    // Remove it from available relics
                    const index = availableRelics.findIndex(r => r.id === 'twoHeadedGoat');
                    if (index !== -1) {
                        availableRelics.splice(index, 1);
                    }
                    
                    // Get one less relic than requested since we already added the goat
                    num--;
                }
            }
        }
        
        // Get the rest of the relics
        for (let i = 0; i < num && availableRelics.length > 0; i++) {
            const index = Math.floor(Math.random() * availableRelics.length);
            shopRelics.push(this.createRelic(availableRelics[index]));
            availableRelics.splice(index, 1);
        }
        
        return shopRelics;
    }
    
    createRelic(definition) {
        // Create a new relic instance
        return {
            id: definition.id,
            name: definition.name,
            blessing: definition.blessing,
            curse: definition.curse,
            color: definition.color,
            apply: definition.apply,
            roomsHeld: 0
        };
    }
    
    applyRelicEffects(player, gameState) {
        // Apply static effects from all relics
        for (const relic of player.relics) {
            if (typeof relic.apply === 'function') {
                relic.apply(player);
            }
        }
    }
    
    // Functions for specific relic events
    onKill(player, gameState) {
        for (const relic of player.relics) {
            switch (relic.id) {
                case 'brassHeart':
                    player.ammo = Math.min(player.maxAmmo, player.ammo + 5);
                    break;
                case 'bloodPact':
                    const ammoBonus = Math.ceil(player.maxAmmo * 0.05);
                    player.maxAmmo += ammoBonus;
                    player.ammo = Math.min(player.maxAmmo, player.ammo + ammoBonus);
                    break;
                case 'ragingHeart':
                    player.baseDamage += 2;
                    break;
                case 'bloodAmplifier':
                    // Only add blood if this was the last enemy
                    if (gameState.enemies && gameState.enemies.length === 1) {
                        gameState.blood += 20;
                    }
                    break;
            }
        }
    }
    
    onHit(player, gameState) {
        // Reset kill streak
        gameState.killStreak = 0;
        
        for (const relic of player.relics) {
            switch (relic.id) {
                case 'bloodPact':
                    const ammoReduction = Math.ceil(player.maxAmmo * 0.1);
                    player.maxAmmo -= ammoReduction;
                    player.ammo = Math.min(player.maxAmmo, player.ammo);
                    break;
                case 'ragingHeart':
                    player.baseDamage = Math.max(1, player.baseDamage - 10);
                    break;
            }
        }
    }
    
    onRoomChange(player) {
        for (const relic of player.relics) {
            // Increment rooms held counter
            relic.roomsHeld = (relic.roomsHeld || 0) + 1;
            
            switch (relic.id) {
                case 'jestersDie':
                    // Randomize weapon stats
                    player.baseDamage = player.generateRandomDamage();
                    player.fireRate = player.generateRandomFireRate();
                    break;
                case 'mirrorsEdge':
                    // Update can sell state
                    if (relic.roomsHeld >= 5) {
                        player.canSellRelics = true;
                    }
                    break;
            }
        }
    }
    
    canSellRelic(player, relic) {
        // Check if a relic can be sold
        if (relic.id === 'jestersDie' && relic.roomsHeld === 0) {
            return false;
        }
        
        if (relic.id === 'mirrorsEdge' && relic.roomsHeld < 5) {
            return false;
        }
        
        return true;
    }
    
    sellRelic(player, relicIndex) {
        const relic = player.relics[relicIndex];
        
        // Check if relic can be sold
        if (!this.canSellRelic(player, relic)) {
            return false;
        }
        
        // Remove relic using player's method which handles onUnequip
        player.removeRelic(relicIndex);
        
        // Check for Mirror's Edge effect
        for (const r of player.relics) {
            if (r.id === 'mirrorsEdge') {
                // 30% chance to remove a random curse
                if (Math.random() < 0.3) {
                    const cursedRelics = player.relics.filter(cr => cr.curse && cr.id !== 'mirrorsEdge');
                    if (cursedRelics.length > 0) {
                        const randomCursedRelic = cursedRelics[Math.floor(Math.random() * cursedRelics.length)];
                        randomCursedRelic.curse = null;
                    }
                }
                break;
            }
        }
        
        return true;
    }
}