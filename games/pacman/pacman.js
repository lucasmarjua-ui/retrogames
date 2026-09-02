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
const hud = mountHud('pacman', scoreElement, document.querySelector('#wallet-count'));
const layout = ['#####################','#o........#........o#','#.###.###.#.###.###.#','#...................#','#.###.#.#####.#.###.#','#.....#...#...#.....#','#####.### # ###.#####','#.........P.........#','###.#.##     ##.#.###','#...#.#G   G #.#...#','###.#.##     ##.#.###','#.........#.........#','#####.### # ###.#####','#.....#...#...#.....#','#.###.#.#####.#.###.#','#...................#','#.###.###.#.###.###.#','#o........#........o#','#####################'];
const tile = canvas.width / 21;
const walls = new Set();
const pellets = new Set();
let pacman;
let ghosts;
let direction;
let nextDirection;
let score;
let powerUntil;
let running;
let timer;
let pelletsEaten;
function key(x, y) { return `${x},${y}`; }
function reset() { clearInterval(timer); walls.clear(); pellets.clear(); layout.forEach((row, y) => [...row].forEach((value, x) => { if (value === '#') walls.add(key(x, y)); if (value === '.' || value === 'o') pellets.add(key(x, y)); })); pacman = { x: 10, y: 7 }; ghosts = [{ x: 9, y: 9, color: '#f04462' }, { x: 11, y: 9, color: '#ff8b3d' }]; direction = { x: 0, y: 0 }; nextDirection = { x: 0, y: 0 }; score = 0; pelletsEaten = 0; powerUntil = 0; running = false; hud.setScore(score); bestElement.textContent = String(getBestScore('pacman')).padStart(4, '0'); statusElement.textContent = 'PULSA UNA FLECHA'; draw(); }
function begin() { if (running) return; running = true; statusElement.textContent = 'EN JUEGO'; timer = setInterval(tick, 170); }
function canMove(position, move) { return !walls.has(key(position.x + move.x, position.y + move.y)); }
function tick() { if (canMove(pacman, nextDirection)) direction = nextDirection; if (canMove(pacman, direction)) { pacman.x += direction.x; pacman.y += direction.y; } const pellet = key(pacman.x, pacman.y); if (pellets.has(pellet)) { pellets.delete(pellet); pelletsEaten++; if (pelletsEaten >= 50) unlockAchievement('pacman-pellets'); const power = layout[pacman.y][pacman.x] === 'o'; score += power ? 50 : 10; Audio.playSfx('eat'); if (power) { powerUntil = Date.now() + 7000; Audio.playSfx('levelup'); } hud.setScore(score); } ghosts.forEach(ghost => moveGhost(ghost)); const caught = ghosts.find(ghost => ghost.x === pacman.x && ghost.y === pacman.y); if (caught) { if (Date.now() < powerUntil) { score += 200; unlockAchievement('pacman-ghost'); caught.x = 10; caught.y = 9; Audio.playSfx('eat'); hud.setScore(score); } else return endGame(); } if (!pellets.size) return endGame(true); draw(); }
function moveGhost(ghost) { const moves = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].filter(move => canMove(ghost, move)); if (!moves.length) return; const target = Date.now() < powerUntil ? { x: 10, y: 9 } : pacman; moves.sort((a, b) => Math.abs(ghost.x + a.x - target.x) + Math.abs(ghost.y + a.y - target.y) - Math.abs(ghost.x + b.x - target.x) - Math.abs(ghost.y + b.y - target.y)); const chosen = Math.random() < .25 ? moves[Math.floor(Math.random() * moves.length)] : moves[0]; ghost.x += chosen.x; ghost.y += chosen.y; }
function endGame(won = false) { clearInterval(timer); running = false; if (won) unlockAchievement('pacman-perfect'); const result = saveScore('pacman', score, { bronze: 400, silver: 1000, gold: 2000 }); Wallet.add(Math.max(1, Math.floor(score / 100))); Audio.playSfx('coin'); Audio.playSfx(won ? 'levelup' : 'gameover'); bestElement.textContent = String(result.bestScore).padStart(4, '0'); statusElement.textContent = won ? `LABERINTO LIMPIO / ${result.medal ? result.medal.toUpperCase() : 'SIN MEDALLA'}` : `GAME OVER / ${result.medal ? result.medal.toUpperCase() : 'SIN MEDALLA'}`; draw(); }
function draw() { context.fillStyle = '#050717'; context.fillRect(0, 0, canvas.width, canvas.height); walls.forEach(value => { const [x, y] = value.split(',').map(Number); context.fillStyle = '#2439b8'; context.fillRect(x * tile + 2, y * tile + 2, tile - 4, tile - 4); }); pellets.forEach(value => { const [x, y] = value.split(',').map(Number); const power = layout[y][x] === 'o'; context.fillStyle = power ? '#ffe66d' : '#fff4d6'; context.beginPath(); context.arc(x * tile + tile / 2, y * tile + tile / 2, power ? 7 : 2.5, 0, Math.PI * 2); context.fill(); }); context.fillStyle = '#ffe66d'; context.beginPath(); context.arc(pacman.x * tile + tile / 2, pacman.y * tile + tile / 2, tile * .38, .2, Math.PI * 2 - .2); context.lineTo(pacman.x * tile + tile / 2, pacman.y * tile + tile / 2); context.fill(); ghosts.forEach(ghost => { context.fillStyle = Date.now() < powerUntil ? '#23e7d7' : ghost.color; context.beginPath(); context.arc(ghost.x * tile + tile / 2, ghost.y * tile + tile / 2, tile * .35, Math.PI, 0); context.lineTo(ghost.x * tile + tile * .85, ghost.y * tile + tile * .8); context.lineTo(ghost.x * tile + tile * .15, ghost.y * tile + tile * .8); context.fill(); }); if (!running && score === 0) { context.fillStyle = '#fff4d6'; context.font = '14px "Press Start 2P"'; context.textAlign = 'center'; context.fillText('READY?', canvas.width / 2, canvas.height - 28); } }
window.addEventListener('keydown', event => { const keys = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }; if (!keys[event.key]) return; event.preventDefault(); nextDirection = keys[event.key]; begin(); });
document.querySelector('#restart').addEventListener('click', reset); reset();
