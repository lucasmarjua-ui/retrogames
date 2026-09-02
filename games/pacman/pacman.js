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
const hud = mountHud('pacman', scoreElement, document.querySelector('#wallet-count'));
const layouts = [['#####################','#o........#........o#','#.###.###.#.###.###.#','#...................#','#.###.#.#####.#.###.#','#.....#...#...#.....#','#####.### # ###.#####','#.........P.........#','###.#.##     ##.#.###','#...#.#G   G #.#...#','###.#.##     ##.#.###','#.........#.........#','#####.### # ###.#####','#.....#...#...#.....#','#.###.#.#####.#.###.#','#...................#','#.###.###.#.###.###.#','#o........#........o#','#####################'], ['#####################','#o....#...#...#....o#','#.###.#.#.#.#.#.###.#','#.....#.#...#.#.....#','###.#.###.#.###.#.###','#...#...#...#...#...#','#.#.###.## # ##.###.#','#.#.....P   .....#.#','#.###.###   ###.###.#','#...#.#G   G #.#...#','#.###.###   ###.###.#','#.#.....   .....#.#','#.#.###.## # ##.###.#','#...#...#...#...#...#','###.#.###.#.###.#.###','#.....#.#...#.#.....#','#.###.#.#.#.#.#.###.#','#o....#...#...#....o#','#####################']];
let layout = layouts[0];
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
let paused;
let mapIndex = -1;
let level;
let fruit;
let fruitExpiresAt;
let fruitSpawns;
function key(x, y) { return `${x},${y}`; }
function loadMap() { mapIndex = (mapIndex + 1) % layouts.length; layout = layouts[mapIndex].map(row => row.padEnd(21, '#').slice(0, 21)); walls.clear(); pellets.clear(); layout.forEach((row, y) => [...row].forEach((value, x) => { if (value === '#') walls.add(key(x, y)); if (value === '.' || value === 'o') pellets.add(key(x, y)); })); pacman = { x: 10, y: 7 }; ghosts = [{ x: 9, y: 9, color: '#f04462', role: 'chase', mode: 'normal' }, { x: 11, y: 9, color: '#ff8b3d', role: 'ambush', mode: 'normal' }, { x: 10, y: 9, color: '#d06cff', role: 'erratic', mode: 'normal' }]; direction = { x: 0, y: 0 }; nextDirection = { x: 0, y: 0 }; powerUntil = 0; fruit = null; fruitExpiresAt = 0; }
function reset() { clearInterval(timer); score = 0; pelletsEaten = 0; fruitSpawns = 0; level = 1; running = false; paused = false; loadMap(); hud.setScore(score); bestElement.textContent = String(getBestScore('pacman')).padStart(4, '0'); statusElement.textContent = 'PULSA UNA FLECHA'; draw(); }
function nextLevel() { if (level === 1) unlockAchievement('pacman-perfect'); level++; loadMap(); Audio.playSfx('levelup'); statusElement.textContent = `NIVEL ${level}`; draw(); }
function spawnFruit() { fruit = { x: 10, y: 9, type: fruitSpawns % 2 ? 'CHERRY' : 'BELL' }; fruitExpiresAt = Date.now() + 6500; fruitSpawns++; }
function fruitStatus(now) { return fruit ? `FRUTA ${Math.max(0, Math.ceil((fruitExpiresAt - now) / 1000))}s` : ''; }
function begin() { if (running) return; running = true; statusElement.textContent = 'EN JUEGO'; timer = setInterval(tick, 170); }
function canMove(position, move) { return !walls.has(key(position.x + move.x, position.y + move.y)); }
function tick() { if (paused) return; const now = Date.now(); if (fruit && now >= fruitExpiresAt) fruit = null; if (canMove(pacman, nextDirection)) direction = nextDirection; if (canMove(pacman, direction)) { pacman.x += direction.x; pacman.y += direction.y; } const pellet = key(pacman.x, pacman.y); if (pellets.has(pellet)) { pellets.delete(pellet); pelletsEaten++; if (pelletsEaten >= 50) unlockAchievement('pacman-pellets'); const power = layout[pacman.y][pacman.x] === 'o'; score += power ? 50 : 10; Audio.playSfx('eat'); if (power) { powerUntil = now + 7000; ghosts.forEach(ghost => { if (ghost.mode !== 'returning') ghost.mode = 'frightened'; }); Audio.playSfx('levelup'); } if (pelletsEaten >= 15 && fruitSpawns < 2 && !fruit) spawnFruit(); hud.setScore(score); } if (fruit && pacman.x === fruit.x && pacman.y === fruit.y) { score += 300; Wallet.add(3); fruit = null; Audio.playSfx('coin'); hud.setScore(score); } ghosts.forEach(ghost => moveGhost(ghost)); const caught = ghosts.find(ghost => ghost.mode !== 'returning' && ghost.x === pacman.x && ghost.y === pacman.y); if (caught) { if (now < powerUntil) { score += 200; unlockAchievement('pacman-ghost'); caught.mode = 'returning'; Audio.playSfx('eat'); hud.setScore(score); } else return endGame(); } if (!pellets.size) return nextLevel(); draw(); }
function moveGhost(ghost) { const moves = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].filter(move => canMove(ghost, move)); if (!moves.length) return; if (ghost.mode === 'returning') { const base = { x: 10, y: 9 }; if (ghost.x === base.x && ghost.y === base.y) { ghost.mode = 'normal'; return; } moves.sort((a, b) => Math.abs(ghost.x + a.x - base.x) + Math.abs(ghost.y + a.y - base.y) - Math.abs(ghost.x + b.x - base.x) - Math.abs(ghost.y + b.y - base.y)); } else if (Date.now() < powerUntil) { moves.sort(() => Math.random() - .5); } else { let target = pacman; if (ghost.role === 'ambush') target = { x: pacman.x + nextDirection.x * 4, y: pacman.y + nextDirection.y * 4 }; if (ghost.role === 'erratic' && Math.abs(ghost.x - pacman.x) + Math.abs(ghost.y - pacman.y) > 5 && Math.random() < .75) moves.sort(() => Math.random() - .5); else moves.sort((a, b) => Math.abs(ghost.x + a.x - target.x) + Math.abs(ghost.y + a.y - target.y) - Math.abs(ghost.x + b.x - target.x) - Math.abs(ghost.y + b.y - target.y)); } ghost.x += moves[0].x; ghost.y += moves[0].y; }
function endGame(won = false) { clearInterval(timer); running = false; if (won) unlockAchievement('pacman-perfect'); const result = saveScore('pacman', score, { bronze: 400, silver: 1000, gold: 2000 }); Wallet.add(Math.max(1, Math.floor(score / 100))); Audio.playSfx('coin'); Audio.playSfx(won ? 'levelup' : 'gameover'); bestElement.textContent = String(result.bestScore).padStart(4, '0'); statusElement.textContent = won ? `LABERINTO LIMPIO / ${result.medal ? result.medal.toUpperCase() : 'SIN MEDALLA'}` : `GAME OVER / ${result.medal ? result.medal.toUpperCase() : 'SIN MEDALLA'}`; draw(); }
function drawBase() { context.fillStyle = '#050717'; context.fillRect(0, 0, canvas.width, canvas.height); walls.forEach(value => { const [x, y] = value.split(',').map(Number); context.fillStyle = '#2439b8'; context.fillRect(x * tile + 2, y * tile + 2, tile - 4, tile - 4); }); pellets.forEach(value => { const [x, y] = value.split(',').map(Number); const power = layout[y][x] === 'o'; context.fillStyle = power ? '#ffe66d' : '#fff4d6'; context.beginPath(); context.arc(x * tile + tile / 2, y * tile + tile / 2, power ? 7 : 2.5, 0, Math.PI * 2); context.fill(); }); context.fillStyle = '#ffe66d'; context.beginPath(); context.arc(pacman.x * tile + tile / 2, pacman.y * tile + tile / 2, tile * .38, .2, Math.PI * 2 - .2); context.lineTo(pacman.x * tile + tile / 2, pacman.y * tile + tile / 2); context.fill(); ghosts.forEach(ghost => { context.fillStyle = ghost.mode === 'returning' ? '#050717' : Date.now() < powerUntil ? '#23e7d7' : ghost.color; context.beginPath(); context.arc(ghost.x * tile + tile / 2, ghost.y * tile + tile / 2, tile * .35, Math.PI, 0); context.lineTo(ghost.x * tile + tile * .85, ghost.y * tile + tile * .8); context.lineTo(ghost.x * tile + tile * .15, ghost.y * tile + tile * .8); context.fill(); }); if (!running && score === 0) { context.fillStyle = '#fff4d6'; context.font = '14px "Press Start 2P"'; context.textAlign = 'center'; context.fillText('READY?', canvas.width / 2, canvas.height - 28); } }
function draw() { drawBase(); const now = Date.now(); if (fruit) { context.fillStyle = fruit.type === 'CHERRY' ? '#f04462' : '#ffe66d'; context.beginPath(); context.arc(fruit.x * tile + tile / 2, fruit.y * tile + tile / 2, 8, 0, Math.PI * 2); context.fill(); context.fillStyle = '#62e889'; context.fillRect(fruit.x * tile + tile / 2, fruit.y * tile + 2, 3, 7); } ghosts.forEach(ghost => { if (ghost.mode === 'returning') { context.fillStyle = '#fff4d6'; context.fillRect(ghost.x * tile + tile * .32, ghost.y * tile + tile * .36, 5, 7); context.fillRect(ghost.x * tile + tile * .55, ghost.y * tile + tile * .36, 5, 7); } }); if (fruit && running) statusElement.textContent = fruitStatus(now); }
window.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); if (running) { paused = !paused; statusElement.textContent = paused ? 'PAUSA' : 'EN JUEGO'; } return; } const keys = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }; if (!keys[event.key]) return; event.preventDefault(); nextDirection = keys[event.key]; begin(); });
document.querySelector('#restart').addEventListener('click', reset); showTutorialOnce('pacman', '<p>FLECHAS: MOVER<br>ESC: PAUSA</p>'); reset();
