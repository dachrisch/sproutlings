import Phaser from 'phaser';
import { bus, EVENTS } from '../bus';
import * as store from '../store';
import { moodFor, type Mood } from '../state';
import type { Monster, Need } from '../types';
import {
  initialPetAnimationState,
  transitionPetAnimation,
  type PetAnimationEvent,
  type PetAnimationState,
} from '../petAnimation';
import { blockButtons, unblockButtons } from '../ui/controls';

const ACTION_SCENE: Record<Need, string> = {
  hunger: 'FeedScene',
  happiness: 'PlayScene',
  cleanliness: 'CleanScene',
  energy: 'SleepScene',
};

// --- Idle behavioral system ---

type BehaviorKind = 'bounce' | 'blink' | 'lookLeft' | 'lookRight' | 'wiggle' | 'droop' | 'yawn';

interface BehaviorWeight {
  kind: BehaviorKind;
  weight: number;
}

const BEHAVIOR_POOL: Record<Mood, BehaviorWeight[]> = {
  happy: [
    { kind: 'bounce', weight: 3 },
    { kind: 'blink', weight: 2 },
    { kind: 'lookLeft', weight: 1 },
    { kind: 'lookRight', weight: 1 },
    { kind: 'wiggle', weight: 1 },
    { kind: 'yawn', weight: 1 },
  ],
  content: [
    { kind: 'bounce', weight: 2 },
    { kind: 'blink', weight: 2 },
    { kind: 'lookLeft', weight: 1 },
    { kind: 'lookRight', weight: 1 },
    { kind: 'yawn', weight: 1 },
  ],
  sad: [
    { kind: 'bounce', weight: 1 },
    { kind: 'blink', weight: 2 },
    { kind: 'droop', weight: 2 },
  ],
};

// Timing constants
const BREATHING_CYCLE = 2000;
const BLINK_DURATION = 600;
const LOOK_DURATION = 800;
const LOOK_DISTANCE = 4;
const WIGGLE_ANGLE = 8;
const WIGGLE_SWING_MS = 100;
const WIGGLE_REPEATS = 3;
const DROOP_DURATION = 1000;
const DROOP_SCALE = 0.92;
const YAWN_DURATION = 1200;
const YAWN_SCALEX = 1.15;
const SHADOW_BASE_W = 14;
const SHADOW_BASE_H = 3;
const SHADOW_Y_OFF = 22;
const BEHAVIOR_START_DELAY = 400;

export class PetScene extends Phaser.Scene {
  private sprite?: Phaser.GameObjects.Image;
  private nameLabel?: Phaser.GameObjects.Text;
  private shadow?: Phaser.GameObjects.Graphics;

  private idleTween?: Phaser.Tweens.Tween;
  private breathingTween?: Phaser.Tweens.Tween;
  private transientTween?: Phaser.Tweens.Tween;

  private nextBehaviorEvent?: Phaser.Time.TimerEvent;
  private baseSpeciesId = '';

  private animState: PetAnimationState = initialPetAnimationState('content');
  private currentMood: Mood = 'content';
  private restY = 0;
  private isScenePlaying = false;

  constructor() {
    super('Pet');
  }

