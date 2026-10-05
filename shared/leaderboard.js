import { loadFirebase } from './firebase-config.js';
import { getCurrentUser } from './auth.js';

let db, collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc;
const firebaseReady = loadFirebase().then(firebase => {
  if (!firebase) return false;
  ({ db } = firebase);
  ({ collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc } = firebase.firestoreApi);
  return true;
});
export async function submitScore(gameId, score) { if (!(await firebaseReady)) return false; const user = getCurrentUser(); const value = Math.max(0, Math.floor(Number(score) || 0)); if (!user || !value) return false; const entry = doc(db, 'leaderboards', gameId, 'entries', user.uid); const current = await getDoc(entry); if (current.exists() && Number(current.data().score || 0) >= value) return false; await setDoc(entry, { username: user.displayName || 'JUGADOR', score: value, updatedAt: Date.now() }); return true; }
export async function getTopScores(gameId, max = 10) { if (!(await firebaseReady)) return []; const user = getCurrentUser(); if (!user) return []; const scores = await getDocs(query(collection(db, 'leaderboards', gameId, 'entries'), orderBy('score', 'desc'), limit(Math.max(1, Math.min(50, max))))); return scores.docs.map(entry => ({ username: entry.data().username || 'JUGADOR', score: Number(entry.data().score || 0) })); }
