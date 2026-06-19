import { ITEM_DB, WEAPONS, ARMORS, BELTS, RECIPES, WORLDS, DIRS, MAP_SIZE, INV_SIZE, T_WALL, T_FLOOR, T_EXIT, T_MEGA_PORTAL, T_DOOR } from './data.js';
import { buildCSS3D, updateCamera, drawMinimap } from './engine.js';

// ==========================================
// STAN GRY
// ==========================================
let map = [], entities = [], logs = [];
let state = 'MENU', difficulty = 1, diffMult = 1.0;
let currentLevel = 1, selectedWorld = 'human';
let currentEnemy = null; window.monsterInterval = null;

let player = {
    x: 1, z: 1, dir: 1, angle: 90, hp: 100, maxHp: 100, lvl: 1, coins: 0, baseDmg: 5, baseArmor: 0,
    weapon: WEAPONS[0], armor: ARMORS[0], belt: BELTS[0],
    inventory: new Array(INV_SIZE).fill(null), selectedSlot: 0
};

window.logMsg = function(msg, type='log-new') { 
    logs.unshift(`<span class="${type}">• ${msg}</span><br>`); 
    if(logs.length > 7) logs.pop(); 
    document.getElementById('log-box').innerHTML = logs.join(''); 
};

window.closeOverlay = function(id) { state = 'EXPLORE'; document.getElementById(id).style.display = 'none'; };
window.openOverlay = function(id) { state = 'MENU'; document.getElementById(id).style.display = 'flex'; };

// ==========================================
// SYSTEM KONT
// ==========================================
const STORAGE_KEY = 'fo_multi_v1'; 
window.currentUser = null;

window.getAccounts = function() { 
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) { return {}; }
};
window.saveAccounts = function(accs) { localStorage.setItem(STORAGE_KEY, JSON.stringify(accs)); };

window.registerAccount = function() {
    let u = document.getElementById('acc-username').value.trim();
    let p = document.getElementById('acc-password').value.trim();
    if(u.length < 3 || p.length < 3) { alert("Login i Hasło muszą mieć min. 3 znaki!"); return; }
    
    let accs = window.getAccounts();
    if(accs[u]) { alert("Konto o takiej nazwie już istnieje!"); return; }
    
    accs[u] = { password: p, saveGame: null };
    window.saveAccounts(accs); 
    alert("Konto zostało pomyślnie utworzone. Logowanie...");
    window.loginAccount();
};

window.loginAccount = function() {
    let u = document.getElementById('acc-username').value.trim();
    let p = document.getElementById('acc-password').value.trim();
    let accs = window.getAccounts();
    
    if(accs[u] && accs[u].password === p) {
        window.currentUser = u;
        document.getElementById('login-screen').style.display = 'none'; 
        document.getElementById('main-menu').style.display = 'flex';
        document.getElementById('logged-user-name').innerText = window.currentUser;
    } else { alert("Błędny login lub hasło!"); }
};

window.logoutAccount = function() {
    clearInterval(window.monsterInterval);
    window.currentUser = null; 
    document.getElementById('main-menu').style.display = 'none'; 
    document.getElementById('login-screen').style.display = 'flex';
};

window.saveGame = function() {
    if(!window.currentUser) return;
    const gameState = { player, map, entities, currentLevel, selectedWorld, difficulty, diffMult, logs };
    let accs = window.getAccounts(); 
    accs[window.currentUser].saveGame = gameState; 
    window.saveAccounts(accs);
    window.logMsg(`💾 Zapisano grę!`, "log-epic");
};

window.loadGame = function() {
    if(!window.currentUser) return;
    let accs = window.getAccounts(); let s = accs[window.currentUser].saveGame;
    if(!s) { alert(`Brak zapisu dla tego konta!`); return; }
    
    player = s.player; map = s.map; entities = s.entities; currentLevel = s.currentLevel; 
    selectedWorld = s.selectedWorld; difficulty = s.difficulty; diffMult = s.diffMult; logs = s.logs || [];
    
    document.getElementById('main-menu').style.display = 'none';
    window.startEngine(false);
    window.logMsg(`💾 Wczytano grę z chmury.`, "log-epic");
};

