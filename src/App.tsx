import { useEffect, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { playDiscovery, playComplete, playWelcome } from './audio';
import { TopBar } from './components/TopBar';
import { Garden } from './components/Garden';
import { Nursery } from './components/Nursery';
import { Collection } from './components/Collection';
import { Shop } from './components/Shop';
import { Confetti } from './components/Confetti';

export default function App() {
  const tab = useGameStore((s) => s.tab);
  const notification = useGameStore((s) => s.notification);
  const celebration = useGameStore((s) => s.celebration);
  const sound = useGameStore((s) => s.settings.sound);
  const clearNotification = useGameStore((s) => s.clearNotification);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const welcomePlayed = useRef(false);

  useEffect(() => {
    const msg: string | null = (useGameStore.getState().processOffline as () => string | null)();
    if (msg) {
      useGameStore.setState({ notification: msg });
      if (!welcomePlayed.current && sound) {
        playWelcome();
        welcomePlayed.current = true;
      }
    }
  }, [sound]);

  useEffect(() => {
    const id = setInterval(() => {
      useGameStore.getState().tick();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (notification) {
      if (notifTimer.current) clearTimeout(notifTimer.current);
      notifTimer.current = setTimeout(() => clearNotification(), 4000);
    }
    return () => {
      if (notifTimer.current) clearTimeout(notifTimer.current);
    };
  }, [notification, clearNotification]);

  useEffect(() => {
    if (celebration && sound) {
      if (celebration.type === 'complete') playComplete();
      else playDiscovery();
    }
  }, [celebration, sound]);

  return (
    <div className="app">
      <TopBar />
      <main className="main">
        {tab === 'garden' && <Garden />}
        {tab === 'nursery' && <Nursery />}
        {tab === 'collection' && <Collection />}
        {tab === 'shop' && <Shop />}
      </main>
      {notification && (
        <div className="toast" role="alert">
          {notification}
        </div>
      )}
      {celebration && (
        <Confetti
          type={celebration.type === 'stageup' || celebration.type === 'newform' ? 'new' : celebration.type}
          onDone={() => useGameStore.setState({ celebration: null })}
        />
      )}
    </div>
  );
}
