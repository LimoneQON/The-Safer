import { WORLDS, DIRS } from './data.js';

export function draw3D(ctx, player, map, entities, selectedWorld, currentBiomeIndex, savedMainMap, isMultiplayer, otherPlayer) {
    const T_WALL = 1, T_DOOR = 2, T_EXIT = 3, T_PORTAL = 4, T_MEGA_PORTAL = 5;
    let b = savedMainMap ? WORLDS[selectedWorld].biomes[0] : WORLDS[selectedWorld].biomes[currentBiomeIndex]; 
    ctx.fillStyle = b.floor; ctx.fillRect(0, 240, 600, 240); 
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, 600, 240); 

    const polyOffsets = [ {w: 600, h: 480, y: 0}, {w: 360, h: 288, y: 96}, {w: 180, h: 144, y: 168}, {w: 80, h: 64, y: 208}, {w: 20, h: 16, y: 232} ];
    let forward = DIRS[player.dir], right = DIRS[(player.dir + 1) % 4], left = DIRS[(player.dir + 3) % 4];

    for(let d = 3; d >= 0; d--) {
        let tx = player.x + forward.dx * d; let ty = player.y + forward.dy * d;
        let pCurrent = polyOffsets[d], pNext = polyOffsets[d+1]; let cxCurrent = 300, cyCurrent = 240;
        let getTile = (vx, vy) => (map[vy] && map[vy][vx] !== undefined) ? map[vy][vx] : T_WALL;
        let tileFront = getTile(tx, ty), tileLeft = getTile(tx + left.dx, ty + left.dy), tileRight = getTile(tx + right.dx, ty + right.dy);

        const drawWallSide = (isLeft, color) => {
            let x1 = isLeft ? (cxCurrent - pCurrent.w/2) : (cxCurrent + pCurrent.w/2); let x2 = isLeft ? (cxCurrent - pNext.w/2) : (cxCurrent + pNext.w/2);
            ctx.beginPath(); ctx.moveTo(x1, cyCurrent - pCurrent.h/2); ctx.lineTo(x2, cyCurrent - pNext.h/2);
            ctx.lineTo(x2, cyCurrent + pNext.h/2); ctx.lineTo(x1, cyCurrent + pCurrent.h/2); ctx.fillStyle = color; ctx.fill(); ctx.stroke();
        };

        if(tileLeft === T_WALL) drawWallSide(true, b.wall); if(tileRight === T_WALL) drawWallSide(false, b.wall);
        
        if(tileFront === T_WALL || tileFront === T_DOOR || tileFront === T_EXIT || tileFront === T_PORTAL || tileFront === T_MEGA_PORTAL) {
            let wx = cxCurrent - pCurrent.w/2, wy = cyCurrent - pCurrent.h/2;
            if(tileFront === T_DOOR) ctx.fillStyle = b.door; else if(tileFront === T_EXIT) ctx.fillStyle = '#888'; else if(tileFront === T_PORTAL) ctx.fillStyle = '#aa00ff'; else if(tileFront === T_MEGA_PORTAL) ctx.fillStyle = '#00ffff'; else ctx.fillStyle = b.wall;
            ctx.fillRect(wx, wy, pCurrent.w, pCurrent.h); ctx.strokeRect(wx, wy, pCurrent.w, pCurrent.h);
            if(tileFront === T_EXIT) { ctx.fillStyle = '#fff'; ctx.font = `bold ${pCurrent.h/5}px Verdana`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(b.exitText, cxCurrent, cyCurrent); }
        } else {
            ctx.beginPath(); ctx.moveTo(cxCurrent - pCurrent.w/2, cyCurrent + pCurrent.h/2); ctx.lineTo(cxCurrent + pCurrent.w/2, cyCurrent + pCurrent.h/2); ctx.lineTo(cxCurrent + pNext.w/2, cyCurrent + pNext.h/2); ctx.lineTo(cxCurrent - pNext.w/2, cyCurrent + pNext.h/2); ctx.fillStyle = (d%2===0)?'rgba(0,0,0,0.2)':'rgba(0,0,0,0.5)'; ctx.fill();
            let ent = entities.find(e => e.x === tx && e.y === ty);
            if(ent) { ctx.font = `${pCurrent.h * 0.7}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(ent.symbol, cxCurrent, cyCurrent + pCurrent.h/2 + 5); }
            if(isMultiplayer && otherPlayer && otherPlayer.x === tx && otherPlayer.y === ty) { ctx.font = `${pCurrent.h * 0.7}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText("🧙‍♂️", cxCurrent, cyCurrent + pCurrent.h/2 + 5); }
        }
    }
}
