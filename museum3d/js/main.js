import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Museum texts for wall sections
const museumTexts = [
    "testing testing 01 this is the game im making. Do NOT change ANY code, just look over my current code and tell me if everything is working and if theres anything youd change. - I'll examine your current files to see what code exists and provide feedback.",
    "why is the loot.js and level.js showing 1 error each? Can you please review and TELL me what youre gonna do before doing it. - I'll check both files to identify the errors.",
    "when i open the index.html from the folder i only see a blank screen. - Let me check the index.",
    "its already in use - The error means port 8000 is already being used by another process.",
    "its still a blank screen - Let me check the browser's console for any JavaScript errors that might be causing the blank screen.",
    "still blank - Let me check the browser's console for errors.",
    "right now some of the UI elements for the items are showing up off screen. Do not change ANY of the other code, but please make sure the ui window for the item description always pops up in the top right of the screen. - Looking at the code, the UI popup positioning is being calculated in the `checkPickup` method of `loot.",
    "that worked! right now the damage and fire rate for the gun is undefined. - Let me check the UI code to see why the weapon stats are showing as undefined.",
    "same is happening with relics! - I see the issue.",
    "that worked! Please show the five slots for your relics at the top middle of the screen. - I'll add a relic slots display at the top middle of the screen.",
    "Please make sure the shop can't appear as the first level! - I'll check the shop spawning logic and modify it to prevent the shop from appearing on level 1.",
    "please generate a small ui window to the left and top of the screen that shows what current gun you have equipped and its stats - I'll add a weapon stats display to the UI class.",
    "he placement is perfect but it doesn't actually show what weapon is equipped - I see the issue - we're not actually displaying the weapon stats correctly.",
    "its still showing zero now alwasy - Let me check the player class to see how the weapon stats are being handled and updated:.",
    "its still not correctly updating when i pick up a new weapon - I see the issue.",
    "Great that worked! Now can you make it so that the relics I collect actually show up in the slots at the top? - Let me check how relics are being handled in the loot system and UI:.",
    "i still can't hover over the relic to see what it does. - I see the issue.",
    "the UI element is there, but it takes too long to pop up! can it pop up instantly when hovering? - I see the issue.",
    "right now the current weapon ui says 0 but its over the correct one that is working, for some reason its blocking it! - I see the issue - we have two weapon stat displays overlapping each other.",
    "dont change anything else, please make max hp and hp initialize at 6 - I'll modify just the initial HP values in the player class:.",
    "i have the hemoclaw charm but my weapon damage is not being multiplied! - I see the issue in the `calculateDamage` method in player.",
    "the damage for my gun should be way higher becasue i have this relic and my killstraek is 3! - Ah, I see the issue! Looking at your screenshot, you have the Raging Heart relic which should give +2 base damage per kill in Kill Streak, but this isn't being calculated.",
    "great, please dont change ANYTHING but start the game with raging heart equiped so i can ttest it. Then we'll remove that - I'll modify just the player initialization to start with Raging Heart equipped:.",
    "Nice that worked! Now please remove raging heart initialization. - I'll remove the Raging Heart from the initial relics array and set it back to empty:.",
    "i have raging heart and hemoclaw and yet my damage is only 9. Why is this - Let me help investigate why your damage calculation might be lower than expected.",
    "i have this relic and yet my damage didnt go up either - I see from the new screenshot that you now have the Infernal Core relic equipped, which should give +25% base damage per equipped relic.",
    "please add a simple option to sell relics for 5 gold when hovering over them at the top - I'll help you add a sell feature for relics.",
    "this is good except when i go to press it the menu goes away, can you make it so that it just tells you to press e to sell it - I'll modify the UI to show Press E to sell instead of having a button, and then implement the selling mechanism through the 'E' key press, similar to how other pickups work.",
    "oh shit, no actually switch it to be a different key, maybe R, because currently when i go to pick up a relic it now sells it - Ah yes, that's a good catch! Using 'E' conflicts with the pickup mechanic.",
    "currently the shop is impossible to buy from or to do the 10 gold to have a chance to remove a curse. Please update the ui to display the options and assign the e key to perform these options. - I'll help modify the shop UI to make it clearer and implement the curse removal option.",
    "Please add the exit to the next level next to the shop so that people can progress - I'll modify the shop level to create the portal (exit) immediately instead of waiting 10 seconds.",
    "start me off with 300 ammo for now. - I'll modify the player's initial ammo to start with 300 bullets.",
    "it didnt work, what line should i update to do that, where is it - Looking at the attached file, I can see that the ammo initialization is in the Player class constructor in `player.",
    "its only showing 300 for a second and then it's going back to 40 - Ah, I see the issue.",
    "That worked! Currently the shop has no ui or interactaable elements to buy items or try and spend gold to remove a curse from a random relic in your hand - I see the issue.",
    "the shop still only looks like this. Can please add very simple words to the ui as well as an interact with E option to perform the actions.  Dont change anything else. - I'll add simple text labels above each shop item to make it clearer what they are and how to interact with them.",
    "I want to add a simple number to each enemy which displays their current health and attack. make sure it is actually bound to the enemy, so that it always is displayed with them and updates as they lose health. - I'll help you add health and attack numbers that follow each enemy.",
    "there is zero UI element that shows the stats above the enemy. However, is there a SUPER simple guarenteed appraoch to bind these stats to the enemy, even if its a part of its actual character. - Ah, I understand - instead of trying to create HTML elements that follow the enemies, we can create a simple Three.",
    "its not working at all! - I see the issue - the text isn't showing up because we need to make sure the text plane always faces the camera (billboarding) and we need to make the texture properly visible.",
    "is it possible to impliment git version control? i really don't want to lose my progress. - I'll help you set up Git version control for your project.",
    "git config --global user.name Admin && git config --global user.email admin@example.com - why'd you use placeholder info? is that okay or do you need my actual git info - Ah, I apologize for using placeholder information! No, you should definitely use your actual Git information.",
    "my email is colemankidding@gmail.com and my name is Bobby Coleman do you need anything more - Perfect! I'll set up Git with your actual information:.",
    "please backup this project on my github online - I'll help you create a GitHub repository and push your code to it.",
    "username is Bobby-Coleman - Great! Let's set up your GitHub repository.",
    "whats going on - The terminal is asking you to confirm where to save your SSH key.",
    "yes continue - Alright, let's continue with the SSH setup.",
    "did it work - Let me check if the SSH key was created successfully:.",
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG+sk0whTuDdt6TN1R4CTItbrzViugBhMhTXgkFT1uQD colemankidding@gmail.com is it this - Yes, exactly! That's your complete SSH public key.",
    "got it right - Perfect! Now let's create a new repository for your game and push your code to GitHub.",
    "got it - Great! Now let's connect your local repository to GitHub and push your code.",
    "this worked! - Yes, it did! Your game is now safely stored on GitHub at https://github.",
    "nice, let's continue with the game now. currently the monsters never show any health number or attack number. Try to track down where their health is being stored and display that somewhere on the screen, then, after that, we can work on tieing that number to each monster. But for now just put it on the screen so i know its working. - Let's first check where the enemy health is stored and then display it in a simple way on the screen.",
    "okay, that actually worked! Please start off the enemies with three times as much health for now so I can test it. - I'll help you modify the enemy health values.",
    "This worked!!!! please push these changes to github - I'll help you push these changes to GitHub.",
    "please remove the right UI element BUT keep the health bars on the enemies. Do NOT change anything else! - I'll help you remove the enemy stats UI element from the top-right corner while keeping the health bars that appear above each enemy.",
    "this is perfect, please push the changes to github - I'll push these changes to GitHub with a descriptive commit message.",
    "my base damage isn't updating in the weapon ui (or maybe the actual weapon) when i have this relic. It should be showing the updated damage because of my killstreak. - I'll help you fix the damage display issue with the Raging Heart relic.",
    "please initialize my character with raging heart equipped so that i can test this. Please do it simply so i can revert afterward, and also dont change any other code. - I'll modify the player initialization in `main.",
    "this is great, please revert starting with raging heart - I'll remove the Raging Heart initialization code from `main.",
    "currently executioners seal doesn't 3x damage with a high kill streak. - Let me check the damage calculation code to add the Executioner's Seal 3x damage multiplier when the kill streak is above 20:.",
    "do not push changes to github until ive tested them - I apologize for being too eager to push to GitHub.",
    "pleasee initialize with executioner's relic and kill streak at 15 so i can test. Do NOT change anything else. - I'll modify `main.",
    "it does not show that my damage trippled (should show 9 damage in this case in the display box) - Let me check the UI update code to make sure it's properly displaying the calculated damage.",
    "base damage didn't go up - Looking at the screenshot and code, I see the issue.",
    "my damage still didn't go up - Looking at the console logs and the code, I see the issue.",
    "the relic is NOT multiplying my damage by 3. - Looking at the code more carefully, I see the issue.",
    "how do i open f12 on mac - On a Mac, to open the browser's Developer Tools (equivalent to F12 on Windows), use:.",
    "willl that work with localhost - Yes, absolutely! The Developer Tools work with localhost exactly the same way as any other website.",
    "is there a way to do it manually bc i dont see it - Yes! In Safari, you can enable the Developer Tools manually:.",
    "wghere - In the Safari settings window you're showing, check the box that says Show features for web developers at the bottom of the Advanced tab (I can see it's already checked in your screenshot).",
    "thoughts - Ah, now I can see exactly what's happening! The logs show:.",
    "It looks good but there's a problem where a random UI box that shows zero damage is being placed in front of the reeal ui box with the correct damage. - Ah, I see the issue in the screenshot - there are two weapon stat boxes overlapping, with one showing Damage: 0 and Fire Rate: 0 bullets/sec.",
    "this is working perfectly, please push to github - Great! I'll push both changes to GitHub - the damage calculation fix and the UI fix that prevents duplicate weapon stat boxes:.",
    "the blood pact relic isn't working, please adjust accordingly to make it work with killstreak. Brass heart is also not adding ammo, but it used to work. Please change these relics and NOTHING else in the code. - I'll check the relic effects in the `RelicSystem` class.",
    "Please show the enemies health as a number below their health bar as well! - I'll modify the Enemy class to add a health number display below the health bar.",
    "its not showing up! - Looking at the code, I see that we need to make a few adjustments to make the health text more visible.",
    "its not working! please only change the smallest amount of things to convert this health bar into a number. - ---.",
    "that worked great, please push that to github - I'll push the changes that add the health number display to GitHub:.",
    "now, please add the enemy's attack as well next to the health. please use the same method as it seemed to work. - I'll modify the enemy health display to include the attack damage, using the same working method:.",
    "that's perfect, now i noticed that the curse does not work. I am taking the normal amount of damage. - Looking at the code, I see that the Executioner's Seal curse (take x2 damage) isn't being applied when we take damage.",
    "please push the changes - I'll push the changes to the `takeDamage` method that implements the curse damage multipliers:.",
    "great. Can we impliment one enemy to work from a sprite sheet? Its a 16 frame sprite sheet with four directions. - I'll help you implement sprite sheet animation for an enemy.",
    "what are all the enemies called - Looking at the enemy.",
    "please do it for basic monster. Let's update that one and call on my a basic monster sprite sheet - I'll modify the code to use your basic monster sprite sheet.",
    "can you create the directory too and ill add in the basic spriteshee - I'll help create a directory structure for your sprite sheets.",
    "did it - Now that you've added the sprite sheet, we need to add the animation update logic to make the sprite animations work.",
    "it went blank now - Let me check if there's an issue with the sprite sheet loading or the mesh creation.",
    "yeah it is. No everything is blank. - I see the error in the console: TypeError: undefined is not an object (evaluating 'this.",
    "no its the same issue - I see the issue now.",
    "I updated the spritesheet for basic monster but the old one is still showing. Dont change code just tell me whats wrong - Ah, this is likely a caching issue with the browser.",
    "right now basic monster flips upside down as it's follwojng me, but that looks weird with the sprite sheet, can you keep it upright alwasy and just change the direction (based on its sprite sheet and which way it's going) - I'll modify the enemy update logic to keep the sprite upright and use the sprite sheet directions instead of rotating the mesh:.",
    "It's perfect, except their directions are wrong. The sprite sheet goes up, right down left. - Ah, I see! Let me adjust the direction mapping to match your sprite sheet's order (up, right, down, left):.",
    "That's perfect, can you make basic_monster twice as big - I'll modify the size of the basic monster by adjusting its geometry size from 32x32 to 64x64:.",
    "Great, can you make basic monster move around randomly when not in aggro range. They should move around slower than their aggro speed. - I'll modify the enemy update logic to add random movement when not in aggro range.",
    "the one on the left is doing it perfectly but the one on the right is stuck in place! why is this - Looking at the code and the image, I can see that the issue is likely because we're not resetting the `isAggro` flag when the player moves out of range.",
    "That's perfect, but im pretty sure they also get stuck at the edge of the screen and can't wander anymore! - Looking at the code, I see the issue.",
    "perfect please push this to github - I'll push these changes to GitHub that improve the enemy movement and aggro behavior:.",
    "This is great. Where is the direction for the basic monster set for the sprite sheet - The direction for the basic monster's sprite sheet is set in two places in the `enemy.",
    "in the movement code what line - Let me find the exact line where the direction mapping occurs in the movement code:.",
    "the directions are off for some reason. Currently when its walking right it looks like its facing down and when its walking left it looks like its facing up. up its facing right and down left. Its all mixed up - Ah, I see the issue.",
    "Everything is 100% reversed now. Up looks down down up and left right right left, if you flip everything itll work perfectly! - Ah, I see! We just need to flip all the direction numbers since everything is exactly reversed.",
    "This is perfect please push to github - I'll push the changes that fixed the sprite sheet direction mapping to GitHub:.",
    "why am i not seeing the assets folder. is it not pushing correctly - Ah, I see the issue.",
    "I want to add a spritesheet for the main player character. Please impliment the spritesheet in the same way as the monster, where it doesn't rotate. - I'll help you implement the player sprite sheet similar to the basic monster.",
    "it didn't update the game with it. but maybe its a cashe issue - Let's verify if it's a cache issue.",
    "no dont commit it. - Ah, I understand.",
    "it says untracked for the sprite sheet why - The sprite sheet is showing as untracked because we haven't added it to git's tracking system yet.",
    "it works but he needs to be like three times as big. - I'll update the player size to be three times larger (from 32x32 to 96x96) and adjust the health bar and indicator positions accordingly:.",
    "the same directional issues are happening that happened with the monster. Can you fix this. - Yes, I'll fix the direction mapping for the player just like we did for the monster.",
    "perfect, change the character to 64 x 64 - I'll update the player size from 96x96 to 64x64 and adjust the indicator position proportionally:.",
    "Hmm he seems to small now, split the difference please! Also remove the weapon direction indecator or if its neecsaary hide it - I'll adjust the player size to 80x80 (the middle ground between 64 and 96) and hide the weapon direction indicator:.",
    "Thats perfect git push these changes and add in the new player sprite assset to git - I'll help you push both the player.",
    "can you please add a random range to the weapons. (from a quarter of the screen to full screen width) - I'll modify the weapon range to be randomized when weapons are created.",
    "please show the range stat of the weapon on the current weapon ui box - I'll help you add the range stat to the weapon UI box.",
    "i want it to show the rspecific range of the weapon equipped not the random stat that shows what ranges can be. Do the guns each currrently have a random but EXACT range assigned? - Looking at the current implementation, I notice that each bullet gets assigned a random range when fired, but the weapon itself doesn't have a fixed range value.",
    "the gun that i started with had a good exact range but the gun i was gonna pick said undefined! - I see the issue! When picking up a weapon from a drop or buying from the shop, we're not transferring the range value to the player's `weaponRange` property.",
    "the random guns being created and dropped arent being assigned a random range. When i equip them they're just keeping the same range as my starter gun - Looking at the code, I can see that while we have the `generateRandomRange()` function implemented correctly in both `loot.",
    "the gun's being dropped by enemies have an undefined range and are NOT being assigned a random range. Please follow best practices and impliment the simplest version of this changing as little code as possibel. - Looking at the code, I see that enemies drop weapons but we haven't checked where those drops are being created.",
    "what port are we on again - Looking at the browser window in your screenshot, I can see you're running on `localhost` without any explicit port number shown in the URL.",
    "can you push the recent changes to github - I'll help you push the recent changes to GitHub, which include the debug logging for weapon drops and pickups:.",
    "Okay lets fix the shop. IT currently cannot be bought from. Do not change anything else, but impliment the SIMPLEST version of a shop right now (4 interactable slots (three relics (with hover ui) feel free to follow the absolute simplest approach to this shop area. Do not change any other code. Make sure the player can still walk around the shop and that the exit is still there how it currently is. Tell me first what youre going to add and remove to achieve this simply - Let me first check the current shop implementation:.",
    "yes this is good but just make it three relic slots don't worry aboiut weapon! - Ah, even simpler! I'll modify the shop to just have three relic slots in a row.",
    "there's no hover UI or option e to purchase. Is it just a UI problem or the actual logic isnt there? - Let me check the code.",
    "lets do it - I'll implement all three components to make the shop fully functional.",
    "Nothing has worked, why do you think this is? I don't see any interactable elements in the shop, no hover ui and no press e to purchase. Tell me whats wrong - Looking at the code and the symptoms you're describing, I think I know what's missing.",
    "you have access - Let me search for the main game file:.",
    "this is what it looks like. Do you think you need to start fresh with the shop, remove all unessaasray aspects and just have three simple interactable relics in the middle? - Yes, looking at the screenshot and the current implementation, I think we should simplify the shop completely.",
    "can you change nothing else but move the UI to the right center on hover. Also initialize my player with 20 gold. CHANGE NOTHING ELSE - I'll help move the UI to the right center on hover and initialize the player with 20 gold.",
    "its hovering in the complete top left - I see the issue.",
    "why is it not at ALL moved. its still top left. impliment the abosolute simplest approach - Looking at the code, let's use the absolute simplest approach possible.",
    "this worked!! please push to github - I'll help push these changes to GitHub.",
    "currently pressing r sells ALL relics. Please make it so that it only sells the relic that i select or hover over (whatever is simplest to impliment.) please think through this implimentation clearly and follow best simplesst approach. - Let me check how the relic selling is currently implemented:.",
    "it still sells both relics. I think its becasue i hold down the R button. Maybe add a slight cool down for selling rellics? but it might not be that - Ah, I see the issue.",
    "this worked! push it to github - I'll push the changes to GitHub that add the cooldown system for relic selling:.",
    "okay this is perfect. Currently relics dropped by monsters are free to pick up. I want to change it so that they always cost 4 gold. Do NOT change any other code and only add this one feature - I'll check how dropped relics are handled and add the gold cost.",
    "that didnt work. - Let me check the UI popup to make sure it shows the gold cost.",
    "push to github - I'll push both the UI changes and the loot system changes to GitHub:.",
    "Please add the same style of movement that basic_monster has to the yellow enemy, but DO not change any other code. Also make the yellow a lot slower when out of aggro range but keep its fast aggro speed the same. - I'll check how the basic monster moves and apply the same style to the yellow enemy (type 2) while keeping its fast speed when in aggro range.",
    "This is good, but please make the yellow monster slower when not aggrod. Change nothing else - I see that the yellow monster's non-aggro speed is currently set to `this.",
    "This is perfect, but currently the yellow monster was able to walk off the screen and never came back - I see the issue.",
    "please make it so that the monsters don't spawn right next to you or even within aggro range right aaway. dont change anythign else - I notice that the enemy spawning logic isn't actually in this file - the Enemy class just handles the behavior after spawning.",
    "please make the starting weapon Damage 3 fire rate 5 / s and range 200 - I'll search for where the player's starting weapon is defined:.",
    "it is currently still initializing randomly - I see the issue - looking at the attached file, I can see that while we modified the generation functions, they're not being used correctly in the constructor.",
    "great push these chacnges - I'll push these changes to GitHub.",
    "let's add a new enemy that slowly walks around and fires a bomb towards the player that bounces off the bounding walls and blows doing AOE damage. Do not change any other code. Please add an enemy in the simplest way, only adding a new enemy without changing a bunch of stuff. - I'll help create a new bomber enemy (type 3) that fires bouncing bombs.",
    "it didnt show up! - Ah, I see the issue! While we added the bomber enemy type (type 3), we need to update the enemy spawning logic in main.",
    "right now i instantly die when i get near them, and never see them shoot a bomb or anything - I see the issue.",
    "its great but currently the bombs never expload! They should only do 1 damage if they hit you but 3 if they expload near you! set an aoe damage for the bombs exploading! - I'll modify the bomb damage values and fix the explosion logic.",
    "right now the bombs do a TON of damage if you get hit by them. However, i want them to do only 1 damage if you get hit by them but if they should settle and then expload after 2 seconds after stopping moving and that explosion shsould have a blast radius (indicated by a quick sphere popped up for a second) and if youre overlapping that sphere at all you take 3 damage ! - I'll modify the bomber's bombs to have this new behavior - direct hits do 1 damage, and after stopping (either from bounces or hitting a wall) they'll wait 2 seconds before exploding with a visible blast radius:.",
    "currently the bomb causes the game to crash after bouncing for a while. The bomb should be done super simply. Do it the simple possible way, where it just shoots out and stops moving after not a long distance (it shuldnt be lasting so long) and then when it stops, it waits a second and then spawns a circle around it that does damage to the player if there's an overlap) keep it SUPEr simple - I'll simplify the bomb logic significantly.",
    "the bomb is still crashing the game. Please look up the best and simplest approach to making this. and impliment that. DO NOTHING ELSE. Keep it super insanley easy - Looking at the code, I see the issue.",
    "its good but it doesnt expload ! - I see the issue - let me make the bomb even simpler and make sure it explodes.",
    "the bombs don't expload ! please impliment a very simple aoe spawn when it stops moving. - I see the issue.",
    "it works ! push this to github  ---  can you make it so that the bomb stays still once it stops for a second longer before blowing up. - I'll modify the bomb's behavior to stay still for a second before exploding.",
    "the server is down - I see the server is down with a Safari Can't Connect to the Server error for localhost:8080.",
    "python - Ah, you're using Python to serve the files.",
    "can you change the bomb to wait two seconds before exploading - I'll modify the bomb's explosion timer from 1 second to 2 seconds in the `enemy.",
    "the bombs currenty expload while moving still. I want them to stop and then expload after two seconds. - I see the issue.",
    "no actually it should still bounce when it hits a wall! - Ah, I understand! The bomb should bounce off walls but still stop after 2 seconds of movement.",
    "please add a VERY simple start screen and i'll upload the background image for it! Dont change - I'll push the changes to GitHub:.",
    "---  _**Assistant**_  I'll create a simple event enemy that's just a stationary block that spawns yellow enemies. Let me first check the enemy types in the code:  ---  Tool call timed out after 5000ms  ---  Let me try reading the enemy file directly:  ---  Read file: enemy.js  ---  Let me read a bit more to find the yellow enemy type:  ---  Read file: enemy.js  ---  Perfect! Now I'll create a new file for our spawner enemy:  ---  ```diff -  + import * as THREE from 'three'; + import { Enemy } from './enemy.js'; +  + export class Spawner { +     constructor(scene, x, y, level) { +         this.scene = scene; +         this.level = level; +          +         // Fixed stats +         this.baseHp = 50; +         this.speed = 0; +         this.attackDamage = 0; +          +         // Spawn timer +         this.lastSpawnTime = 0; +         this.spawnCooldown = 5000; // 5 seconds +          +         // Create simple block mesh +         const geometry = new THREE.BoxGeometry(50, 50, 1); +         const material = new THREE.MeshBasicMaterial({ +             color: 0x800080, // Purple color +         }); +         this.mesh = new THREE.Mesh(geometry, material); +          +         // Set position +         this.mesh.position.set(x, y, 0); +         scene.add(this.mesh); +          +         // Health setup +         this.maxHp = this.baseHp; +         this.currentHp = this.maxHp; +     } +      +     update(currentTime, player) { +         // Only spawn if alive +         if (this.currentHp <= 0) return; +          +         // Check if it's time to spawn +         if (currentTime - this.lastSpawnTime > this.spawnCooldown) { +             // Spawn a yellow enemy (type 2) +             const enemy = new Enemy(this.scene, this.mesh.position.x, this.mesh.position.y, 2, this.level); +             this.lastSpawnTime = currentTime; +             return enemy; // Return the new enemy to be added to the game's enemy list +         } +         return null; +     } +      +     takeDamage(amount) { +         this.currentHp -= amount; +         if (this.currentHp <= 0) { +             this.scene.remove(this.mesh); +         } +     } + }  ```  ---  Now I'll push this to GitHub:  ---  ```bash git add spawner.js ```  ``` Admin@MacBook-2 CURSED DEPTHS 3 %   ```  ---  Cancelled  ---  _**User**_  it did NOT generate this enemy, please try and do it in the simplest way. Just add the enemy - I'll add the spawner enemy type directly to the existing `enemy.",
    "Okay I want to update the look of the game. I have uploaded a tileset.png to assets/sprites. Please use this to create a very simple SIMPLE proceedurally generated background. Do NOT change any other code and do this the simplest way. Tell me first what youre gonna do - I'll help you create a simple procedurally generated background using the tileset.",
    "everything is now blank - Let me check if we need to instantiate the Background class in the main game file.",
    "still blank! - We need to make sure the Background class is actually being instantiated in the game.",
    "i think its main.js - Let me check main.",
    "it didnt work. also from now on dont ask to push to github ill tell you - I see the issue in main.",
    "this is what i see - I see the issue - the background is black because we need to update the camera's position and the background's z-position.",
    "everything is black it broke the game. why is a single tilesheet breaking the game? - Looking at the code, I see the issue.",
];

