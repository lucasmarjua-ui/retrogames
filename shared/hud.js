import { Wallet } from './wallet.js';

export function mountHud(gameId, scoreElement, walletElement) {
  const renderWallet = () => { walletElement.textContent = Wallet.get(); };
  renderWallet();
  window.addEventListener('walletchange', renderWallet);
  return {
    setScore(score) { scoreElement.textContent = String(score).padStart(4, '0'); },
    awardCoins(score, divisor = 100) { return Wallet.add(Math.max(1, Math.floor(score / divisor))); },
    destroy() { window.removeEventListener('walletchange', renderWallet); }
  };
}
