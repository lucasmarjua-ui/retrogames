import { Wallet } from './wallet.js';

export const SLOT_COST = 5;
export const SLOT_BETS = [5, 10, 25, 50];
export const SLOT_SYMBOLS = ['CHERRY', 'BELL', 'STAR', '7'];
export function spin(cost = SLOT_COST) { const price = Math.max(0, Math.floor(Number(cost) || 0)); if (Wallet.get() < price) return { symbols: ['?', '?', '?'], prize: 0, matches: 0, kind: 'none', message: 'NO HAY MONEDAS' }; Wallet.add(-price); const symbols = Array.from({ length: 3 }, () => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]); const matches = symbols.filter(symbol => symbol === symbols[0]).length; const prize = matches === 3 ? price * 10 : matches === 2 ? price * 2 : 0; const kind = matches === 3 ? 'jackpot' : matches === 2 ? 'small' : 'none'; if (prize) Wallet.add(prize); return { symbols, prize, matches, kind, message: kind === 'jackpot' ? `¡GANASTE ${prize} MONEDAS!` : kind === 'small' ? `PREMIO PEQUEÑO +${prize}` : 'SIN PREMIO' }; }