// ==========================================
// EKWIPUNEK
// ==========================================
window.getInventoryCount = function(id) { return player.inventory.filter(i => i && i.id === id).reduce((sum, i) => sum + i.count, 0); };

window.removeInventoryItem = function(id, amount) {
    let remaining = amount;
    for(let i = player.inventory.length - 1; i >= 0; i--) {
        if(player.inventory[i] && player.inventory[i].id === id) {
            if(player.inventory[i].count >= remaining) {
                player.inventory[i].count -= remaining;
                if(player.inventory[i].count === 0) player.inventory[i] = null;
                window.updateInventoryUI(); return true;
            } else { remaining -= player.inventory[i].count; player.inventory[i] = null; }
        }
    } return false;
};

window.addToInventory = function(id, amount) {
    let maxStack = player.belt.cap; let remaining = amount;
    for(let i=0; i<INV_SIZE; i++) {
        if(player.inventory[i] && player.inventory[i].id === id && player.inventory[i].count < maxStack) {
            let space = maxStack - player.inventory[i].count;
            if(remaining <= space) { player.inventory[i].count += remaining; window.updateInventoryUI(); return true; }
            else { player.inventory[i].count = maxStack; remaining -= space; }
        }
    }
    for(let i=0; i<INV_SIZE; i++) {
        if(!player.inventory[i]) {
            if(remaining <= maxStack) { player.inventory[i] = {id: id, count: remaining}; window.updateInventoryUI(); return true; }
            else { player.inventory[i] = {id: id, count: maxStack}; remaining -= maxStack; }
        }
    }
    window.logMsg("Plecak pełny!", "log-dmg"); return false;
};

window.updateInventoryUI = function() {
    let hotbarHTML = ''; let mainHTML = '';
    for(let i=0; i<INV_SIZE; i++) {
        let item = player.inventory[i];
        let sym = item ? ITEM_DB[item.id].sym : '';
        let cnt = item ? `<div class="inv-count">${item.count}</div>` : '';
        let html = `<div class="inv-slot ${i === player.selectedSlot ? 'active' : ''}" onclick="window.selectSlot(${i})">${sym}${cnt}</div>`;
        if(i < 9) hotbarHTML += html; else mainHTML += html;
    }
    document.getElementById('inv-hotbar').innerHTML = hotbarHTML;
    document.getElementById('inv-grid-main').innerHTML = mainHTML;
};

window.selectSlot = function(idx) {
    player.selectedSlot = idx;
    let item = player.inventory[idx];
    if(item && ITEM_DB[item.id].type === 'use') {
        ITEM_DB[item.id].action(player);
        item.count--; if(item.count <= 0) player.inventory[idx] = null;
    } else if(item) { window.logMsg(`Wybrano: ${ITEM_DB[item.id].name}`); }
    window.updateInventoryUI(); window.updateHUD();
};

// ==========================================
// SILNIK I START GRY
// ==========================================
window.startGameSingle = function() {
    document.getElementById('main-menu').style.display = 'none';
    difficulty = parseInt(document.getElementById('diff-selector').value);
    diffMult = (difficulty === 2) ? 1.5 : (difficulty === 3 ? 2.0 : 1.0);

    player.hp = 100; player.maxHp = 100; player.coins = 0; 
    player.weapon = WEAPONS[0]; player.armor = ARMORS[0]; player.belt = BELTS[0];
    player.inventory.fill(null);
    window.addToInventory('pot', 2); window.addToInventory('bomb', 1);
    
    window.startEngine(true);
};

