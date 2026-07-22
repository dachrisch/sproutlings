import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { playPurchase } from '../audio';
import {
  SEED_PRICE, PLOT_CAP, plotPrice, LUCK_LEVEL_CAP, luckUpgradePrice,
  HAT_BOX_PRICE, HATS, SPARKLE_BASE_CHANCE, SPARKLE_PER_LUCK_LEVEL,
  SPARKLE_CHANCE_CAP, FOOD_PRICE, TOY_PRICE,
} from '../constants';

export function Shop() {
  const coins = useGameStore((s) => s.coins);
  const seeds = useGameStore((s) => s.seeds);
  const plotCount = useGameStore((s) => s.plotCount);
  const luckLevel = useGameStore((s) => s.luckLevel);
  const ownedHats = useGameStore((s) => s.ownedHats);
  const inventory = useGameStore((s) => s.inventory);
  const sound = useGameStore((s) => s.settings.sound);
  const buySeeds = useGameStore((s) => s.buySeeds);
  const buyPlotAct = useGameStore((s) => s.buyPlot);
  const buyLuck = useGameStore((s) => s.buyLuckUpgrade);
  const buyHatBox = useGameStore((s) => s.buyHatBox);
  const buyFood = useGameStore((s) => s.buyFood);
  const buyToy = useGameStore((s) => s.buyToy);

  const plotCost = plotPrice(plotCount);
  const plotMaxed = plotCount >= PLOT_CAP;
  const luckCost = luckUpgradePrice(luckLevel);
  const luckMaxed = luckLevel >= LUCK_LEVEL_CAP;
  const hatsAllOwned = ownedHats.length >= HATS.length;
  const sparkleChance = Math.min(
    SPARKLE_BASE_CHANCE + luckLevel * SPARKLE_PER_LUCK_LEVEL,
    SPARKLE_CHANCE_CAP
  );

  const wrap = useCallback(
    (fn: () => boolean | string | null) => () => {
      const ok = fn();
      if (ok && sound) playPurchase();
    },
    [sound]
  );

  return (
    <section className="view shop-view">
      <h2 className="section-title">Shop</h2>
      {coins < 5 && <p className="shop-hint">Train your creatures to earn coins!</p>}

      <div className="shop-list">
        <div className={`shop-item ${coins < SEED_PRICE ? 'unaffordable' : ''}`}>
          <div className="shop-info">
            <span className="shop-name">🌱 Seed</span>
            <span className="shop-desc">Plant in an empty plot</span>
            <span className="shop-owned">You have: {seeds}</span>
          </div>
          <div className="shop-action">
            <span className="shop-price">{SEED_PRICE}🪙</span>
            <button className="buy-btn" disabled={coins < SEED_PRICE} onClick={wrap(buySeeds)} type="button">
              Buy
            </button>
          </div>
        </div>

        <div className={`shop-item ${plotMaxed || coins < plotCost ? 'unaffordable' : ''}`}>
          <div className="shop-info">
            <span className="shop-name">📦 New Plot</span>
            <span className="shop-desc">More room for planting</span>
            <span className="shop-owned">{plotCount} / {PLOT_CAP}</span>
          </div>
          <div className="shop-action">
            <span className="shop-price">{Math.floor(plotCost)}🪙</span>
            <button className="buy-btn" disabled={plotMaxed || coins < plotCost} onClick={wrap(buyPlotAct)} type="button">
              {plotMaxed ? 'Full!' : 'Buy'}
            </button>
          </div>
        </div>

        <div className={`shop-item ${luckMaxed || coins < luckCost ? 'unaffordable' : ''}`}>
          <div className="shop-info">
            <span className="shop-name">🍀 Luck Upgrade</span>
            <span className="shop-desc">Sparkle chance: {(sparkleChance * 100).toFixed(0)}%</span>
            <span className="shop-owned">Level {luckLevel} / {LUCK_LEVEL_CAP}</span>
          </div>
          <div className="shop-action">
            <span className="shop-price">{Math.floor(luckCost)}🪙</span>
            <button className="buy-btn" disabled={luckMaxed || coins < luckCost} onClick={wrap(buyLuck)} type="button">
              {luckMaxed ? 'Maxed!' : 'Buy'}
            </button>
          </div>
        </div>

        <div className={`shop-item ${hatsAllOwned || coins < HAT_BOX_PRICE ? 'unaffordable' : ''}`}>
          <div className="shop-info">
            <span className="shop-name">🎩 Hat Box</span>
            <span className="shop-desc">A surprise hat!</span>
            <span className="shop-owned">{ownedHats.length} / {HATS.length}</span>
          </div>
          <div className="shop-action">
            <span className="shop-price">{HAT_BOX_PRICE}🪙</span>
            <button className="buy-btn" disabled={hatsAllOwned || coins < HAT_BOX_PRICE} onClick={wrap(buyHatBox)} type="button">
              {hatsAllOwned ? 'All done!' : 'Buy'}
            </button>
          </div>
        </div>

        <div className={`shop-item ${coins < FOOD_PRICE ? 'unaffordable' : ''}`}>
          <div className="shop-info">
            <span className="shop-name">🍽️ Food</span>
            <span className="shop-desc">Feed a nursery creature</span>
            <span className="shop-owned">You have: {inventory.food}</span>
          </div>
          <div className="shop-action">
            <span className="shop-price">{FOOD_PRICE}🪙</span>
            <button className="buy-btn" disabled={coins < FOOD_PRICE} onClick={wrap(buyFood)} type="button">
              Buy
            </button>
          </div>
        </div>

        <div className={`shop-item ${coins < TOY_PRICE ? 'unaffordable' : ''}`}>
          <div className="shop-info">
            <span className="shop-name">🧸 Toy</span>
            <span className="shop-desc">Play with a nursery creature</span>
            <span className="shop-owned">You have: {inventory.toys}</span>
          </div>
          <div className="shop-action">
            <span className="shop-price">{TOY_PRICE}🪙</span>
            <button className="buy-btn" disabled={coins < TOY_PRICE} onClick={wrap(buyToy)} type="button">
              Buy
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
