import { useEffect, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { TopBar } from './components/TopBar';
import { Garden } from './components/Garden';
import { Collection } from './components/Collection';
import { Shop } from './components/Shop';
import { Confetti } from './components/Confetti';

export default function App() {
  const tab = useGameStore((s) => s.tab);
  const notification = useGameStore((s) => s.notification);
  const celebration = useGameStore((s) => s.celebration);
  const clearNotification = useGameStore((s) => s.clearNotification);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const msg: string | null = (useGameStore.getState().processOffline as () => string | null)();
    if (msg) {
      useGameStore.setState({ notification: msg });
    }
  }, []);

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

  return (
    <div className="app">
      <TopBar />
      <main className="main">
        {tab === 'garden' && <Garden />}
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
          type={celebration.type}
          onDone={() => useGameStore.setState({ celebration: null })}
        />
      )}
    </div>
  );
}
