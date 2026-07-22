import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { playPurchase } from '../audio';
import {
  SLOT_CAP, slotPrice, LUCK_LEVEL_CAP, luckUpgradePrice,
  HAT_BOX_PRICE, HATS, SPARKLE_BASE_CHANCE, SPARKLE_PER_LUCK_LEVEL,
  SPARKLE_CHANCE_CAP,
} from '../constants';

export function Shop() {
  const coins = useGameStore((s) => s.coins);
  const slotCount = useGameStore((s) => s.slotCount);
  const luckLevel = useGameStore((s) => s.luckLevel);
  const ownedHats = useGameStore((s) => s.ownedHats);
  const sound = useGameStore((s) => s.settings.sound);
  const buySlotAct = useGameStore((s) => s.buySlot);
  const buyLuck = useGameStore((s) => s.buyLuckUpgrade);
  const buyHatBox = useGameStore((s) => s.buyHatBox);

  const slotCost = slotPrice(slotCount);
  const slotMaxed = slotCount >= SLOT_CAP;
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
      {coins < 5 && <p className="shop-hint">Send expeditions to earn more coins!</p>}

      <div className="shop-list">
        <div className={`shop-item ${slotMaxed || coins < slotCost ? 'unaffordable' : ''}`}>
          <div className="shop-info">
            <span className="shop-name">🗺️ Expedition Slot</span>
            <span className="shop-desc">Send more expeditions at once</span>
            <span className="shop-owned">{slotCount} / {SLOT_CAP}</span>
          </div>
          <div className="shop-action">
            <span className="shop-price">{Math.floor(slotCost)}🪙</span>
            <button className="buy-btn" disabled={slotMaxed || coins < slotCost} onClick={wrap(buySlotAct)} type="button">
              {slotMaxed ? 'Full!' : 'Buy'}
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
            <span className="shop-desc">A surprise hat for your creatures!</span>
            <span className="shop-owned">{ownedHats.length} / {HATS.length}</span>
          </div>
          <div className="shop-action">
            <span className="shop-price">{HAT_BOX_PRICE}🪙</span>
            <button className="buy-btn" disabled={hatsAllOwned || coins < HAT_BOX_PRICE} onClick={wrap(buyHatBox)} type="button">
              {hatsAllOwned ? 'All done!' : 'Buy'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