// Game variables
let camera, scene, renderer, controls;
let hallways = [];
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let font;

// Constants
const HALLWAY_LENGTH = 40;  // Longer segments for better performance
const HALLWAY_WIDTH = 10;
const HALLWAY_HEIGHT = 50;
const PLAYER_HEIGHT = 2;
const PLAYER_SPEED = 150.0;  // Increased for smoother movement
const SEGMENTS_IN_VIEW = 4;  // Keep 4 segments loaded at a time
const WALL_BOUNDARY = HALLWAY_WIDTH/2 - 0.5;

// Initialize the game
function init() {
    // Scene setup with fog
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 60, 100);  // Add fog for distance fade-out
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = PLAYER_HEIGHT;

    // Basic ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // Floor with repeating texture for movement perception
    const floorGeometry = new THREE.PlaneGeometry(HALLWAY_WIDTH, HALLWAY_LENGTH * SEGMENTS_IN_VIEW);
    const floorMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x808080,
        transparent: true,
        opacity: 0.5
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));  // Cap pixel ratio for performance
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Controls setup
    controls = new PointerLockControls(camera, document.body);

    // Automatically lock controls when game starts
    document.addEventListener('click', () => {
        controls.lock();
    });

    controls.addEventListener('unlock', () => {
        // Re-lock on next click
        document.addEventListener('click', () => {
            controls.lock();
        }, { once: true });
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);

    // Create initial hallway segments
    for (let i = 0; i < SEGMENTS_IN_VIEW; i++) {
        createHallwaySegment(i);
    }
}

