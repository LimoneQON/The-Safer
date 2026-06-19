export const MAP_SIZE = 24; 
export const INV_SIZE = 20;

export const ITEM_DB = {
    'wood': { sym: '🪵', name: 'Drewno' }, 'steel': { sym: '⛓️', name: 'Stal' },
    'fire': { sym: '🔥', name: 'Ogień' }, 'magic': { sym: '✨', name: 'Magia' },
    'bone': { sym: '🦴', name: 'Kość' }, 'gem': { sym: '💎', name: 'Klejnot' },
    'shadow': { sym: '🌑', name: 'Esencja Cienia' },
    'pot': { sym: '🧪', name: 'Mikstura HP', use: true }, 'bomb': { sym: '💣', name: 'Bomba', use: false },
    'vodka': { sym: '🍺', name: 'Wódka', use: true }, 'drug': { sym: '💊', name: 'Fisstech', use: true }
};

export const HEROES = [
    {name: "Michał Kutas", cls: "Wojownik", hp: 150, dmg: 15}, {name: "Dżon Pinat", cls: "Mag", hp: 60, dmg: 35},
    {name: "Gibki Gibek", cls: "Łotr", hp: 90, dmg: 25}, {name: "Paskalito", cls: "Łucznik", hp: 80, dmg: 30}
];

export const WEAPONS = [ {name: "Pięści", sym: "👊", dmg: 0}, {name: "Sztylet", sym: "🔪", dmg: 8}, {name: "Miecz", sym: "🗡️", dmg: 15}, {name: "Topór bojowy", sym: "🪓", dmg: 35}, {name: "Kij ArcyMaga", sym: "🪄", dmg: 60}, {name: "Ostrze Zagłady", sym: "⚔️", dmg: 120} ];
export const HELMETS = [ {name: "Brak", sym: "", def: 0}, {name: "Skórzany Kaptur", sym: "🪖", def: 3}, {name: "Żelazny Hełm", sym: "⛑️", def: 10}, {name: "Korona Magii", sym: "👑", def: 25} ];
export const CHESTS = [ {name: "Szmaty", sym: "👕", def: 0}, {name: "Skórzana Kurta", sym: "🦺", def: 8}, {name: "Napiersnik", sym: "🛡️", def: 20}, {name: "Zbroja Cienia", sym: "🥋", def: 50} ];
export const PANTS = [ {name: "Brak", sym: "", def: 0}, {name: "Skórzane Spodnie", sym: "👖", def: 4}, {name: "Żelazne Nogawice", sym: "🦿", def: 12} ];
export const BOOTS = [ {name: "Brak", sym: "", def: 0}, {name: "Skórzane Buty", sym: "👞", def: 2}, {name: "Stalowe Buty", sym: "🥾", def: 8} ];
export const BELTS = [ {name: "Brak", sym: "", cap: 5}, {name: "Skórzany Pas", sym: "🎗️", cap: 15}, {name: "Pas Tytanów", sym: "🪢", cap: 50} ];

export const MOBS = [ 
    {n: "Szczur", s: "🐀", hp: 20, d: 5, loot: 'wood'}, {n: "Wilk", s: "🐺", hp: 40, d: 12, loot: 'wood'}, 
    {n: "Goblin", s: "👺", hp: 50, d: 15, loot: 'steel'}, {n: "Szkielet", s: "💀", hp: 70, d: 20, loot: 'bone'}, 
    {n: "Ork", s: "👹", hp: 100, d: 25, loot: 'steel'}, {n: "Wampir", s: "🧛", hp: 150, d: 35, loot: 'magic'}, 
    {n: "Golem", s: "🗿", hp: 250, d: 45, loot: 'fire'}, {n: "Demon", s: "👿", hp: 300, d: 55, loot: 'fire'}, 
    {n: "Smok", s: "🐉", hp: 500, d: 80, loot: 'gem'}, {n: "Licz", s: "🧟", hp: 400, d: 70, loot: 'shadow'} 
];

export const NPC_POOL = [
    {n: "Piotr 'Ciepły'", s: "🧔", text: "Witaj w bezpiecznej strefie. Rzymianie-Żydzi to tylko kod w Matrixie."},
    {n: "Gotka Oliwia 'Tom'", s: "🧛‍♀️", text: "Nigdy nie stój w miejscu, bo dopadną cię błędy symulacji."},
    {n: "Bułka Zulczyk", s: "🍞", text: "Kowal ma schemat Ostrza Zagłady. Potrzebujesz esencji Cienia z Licza."}
];

export const PERKS = [
    {id: 'str', n: 'Siłacz', d: '+15 Atak na stałe', apply: p => p.baseDmg += 15},
    {id: 'hp', n: 'Witalność', d: '+50 Max HP', apply: p => {p.maxHp += 50; p.hp += 50;}},
    {id: 'def', n: 'Twardoskóry', d: '+10 Pancerza na stałe', apply: p => p.baseArmor += 10},
    {id: 'sap', n: 'Saper', d: 'Dostajesz 5 bomb na start', apply: p => window.addToInventory('bomb', 5)}
];

export const RECIPES = [
    {name: "Skórzany Pas (Max Stack x15)", req: {wood: 5}, type: 'belt', val: 1}, {name: "Pas Tytanów (Max Stack x50)", req: {steel: 10, fire: 5}, type: 'belt', val: 2},
    {name: "Sztylet (+8 Dmg)", req: {wood: 2, steel: 1}, type: 'wep', val: 1}, {name: "Stalowy Miecz (+15 Dmg)", req: {steel: 3, wood: 1}, type: 'wep', val: 2},
    {name: "Topór (+35 Dmg)", req: {steel: 10, fire: 5}, type: 'wep', val: 3}, {name: "Kij Maga (+60 Dmg)", req: {wood: 10, magic: 5}, type: 'wep', val: 4},
    {name: "Ostrze Zagłady (+120 Dmg)", req: {steel: 20, fire: 15, magic: 10}, type: 'wep', val: 5},
    {name: "Skórzany Kaptur (+3 Def)", req: {wood: 3}, type: 'helm', val: 1}, {name: "Żelazny Hełm (+10 Def)", req: {steel: 5}, type: 'helm', val: 2}, {name: "Korona Magii (+25 Def)", req: {magic: 10, steel: 5}, type: 'helm', val: 3},
    {name: "Skórzana Kurta (+8 Def)", req: {wood: 6}, type: 'chest', val: 1}, {name: "Żelazny Napiersnik (+20 Def)", req: {steel: 12}, type: 'chest', val: 2}, {name: "Mithrilowa Zbroja (+50 Def)", req: {steel: 25, magic: 15}, type: 'chest', val: 3},
    {name: "Skórzane Spodnie (+4 Def)", req: {wood: 4}, type: 'pants', val: 1}, {name: "Żelazne Nagolenniki (+12 Def)", req: {steel: 8}, type: 'pants', val: 2},
    {name: "Skórzane Buty (+2 Def)", req: {wood: 2}, type: 'boots', val: 1}, {name: "Stalowe Buty (+8 Def)", req: {steel: 4}, type: 'boots', val: 2},
    {name: "Mikstura Leczenia", req: {wood: 1, magic: 1}, type: 'item', id: 'pot'}, {name: "Bomba Obszarowa", req: {fire: 2, steel: 1}, type: 'item', id: 'bomb'}
];
