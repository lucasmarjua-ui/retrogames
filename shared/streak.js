import { Wallet } from './wallet.js';

const KEY = 'retrogames.streak';
function today() { return new Date().toISOString().slice(0, 10); }
function read() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
function daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }
export function loadDailyStreak() { const current = today(); const saved = read(); let count = Number(saved.count) || 0; let reward = 0; if (!saved.date) count = 1; else { const gap = daysBetween(saved.date, current); if (gap === 1) { count = Math.max(1, count) + 1; reward = Math.min(count, 7) * 5; Wallet.add(reward); } else if (gap > 1) count = 1; } const state = { date: current, count }; localStorage.setItem(KEY, JSON.stringify(state)); window.dispatchEvent(new CustomEvent('streakchange', { detail: { ...state, reward } })); return { ...state, reward }; }
export function getStreak() { return read(); }
