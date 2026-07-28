import { describe, expect, it } from 'vitest';
import { initialPetAnimationState, transitionPetAnimation } from './petAnimation';

describe('initialPetAnimationState', () => {
  it('starts idle with the given mood', () => {
    expect(initialPetAnimationState('happy')).toEqual({ kind: 'idle', mood: 'happy' });
  });
});

describe('transitionPetAnimation', () => {
  it('RUN_AWAY wins from idle', () => {
    const state = initialPetAnimationState('content');
    expect(transitionPetAnimation(state, { type: 'RUN_AWAY' })).toEqual({ kind: 'runningAway' });
  });

  it('RUN_AWAY wins from reacting', () => {
    const state = { kind: 'reacting', need: 'hunger', mood: 'content' } as const;
    expect(transitionPetAnimation(state, { type: 'RUN_AWAY' })).toEqual({ kind: 'runningAway' });
  });

  it('RUN_AWAY wins from moodShift', () => {
    const state = { kind: 'moodShift', from: 'content', to: 'happy' } as const;
    expect(transitionPetAnimation(state, { type: 'RUN_AWAY' })).toEqual({ kind: 'runningAway' });
  });

  it('runningAway is terminal and ignores further events', () => {
    const state = { kind: 'runningAway' } as const;
    expect(transitionPetAnimation(state, { type: 'ACTION', need: 'hunger' })).toEqual({ kind: 'runningAway' });
  });

  it('an ACTION from idle enters reacting with the current mood', () => {
    const state = initialPetAnimationState('happy');
    expect(transitionPetAnimation(state, { type: 'ACTION', need: 'happiness' })).toEqual({
      kind: 'reacting',
      need: 'happiness',
      mood: 'happy',
    });
  });

  it('a MOOD_UPDATED to a different mood from idle enters moodShift', () => {
    const state = initialPetAnimationState('content');
    expect(transitionPetAnimation(state, { type: 'MOOD_UPDATED', mood: 'sad' })).toEqual({
      kind: 'moodShift',
      from: 'content',
      to: 'sad',
    });
  });

  it('a MOOD_UPDATED to the same mood from idle is a no-op (same reference)', () => {
    const state = initialPetAnimationState('content');
    expect(transitionPetAnimation(state, { type: 'MOOD_UPDATED', mood: 'content' })).toBe(state);
  });

  it('a new ACTION while reacting restarts the reaction with the new need', () => {
    const state = { kind: 'reacting', need: 'hunger', mood: 'content' } as const;
    expect(transitionPetAnimation(state, { type: 'ACTION', need: 'energy' })).toEqual({
      kind: 'reacting',
      need: 'energy',
      mood: 'content',
    });
  });

  it('an ACTION while reacting with the same need restarts (creates new state, not no-op)', () => {
    const state = { kind: 'reacting', need: 'hunger', mood: 'content' } as const;
    const next = transitionPetAnimation(state, { type: 'ACTION', need: 'hunger' });
    expect(next).toEqual({
      kind: 'reacting',
      need: 'hunger',
      mood: 'content',
    });
    expect(next).not.toBe(state);
  });

  it('a MOOD_UPDATED while reacting updates the mood silently without leaving reacting', () => {
    const state = { kind: 'reacting', need: 'hunger', mood: 'content' } as const;
    expect(transitionPetAnimation(state, { type: 'MOOD_UPDATED', mood: 'sad' })).toEqual({
      kind: 'reacting',
      need: 'hunger',
      mood: 'sad',
    });
  });

  it('a MOOD_UPDATED with the same mood while reacting is a no-op (same reference)', () => {
    const state = { kind: 'reacting', need: 'hunger', mood: 'sad' } as const;
    expect(transitionPetAnimation(state, { type: 'MOOD_UPDATED', mood: 'sad' })).toBe(state);
  });

  it('ANIMATION_COMPLETE while reacting returns to idle with the carried mood', () => {
    const state = { kind: 'reacting', need: 'hunger', mood: 'sad' } as const;
    expect(transitionPetAnimation(state, { type: 'ANIMATION_COMPLETE' })).toEqual({ kind: 'idle', mood: 'sad' });
  });

  it('an ACTION while moodShift is playing preempts it and enters reacting with the target mood', () => {
    const state = { kind: 'moodShift', from: 'content', to: 'happy' } as const;
    expect(transitionPetAnimation(state, { type: 'ACTION', need: 'cleanliness' })).toEqual({
      kind: 'reacting',
      need: 'cleanliness',
      mood: 'happy',
    });
  });

  it('a further MOOD_UPDATED while moodShift is playing updates the target mood', () => {
    const state = { kind: 'moodShift', from: 'content', to: 'happy' } as const;
    expect(transitionPetAnimation(state, { type: 'MOOD_UPDATED', mood: 'sad' })).toEqual({
      kind: 'moodShift',
      from: 'content',
      to: 'sad',
    });
  });

  it('a MOOD_UPDATED matching the current target while moodShift is playing is a no-op (same reference)', () => {
    const state = { kind: 'moodShift', from: 'content', to: 'happy' } as const;
    expect(transitionPetAnimation(state, { type: 'MOOD_UPDATED', mood: 'happy' })).toBe(state);
  });

  it('ANIMATION_COMPLETE while moodShift is playing settles into idle at the target mood', () => {
    const state = { kind: 'moodShift', from: 'content', to: 'happy' } as const;
    expect(transitionPetAnimation(state, { type: 'ANIMATION_COMPLETE' })).toEqual({ kind: 'idle', mood: 'happy' });
  });
});
