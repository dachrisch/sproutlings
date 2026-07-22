import { useGameStore } from '../store/gameStore';
import {
  SEED_PRICE, PLOT_CAP, plotPrice, LUCK_LEVEL_CAP, luckUpgradePrice,
  HAT_BOX_PRICE, HATS,
} from '../constants';

export function Shop() {
  const coins = useGameStore((s) => s.coins);
  const seeds = useGameStore((s) => s.seeds);
  const plotCount = useGameStore((s) => s.plotCount);
  const luckLevel = useGameStore((s) => s.luckLevel);
  const ownedHats = useGameStore((s) => s.ownedHats);
  const buySeeds = useGameStore((s) => s.buySeeds);
  const buyPlot = useGameStore((s) => s.buyPlot);
  const buyLuckUpgrade = useGameStore((s) => s.buyLuckUpgrade);
  const buyHatBox = useGameStore((s) => s.buyHatBox);

  const plotCost = plotPrice(plotCount);
  const plotMaxed = plotCount >= PLOT_CAP;
  const luckCost = luckUpgradePrice(luckLevel);
  const luckMaxed = luckLevel >= LUCK_LEVEL_CAP;
  const hatsAllOwned = ownedHats.length >= HATS.length;

  return (
    <section className="view shop-view">
      <h2 className="section-title">Shop</h2>
      {coins < 5 && <p className="shop-hint">Hatch creatures to earn coins!</p>}

      <div className="shop-list">
        <div className={`shop-item ${coins < SEED_PRICE ? 'unaffordable' : ''}`}>
          <div className="shop-info">
            <span className="shop-name">Seed</span>
            <span className="shop-desc">Plant in an empty plot</span>
            <span className="shop-owned">Owned: {seeds}</span>
          </div>
          <div className="shop-action">
            <span className="shop-price">{SEED_PRICE}🪙</span>
            <button className="buy-btn" disabled={coins < SEED_PRICE} onClick={buySeeds} type="button">
              Buy
            </button>
          </div>
        </div>

        <div className={`shop-item ${plotMaxed || coins < plotCost ? 'unaffordable' : ''}`}>
          <div className="shop-info">
            <span className="shop-name">New Plot</span>
            <span className="shop-desc">Expand your garden</span>
            <span className="shop-owned">{plotCount} / {PLOT_CAP}</span>
          </div>
          <div className="shop-action">
            <span className="shop-price">{Math.floor(plotCost)}🪙</span>
            <button className="buy-btn" disabled={plotMaxed || coins < plotCost} onClick={buyPlot} type="button">
              {plotMaxed ? 'Max' : 'Buy'}
            </button>
          </div>
        </div>

        <div className={`shop-item ${luckMaxed || coins < luckCost ? 'unaffordable' : ''}`}>
          <div className="shop-info">
            <span className="shop-name">Luck Upgrade</span>
            <span className="shop-desc">Boost Sparkle chance</span>
            <span className="shop-owned">Level {luckLevel} / {LUCK_LEVEL_CAP}</span>
          </div>
          <div className="shop-action">
            <span className="shop-price">{Math.floor(luckCost)}🪙</span>
            <button className="buy-btn" disabled={luckMaxed || coins < luckCost} onClick={buyLuckUpgrade} type="button">
              {luckMaxed ? 'Max' : 'Buy'}
            </button>
          </div>
        </div>

        <div className={`shop-item ${hatsAllOwned || coins < HAT_BOX_PRICE ? 'unaffordable' : ''}`}>
          <div className="shop-info">
            <span className="shop-name">Hat Box</span>
            <span className="shop-desc">Unlock a new hat</span>
            <span className="shop-owned">{ownedHats.length} / {HATS.length}</span>
          </div>
          <div className="shop-action">
            <span className="shop-price">{HAT_BOX_PRICE}🪙</span>
            <button className="buy-btn" disabled={hatsAllOwned || coins < HAT_BOX_PRICE} onClick={buyHatBox} type="button">
              {hatsAllOwned ? 'All owned' : 'Buy'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
