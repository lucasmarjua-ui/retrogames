const KEY = 'retrogames.stats';
let starts = {};
function read() { try { const value = JSON.parse(localStorage.getItem(KEY) || '{}'); return { totalGames: Number(value.totalGames) || 0, totalTimeMs: Number(value.totalTimeMs) || 0, perGame: value.perGame || {} }; } catch { return { totalGames: 0, totalTimeMs: 0, perGame: {} }; } }
function write(value) { localStorage.setItem(KEY, JSON.stringify(value)); window.dispatchEvent(new CustomEvent('statschange', { detail: value })); return value; }
export function getStats() { return read(); }
export function recordGameStart(gameId) { starts[gameId] = performance.now(); }
export function recordGameEnd(gameId) { if (starts[gameId] === undefined) return read(); const duration = Math.max(0, Math.round(performance.now() - starts[gameId])); delete starts[gameId]; const stats = read(); stats.totalGames++; stats.totalTimeMs += duration; stats.perGame[gameId] = stats.perGame[gameId] || { playCount: 0, timeMs: 0 }; stats.perGame[gameId].playCount++; stats.perGame[gameId].timeMs += duration; return write(stats); }
