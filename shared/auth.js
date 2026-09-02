import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { firebaseApp } from './firebase-config.js';

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const DATA_KEYS = ['retrogames.wallet', 'retrogames.game-data', 'retrogames.unlocks', 'retrogames.achievements', 'retrogames.streak', 'retrogames.character'];
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,16}$/;
let currentUser = null;
let listeners = [];
let syncing = false;

function isValidUsername(username) {
  return typeof username === 'string' && USERNAME_PATTERN.test(username.trim());
}
function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@retrogames.local`;
}
function readLocal() {
  return DATA_KEYS.reduce((data, key) => { const value = localStorage.getItem(key); if (value !== null) data[key] = value; return data; }, {});
}
function writeLocal(data) { Object.entries(data || {}).forEach(([key, value]) => localStorage.setItem(key, String(value))); }
function mergeData(local, cloud) {
  const merged = { ...local, ...cloud };
  const localWallet = Number.parseInt(local['retrogames.wallet'] || '0', 10) || 0;
  const cloudWallet = Number.parseInt(cloud['retrogames.wallet'] || '0', 10) || 0;
  if (local['retrogames.wallet'] || cloud['retrogames.wallet']) merged['retrogames.wallet'] = String(Math.max(localWallet, cloudWallet));
  ['retrogames.game-data', 'retrogames.unlocks', 'retrogames.achievements', 'retrogames.streak', 'retrogames.character'].forEach(key => {
    try {
      const localValue = JSON.parse(local[key] || '{}');
      const cloudValue = JSON.parse(cloud[key] || '{}');
      merged[key] = JSON.stringify(key === 'retrogames.game-data' ? mergeGameData(localValue, cloudValue) : key === 'retrogames.unlocks' ? mergeUnlocks(localValue, cloudValue) : key === 'retrogames.achievements' ? mergeAchievements(localValue, cloudValue) : key === 'retrogames.streak' ? mergeStreak(localValue, cloudValue) : mergeCharacter(localValue, cloudValue));
    } catch { /* Preserve the valid side if old local data is malformed. */ }
  });
  return merged;
}
function mergeGameData(local, cloud) { const result = { ...cloud }; Object.entries(local).forEach(([gameId, values]) => { result[gameId] = { ...(cloud[gameId] || {}), ...values, bestScore: Math.max(values.bestScore || 0, cloud[gameId]?.bestScore || 0) }; }); return result; }
function mergeUnlocks(local, cloud) { return { unlocked: [...new Set([...(cloud.unlocked || []), ...(local.unlocked || []), 'classic'])], equipped: local.equipped || cloud.equipped || 'classic' }; }
function mergeAchievements(local, cloud) { return [...new Set([...(Array.isArray(cloud) ? cloud : []), ...(Array.isArray(local) ? local : [])])]; }
function mergeStreak(local, cloud) { return Date.parse(local.date || '') >= Date.parse(cloud.date || '') ? local : cloud; }
function mergeCharacter(local, cloud) { return { owned: [...new Set([...(cloud.owned || []), ...(local.owned || [])])], equipped: { ...(cloud.equipped || {}), ...(local.equipped || {}) } }; }
async function loadUserData(user) { const local = readLocal(); const hasLocalProgress = Object.keys(local).some(key => key !== 'retrogames.achievements' || local[key] !== '[]'); const snapshot = await getDoc(doc(db, 'users', user.uid)); if (!snapshot.exists()) { await saveUserData(user); return; } const cloud = snapshot.data().data || {}; const keepLocal = hasLocalProgress && window.confirm('Conservar y fusionar el progreso local con tu cuenta?'); const merged = keepLocal ? mergeData(local, cloud) : cloud; writeLocal(merged); window.dispatchEvent(new CustomEvent('cloudsync', { detail: merged })); if (keepLocal) await setDoc(doc(db, 'users', user.uid), { data: merged, username: user.displayName }, { merge: true }); }
async function saveUserData(user = currentUser) { if (!user || syncing) return; syncing = true; try { await setDoc(doc(db, 'users', user.uid), { data: readLocal(), username: user.displayName, updatedAt: Date.now() }, { merge: true }); } catch (error) { console.warn('No se pudo sincronizar RetroGames:', error); } finally { syncing = false; } }
export async function registerUser(username, password) {
  if (!isValidUsername(username)) { const error = new Error('Invalid username'); error.code = 'auth/invalid-username'; throw error; }
  const credential = await createUserWithEmailAndPassword(auth, usernameToEmail(username), password);
  await updateProfile(credential.user, { displayName: username.trim() });
  return credential;
}
export async function loginUser(username, password) {
  if (!isValidUsername(username)) { const error = new Error('Invalid username'); error.code = 'auth/invalid-username'; throw error; }
  return signInWithEmailAndPassword(auth, usernameToEmail(username), password);
}
export async function logoutUser() { return signOut(auth); }
export function getCurrentUser() { return currentUser; }
export function onUserChange(listener) { listeners.push(listener); listener(currentUser); return () => { listeners = listeners.filter(item => item !== listener); }; }
export function syncCurrentUser() { return saveUserData(); }
window.addEventListener('walletchange', () => saveUserData());
window.addEventListener('storagechange', () => saveUserData());
window.addEventListener('skinchange', () => saveUserData());
window.addEventListener('achievementchange', () => saveUserData());
onAuthStateChanged(auth, async user => { currentUser = user; if (user) { try { await loadUserData(user); } catch (error) { console.warn('No se pudo cargar el progreso:', error); } } listeners.forEach(listener => listener(currentUser)); });