window.startEngine = function(isNewGame = false) {
    document.getElementById('game-view').style.display = 'block';
    state = 'EXPLORE';
    if(isNewGame || map.length === 0) window.generateLevel(); 
    else { buildCSS3D(map, entities, player, selectedWorld); drawMinimap(map, entities, player); window.updateInventoryUI(); }
    window.updateHUD();

    clearInterval(window.monsterInterval);
    if(difficulty > 1) {
        let speed = difficulty === 3 ? 1000 : 2000;
        window.monsterInterval = setInterval(() => {
            if(state === 'EXPLORE') { window.moveMonstersRealTime(); }
        }, speed);
        window.logMsg("Potwory aktywne w czasie rzeczywistym!", "log-dmg");
    }
};

window.generateLevel = function() {
    map = []; entities = [];
    for(let z=0; z<MAP_SIZE; z++) { map[z] = []; for(let x=0; x<MAP_SIZE; x++) map[z][x] = T_WALL; }
    player.x = Math.floor(MAP_SIZE/2); player.z = Math.floor(MAP_SIZE/2); map[player.z][player.x] = T_FLOOR;

    let floorCount = 0;
    while(floorCount < 180) {
        let d = Math.floor(Math.random()*4);
        if(d===0 && player.z>2) player.z--; else if(d===1 && player.z<MAP_SIZE-3) player.z++;
        else if(d===2 && player.x>2) player.x--; else if(d===3 && player.x<MAP_SIZE-3) player.x++;
        if(map[player.z][player.x] === T_WALL) { map[player.z][player.x] = T_FLOOR; floorCount++; }
    }

    player.x = Math.floor(MAP_SIZE/2); player.z = Math.floor(MAP_SIZE/2); player.dir = 0; player.angle = 0;

    let empty = () => { while(true) { let x=Math.floor(Math.random()*MAP_SIZE), z=Math.floor(Math.random()*MAP_SIZE); if(map[z][x]===T_FLOOR && (x!==player.x||z!==player.z)) return {x,z}; } };
    
    let ex = empty(); map[ex.z][ex.x] = T_EXIT;
    let pm = empty(); map[pm.z][pm.x] = T_MEGA_PORTAL;

    for(let i=0; i<3; i++) { let p=empty(); entities.push({x:p.x, z:p.z, sym: '🧪', id: 'pot'}); }
    for(let i=0; i<4; i++) { let p=empty(); entities.push({x:p.x, z:p.z, sym: '🪵', id: 'wood'}); }
    for(let i=0; i<3; i++) { let p=empty(); entities.push({x:p.x, z:p.z, sym: '⛓️', id: 'steel'}); }

    let wData = WORLDS[selectedWorld];
    let mCount = 4 + currentLevel;
    for(let i=0; i<mCount; i++) {
        let p = empty(); let mob = wData.mobs[Math.floor(Math.random()*wData.mobs.length)];
        entities.push({x:p.x, z:p.z, sym: mob.s, isEnemy: true, name: mob.n, hp: mob.hp*diffMult, maxHp: mob.hp*diffMult, dmg: mob.d*diffMult});
    }

    buildCSS3D(map, entities, player, selectedWorld); drawMinimap(map, entities, player); window.updateInventoryUI();
};

window.updateHUD = function() {
    document.getElementById('ui-hp').innerText = Math.floor(player.hp);
    document.getElementById('ui-maxhp').innerText = player.maxHp;
    document.getElementById('ui-coins').innerText = player.coins;
    document.getElementById('ui-dlvl').innerText = currentLevel;
    document.getElementById('ui-worldname').innerText = WORLDS[selectedWorld].title;
    
    document.getElementById('ch-wep').innerText = player.weapon.name;
    document.getElementById('ch-arm').innerText = player.armor.name;
    document.getElementById('ch-belt').innerText = `${player.belt.name} (Max x${player.belt.cap})`;
};

