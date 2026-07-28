import type { Mood } from './state';
import type { Need } from './types';

export type PetAnimationState =
  | { kind: 'idle'; mood: Mood }
  | { kind: 'moodShift'; from: Mood; to: Mood }
  | { kind: 'reacting'; need: Need; mood: Mood }
  | { kind: 'runningAway' };

export type PetAnimationEvent =
  | { type: 'MOOD_UPDATED'; mood: Mood }
  | { type: 'ACTION'; need: Need }
  | { type: 'RUN_AWAY' }
  | { type: 'ANIMATION_COMPLETE' };

export function initialPetAnimationState(mood: Mood): PetAnimationState {
  return { kind: 'idle', mood };
}

export function transitionPetAnimation(
  state: PetAnimationState,
  event: PetAnimationEvent,
): PetAnimationState {
  if (event.type === 'RUN_AWAY') {
    return { kind: 'runningAway' };
  }
  if (state.kind === 'runningAway') {
    return state;
  }

  switch (state.kind) {
    case 'idle': {
      if (event.type === 'ACTION') {
        return { kind: 'reacting', need: event.need, mood: state.mood };
      }
      if (event.type === 'MOOD_UPDATED') {
        if (event.mood === state.mood) return state;
        return { kind: 'moodShift', from: state.mood, to: event.mood };
      }
      return state;
    }
    case 'reacting': {
      if (event.type === 'ACTION') {
        return { kind: 'reacting', need: event.need, mood: state.mood };
      }
      if (event.type === 'MOOD_UPDATED') {
        if (event.mood === state.mood) return state;
        return { kind: 'reacting', need: state.need, mood: event.mood };
      }
      if (event.type === 'ANIMATION_COMPLETE') {
        return { kind: 'idle', mood: state.mood };
      }
      return state;
    }
    case 'moodShift': {
      if (event.type === 'ACTION') {
        return { kind: 'reacting', need: event.need, mood: state.to };
      }
      if (event.type === 'MOOD_UPDATED') {
        if (event.mood === state.to) return state;
        return { kind: 'moodShift', from: state.from, to: event.mood };
      }
      if (event.type === 'ANIMATION_COMPLETE') {
        return { kind: 'idle', mood: state.to };
      }
      return state;
    }
  }
}
