import { Wallet } from '../../shared/wallet.js';
import { saveScore, getBestScore } from '../../shared/records.js';
import { mountHud } from '../../shared/hud.js';
import { Audio } from '../../shared/audio.js';
import '../../shared/skins.js';
import '../../shared/auth.js';
import { unlockAchievement } from '../../shared/achievements.js';
import { showTutorialOnce } from '../../shared/tutorial.js';

const canvas = document.querySelector('#game');
const context = canvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const bestElement = document.querySelector('#best');
const statusElement = document.querySelector('#status');
const hud = mountHud('snake', scoreElement, document.querySelector('#wallet-count'));
const columns = 32;
const rows = 24;
const cell = canvas.width / columns;
let snake;
let apple;
let direction;
let nextDirection;
let score;
let timer;
let running;
let paused;
let startedAt;
let apples;
let goldenApple;
let goldenExpiresAt;
let combo;
let lastMealAt;
let previousSnake;
let moveStartedAt;
let moveDuration;
let animationFrame;
let impactTimeout;
let impactFrames;
let gameOverPending;
const canvasFrame = document.querySelector('.canvas-frame');

function randomApple(excluded = []) {
  let candidate;
  do { candidate = { x: Math.floor(Math.random() * columns), y: Math.floor(Math.random() * rows) }; }
  while ([...snake, ...excluded].some(part => part.x === candidate.x && part.y === candidate.y));
  return candidate;
}
function tickInterval() { return Math.max(65, 135 - Math.floor((snake.length - 3) / 3) * 8); }
function updateStatus(now = Date.now()) { if (combo && lastMealAt && now - lastMealAt >= 2000) combo = 0; const goldenSeconds = goldenApple ? Math.max(0, Math.ceil((goldenExpiresAt - now) / 1000)) : 0; statusElement.textContent = goldenApple ? `DORADA ${goldenSeconds}s / COMBO x${combo}` : combo > 1 ? `COMBO x${combo}` : 'EN JUEGO'; }
function reset() {
  clearInterval(timer); cancelAnimationFrame(animationFrame); clearTimeout(impactTimeout); canvasFrame.classList.remove('impact-flash'); snake = [{ x: 16, y: 12 }, { x: 15, y: 12 }, { x: 14, y: 12 }]; previousSnake = snake.map(part => ({ ...part })); apple = randomApple(); goldenApple = null; goldenExpiresAt = 0; direction = { x: 1, y: 0 }; nextDirection = direction; score = 0; apples = 0; combo = 0; lastMealAt = 0; startedAt = 0; moveStartedAt = 0; moveDuration = tickInterval(); impactFrames = 0; gameOverPending = false; running = false; paused = false; hud.setScore(score); bestElement.textContent = String(getBestScore('snake')).padStart(4, '0'); statusElement.textContent = 'PULSA UNA FLECHA'; draw();
}
function begin() { if (running) return; running = true; startedAt = Date.now(); updateStatus(); timer = setInterval(tick, tickInterval()); animationFrame = requestAnimationFrame(renderFrame); }
function tick() {
  if (paused || gameOverPending) return;
  const tickStartedAt = performance.now();
  if (goldenApple && Date.now() >= goldenExpiresAt) goldenApple = null;
  previousSnake = snake.map(part => ({ ...part }));
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const hitWall = head.x < 0 || head.x >= columns || head.y < 0 || head.y >= rows;
  const hitSelf = snake.some(part => part.x === head.x && part.y === head.y);
  if (hitWall || hitSelf) return endGame();
  snake.unshift(head);
  const ateGolden = goldenApple && head.x === goldenApple.x && head.y === goldenApple.y;
  const ateNormal = head.x === apple.x && head.y === apple.y;
  if (ateGolden || ateNormal) { const now = Date.now(); combo = now - lastMealAt < 2000 ? Math.min(combo + 1, 5) : 1; lastMealAt = now; const points = (ateGolden ? 50 : 10) * combo; score += points; apples++; if (ateGolden) { goldenApple = null; Wallet.add(3); Audio.playSfx('coin'); } if (apples >= 20) unlockAchievement('snake-feast'); if (snake.length >= 30) unlockAchievement('snake-long'); Audio.playSfx('eat'); hud.setScore(score); apple = randomApple(goldenApple ? [goldenApple] : []); if (!ateGolden && apples >= 4 && Math.random() < .18) { goldenApple = randomApple([apple]); goldenExpiresAt = now + 5500; } } else snake.pop();
  moveStartedAt = tickStartedAt; moveDuration = tickInterval(); clearInterval(timer); timer = setInterval(tick, moveDuration); updateStatus();
}
function finishGameOver() { if (startedAt && Date.now() - startedAt >= 60000) unlockAchievement('snake-survivor'); const result = saveScore('snake', score, { bronze: 50, silver: 120, gold: 250 }); Wallet.add(Math.max(1, Math.floor(score / 20))); Audio.playSfx('coin'); Audio.playSfx('gameover'); bestElement.textContent = String(result.bestScore).padStart(4, '0'); statusElement.textContent = `GAME OVER / ${result.medal ? result.medal.toUpperCase() : 'SIN MEDALLA'}`; draw(); }
function endGame() { clearInterval(timer); running = false; gameOverPending = true; impactFrames = 12; canvasFrame.classList.add('impact-flash'); Audio.playSfx('impact'); impactTimeout = setTimeout(() => { gameOverPending = false; impactFrames = 0; canvasFrame.classList.remove('impact-flash'); finishGameOver(); }, 260); }
function renderFrame(now) { if (goldenApple && Date.now() >= goldenExpiresAt) goldenApple = null; if (running && !paused && !gameOverPending) { updateStatus(); draw(now); animationFrame = requestAnimationFrame(renderFrame); } else if (gameOverPending) { draw(now); animationFrame = requestAnimationFrame(renderFrame); } }
function draw() {
  const now = performance.now(); const progress = moveStartedAt ? Math.min(1, Math.max(0, (now - moveStartedAt) / moveDuration)) : 1; context.save(); if (impactFrames > 0) { context.translate((Math.random() - .5) * 8, (Math.random() - .5) * 8); impactFrames--; } context.fillStyle = '#050717'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(35,231,215,.12)'; context.lineWidth = 1; for (let x = 0; x <= columns; x++) { context.beginPath(); context.moveTo(x * cell, 0); context.lineTo(x * cell, canvas.height); context.stroke(); } for (let y = 0; y <= rows; y++) { context.beginPath(); context.moveTo(0, y * cell); context.lineTo(canvas.width, y * cell); context.stroke(); }
  context.fillStyle = '#ff4f9a'; context.fillRect(apple.x * cell + 5, apple.y * cell + 5, cell - 10, cell - 10); if (goldenApple) { const remaining = goldenExpiresAt - Date.now(); const elapsed = 5500 - remaining; context.globalAlpha = .35 + Math.abs(Math.sin(elapsed * (.01 + elapsed / 300000))) * .65; context.fillStyle = '#ffe66d'; context.shadowColor = '#fff4d6'; context.shadowBlur = 12; context.fillRect(goldenApple.x * cell + 3, goldenApple.y * cell + 3, cell - 6, cell - 6); context.shadowBlur = 0; context.globalAlpha = 1; } context.fillStyle = '#62e889'; snake.forEach((part, index) => { const old = previousSnake[index] || part; const x = old.x + (part.x - old.x) * progress; const y = old.y + (part.y - old.y) * progress; context.fillStyle = index === 0 ? '#ffe66d' : '#62e889'; context.fillRect(x * cell + 3, y * cell + 3, cell - 6, cell - 6); });
  if (!running && score === 0) { context.fillStyle = '#fff4d6'; context.font = '16px "Press Start 2P"'; context.textAlign = 'center'; context.fillText('READY?', canvas.width / 2, canvas.height / 2); }
  context.restore();
}
window.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); if (running) { paused = !paused; statusElement.textContent = paused ? 'PAUSA' : 'EN JUEGO'; if (!paused) animationFrame = requestAnimationFrame(renderFrame); } return; } const keys = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }; const candidate = keys[event.key]; if (!candidate) return; event.preventDefault(); if (candidate.x + direction.x !== 0 || candidate.y + direction.y !== 0) nextDirection = candidate; begin(); });
document.querySelector('#restart').addEventListener('click', reset);
showTutorialOnce('snake', '<p>FLECHAS: MOVER<br>ESC: PAUSA</p>'); reset();
