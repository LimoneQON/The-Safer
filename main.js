import { ITEM_DB, WEAPONS, ARMORS, BELTS, RECIPES, MOBS, MAP_SIZE, INV_SIZE } from './data.js';
import { render3D, drawMinimap } from './engine.js';

// --- STAN GRY I DANE ---
let map = [], entities = [], logs = [];
let state = 'MENU', difficulty = 1;
let currentLevel = 1, currentEnemy = null;
let keys = {w:false, a:false, s:false, d:false};

// Matematyka dla Raycastera
let player = {
    x: 1.5, y: 1.5, 
    dirX: -1, dirY: 0, 
    planeX: 0, planeY: 0.66, 
    hp: 100, maxHp: 100, coins: 0, baseDmg: 0, baseArmor: 0,
    weapon: WEAPONS[0], armor: ARMORS[0], belt: BELTS[0],
    inventory: new Array(INV_SIZE).fill(null), selectedSlot: 0
};

const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const miniCanvas = document.getElementById('minimap');
const mCtx = miniCanvas.getContext('2d');

// --- SYSTEM LOGOWANIA ---
const STORAGE_KEY = 'fo_raycaster_v1';
let currentUser = null;

function getAccs() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) { return {}; } }
function saveAccs(accs) { localStorage.setItem(STORAGE_KEY, JSON.stringify(accs)); }

function logMsg(msg, type='log-new') { logs.unshift(`<span class="${type}">• ${msg}</span><br>`); if(logs.length > 7) logs.pop(); document.getElementById('log-box').innerHTML = logs.join(''); }

// BINDOWANIE ZDARZEŃ (Naprawia 'is not a function')
document.getElementById('btn-register').addEventListener('click', () => {
    let u = document.getElementById('acc-username').value.trim(); let p = document.getElementById('acc-password').value.trim();
    if(u.length < 3) { alert("Login za krótki!"); return; }
    let accs = getAccs(); if(accs[u]) { alert("Konto istnieje!"); return; }
    accs[u] = { password: p, saveGame: null }; saveAccs(accs); 
    alert("Konto utworzone!"); document.getElementById('btn-login').click();
});

document.getElementById('btn-login').addEventListener('click', () => {
    let u = document.getElementById('acc-username').value.trim(); let p = document.getElementById('acc-password').value.trim();
    let accs = getAccs();
    if(accs[u] && accs[u].password === p) {
        currentUser = u;
        document.getElementById('login-screen').style.display = 'none'; 
        document.getElementById('main-menu').style.display = 'flex';
        document.getElementById('logged-user-name').innerText = currentUser;
    } else { alert("Błędny login/hasło!"); }
});

document.getElementById('btn-logout').addEventListener('click', () => location.reload());

// --- ZAPIS GRY ---
document.getElementById('btn-save-game').addEventListener('click', () => {
    if(!currentUser) return;
    let accs = getAccs(); accs[currentUser].saveGame = { player, map, entities, currentLevel, logs }; saveAccs(accs);
    logMsg(`💾 Zapisano grę!`, "log-epic");
});

document.getElementById('btn-load').addEventListener('click', () => {
    if(!currentUser) return;
    let accs = getAccs(); let s = accs[currentUser].saveGame;
    if(!s) { alert(`Brak zapisu!`); return; }
    player = s.player; map = s.map; entities = s.entities; currentLevel = s.currentLevel; logs = s.logs || [];
    document.getElementById('main-menu').style.display = 'none'; document.getElementById('game-view').style.display = 'block';
    document.getElementById('weapon-view').innerText = player.weapon.sym;
    state = 'EXPLORE'; requestAnimationFrame(gameLoop); logMsg(`💾 Wczytano grę.`, "log-epic");
});

