import { Wallet } from './wallet.js';
import { getBestScore, getMedal } from './records.js';
import { GAMES } from './games-registry.js';
import { getStreak } from './streak.js';

const KEY = 'retrogames.character';
const CLASSIC_GAMES = ['snake', 'pacman', 'tetris', 'breakout', 'space-invaders'];
export const CHARACTER_CATEGORIES = ['shirts', 'hats', 'glasses', 'accessories'];
export const CHARACTER_CATEGORY_LABELS = { shirts: 'Camisetas', hats: 'Gorros', glasses: 'Gafas', accessories: 'Accesorios' };
export const CHARACTER_ITEMS = [
  { id: 'shirt-basic', name: 'Camiseta Básica', category: 'shirts', cost: 0, exclusive: false, unlock: 'included' },
  { id: 'shirt-red', name: 'Camiseta Roja', category: 'shirts', cost: 50, exclusive: false, unlock: 'purchase' },
  { id: 'shirt-neon', name: 'Camiseta Neón', category: 'shirts', cost: 120, exclusive: false, unlock: 'purchase' },
  { id: 'shirt-camo', name: 'Camiseta Pixel Camo', category: 'shirts', cost: 200, exclusive: true, unlock: 'purchase' },
  { id: 'hat-none', name: 'Sin gorro', category: 'hats', cost: 0, exclusive: false, unlock: 'included' },
  { id: 'hat-cap', name: 'Gorra Clásica', category: 'hats', cost: 60, exclusive: false, unlock: 'purchase' },
  { id: 'hat-cowboy', name: 'Sombrero Vaquero', category: 'hats', cost: 90, exclusive: false, unlock: 'purchase' },
  { id: 'hat-crown', name: 'Corona Arcade', category: 'hats', cost: 0, exclusive: true, unlock: 'all-gold' },
  { id: 'glasses-none', name: 'Sin gafas', category: 'glasses', cost: 0, exclusive: false, unlock: 'included' },
  { id: 'glasses-sun', name: 'Gafas de Sol', category: 'glasses', cost: 70, exclusive: false, unlock: 'purchase' },
  { id: 'glasses-3d', name: 'Gafas 3D Retro', category: 'glasses', cost: 100, exclusive: false, unlock: 'purchase' },
  { id: 'glasses-laser', name: 'Gafas Láser', category: 'glasses', cost: 0, exclusive: true, unlock: 'streak-7' },
  { id: 'accessory-none', name: 'Sin accesorio', category: 'accessories', cost: 0, exclusive: false, unlock: 'included' },
  { id: 'accessory-scarf', name: 'Bufanda', category: 'accessories', cost: 80, exclusive: false, unlock: 'purchase' },
  { id: 'accessory-backpack', name: 'Mochila Pixel', category: 'accessories', cost: 110, exclusive: false, unlock: 'purchase' },
  { id: 'accessory-cape', name: 'Capa Dorada', category: 'accessories', cost: 500, exclusive: true, unlock: 'purchase' }
];
const DEFAULT_STATE = { owned: ['shirt-basic', 'hat-none', 'glasses-none', 'accessory-none'], equipped: { shirts: 'shirt-basic', hats: 'hat-none', glasses: 'glasses-none', accessories: 'accessory-none' } };
function read() { try { const value = JSON.parse(localStorage.getItem(KEY) || '{}'); return { owned: [...new Set([...(value.owned || []), ...DEFAULT_STATE.owned])], equipped: { ...DEFAULT_STATE.equipped, ...(value.equipped || {}) } }; } catch { return structuredClone(DEFAULT_STATE); } }
function write(state) { localStorage.setItem(KEY, JSON.stringify(state)); window.dispatchEvent(new CustomEvent('characterchange', { detail: state })); }
function allGold() { return CLASSIC_GAMES.every(id => { const game = GAMES.find(item => item.id === id); return game && getMedal(getBestScore(id), game.thresholds) === 'gold'; }); }
function conditionMet(item) { return item.unlock === 'all-gold' ? allGold() : item.unlock === 'streak-7' ? Number(getStreak().count) >= 7 : item.unlock === 'included' || item.unlock === 'purchase'; }
export function getCharacterState() { return read(); }
export function getCharacterItems(category) { return CHARACTER_ITEMS.filter(item => !category || item.category === category).map(item => ({ ...item, owned: read().owned.includes(item.id), equipped: read().equipped[item.category] === item.id, unlocked: conditionMet(item) })); }
export function checkCharacterUnlocks() { const state = read(); let changed = false; CHARACTER_ITEMS.filter(item => item.exclusive && item.unlock !== 'purchase' && conditionMet(item)).forEach(item => { if (!state.owned.includes(item.id)) { state.owned.push(item.id); changed = true; } }); if (changed) write(state); return state; }
export function buyCharacterItem(id) { checkCharacterUnlocks(); const item = CHARACTER_ITEMS.find(entry => entry.id === id); const state = read(); if (!item || item.unlock !== 'purchase' || state.owned.includes(id) || Wallet.get() < item.cost) return false; Wallet.add(-item.cost); state.owned.push(id); write(state); return true; }
export function equipCharacterItem(id) { checkCharacterUnlocks(); const item = CHARACTER_ITEMS.find(entry => entry.id === id); const state = read(); if (!item || !state.owned.includes(id)) return false; state.equipped[item.category] = id; write(state); return true; }
export function renderCharacter(container, options = {}) { const state = read(); const shirt = state.equipped.shirts; const hat = state.equipped.hats; const glasses = state.equipped.glasses; const accessory = state.equipped.accessories; const scale = options.size || '100%'; const shirtColor = shirt === 'shirt-red' ? '#e34b42' : shirt === 'shirt-neon' ? '#ff4f9a' : shirt === 'shirt-camo' ? '#536f53' : '#23e7d7'; const body = options.compact ? 24 : 38; container.innerHTML = `<svg class="pixel-character" style="width:${scale};height:${scale}" viewBox="0 0 100 120" role="img" aria-label="Personaje RetroGames"><rect x="${50-body/2}" y="50" width="${body}" height="42" fill="#f4b183"/><rect x="28" y="88" width="44" height="22" fill="${shirtColor}"/><rect x="35" y="108" width="11" height="8" fill="#11142b"/><rect x="54" y="108" width="11" height="8" fill="#11142b"/>${hat === 'hat-cap' ? '<rect x="28" y="40" width="44" height="8" fill="#ff4f9a"/><rect x="40" y="32" width="25" height="10" fill="#ff4f9a"/>' : hat === 'hat-cowboy' ? '<rect x="24" y="42" width="52" height="6" fill="#a96b35"/><rect x="35" y="30" width="30" height="14" fill="#a96b35"/>' : hat === 'hat-crown' ? '<path d="M30 44L34 25L45 36L50 20L56 36L68 25L72 44Z" fill="#ffe66d"/>' : ''}${glasses === 'glasses-sun' ? '<rect x="32" y="56" width="15" height="9" fill="#11142b"/><rect x="53" y="56" width="15" height="9" fill="#11142b"/><rect x="47" y="59" width="6" height="3" fill="#11142b"/>' : glasses === 'glasses-3d' ? '<rect x="31" y="55" width="18" height="11" fill="#f04462"/><rect x="51" y="55" width="18" height="11" fill="#23e7d7"/>' : glasses === 'glasses-laser' ? '<rect x="31" y="58" width="38" height="4" fill="#ff4f9a"/><rect x="34" y="55" width="5" height="10" fill="#ff4f9a"/><rect x="61" y="55" width="5" height="10" fill="#ff4f9a"/>' : ''}${accessory === 'accessory-scarf' ? '<rect x="28" y="82" width="44" height="8" fill="#f04462"/><rect x="62" y="87" width="8" height="20" fill="#f04462"/>' : accessory === 'accessory-backpack' ? '<rect x="20" y="70" width="9" height="28" fill="#ff8b3d"/><rect x="17" y="76" width="6" height="18" fill="#ff8b3d"/>' : accessory === 'accessory-cape' ? '<path d="M28 70L16 108L34 101L50 112L66 101L84 108L72 70Z" fill="#ffe66d"/>' : ''}</svg>`; return container.firstElementChild; }
checkCharacterUnlocks();
window.addEventListener('achievementchange', checkCharacterUnlocks);
window.addEventListener('streakchange', checkCharacterUnlocks);
window.addEventListener('storagechange', checkCharacterUnlocks);
window.addEventListener('cloudsync', checkCharacterUnlocks);
