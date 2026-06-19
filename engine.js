import { MAP_SIZE, TILE_SIZE, T_WALL, T_FLOOR, T_DOOR, T_EXIT, T_PORTAL, T_MEGA_PORTAL, WORLDS } from './data.js';

export function createBlock(x, z, baseClass, innerHtml, container) {
    const faces = [ 
        { rx: 0, ry: 0, tz: TILE_SIZE/2 }, 
        { rx: 0, ry: 180, tz: TILE_SIZE/2 }, 
        { rx: 0, ry: 90, tz: TILE_SIZE/2 }, 
        { rx: 0, ry: -90, tz: TILE_SIZE/2 } 
    ];
    faces.forEach(f => {
        let face = document.createElement('div'); 
        face.className = baseClass; 
        if(innerHtml) face.innerHTML = innerHtml;
        face.style.transform = `translate3d(${x*TILE_SIZE}px, 0, ${z*TILE_SIZE}px) rotateY(${f.ry}deg) translateZ(${f.tz}px)`;
        container.appendChild(face);
    });
}

export function buildCSS3D(map, entities, player, selectedWorld) {
    let world = document.getElementById('world'); 
    world.innerHTML = ''; 
    let texClass = WORLDS[selectedWorld].tex;

    // Podłoga i Sufit 3D
    let floor = document.createElement('div');
    floor.className = `floor-plane ${texClass}-floor`;
    floor.style.transform = `translate3d(-5000px, ${TILE_SIZE/2}px, -5000px) rotateX(90deg)`;
    world.appendChild(floor);

    let ceil = document.createElement('div');
    ceil.className = `ceil-plane`;
    ceil.style.transform = `translate3d(-5000px, ${-TILE_SIZE/2}px, -5000px) rotateX(-90deg)`;
    world.appendChild(ceil);

    // RENDER DISTANCE = 5. (Rysuje tylko 5 bloków przed Tobą - 0 lagów na starych PC!)
    const RENDER_DIST = 5;

    for(let z = Math.max(0, player.z - RENDER_DIST); z <= Math.min(MAP_SIZE-1, player.z + RENDER_DIST); z++) {
        for(let x = Math.max(0, player.x - RENDER_DIST); x <= Math.min(MAP_SIZE-1, player.x + RENDER_DIST); x++) {
            let t = map[z][x];
            if(t !== T_FLOOR) {
                let cls = `wall ${t === T_WALL ? texClass : ''}`;
                let html = "";
                if(t === T_PORTAL || t === T_MEGA_PORTAL) { cls += ' tex-portal'; html = "<div class='wall-text'>WYMIAR</div>"; }
                if(t === T_EXIT) { cls += ' tex-exit'; html = "<div class='wall-text'>WYJŚCIE</div>"; }
                createBlock(x, z, cls, html, world);
            }
        }
    }

    entities.forEach(e => {
        if(Math.abs(e.x - player.x) <= RENDER_DIST && Math.abs(e.z - player.z) <= RENDER_DIST) {
            let s = document.createElement('div'); 
            s.className = 'sprite'; 
            s.innerHTML = e.sym; 
            s.id = `ent_${e.x}_${e.z}`;
            s.style.transform = `translate3d(${e.x*TILE_SIZE}px, 0, ${e.z*TILE_SIZE}px) rotateY(${-player.angle}deg)`;
            world.appendChild(s);
        }
    });

    updateCamera(player);
}

export function updateCamera(player) {
    let px = player.x * TILE_SIZE; 
    let pz = player.z * TILE_SIZE;
    
    // Kluczowa poprawka: Kamera się obraca, a World się przesuwa!
    document.getElementById('camera').style.transform = `translateZ(200px) rotateY(${-player.angle}deg)`;
    document.getElementById('world').style.transform = `translate3d(${-px}px, 0, ${-pz}px)`;
    
    document.querySelectorAll('.sprite').forEach(s => {
        let coords = s.id.split('_'); let ex = coords[1] * TILE_SIZE; let ez = coords[2] * TILE_SIZE;
        s.style.transform = `translate3d(${ex}px, 0, ${ez}px) rotateY(${player.angle}deg)`;
    });
}

export function drawMinimap(map, entities, player) {
    const canvas = document.getElementById('minimap');
    if(!canvas) return;
    const mCtx = canvas.getContext('2d');
    const W = canvas.width; 
    const TS = W / MAP_SIZE;
    
    mCtx.fillStyle = '#0a0a0f'; mCtx.fillRect(0, 0, W, W);
    for(let z=0; z<MAP_SIZE; z++) {
        for(let x=0; x<MAP_SIZE; x++) {
            if(map[z][x] === T_FLOOR) mCtx.fillStyle = '#334'; 
            else if(map[z][x]===T_EXIT) mCtx.fillStyle='#aaa'; 
            else if(map[z][x]===T_MEGA_PORTAL) mCtx.fillStyle='#0ff'; 
            else continue;
            mCtx.fillRect(x*TS, z*TS, TS+0.5, TS+0.5);
        }
    }
    entities.forEach(e => { mCtx.fillStyle = e.isEnemy ? '#f33' : '#fc0'; mCtx.fillRect(e.x*TS+1, e.z*TS+1, TS-2, TS-2); });
    
    mCtx.save(); 
    mCtx.translate(player.x * TS + TS/2, player.z * TS + TS/2); 
    mCtx.rotate(player.dir * Math.PI/2); 
    mCtx.fillStyle = '#5f5'; mCtx.beginPath(); 
    mCtx.moveTo(0, -TS/2); mCtx.lineTo(TS/2, TS/2); mCtx.lineTo(-TS/2, TS/2); mCtx.fill(); mCtx.restore();
}