// --- INVENTORY ---
function getInvCount(id) { return player.inventory.filter(i => i && i.id === id).reduce((sum, i) => sum + i.count, 0); }
function removeInv(id, amount) {
    let rem = amount;
    for(let i = player.inventory.length - 1; i >= 0; i--) {
        if(player.inventory[i] && player.inventory[i].id === id) {
            if(player.inventory[i].count >= rem) { player.inventory[i].count -= rem; if(player.inventory[i].count === 0) player.inventory[i] = null; updateInventoryUI(); return true; } 
            else { rem -= player.inventory[i].count; player.inventory[i] = null; }
        }
    } return false;
}
function addToInventory(id, amount) {
    let maxStack = player.belt.cap; let rem = amount;
    for(let i=0; i<INV_SIZE; i++) {
        if(player.inventory[i] && player.inventory[i].id === id && player.inventory[i].count < maxStack) {
            let space = maxStack - player.inventory[i].count;
            if(rem <= space) { player.inventory[i].count += rem; updateInventoryUI(); return true; } else { player.inventory[i].count = maxStack; rem -= space; }
        }
    }
    for(let i=0; i<INV_SIZE; i++) {
        if(!player.inventory[i]) {
            if(rem <= maxStack) { player.inventory[i] = {id: id, count: rem}; updateInventoryUI(); return true; } else { player.inventory[i] = {id: id, count: maxStack}; rem -= maxStack; }
        }
    }
    logMsg("Plecak pełny!", "log-dmg"); return false;
}

function selectSlot(idx) {
    player.selectedSlot = idx; let item = player.inventory[idx];
    if(item && ITEM_DB[item.id].use) { 
        ITEM_DB[item.id].use(player); item.count--; if(item.count <= 0) player.inventory[idx] = null; 
    } else if(item) { logMsg(`Wybrano: ${ITEM_DB[item.id].name}`); }
    updateInventoryUI(); updateHUD();
}

function updateInventoryUI() {
    let hotbarHTML = ''; let mainHTML = '';
    for(let i=0; i<INV_SIZE; i++) {
        let item = player.inventory[i]; let sym = item ? ITEM_DB[item.id].sym : ''; let cnt = item ? `<div class="inv-count">${item.count}</div>` : '';
        let html = `<div class="inv-slot ${i === player.selectedSlot ? 'active' : ''}" data-idx="${i}">${sym}${cnt}</div>`;
        if(i < 9) hotbarHTML += html; else mainHTML += html;
    }
    document.getElementById('inv-hotbar').innerHTML = hotbarHTML; document.getElementById('inv-grid-main').innerHTML = mainHTML;
    document.querySelectorAll('.inv-slot').forEach(el => el.addEventListener('click', function() { selectSlot(parseInt(this.getAttribute('data-idx'))); }));
}

// --- GENEROWANIE I SILNIK ---
document.getElementById('btn-new-game').addEventListener('click', () => {
    document.getElementById('main-menu').style.display = 'none'; document.getElementById('game-view').style.display = 'block';
    difficulty = parseInt(document.getElementById('diff-selector').value);
    player.hp = 100; player.inventory.fill(null); addToInventory('pot', 2); document.getElementById('weapon-view').innerText = player.weapon.sym; 
    generateLevel(); state = 'EXPLORE'; requestAnimationFrame(gameLoop);
});