function createHallwaySegment(index) {
    const segment = {
        walls: [],
        zPosition: index * HALLWAY_LENGTH
    };

    // Create walls with basic material
    const wallGeometry = new THREE.BoxGeometry(0.2, HALLWAY_HEIGHT, HALLWAY_LENGTH);
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-HALLWAY_WIDTH/2, HALLWAY_HEIGHT/2, segment.zPosition);
    segment.walls.push(leftWall);
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(HALLWAY_WIDTH/2, HALLWAY_HEIGHT/2, segment.zPosition);
    segment.walls.push(rightWall);
    scene.add(rightWall);

    // Add text to walls if font is loaded
    if (font) {
        // Calculate base text index for this segment
        const baseTextIndex = Math.abs(Math.floor(segment.zPosition / HALLWAY_LENGTH)) * 8;
        
        // Add 8 texts to each wall (more texts to fill the space)
        for (let i = 0; i < 8; i++) {
            // Left wall texts
            addTextToWall(leftWall, museumTexts[(baseTextIndex + i) % museumTexts.length], -1, i);
            // Right wall texts
            addTextToWall(rightWall, museumTexts[(baseTextIndex + i + 4) % museumTexts.length], 1, i);
        }
    }

    hallways.push(segment);
}

function addTextToWall(wall, text, side, textIndex) {
    // Split text into words and create lines of 5 words
    const words = text.split(' ');
    const lines = [];
    for (let i = 0; i < words.length; i += 5) {
        lines.push(words.slice(i, i + 5).join(' '));
    }

    // Create and position each line of text
    lines.forEach((line, lineIndex) => {
        const textGeometry = new TextGeometry(line, {
            font: font,
            size: 0.12,
            height: 0.01,
        });
        textGeometry.computeBoundingBox();
        
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        // Position text in a continuous strip
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        textMesh.position.set(
            side * -0.15,
            -(HALLWAY_HEIGHT/2) + PLAYER_HEIGHT + 0.5 - (lineIndex * 0.15), // Vertical position stays consistent
            -HALLWAY_LENGTH/2 + (HALLWAY_LENGTH * (textIndex/8)) // Evenly space across entire wall length
        );
        textMesh.rotation.y = -Math.PI/2 * side;
        wall.add(textMesh);
    });
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * PLAYER_SPEED * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * PLAYER_SPEED * delta;

        // Improved wall collision detection
        const nextX = camera.position.x - velocity.x * delta;
        const nextZ = camera.position.z - velocity.z * delta;
        
        // Calculate distances to walls after potential movement
        const distanceToLeftWall = nextX + WALL_BOUNDARY;
        const distanceToRightWall = WALL_BOUNDARY - nextX;
        
        // Check wall collisions with buffer zone
        const COLLISION_BUFFER = 0.1; // Small buffer to prevent wall touching
        
        let canMoveX = true;
        let canMoveZ = true;
        
        // Prevent X movement if too close to walls
        if (distanceToLeftWall < COLLISION_BUFFER || distanceToRightWall < COLLISION_BUFFER) {
            canMoveX = false;
            velocity.x = 0; // Stop horizontal momentum
        }
        
        // Apply allowed movement
        if (canMoveX) {
            controls.moveRight(-velocity.x * delta);
        }
        if (canMoveZ) {
            controls.moveForward(-velocity.z * delta);
        }

        // Enforce absolute boundaries (failsafe)
        if (Math.abs(camera.position.x) >= WALL_BOUNDARY) {
            camera.position.x = Math.sign(camera.position.x) * WALL_BOUNDARY;
            velocity.x = 0;
        }

        // Recycle hallway segments
        const cameraZ = camera.position.z;
        hallways.forEach((segment, index) => {
            const distanceFromCamera = segment.zPosition - cameraZ;
            
            // If segment is too far behind, move it to the front
            if (distanceFromCamera < -HALLWAY_LENGTH * 2) {
                const newPosition = segment.zPosition + (HALLWAY_LENGTH * SEGMENTS_IN_VIEW);
                segment.zPosition = newPosition;
                segment.walls.forEach(wall => {
                    wall.position.z = newPosition;
                    
                    // Update text on recycled segment
                    const textIndex = Math.abs(Math.floor(newPosition / HALLWAY_LENGTH)) % museumTexts.length;
                    // Remove old text
                    wall.children.forEach(child => wall.remove(child));
                    // Add new text
                    if (font) {
                        // Left wall gets current index, right wall gets next index
                        const isLeftWall = wall.position.x < 0;
                        addTextToWall(wall, museumTexts[isLeftWall ? textIndex : (textIndex + 1) % museumTexts.length], isLeftWall ? -1 : 1);
                    }
                });
            }
            
            // If segment is too far ahead, move it to the back
            if (distanceFromCamera > HALLWAY_LENGTH * 2) {
                const newPosition = segment.zPosition - (HALLWAY_LENGTH * SEGMENTS_IN_VIEW);
                segment.zPosition = newPosition;
                segment.walls.forEach(wall => {
                    wall.position.z = newPosition;
                    
                    // Update text on recycled segment
                    const textIndex = Math.abs(Math.floor(newPosition / HALLWAY_LENGTH)) % museumTexts.length;
                    // Remove old text
                    wall.children.forEach(child => wall.remove(child));
                    // Add new text
                    if (font) {
                        // Left wall gets current index, right wall gets next index
                        const isLeftWall = wall.position.x < 0;
                        addTextToWall(wall, museumTexts[isLeftWall ? textIndex : (textIndex + 1) % museumTexts.length], isLeftWall ? -1 : 1);
                    }
                });
            }
        });

        prevTime = time;
    }

    renderer.render(scene, camera);
}

