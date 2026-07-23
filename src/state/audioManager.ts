import { useEffect, useRef } from 'react';
import type { BattleState } from '../types';
import { playHit, playCatchShake, playCatchSuccess, playCatchFail, playFaint, playLevelUp } from '../audio';

export function useBattleAudio(battleState: BattleState | null): void {
  const lastCount = useRef(0);

  useEffect(() => {
    if (!battleState) {
      lastCount.current = 0;
      return;
    }

    const events = battleState.events;
    if (events.length <= lastCount.current) return;

    const newEvents = events.slice(lastCount.current);
    lastCount.current = events.length;

    for (const event of newEvents) {
      switch (event.type) {
        case 'damage':
          playHit();
          break;
        case 'catchAttempt':
          playCatchShake();
          break;
        case 'catchSuccess':
          playCatchSuccess();
          break;
        case 'catchFail':
          playCatchFail();
          break;
        case 'faint':
          playFaint();
          break;
        case 'levelUp':
          playLevelUp();
          break;
      }
    }
  }, [battleState]);
}