// ==========================================
// RUCH I GONITWA
// ==========================================
window.moveMonstersRealTime = function() {
    let combatTriggered = false;
    entities.forEach(e => {
        if(e.isEnemy) { 
            let dx = Math.sign(player.x - e.x); let dz = Math.sign(player.z - e.z);
            if(Math.random() > 0.3) { 
                let targetZ = map[e.z];
                if(targetZ && Math.random()>0.5 && dx!==0 && targetZ[e.x+dx]===T_FLOOR && !(e.x+dx===player.x && e.z===player.z)) e.x += dx;
                else {
                    let targetZPlus = map[e.z+dz];
                    if(targetZPlus && dz!==0 && targetZPlus[e.x]===T_FLOOR && !(e.x===player.x && e.z+dz===player.z)) e.z += dz;
                }
            }
            if(e.x === player.x && e.z === player.z) { currentEnemy = e; combatTriggered = true; }
        }
    });
    if(combatTriggered && state === 'EXPLORE') {
        state = 'COMBAT'; window.openOverlay('combat-overlay');
        document.getElementById('c-enemy-name').innerText = currentEnemy.name; document.getElementById('enemy-sprite').innerText = currentEnemy.sym;
        window.updateCombatUI();
    } else if (state === 'EXPLORE') { buildCSS3D(map, entities, player, selectedWorld); drawMinimap(map, entities, player); }
};

window.movePlayer = function(moveType) {
    if(state !== 'EXPLORE') return;
    if(moveType === 'LEFT') { player.dir = (player.dir + 3) % 4; player.angle -= 90; }
    if(moveType === 'RIGHT') { player.dir = (player.dir + 1) % 4; player.angle += 90; }
    
    if(moveType === 'FORWARD' || moveType === 'BACK') {
        let vec = DIRS[player.dir]; let sign = moveType === 'FORWARD' ? 1 : -1;
        let nx = player.x + vec.dx * sign; let nz = player.z + vec.dz * sign;
        
        let t = map[nz][nx];
        if(t !== T_WALL && t !== T_DOOR) {
            if(t === T_EXIT) { currentLevel++; window.generateLevel(); return; }
            if(t === T_MEGA_PORTAL) { window.openOverlay('portal-overlay'); return; }

            player.x = nx; player.z = nz;
            let cam = document.getElementById('camera'); cam.classList.remove('head-bob'); void cam.offsetWidth; cam.classList.add('head-bob');

            let entIdx = entities.findIndex(e => e.x === nx && e.z === nz);
            if(entIdx !== -1) {
                let e = entities[entIdx];
                if(!e.isEnemy) {
                    if(window.addToInventory(e.id, 1)) { window.logMsg(`Zebrałeś: ${ITEM_DB[e.id].name}`); entities.splice(entIdx, 1); buildCSS3D(map, entities, player, selectedWorld); }
                } else {
                    currentEnemy = e; window.openOverlay('combat-overlay');
                    document.getElementById('c-enemy-name').innerText = currentEnemy.name; document.getElementById('enemy-sprite').innerText = currentEnemy.sym;
                    window.updateCombatUI(); return;
                }
            }
        }
    }
    updateCamera(player); drawMinimap(map, entities, player);
};

// ==========================================
// KOWAL I PORTALE
// ==========================================
window.openCrafting = function() {
    window.openOverlay('crafting-overlay');
    let c = document.getElementById('craft-container'); c.innerHTML = '';
    RECIPES.forEach((r, idx) => {
        let reqStr = Object.entries(r.req).map(([k, v]) => `${ITEM_DB[k].name}:${v}`).join(', ');
        c.innerHTML += `<div style="background:#223; padding:10px; border-radius:6px; border:1px solid #445; font-size:12px; cursor:pointer;" onclick="window.craft(${idx})"><b style="color:#0ff;">${r.name}</b><br><span style="color:#aaa;">Wymaga: ${reqStr}</span></div>`;
    });
};

window.craft = function(idx) {
    let r = RECIPES[idx]; let canCraft = true;
    for(let key in r.req) { if(window.getInventoryCount(key) < r.req[key]) canCraft = false; }
    if(canCraft) {
        for(let key in r.req) { window.removeInventoryItem(key, r.req[key]); }
        r.action(player); window.openCrafting(); window.updateHUD();
    } else { window.logMsg("Brakuje surowców w plecaku!", "log-dmg"); }
};

