import { useEffect } from 'react';
import { useGameStore } from './state/store';
import { BattleScreen } from './ui/BattleScreen';
import { BiomeSelect } from './ui/BiomeSelect';
import { TopBar } from './ui/TopBar';
import { PartyScreen } from './ui/PartyScreen';
import { CollectionScreen } from './ui/CollectionScreen';
import { CareScreen } from './ui/CareScreen';

export default function App() {
  const tab = useGameStore(s => s.tab);
  const notification = useGameStore(s => s.notification);
  const clearNotification = useGameStore(s => s.clearNotification);

  useEffect(() => {
    const state = useGameStore.getState();
    state.healAll();
  }, []);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => clearNotification(), 3000);
      return () => clearTimeout(t);
    }
  }, [notification, clearNotification]);

  return (
    <div className="app">
      <TopBar />
      <main className="main">
        {tab === 'battle' && <BattleScreen />}
        {tab === 'biomes' && <BiomeSelect />}
        {tab === 'party' && <PartyScreen />}
        {tab === 'collection' && <CollectionScreen />}
        {tab === 'care' && <CareScreen />}
      </main>
      {notification && (
        <div className="toast" role="alert">
          {notification}
        </div>
      )}
    </div>
  );
}
