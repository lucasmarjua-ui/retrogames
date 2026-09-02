const STORAGE_KEY = 'retrogames.game-data';

function readAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

export const RetroStorage = {
  get(gameId, key, fallback = null) {
    const gameData = readAll()[gameId] || {};
    return Object.hasOwn(gameData, key) ? gameData[key] : fallback;
  },
  set(gameId, key, value) {
    const allData = readAll();
    allData[gameId] = { ...(allData[gameId] || {}), [key]: value };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    return value;
  }
};
