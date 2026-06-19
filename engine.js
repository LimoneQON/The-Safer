import { MAP_SIZE } from './data.js';

const texCanvas = document.createElement('canvas');
texCanvas.width = 64; texCanvas.height = 64;
const tCtx = texCanvas.getContext('2d');

function genTex(color1, color2) {
    tCtx.fillStyle = color1; tCtx.fillRect(0,0,64,64); tCtx.fillStyle = color2;
    for(let i=0; i<64; i+=16) { tCtx.fillRect(0, i, 64, 2); for(let j=0; j<64; j+=16) tCtx.fillRect(j + (i%32===0?0:8), i, 2, 16); }
}

export function render3D(ctx, map, entities, player, otherPlayer, isSafeZone) {
    const w = ctx.canvas.width; const h = ctx.canvas.height;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, w, h/2); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, h/2, w, h/2);

    if(isSafeZone) genTex('#2a4', '#152'); else genTex('#444', '#222'); // Inna ściana w Safe Zone!

    let zBuffer = new Array(w).fill(0);

    for(let x = 0; x < w; x++) {
        let cameraX = 2 * x / w - 1;
        let rayDirX = player.dirX + player.planeX * cameraX;
        let rayDirY = player.dirY + player.planeY * cameraX;

        let mapX = Math.floor(player.x); let mapY = Math.floor(player.y);
        let sideDistX, sideDistY;
        let deltaDistX = Math.abs(1 / rayDirX); let deltaDistY = Math.abs(1 / rayDirY);
        let perpWallDist; let stepX, stepY;
        let hit = 0, side = 0, hitType = 0;

        if(rayDirX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; }
        else { stepX = 1; sideDistX = (mapX + 1.0 - player.x) * deltaDistX; }
        if(rayDirY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; }
        else { stepY = 1; sideDistY = (mapY + 1.0 - player.y) * deltaDistY; }

        while(hit === 0) {
            if(sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
            else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
            if(map[mapY][mapX] > 0) { hit = 1; hitType = map[mapY][mapX]; }
        }

        if(side === 0) perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
        else perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;

        zBuffer[x] = perpWallDist;
        let lineHeight = Math.floor(h / perpWallDist);
        let drawStart = -lineHeight / 2 + h / 2;
        
        let wallX; if(side === 0) wallX = player.y + perpWallDist * rayDirY; else wallX = player.x + perpWallDist * rayDirX;
        wallX -= Math.floor(wallX);
        let texX = Math.floor(wallX * 64);
        if(side === 0 && rayDirX > 0) texX = 64 - texX - 1; if(side === 1 && rayDirY < 0) texX = 64 - texX - 1;

        ctx.drawImage(texCanvas, texX, 0, 1, 64, x, drawStart, 1, lineHeight);
        
        let shadow = (side === 1 ? 0.3 : 0.0) + Math.min(0.8, perpWallDist * 0.05);
        if(hitType === 3) ctx.fillStyle = `rgba(0, 255, 0, 0.4)`; // EXIT
        else if(hitType === 4) ctx.fillStyle = `rgba(0, 255, 255, 0.4)`; // PORTAL
        else ctx.fillStyle = `rgba(0, 0, 0, ${shadow})`;
        ctx.fillRect(x, drawStart, 1, lineHeight);
    }

    let drawEntities = [...entities];
    if(otherPlayer && otherPlayer.x) drawEntities.push({x: otherPlayer.x, y: otherPlayer.y, sym: '🧙‍♂️', isEnemy: false});

    drawEntities.sort((a,b) => ((player.x - b.x)**2 + (player.y - b.y)**2) - ((player.x - a.x)**2 + (player.y - a.y)**2)).forEach(e => {
        let spriteX = e.x - player.x; let spriteY = e.y - player.y;
        let invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        let transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
        let transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);

        if(transformY > 0.1) {
            let spriteScreenX = Math.floor((w / 2) * (1 + transformX / transformY));
            let spriteHeight = Math.abs(Math.floor(h / transformY));
            if(spriteScreenX > -spriteHeight/2 && spriteScreenX < w + spriteHeight/2 && transformY < zBuffer[spriteScreenX]) {
                ctx.font = `${spriteHeight * 0.8}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.shadowColor = e.isNPC ? 'rgba(0,255,255,0.8)' : 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
                ctx.fillText(e.sym, spriteScreenX, h/2); ctx.shadowBlur = 0; 
            }
        }
    });
}

export function drawMinimap(ctx, map, entities, player, otherPlayer) {
    const W = ctx.canvas.width; const TS = W / MAP_SIZE;
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, W);
    for(let y=0; y<MAP_SIZE; y++) {
        for(let x=0; x<MAP_SIZE; x++) {
            if(map[y][x] === 0) ctx.fillStyle = '#334'; else if(map[y][x]===3) ctx.fillStyle='#0f0'; else if(map[y][x]===4) ctx.fillStyle='#0ff'; else continue;
            ctx.fillRect(x*TS, y*TS, TS+1, TS+1);
        }
    }
    entities.forEach(e => { ctx.fillStyle = e.isNPC ? '#0ff' : (e.isEnemy ? '#f33' : '#fc0'); ctx.fillRect(e.x*TS-1, e.y*TS-1, 4, 4); });
    if(otherPlayer && otherPlayer.x) { ctx.fillStyle = '#f0f'; ctx.fillRect(otherPlayer.x*TS-2, otherPlayer.y*TS-2, 6, 6); }

    ctx.fillStyle = '#5f5'; ctx.beginPath(); ctx.arc(player.x*TS, player.y*TS, 3, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(player.x*TS, player.y*TS); ctx.lineTo((player.x + player.dirX*2)*TS, (player.y + player.dirY*2)*TS); ctx.stroke();
}