function generateLevel() {
    map = []; entities = [];
    for(let y=0; y<MAP_SIZE; y++) { map[y] = []; for(let x=0; x<MAP_SIZE; x++) map[y][x] = 1; }
    player.x = Math.floor(MAP_SIZE/2) + 0.5; player.y = Math.floor(MAP_SIZE/2) + 0.5; map[Math.floor(player.y)][Math.floor(player.x)] = 0;

    let floorCount = 0; let cx = Math.floor(player.x), cy = Math.floor(player.y);
    while(floorCount < 150) {
        let d = Math.floor(Math.random()*4);
        if(d===0 && cy>2) cy--; else if(d===1 && cy<MAP_SIZE-3) cy++; else if(d===2 && cx>2) cx--; else if(d===3 && cx<MAP_SIZE-3) cx++;
        if(map[cy][cx] === 1) { map[cy][cx] = 0; floorCount++; }
    }
    let empty = () => { while(true) { let x=Math.floor(Math.random()*MAP_SIZE), y=Math.floor(Math.random()*MAP_SIZE); if(map[y][x]===0 && (x!==Math.floor(player.x)||y!==Math.floor(player.y))) return {x,y}; } };
    let ex = empty(); map[ex.y][ex.x] = 3;
    
    for(let i=0; i<4; i++) { let p=empty(); entities.push({x:p.x+0.5, y:p.y+0.5, sym: '🧪', id: 'pot'}); }
    for(let i=0; i<6; i++) { let p=empty(); entities.push({x:p.x+0.5, y:p.y+0.5, sym: '🪵', id: 'wood'}); }
    for(let i=0; i<4; i++) { let p=empty(); entities.push({x:p.x+0.5, y:p.y+0.5, sym: '⛓️', id: 'steel'}); }
    for(let i=0; i<5+currentLevel; i++) { let p = empty(); let mob = MOBS[Math.floor(Math.random()*MOBS.length)]; entities.push({x:p.x+0.5, y:p.y+0.5, sym: mob.s, isEnemy: true, name: mob.n, hp: mob.hp, maxHp: mob.hp, dmg: mob.d}); }
    updateInventoryUI();
}

// --- PĘTLA GRY FPS ---
let isMoving = false; let lastTime = 0;
function gameLoop(time) {
    if(state === 'EXPLORE') {
        let dt = (time - lastTime) / 1000; lastTime = time; if(dt > 0.1) dt = 0.1; // Delta time fix
        
        let moveSpeed = 4.0 * dt; 
        let rotSpeed = 3.0 * dt;
        let moved = false;

        // Obrót kamery (A i D)
        if(keys.a) {
            let oldDirX = player.dirX; player.dirX = player.dirX * Math.cos(-rotSpeed) - player.dirY * Math.sin(-rotSpeed); player.dirY = oldDirX * Math.sin(-rotSpeed) + player.dirY * Math.cos(-rotSpeed);
            let oldPlaneX = player.planeX; player.planeX = player.planeX * Math.cos(-rotSpeed) - player.planeY * Math.sin(-rotSpeed); player.planeY = oldPlaneX * Math.sin(-rotSpeed) + player.planeY * Math.cos(-rotSpeed);
        }
        if(keys.d) {
            let oldDirX = player.dirX; player.dirX = player.dirX * Math.cos(rotSpeed) - player.dirY * Math.sin(rotSpeed); player.dirY = oldDirX * Math.sin(rotSpeed) + player.dirY * Math.cos(rotSpeed);
            let oldPlaneX = player.planeX; player.planeX = player.planeX * Math.cos(rotSpeed) - player.planeY * Math.sin(rotSpeed); player.planeY = oldPlaneX * Math.sin(rotSpeed) + player.planeY * Math.cos(rotSpeed);
        }
        
        // Ruch do przodu/tyłu z Kolizją
        if(keys.w) {
            if(map[Math.floor(player.y)][Math.floor(player.x + player.dirX * moveSpeed * 2.0)] === 0) player.x += player.dirX * moveSpeed;
            if(map[Math.floor(player.y + player.dirY * moveSpeed * 2.0)][Math.floor(player.x)] === 0) player.y += player.dirY * moveSpeed;
            moved = true;
        }
        if(keys.s) {
            if(map[Math.floor(player.y)][Math.floor(player.x - player.dirX * moveSpeed * 2.0)] === 0) player.x -= player.dirX * moveSpeed;
            if(map[Math.floor(player.y - player.dirY * moveSpeed * 2.0)][Math.floor(player.x)] === 0) player.y -= player.dirY * moveSpeed;
            moved = true;
        }

        // Animacja broni
        let wep = document.getElementById('weapon-view');
        if(moved && !isMoving) { wep.classList.add('walking-bob'); isMoving = true; } else if(!moved && isMoving) { wep.classList.remove('walking-bob'); isMoving = false; }

        // Portale/Wyjście
        if(map[Math.floor(player.y)][Math.floor(player.x)] === 3) { currentLevel++; generateLevel(); }

        // Zbieranie i Walka i Gonitwa
        for(let i = entities.length - 1; i >= 0; i--) {
            let e = entities[i]; let dist = Math.sqrt((player.x - e.x)**2 + (player.y - e.y)**2);
            if(dist < 0.6) {
                if(!e.isEnemy) { if(addToInventory(e.id, 1)) { logMsg(`Zebrałeś: ${ITEM_DB[e.id].name}`); entities.splice(i, 1); } } 
                else { 
                    currentEnemy = e; state = 'COMBAT'; document.getElementById('combat-overlay').style.display = 'flex'; 
                    document.getElementById('c-enemy-name').innerText = currentEnemy.name; document.getElementById('enemy-sprite').innerText = currentEnemy.sym; updateCombatUI(); 
                }
            }
            // Gonitwa
            if(difficulty === 2 && e.isEnemy && Math.random() < 0.03) {
                let dx = Math.sign(player.x - e.x)*0.1; let dy = Math.sign(player.y - e.y)*0.1;
                if(map[Math.floor(e.y)][Math.floor(e.x+dx)] === 0) e.x += dx;
                if(map[Math.floor(e.y+dy)][Math.floor(e.x)] === 0) e.y += dy;
            }
        }
        
        render3D(ctx, map, entities, player); drawMinimap(mCtx, map, entities, player);
    }
    requestAnimationFrame(gameLoop);
}

