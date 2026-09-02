import { Wallet } from './wallet.js';

const KEY = 'retrogames.unlocks';
export const SKINS = [
  { id: 'classic', name: 'Verde fosforo clasico', cost: 0, vars: { '--cyan': '#23e7d7', '--pink': '#ff4f9a', '--yellow': '#ffe66d', '--paper': '#fff4d6', '--ink': '#11142b', '--orange': '#ff8b3d', '--green': '#62e889' } },
  { id: 'neon-pink', name: 'Neon rosa', cost: 12, vars: { '--cyan': '#7df9ff', '--pink': '#ff2bd6', '--yellow': '#fff36a', '--paper': '#fff0fb', '--ink': '#25102b', '--orange': '#ff704d', '--green': '#75ffb0' } },
  { id: 'synthwave', name: 'Synthwave morado-cian', cost: 20, vars: { '--cyan': '#00f0ff', '--pink': '#b44cff', '--yellow': '#f7ff00', '--paper': '#f2eaff', '--ink': '#160d31', '--orange': '#ff7b00', '--green': '#52ffcf' } },
  { id: 'amber', name: 'Ambar retro', cost: 8, vars: { '--cyan': '#ffc857', '--pink': '#e76f51', '--yellow': '#ffe29a', '--paper': '#fff1c1', '--ink': '#2b2118', '--orange': '#d95d39', '--green': '#8ac926' } }
];
function read() { try { return JSON.parse(localStorage.getItem(KEY) || '{"unlocked":["classic"],"equipped":"classic"}'); } catch { return { unlocked: ['classic'], equipped: 'classic' }; } }
function write(data) { localStorage.setItem(KEY, JSON.stringify(data)); window.dispatchEvent(new CustomEvent('skinchange', { detail: data })); }
export function getSkinState() { return read(); }
export function applySkin(id = read().equipped) { const skin = SKINS.find(item => item.id === id) || SKINS[0]; const root = document.documentElement; Object.entries(skin.vars).forEach(([name, value]) => root.style.setProperty(name, value)); return skin; }
export function buySkin(id) { const skin = SKINS.find(item => item.id === id); const state = read(); if (!skin || state.unlocked.includes(id)) return false; if (Wallet.get() < skin.cost) return false; Wallet.add(-skin.cost); state.unlocked.push(id); write(state); return true; }
export function equipSkin(id) { const state = read(); if (!state.unlocked.includes(id)) return false; state.equipped = id; write(state); applySkin(id); return true; }
applySkin();
