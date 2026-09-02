import { Wallet } from './wallet.js';

export const SLOT_COST = 2;
const SYMBOLS = ['CHERRY', 'BELL', 'STAR', '7'];
export function spin(cost = SLOT_COST) { const price = Math.max(0, Math.floor(Number(cost) || 0)); if (Wallet.get() < price) return { symbols: ['?', '?', '?'], prize: 0, message: 'NO HAY MONEDAS' }; Wallet.add(-price); const symbols = Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]); const matches = symbols.filter(symbol => symbol === symbols[0]).length; const prize = matches === 3 ? price * 10 : matches === 2 ? price * 2 : 0; if (prize) Wallet.add(prize); return { symbols, prize, matches, message: prize ? `PREMIO +${prize}` : 'SIN PREMIO' }; }