// --- KOWAL I UI ---
function updateHUD() {
    document.getElementById('ui-hp').innerText = Math.floor(player.hp); document.getElementById('ui-maxhp').innerText = player.maxHp;
    document.getElementById('ui-coins').innerText = player.coins; document.getElementById('ui-dlvl').innerText = currentLevel;
    document.getElementById('ch-wep').innerText = player.weapon.name; document.getElementById('ch-arm').innerText = player.armor.name; document.getElementById('ch-belt').innerText = `${player.belt.name} (Max x${player.belt.cap})`;
}

document.getElementById('btn-open-crafting').addEventListener('click', () => {
    document.getElementById('inventory-overlay').style.display = 'none'; document.getElementById('crafting-overlay').style.display = 'flex';
    let c = document.getElementById('craft-container'); c.innerHTML = '';
    RECIPES.forEach((r, idx) => {
        let reqStr = Object.entries(r.req).map(([k, v]) => `${ITEM_DB[k].name}:${v}`).join(', ');
        c.innerHTML += `<div style="background:#8b8b8b; color:#111; padding:10px; border:2px solid #373737; font-weight:bold; cursor:pointer;" data-idx="${idx}"><b>${r.name}</b><br><span style="font-size:11px;">${reqStr}</span></div>`;
    });
    c.querySelectorAll('div').forEach(el => el.addEventListener('click', function() {
        let r = RECIPES[this.getAttribute('data-idx')]; let canCraft = true;
        for(let key in r.req) { if(getInvCount(key) < r.req[key]) canCraft = false; }
        if(canCraft) { 
            for(let key in r.req) removeInv(key, r.req[key]); 
            if(r.type === 'belt') player.belt = BELTS[1];
            if(r.type === 'wep') { player.weapon = WEAPONS[r.val]; document.getElementById('weapon-view').innerText = player.weapon.sym; }
            if(r.type === 'arm') player.armor = ARMORS[r.val];
            if(r.type === 'item') addToInventory(r.id, 1);
            logMsg("Wykuto przedmiot!"); updateHUD();
        } else logMsg("Brak surowców!", "log-dmg");
    }));
});

document.getElementById('btn-close-inv').addEventListener('click', () => { state = 'EXPLORE'; document.getElementById('inventory-overlay').style.display = 'none'; keys={w:false,a:false,s:false,d:false}; });
document.getElementById('btn-close-crafting').addEventListener('click', () => { document.getElementById('crafting-overlay').style.display = 'none'; document.getElementById('inventory-overlay').style.display = 'flex'; });

