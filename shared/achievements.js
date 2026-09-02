const KEY = 'retrogames.achievements';

export const ACHIEVEMENTS = {
  snake: [
    { id: 'snake-survivor', medal: 'bronze', name: 'Superviviente', description: 'Sobrevive 60 segundos.' },
    { id: 'snake-feast', medal: 'silver', name: 'Gran banquete', description: 'Come 20 manzanas en una partida.' },
    { id: 'snake-long', medal: 'gold', name: 'Serpiente titan', description: 'Alcanza longitud 30 sin chocar.' }
  ],
  pacman: [
    { id: 'pacman-pellets', medal: 'bronze', name: 'Limpieza express', description: 'Come 50 pellets en una partida.' },
    { id: 'pacman-ghost', medal: 'silver', name: 'Cazafantasmas', description: 'Come un fantasma con power pellet.' },
    { id: 'pacman-perfect', medal: 'gold', name: 'Nivel perfecto', description: 'Completa un nivel sin perder.' }
  ],
  tetris: [
    { id: 'tetris-lines', medal: 'bronze', name: 'Primera linea', description: 'Limpia 4 lineas en una partida.' },
    { id: 'tetris-level', medal: 'silver', name: 'A toda velocidad', description: 'Alcanza el nivel 5.' },
    { id: 'tetris-tetris', medal: 'gold', name: 'Tetris', description: 'Limpia 4 lineas de una vez.' }
  ],
  breakout: [
    { id: 'breakout-bricks', medal: 'bronze', name: 'Rompehielos', description: 'Rompe 10 bloques.' },
    { id: 'breakout-rally', medal: 'silver', name: 'Buen rally', description: 'Mantén 20 rebotes sin perder la bola.' },
    { id: 'breakout-clear', medal: 'gold', name: 'Pared limpia', description: 'Destruye todos los bloques.' }
  ],
  'space-invaders': [
    { id: 'invaders-first-wave', medal: 'bronze', name: 'Primera defensa', description: 'Destruye 10 invasores.' },
    { id: 'invaders-sharpshooter', medal: 'silver', name: 'Tirador certero', description: 'Consigue 15 impactos seguidos.' },
    { id: 'invaders-earth', medal: 'gold', name: 'Defensor de la Tierra', description: 'Supera una oleada sin perder vidas.' }
  ]
};
function read() { try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
function write(value) { localStorage.setItem(KEY, JSON.stringify(value)); window.dispatchEvent(new CustomEvent('achievementchange', { detail: value })); }
export function getUnlockedAchievements() { return read(); }
export function getGameAchievements(gameId) { return (ACHIEVEMENTS[gameId] || []).map(item => ({ ...item, unlocked: read().includes(item.id) })); }
export function unlockAchievement(id) { const achievement = Object.values(ACHIEVEMENTS).flat().find(item => item.id === id); const unlocked = read(); if (!achievement || unlocked.includes(id)) return false; unlocked.push(id); write(unlocked); return true; }
export function unlockGameAchievement(gameId, achievementId) { const fullId = achievementId.startsWith(`${gameId}-`) ? achievementId : `${gameId}-${achievementId}`; return unlockAchievement(fullId); }
