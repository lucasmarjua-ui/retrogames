import { RetroStorage } from './storage.js';

export function getMedal(score, thresholds) {
  if (score >= thresholds.gold) return 'gold';
  if (score >= thresholds.silver) return 'silver';
  if (score >= thresholds.bronze) return 'bronze';
  return null;
}

export function getBestScore(gameId) { return RetroStorage.get(gameId, 'bestScore', 0); }

export function saveScore(gameId, score, thresholds) {
  const bestScore = Math.max(getBestScore(gameId), score);
  RetroStorage.set(gameId, 'bestScore', bestScore);
  return { bestScore, medal: getMedal(bestScore, thresholds) };
}

export const MEDAL_ICONS = { gold: 'G', silver: 'S', bronze: 'B' };
