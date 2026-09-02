import { mountHud } from '../../shared/hud.js';
import { getBestScore, saveScore } from '../../shared/records.js';
import { Audio } from '../../shared/audio.js';
import '../../shared/skins.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const hud = mountHud('tetris', document.querySelector('#score'), document.querySelector('#wallet-count'));
const status = document.querySelector('#status');
const W = 10, H = 20, size = 30;
const shapes = [
  [[1,1,1,1]], [[1,1],[1,1]], [[0,1,0],[1,1,1]], [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]], [[0,1,1],[1,1,0]], [[1,1,0],[0,1,1]]
];
const colors = ['#23e7d7','#ffe66d','#ff4f9a','#ff8b3d','#62e889','#f04462','#a78bfa'];
let board, piece, score, level, dropTimer, running;
const best = () => getBestScore('tetris');
function rotate(matrix) { return matrix[0].map((_, x) => matrix.map(row => row[x]).reverse()); }
function collision(candidate = piece) { return candidate.shape.some((row, y) => row.some((cell, x) => cell && (candidate.x + x < 0 || candidate.x + x >= W || candidate.y + y >= H || board[candidate.y + y]?.[candidate.x + x]))); }
function spawn() { const n = Math.floor(Math.random() * shapes.length); piece = { shape: shapes[n].map(row => [...row]), color: colors[n], x: 3, y: 0 }; if (collision()) end(); }
function merge() { piece.shape.forEach((row, y) => row.forEach((cell, x) => { if (cell) board[piece.y + y][piece.x + x] = piece.color; })); }
function clearLines() { let lines = 0; board = board.filter(row => { if (row.every(Boolean)) { lines++; return false; } return true; }); while (board.length < H) board.unshift(Array(W).fill('')); if (lines) { score += [0,100,300,500,800][lines] * level; level = Math.floor(score / 1000) + 1; Audio.playSfx(lines > 1 ? 'levelup' : 'eat'); if (running) { clearInterval(dropTimer); dropTimer = setInterval(drop, Math.max(100, 650 - level * 45)); } } }
function draw() { ctx.fillStyle = '#050717'; ctx.fillRect(0,0,canvas.width,canvas.height); [...board.map((row,y) => row.map((color,x) => ({color,x,y}))), ...piece.shape.flatMap((row,y) => row.map((cell,x) => cell ? {color:piece.color,x:piece.x+x,y:piece.y+y} : null))].filter(Boolean).forEach(cell => { ctx.fillStyle = cell.color; ctx.fillRect(cell.x*size+1, cell.y*size+1, size-2, size-2); }); hud.setScore(score); document.querySelector('#best').textContent = String(best()).padStart(4,'0'); }
function drop() { if (!running) return; piece.y++; if (collision()) { piece.y--; merge(); clearLines(); spawn(); } draw(); }
function start() { if (running) return; running = true; status.textContent = 'EN JUEGO'; dropTimer = setInterval(drop, Math.max(100, 650 - level * 45)); }
function end() { running = false; clearInterval(dropTimer); saveScore('tetris', score, {bronze:500,silver:1500,gold:4000}); hud.awardCoins(score, 250); status.textContent = 'GAME OVER'; Audio.playSfx('gameover'); }
function reset() { clearInterval(dropTimer); board = Array.from({length:H}, () => Array(W).fill('')); score = 0; level = 1; running = false; spawn(); status.textContent = 'PULSA UNA FLECHA'; draw(); }
document.addEventListener('keydown', event => { if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(event.key)) return; event.preventDefault(); start(); if (event.key === 'ArrowLeft') { piece.x--; if (collision()) piece.x++; } if (event.key === 'ArrowRight') { piece.x++; if (collision()) piece.x--; } if (event.key === 'ArrowUp') { const old = piece.shape; piece.shape = rotate(piece.shape); if (collision()) piece.shape = old; } if (event.key === 'ArrowDown') drop(); if (event.key === ' ') while (!collision()) piece.y++; piece.y--; draw(); });
document.querySelector('#restart').addEventListener('click', reset); reset();