function updateCombatUI() { document.getElementById('c-enemy-hp-bar').style.width = Math.max(0, (currentEnemy.hp / currentEnemy.maxHp) * 100) + '%'; document.getElementById('c-player-hp-bar').style.width = Math.max(0, (player.hp / player.maxHp) * 100) + '%'; document.getElementById('c-player-hp-text').innerText = Math.floor(player.hp); }

function combatAction(action) {
    let wep = document.getElementById('weapon-view'); wep.classList.add('attacking'); setTimeout(() => wep.classList.remove('attacking'), 200);
    let dmg = player.baseDmg + player.weapon.dmg; let arm = player.baseArmor + player.armor.def;
    if(action === 'Zwykly') { currentEnemy.hp -= dmg; logMsg(`Zadajesz ${dmg} obr.`); }
    if(action === 'Silny') { if(Math.random()<0.5) { currentEnemy.hp -= dmg*2; logMsg(`KRYTYK! ${dmg*2} obr!`, "log-epic"); } else logMsg("Pudło!", "log-dmg"); }
    if(action === 'Bomba') { if(removeInv('bomb', 1)) { currentEnemy.hp -= 100; logMsg("BUM! 100 obr!"); } else { logMsg("Brak bomb!"); return; } }
    if(action === 'Mikstura') { if(removeInv('pot', 1)) { player.hp = Math.min(player.maxHp, player.hp+50); logMsg("Leczysz się."); } else return; }
    
    if(currentEnemy.hp <= 0) { logMsg(`Zwycięstwo! +25 monet.`, "log-heal"); player.coins += 25; entities.splice(entities.indexOf(currentEnemy), 1); document.getElementById('combat-overlay').style.display = 'none'; state='EXPLORE'; currentEnemy = null; updateHUD(); return; }
    
    let enemyDmg = Math.max(1, (currentEnemy.dmg + Math.floor(Math.random()*5)) - arm); player.hp -= enemyDmg; logMsg(`Otrzymujesz ${enemyDmg} obr!`, "log-dmg"); 
    if(player.hp <= 0) { player.hp = 0; logMsg("💀 ZGINĄŁEŚ!"); alert("Zginąłeś!"); location.reload(); }
    updateCombatUI(); updateHUD();
}

document.getElementById('btn-combat-atk').addEventListener('click', () => combatAction('Zwykly'));
document.getElementById('btn-combat-str').addEventListener('click', () => combatAction('Silny'));
document.getElementById('btn-combat-heal').addEventListener('click', () => combatAction('Mikstura'));
document.getElementById('btn-combat-bomb').addEventListener('click', () => combatAction('Bomba'));

// --- KLAWIATURA I MYSZ ---
window.addEventListener('keydown', e => { 
    let k = e.key.toLowerCase(); if(keys.hasOwnProperty(k)) keys[k] = true; 
    if(k==='e' && state==='EXPLORE') { state='MENU'; document.getElementById('inventory-overlay').style.display = 'flex'; updateInventoryUI(); updateHUD(); keys={w:false,a:false,s:false,d:false};}
    else if(k==='e' && state==='MENU') { document.querySelectorAll('.overlay-ui').forEach(el=>el.style.display='none'); state='EXPLORE'; keys={w:false,a:false,s:false,d:false}; }
    if(!isNaN(k) && k>0 && k<=9 && state==='EXPLORE') selectSlot(k-1);
});
window.addEventListener('keyup', e => { let k = e.key.toLowerCase(); if(keys.hasOwnProperty(k)) keys[k] = false; });
window.addEventListener('mousedown', () => { if(state === 'EXPLORE') { let wep = document.getElementById('weapon-view'); wep.classList.add('attacking'); setTimeout(() => wep.classList.remove('attacking'), 200); }});

console.log("Silnik załadowany pomyślnie!");