window.travelToWorld = function(wId) {
    selectedWorld = wId; currentLevel++; 
    window.logMsg(`Przeszedłeś do innego wymiaru!`, "log-epic"); 
    window.closeOverlay('portal-overlay'); window.generateLevel(); 
};

// ==========================================
// WALKA
// ==========================================
window.updateCombatUI = function() {
    document.getElementById('c-enemy-hp-bar').style.width = Math.max(0, (currentEnemy.hp / currentEnemy.maxHp) * 100) + '%'; 
    document.getElementById('c-player-hp-bar').style.width = Math.max(0, (player.hp / player.maxHp) * 100) + '%'; 
    document.getElementById('c-player-hp-text').innerText = Math.floor(player.hp); 
};

window.combatAction = function(action) {
    let dmg = player.baseDmg + player.weapon.dmg; let arm = player.baseArmor + player.armor.def;

    if(action === 'Zwykly') { currentEnemy.hp -= dmg; window.logMsg(`Zadajesz ${dmg} obr.`); }
    if(action === 'Silny') { if(Math.random()<0.5) { currentEnemy.hp -= dmg*2; window.logMsg(`KRYTYK! ${dmg*2} obr!`, "log-epic"); } else window.logMsg("Pudło!", "log-dmg"); }
    if(action === 'Bomba') { if(window.removeInventoryItem('bomb', 1)) { currentEnemy.hp -= 100; window.logMsg("BUM! 100 obr!"); } else { window.logMsg("Brak bomb!"); return; } }
    if(action === 'Mikstura') { if(window.removeInventoryItem('pot', 1)) { player.hp = Math.min(player.maxHp, player.hp+50); window.logMsg("Leczysz się."); } else return; }
    if(action === 'Ucieczka') { if(Math.random()<0.6) { window.closeOverlay('combat-overlay'); return; } else window.logMsg("Ucieczka nieudana!", "log-dmg"); }

    if(currentEnemy.hp <= 0) {
        window.logMsg(`Zwycięstwo! Zyskujesz 25 monet.`, "log-heal"); player.coins += 25;
        entities.splice(entities.findIndex(e => e === currentEnemy), 1);
        window.closeOverlay('combat-overlay'); currentEnemy = null; buildCSS3D(map, entities, player, selectedWorld); drawMinimap(map, entities, player); window.updateHUD(); return;
    }

    let enemyDmg = Math.max(1, (currentEnemy.dmg + Math.floor(Math.random()*5)) - arm); 
    player.hp -= enemyDmg; window.logMsg(`Otrzymujesz ${enemyDmg} obr!`, "log-dmg"); 
    
    if(player.hp <= 0) { player.hp = 0; window.logMsg("💀 ZGINĄŁEŚ!", "log-dmg"); clearInterval(window.monsterInterval); alert("Koniec Gry! Odśwież stronę."); location.reload(); }
    window.updateCombatUI(); window.updateHUD();
};

// ==========================================
// KLAWIATURA
// ==========================================
window.addEventListener('keydown', (e) => {
    let k = e.key.toLowerCase();
    if(state === 'EXPLORE') {
        if(k === 'w' || e.code === 'ArrowUp') window.movePlayer('FORWARD');
        if(k === 's' || e.code === 'ArrowDown') window.movePlayer('BACK');
        if(k === 'a' || e.code === 'ArrowLeft') window.movePlayer('LEFT');
        if(k === 'd' || e.code === 'ArrowRight') window.movePlayer('RIGHT');
        if(k === 'e') window.openOverlay('inventory-overlay');
        if(!isNaN(k) && k > 0 && k <= 9) window.selectSlot(k - 1);
    } else if (k === 'e' && state === 'MENU') {
        window.closeOverlay('inventory-overlay'); window.closeOverlay('crafting-overlay'); window.closeOverlay('portal-overlay');
    }
});
