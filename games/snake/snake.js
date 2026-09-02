import { Wallet } from '../../shared/wallet.js';
import { saveScore, getBestScore } from '../../shared/records.js';
import { mountHud } from '../../shared/hud.js';
import { Audio } from '../../shared/audio.js';
import '../../shared/skins.js';
import '../../shared/auth.js';
import { unlockAchievement } from '../../shared/achievements.js';

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
let startedAt;
let apples;

function randomApple() {
  let candidate;
  do { candidate = { x: Math.floor(Math.random() * columns), y: Math.floor(Math.random() * rows) }; }
  while (snake.some(part => part.x === candidate.x && part.y === candidate.y));
  return candidate;
}
function reset() {
  clearInterval(timer); snake = [{ x: 16, y: 12 }, { x: 15, y: 12 }, { x: 14, y: 12 }]; apple = randomApple(); direction = { x: 1, y: 0 }; nextDirection = direction; score = 0; apples = 0; startedAt = 0; running = false; hud.setScore(score); bestElement.textContent = String(getBestScore('snake')).padStart(4, '0'); statusElement.textContent = 'PULSA UNA FLECHA'; draw();
}
function begin() { if (running) return; running = true; startedAt = Date.now(); statusElement.textContent = 'EN JUEGO'; timer = setInterval(tick, 135); }
function tick() {
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const hitWall = head.x < 0 || head.x >= columns || head.y < 0 || head.y >= rows;
  const hitSelf = snake.some(part => part.x === head.x && part.y === head.y);
  if (hitWall || hitSelf) return endGame();
  snake.unshift(head);
  if (head.x === apple.x && head.y === apple.y) { score += 10; apples++; if (apples >= 20) unlockAchievement('snake-feast'); if (snake.length >= 30) unlockAchievement('snake-long'); Audio.playSfx('eat'); hud.setScore(score); apple = randomApple(); if (score % 50 === 0) { Audio.playSfx('levelup'); clearInterval(timer); timer = setInterval(tick, Math.max(55, 135 - score / 4)); } } else snake.pop();
  draw();
}
function endGame() { clearInterval(timer); running = false; if (startedAt && Date.now() - startedAt >= 60000) unlockAchievement('snake-survivor'); const result = saveScore('snake', score, { bronze: 50, silver: 120, gold: 250 }); Wallet.add(Math.max(1, Math.floor(score / 20))); Audio.playSfx('coin'); Audio.playSfx('gameover'); bestElement.textContent = String(result.bestScore).padStart(4, '0'); statusElement.textContent = `GAME OVER / ${result.medal ? result.medal.toUpperCase() : 'SIN MEDALLA'}`; draw(); }
function draw() {
  context.fillStyle = '#050717'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(35,231,215,.12)'; context.lineWidth = 1; for (let x = 0; x <= columns; x++) { context.beginPath(); context.moveTo(x * cell, 0); context.lineTo(x * cell, canvas.height); context.stroke(); } for (let y = 0; y <= rows; y++) { context.beginPath(); context.moveTo(0, y * cell); context.lineTo(canvas.width, y * cell); context.stroke(); }
  context.fillStyle = '#ff4f9a'; context.fillRect(apple.x * cell + 5, apple.y * cell + 5, cell - 10, cell - 10); context.fillStyle = '#62e889'; snake.forEach((part, index) => { context.fillStyle = index === 0 ? '#ffe66d' : '#62e889'; context.fillRect(part.x * cell + 3, part.y * cell + 3, cell - 6, cell - 6); });
  if (!running && score === 0) { context.fillStyle = '#fff4d6'; context.font = '16px "Press Start 2P"'; context.textAlign = 'center'; context.fillText('READY?', canvas.width / 2, canvas.height / 2); }
}
window.addEventListener('keydown', event => { const keys = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }; const candidate = keys[event.key]; if (!candidate) return; event.preventDefault(); if (candidate.x + direction.x !== 0 || candidate.y + direction.y !== 0) nextDirection = candidate; begin(); });
document.querySelector('#restart').addEventListener('click', reset);
reset();
