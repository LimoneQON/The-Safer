export const MAP_SIZE = 24; 
export const TILE_SIZE = 300;
export const INV_SIZE = 20;

export const T_WALL = 1, T_FLOOR = 0, T_DOOR = 2, T_EXIT = 3, T_PORTAL = 4, T_MEGA_PORTAL = 5;
export const DIRS = [ {dx: 0, dz: -1}, {dx: 1, dz: 0}, {dx: 0, dz: 1}, {dx: -1, dz: 0} ];

export const ITEM_DB = {
    'wood': { sym: '🪵', name: 'Drewno', type: 'mat' },
    'steel': { sym: '⛓️', name: 'Stal', type: 'mat' },
    'fire': { sym: '🔥', name: 'Ogień', type: 'mat' },
    'magic': { sym: '✨', name: 'Magia', type: 'mat' },
    'pot': { sym: '🧪', name: 'Mikstura HP', type: 'use', action: (p)=>{ p.hp=Math.min(p.maxHp, p.hp+50); window.logMsg("Leczysz 50 HP.","log-heal"); } },
    'bomb': { sym: '💣', name: 'Bomba', type: 'combat' },
    'key': { sym: '🔑', name: 'Klucz Skarbca', type: 'key' }
};

export const WEAPONS = [ 
    {name: "Pięści", dmg: 0}, 
    {name: "Stalowy Miecz", dmg: 15}, 
    {name: "Krasnoludzki Topór", dmg: 35}, 
    {name: "Ostrze Zagłady", dmg: 100} 
];

export const ARMORS = [ 
    {name: "Szmaty", def: 0}, 
    {name: "Żelazna Zbroja", def: 15}, 
    {name: "Mithril", def: 40} 
];

export const BELTS = [ 
    {name: "Brak", cap: 5}, 
    {name: "Skórzany Pas", cap: 15}, 
    {name: "Pas Tytanów", cap: 50} 
];

export const RECIPES = [
    {name: "Skórzany Pas (Max Stack x15)", req: {wood: 5}, action: (p)=>{ p.belt = BELTS[1]; window.logMsg("Masz lepszy pas!"); }},
    {name: "Stalowy Miecz (+15 Dmg)", req: {steel: 3, wood: 1}, action: (p)=>{ p.weapon = WEAPONS[1]; window.logMsg("Wykuto Miecz!"); }},
    {name: "Krasnoludzki Topór (+35 Dmg)", req: {steel: 10, fire: 5}, action: (p)=>{ p.weapon = WEAPONS[2]; window.logMsg("Wykuto Topór!"); }},
    {name: "Ostrze Zagłady (+100 Dmg)", req: {steel: 30, magic: 20, fire: 20}, action: (p)=>{ p.weapon = WEAPONS[3]; window.logMsg("Wykuto Legendę!", "log-epic"); }},
    {name: "Żelazna Zbroja (+15 Def)", req: {steel: 8}, action: (p)=>{ p.armor = ARMORS[1]; }},
    {name: "Mikstura Leczenia", req: {magic: 1, wood: 1}, action: (p)=>{ window.addToInventory('pot', 1); window.logMsg("Uwarzono Miksturę!"); }},
    {name: "Bomba Obszarowa", req: {fire: 2, steel: 1}, action: (p)=>{ window.addToInventory('bomb', 1); window.logMsg("Zbudowano Bombę!"); }}
];

export const WORLDS = {
    human: { title: "Ludzkie Królestwa", tex: 'tex-human', mobs: [ {n: "Wilk", s: "🐺", hp: 30, d: 8}, {n: "Goblin", s: "👺", hp: 40, d: 12} ] },
    elf: { title: "Świat Elfów", tex: 'tex-elf', mobs: [ {n: "Strażnik", s: "🧝", hp: 45, d: 10}, {n: "Wróżka", s: "🧚", hp: 20, d: 15} ] },
    dwarf: { title: "Podziemia Krasnoludów", tex: 'tex-dwarf', mobs: [ {n: "Krasnolud", s: "🧔", hp: 60, d: 15}, {n: "Żywiołak", s: "🔥", hp: 100, d: 35} ] },
    homunculus: { title: "Laboratoria", tex: 'tex-human', mobs: [ {n: "Szczur", s: "🐀", hp: 35, d: 15}, {n: "Homunkulus", s: "👁️", hp: 160, d: 40} ] }
};