  create(): void {
    const monster = store.getMonster();
    if (!monster) {
      this.scene.start('Hatch');
      return;
    }

    this.cameras.main.setBackgroundColor('#9bbc0f');
    this.drawGrid();

    this.nameLabel = this.add
      .text(80, 12, monster.name, { fontSize: '12px', color: '#0f380f' })
      .setOrigin(0.5);
    this.sprite = this.add.image(80, 80, monster.speciesId).setOrigin(0.5);
    this.baseSpeciesId = monster.speciesId;
    this.restY = this.sprite.y;

    this.shadow = this.add.graphics();
    this.updateShadow(0);

    this.cameras.main.filters.internal.addGlow(0x0f380f, 1, 0);

    this.currentMood = moodFor(monster);
    this.animState = initialPetAnimationState(this.currentMood);
    this.playForState(this.animState);

    bus.on(EVENTS.MONSTER_UPDATED, this.onMonsterUpdated, this);
    bus.on(EVENTS.ACTION, this.onAction, this);
    bus.on(EVENTS.RUN_AWAY, this.onRunAway, this);
    bus.on(EVENTS.SCENE_COMPLETE, this.onSceneComplete, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off(EVENTS.MONSTER_UPDATED, this.onMonsterUpdated, this);
      bus.off(EVENTS.ACTION, this.onAction, this);
      bus.off(EVENTS.RUN_AWAY, this.onRunAway, this);
      bus.off(EVENTS.SCENE_COMPLETE, this.onSceneComplete, this);
    });
  }

  private dispatch(event: PetAnimationEvent): void {
    const next = transitionPetAnimation(this.animState, event);
    if (next === this.animState) return;
    this.animState = next;
    this.playForState(next);
  }

  private onMonsterUpdated(monster: Monster | null): void {
    if (!monster) return;
    if (this.sprite && this.sprite.texture.key !== monster.speciesId) {
      this.sprite.setTexture(monster.speciesId);
      this.baseSpeciesId = monster.speciesId;
    }
    if (this.nameLabel) this.nameLabel.setText(monster.name);
    this.dispatch({ type: 'MOOD_UPDATED', mood: moodFor(monster) });
  }

  private onAction(need: Need): void {
    if (this.isScenePlaying) return;
    this.isScenePlaying = true;
    blockButtons();
    this.haltIdle();
    this.transientTween?.stop();
    const sceneName = ACTION_SCENE[need];
    this.scene.launch(sceneName, { speciesId: this.sprite?.texture.key ?? this.baseSpeciesId });
  }

  private onSceneComplete(): void {
    this.isScenePlaying = false;
    unblockButtons();
    const monster = store.getMonster();
    if (monster) {
      this.dispatch({ type: 'MOOD_UPDATED', mood: moodFor(monster) });
      if (this.animState.kind === 'idle') {
        this.startIdleBehaviors();
      }
    }
  }

  private onRunAway(): void {
    this.dispatch({ type: 'RUN_AWAY' });
  }

  private complete(): void {
    this.dispatch({ type: 'ANIMATION_COMPLETE' });
  }

  private playForState(state: PetAnimationState): void {
    if (!this.sprite) return;
    switch (state.kind) {
      case 'idle':
        this.playIdle(state.mood);
        break;
      case 'reacting':
        this.playReaction(state.need);
        break;
      case 'moodShift':
        this.playMoodShift(state.to);
        break;
      case 'runningAway':
        this.playRunningAway();
        break;
    }
  }

  // ===================== Idle behavior system =====================

  private haltIdle(): void {
    this.nextBehaviorEvent?.remove();
    this.idleTween?.stop();
    this.breathingTween?.stop();
  }

  private playIdle(mood: Mood): void {
    if (!this.sprite) return;
    this.currentMood = mood;
    this.startIdleBehaviors();
  }

  private startIdleBehaviors(): void {
    if (!this.sprite) return;
    this.haltIdle();
    this.sprite.setY(this.restY);
    this.sprite.setX(80);
    this.sprite.setAngle(0);
    this.sprite.setScale(1);
    this.updateShadow(0);
    this.startBreathing();
    this.time.delayedCall(
      BEHAVIOR_START_DELAY + Math.random() * 200,
      () => this.scheduleNextBehavior(),
    );
  }

  private startBreathing(): void {
    this.breathingTween?.stop();
    if (!this.sprite) return;
    this.sprite.setScale(1);
    this.breathingTween = this.tweens.add({
      targets: this.sprite,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: BREATHING_CYCLE / 2,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private scheduleNextBehavior(): void {
    if (!this.sprite || this.isScenePlaying) return;

    const delay = this.interBehaviorDelay();
    this.nextBehaviorEvent = this.time.delayedCall(delay, () => {
      if (!this.sprite || this.isScenePlaying) return;
      const kind = this.pickBehavior();
      this.breathingTween?.pause();
      this.runBehavior(kind);
    });
  }

  private interBehaviorDelay(): number {
    if (this.currentMood === 'sad') {
      return 2000 + Math.random() * 3000;
    }
    return 800 + Math.random() * 1700;
  }

  private pickBehavior(): BehaviorKind {
    const pool = BEHAVIOR_POOL[this.currentMood];
    const totalWeight = pool.reduce((sum, b) => sum + b.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const b of pool) {
      roll -= b.weight;
      if (roll <= 0) return b.kind;
    }
    return pool[0].kind;
  }

  private runBehavior(kind: BehaviorKind): void {
    switch (kind) {
      case 'bounce':
        this.playBounce();
        break;
      case 'blink':
        this.playBlink();
        break;
      case 'lookLeft':
        this.playLook(-1);
        break;
      case 'lookRight':
        this.playLook(1);
        break;
      case 'wiggle':
        this.playWiggle();
        break;
      case 'droop':
        this.playDroop();
        break;
      case 'yawn':
        this.playYawn();
        break;
    }
  }

  private playBounce(): void {
    if (!this.sprite) return;

    const bounceValues = {
      happy: { y: 6, duration: 700, angle: 4 },
      content: { y: 3, duration: 700, angle: 0 },
      sad: { y: 1, duration: 1400, angle: -3 },
    };
    const bv = bounceValues[this.currentMood];

    this.idleTween?.stop();
    this.sprite.setY(this.restY);
    this.sprite.setAngle(0);

    const behaviorTime =
      this.currentMood === 'sad'
        ? 3000 + Math.random() * 2000
        : 1500 + Math.random() * 2000;
    const repeatCount = Math.max(0, Math.floor(behaviorTime / bv.duration) - 1);

    this.idleTween = this.tweens.add({
      targets: this.sprite,
      y: this.restY - bv.y,
      angle: bv.angle,
      duration: bv.duration,
      yoyo: true,
      repeat: repeatCount,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (this.sprite && this.shadow) {
          this.updateShadow(this.restY - this.sprite.y);
        }
      },
      onComplete: () => {
        if (this.shadow) this.updateShadow(0);
        this.onBehaviorComplete();
      },
    });
  }

  private playBlink(): void {
    if (!this.sprite) return;
    const blinkKey = `${this.baseSpeciesId}_blink`;
    if (!this.textures.exists(blinkKey)) {
      this.onBehaviorComplete();
      return;
    }

    this.sprite.setTexture(blinkKey);
    this.nextBehaviorEvent = this.time.delayedCall(BLINK_DURATION, () => {
      if (this.sprite && this.textures.exists(this.baseSpeciesId)) {
        this.sprite.setTexture(this.baseSpeciesId);
      }
      this.onBehaviorComplete();
    });
  }

  private playLook(direction: -1 | 1): void {
    if (!this.sprite) return;
    this.transientTween = this.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + LOOK_DISTANCE * direction,
      duration: LOOK_DURATION / 2,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => this.onBehaviorComplete(),
    });
  }

  private playWiggle(): void {
    if (!this.sprite) return;
    this.transientTween = this.tweens.add({
      targets: this.sprite,
      angle: WIGGLE_ANGLE,
      duration: WIGGLE_SWING_MS,
      yoyo: true,
      repeat: WIGGLE_REPEATS,
      ease: 'Sine.easeInOut',
      onComplete: () => this.onBehaviorComplete(),
    });
  }

  private playDroop(): void {
    if (!this.sprite) return;
    this.transientTween = this.tweens.add({
      targets: this.sprite,
      scaleY: DROOP_SCALE,
      duration: DROOP_DURATION,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => this.onBehaviorComplete(),
    });
  }

  private playYawn(): void {
    if (!this.sprite) return;
    this.transientTween = this.tweens.add({
      targets: this.sprite,
      scaleX: YAWN_SCALEX,
      duration: YAWN_DURATION,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => this.onBehaviorComplete(),
    });
  }

  private onBehaviorComplete(): void {
    if (this.sprite) {
      this.sprite.setY(this.restY);
      this.sprite.setX(80);
      this.sprite.setAngle(0);
      this.sprite.setScale(1);
    }
    if (this.shadow) this.updateShadow(0);
    this.startBreathing();
    this.scheduleNextBehavior();
  }

  private updateShadow(heightDiff: number): void {
    if (!this.shadow || !this.sprite) return;
    this.shadow.clear();
    this.shadow.fillStyle(0x306230, 0.5);

    const ratio = Math.min(Math.abs(heightDiff) / 8, 1);
    const w = SHADOW_BASE_W + ratio * 8;
    const h = Math.max(1, SHADOW_BASE_H * (1 - ratio * 0.5));
    this.shadow.fillEllipse(this.sprite.x, this.restY + SHADOW_Y_OFF, w, h);
  }

  // ===================== Non-idle animations =====================

  private playReaction(need: Need): void {
    if (!this.sprite) return;
    this.haltIdle();
    this.transientTween?.stop();

    const particleMap: Record<Need, string> = {
      hunger: 'particle-morsel',
      happiness: 'particle-star',
      cleanliness: 'particle-droplet',
      energy: 'particle-zzz',
    };

    const onComplete = () => this.complete();

    switch (need) {
      case 'hunger':
        this.transientTween = this.tweens.add({
          targets: this.sprite,
          scaleX: { from: 0.85, to: 1 },
          scaleY: { from: 1.15, to: 1 },
          duration: 220,
          ease: 'Bounce.Out',
          onComplete,
        });
        break;
      case 'happiness':
        this.transientTween = this.tweens.add({
          targets: this.sprite,
          y: this.sprite.y - 10,
          angle: { from: 0, to: 8 },
          duration: 200,
          yoyo: true,
          ease: 'Sine.easeOut',
          onComplete,
        });
        break;
      case 'cleanliness':
        this.transientTween = this.tweens.add({
          targets: this.sprite,
          scaleX: { from: 1, to: 1.08 },
          angle: { from: 0, to: 5 },
          duration: 90,
          yoyo: true,
          repeat: 2,
          onComplete,
        });
        break;
      case 'energy':
        this.transientTween = this.tweens.add({
          targets: this.sprite,
          y: this.sprite.y + 6,
          duration: 300,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete,
        });
        break;
    }

    this.spawnParticle(particleMap[need], this.sprite.x, this.sprite.y - 16);
  }

  private playMoodShift(to: Mood): void {
    if (!this.sprite) return;
    this.haltIdle();
    this.transientTween?.stop();

    const onComplete = () => this.complete();

    if (to === 'happy') {
      this.transientTween = this.tweens.add({
        targets: this.sprite,
        y: this.sprite.y - 14,
        duration: 220,
        yoyo: true,
        onComplete,
      });
      this.spawnParticle('particle-star', this.sprite.x, this.sprite.y - 20);
      return;
    }
    if (to === 'sad') {
      this.transientTween = this.tweens.add({
        targets: this.sprite,
        scaleY: { from: 1, to: 0.85 },
        duration: 250,
        yoyo: true,
        onComplete,
      });
      return;
    }
    this.transientTween = this.tweens.add({
      targets: this.sprite,
      scale: { from: 0.95, to: 1 },
      duration: 200,
      onComplete,
    });
  }

  private playRunningAway(): void {
    if (!this.sprite) return;
    this.haltIdle();
    this.transientTween?.stop();

    this.spawnParticle('particle-poof', this.sprite.x, this.sprite.y);
    this.transientTween = this.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 30,
      alpha: 0,
      scale: 0.4,
      duration: 500,
      ease: 'Cubic.In',
      onComplete: () => this.scene.start('Hatch'),
    });
  }

  private spawnParticle(textureKey: string, x: number, y: number): void {
    const particle = this.add.image(x, y, textureKey).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: particle,
      alpha: { from: 0, to: 1 },
      y: y - 14,
      duration: 350,
      yoyo: true,
      onComplete: () => particle.destroy(),
    });
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x8bac0f, 0.4);
    for (let x = 0; x <= 160; x += 4) {
      graphics.lineBetween(x, 0, x, 144);
    }
    for (let y = 0; y <= 144; y += 4) {
      graphics.lineBetween(0, y, 160, y);
    }
  }
}
