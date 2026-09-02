const WALLET_KEY = 'retrogames.wallet';

export const Wallet = {
  get() {
    return Number.parseInt(localStorage.getItem(WALLET_KEY) || '0', 10) || 0;
  },
  add(amount) {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
    const total = this.get() + safeAmount;
    localStorage.setItem(WALLET_KEY, String(total));
    window.dispatchEvent(new CustomEvent('walletchange', { detail: total }));
    return total;
  }
};