// Load font and initialize game
const fontLoader = new FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(loadedFont) {
    font = loadedFont;
    init();
    animate();
    
    // Initialize audio with multiple approaches and fallbacks
    initAudio();
});

// Multiple approaches to ensure audio plays successfully
function initAudio() {
    console.log("Initializing audio system...");
    
    // Store status for debugging
    let audioStatus = {
        elementFound: false,
        playAttempted: false,
        playSucceeded: false,
        playError: null,
        redirectScheduled: false
    };
    
    // Get the audio element from the DOM
    const audioElement = document.getElementById('introVoice');
    if (!audioElement) {
        console.error("Audio element not found in the DOM!");
        return;
    }
    audioStatus.elementFound = true;
    
    // Get the button for manual playback
    const audioButton = document.getElementById('audioButton');
    if (audioButton) {
        // Hide button initially, show if autoplay fails
        audioButton.style.display = 'none';
        
        // Add click handler to the button
        audioButton.addEventListener('click', function() {
            console.log("Audio button clicked");
            playAudioWithElement(audioElement);
            audioButton.style.display = 'none'; // Hide after click
        });
    }
    
    // Helper function to actually play the audio
    function playAudioWithElement(element) {
        if (audioStatus.playSucceeded) {
            console.log("Audio already playing, not starting again");
            return;
        }
        
        console.log("Attempting to play audio...");
        audioStatus.playAttempted = true;
        
        // First check if the audio source is valid
        if (!element.src && element.getElementsByTagName('source').length === 0) {
            console.error("No audio source found!");
            audioStatus.playError = "No source";
            if (audioButton) {
                audioButton.style.display = 'block';
            }
            return;
        }
        
        // Enforce volume setting
        element.volume = 1.0;
        
        // Play with detailed error handling
        element.play()
            .then(() => {
                console.log("Audio playback started successfully!");
                audioStatus.playSucceeded = true;
                
                // Schedule the redirect only once we confirm audio is playing
                if (!audioStatus.redirectScheduled) {
                    scheduleRedirect();
                }
            })
            .catch(error => {
                console.error("Audio playback failed:", error);
                audioStatus.playError = error.message || "Unknown error";
                
                // Show the manual play button if autoplay fails
                if (audioButton) {
                    audioButton.style.display = 'block';
                }
                
                // Schedule redirect even if audio fails
                if (!audioStatus.redirectScheduled) {
                    scheduleRedirect();
                }
            });
    }
    
    // Schedule the redirect to visual novel
    function scheduleRedirect() {
        console.log("Scheduling redirect to visual novel...");
        audioStatus.redirectScheduled = true;
        
        // Redirect after 26 seconds
        setTimeout(() => {
            console.log("Redirecting to visual novel now");
            window.location.href = 'https://cursed-depths-3-de6de9e234ae.herokuapp.com/visual-novel/index.html';
        }, 26000);
    }
    
    // IMPORTANT: Try to play audio immediately on initialization
    console.log("Making initial attempt to play audio automatically...");
    playAudioWithElement(audioElement);
    
    // Try to play automatically after 4 seconds
    setTimeout(() => {
        console.log("4-second timer elapsed, attempting to play audio...");
        playAudioWithElement(audioElement);
    }, 4000);
    
    // Provide a global function for debugging
    window.debugAudioStatus = function() {
        console.log("Audio Status:", audioStatus);
        console.log("Audio Element:", audioElement);
        return audioStatus;
    };
    
    // Attempt to play when user interacts with the page
    document.addEventListener('click', function playOnInteraction() {
        console.log("User interaction detected, attempting to play audio...");
        playAudioWithElement(audioElement);
        document.removeEventListener('click', playOnInteraction);
    });
    
    // Also attempt to play on keydown if other methods fail
    document.addEventListener('keydown', function playOnKey(event) {
        if (!audioStatus.playSucceeded && (event.code === 'KeyW' || event.code === 'KeyA' || 
            event.code === 'KeyS' || event.code === 'KeyD')) {
            console.log("Key press detected, attempting to play audio...");
            playAudioWithElement(audioElement);
            document.removeEventListener('keydown', playOnKey);
        }
    });
} 