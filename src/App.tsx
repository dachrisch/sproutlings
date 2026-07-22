import { useGameStore } from './store/gameStore';
import { TopBar } from './components/TopBar';
import { Garden } from './components/Garden';
import { Collection } from './components/Collection';
import { Shop } from './components/Shop';

export default function App() {
  const tab = useGameStore((s) => s.tab);

  return (
    <div className="app">
      <TopBar />
      <main className="main">
        {tab === 'garden' && <Garden />}
        {tab === 'collection' && <Collection />}
        {tab === 'shop' && <Shop />}
      </main>
    </div>
  );
}
