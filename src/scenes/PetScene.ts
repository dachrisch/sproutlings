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

const REACTION_PARTICLE: Record<Need, string> = {
  hunger: 'particle-morsel',
  happiness: 'particle-star',
  cleanliness: 'particle-droplet',
  energy: 'particle-zzz',
};

export class PetScene extends Phaser.Scene {
  private sprite?: Phaser.GameObjects.Image;
  private nameLabel?: Phaser.GameObjects.Text;
  private idleTween?: Phaser.Tweens.Tween;
  private transientTween?: Phaser.Tweens.Tween;
  private animState: PetAnimationState = initialPetAnimationState('content');
  private restY = 0;

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
    this.restY = this.sprite.y;
    this.cameras.main.filters.internal.addGlow(0x0f380f, 1, 0);

    this.animState = initialPetAnimationState(moodFor(monster));
    this.playForState(this.animState);

    bus.on(EVENTS.MONSTER_UPDATED, this.onMonsterUpdated, this);
    bus.on(EVENTS.ACTION, this.onAction, this);
    bus.on(EVENTS.RUN_AWAY, this.onRunAway, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off(EVENTS.MONSTER_UPDATED, this.onMonsterUpdated, this);
      bus.off(EVENTS.ACTION, this.onAction, this);
      bus.off(EVENTS.RUN_AWAY, this.onRunAway, this);
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
    }
    if (this.nameLabel) this.nameLabel.setText(monster.name);
    this.dispatch({ type: 'MOOD_UPDATED', mood: moodFor(monster) });
  }

  private onAction(need: Need): void {
    this.dispatch({ type: 'ACTION', need });
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

  private playIdle(mood: Mood): void {
    if (!this.sprite) return;
    this.idleTween?.stop();
    this.sprite.setAngle(0);
    this.sprite.setY(this.restY);
    const baseY = this.restY;
    const bounce = mood === 'happy' ? 6 : mood === 'sad' ? 1 : 3;
    const duration = mood === 'sad' ? 1400 : 700;
    const targetAngle = mood === 'happy' ? 4 : mood === 'sad' ? -3 : 0;

    this.idleTween = this.tweens.add({
      targets: this.sprite,
      y: baseY - bounce,
      angle: targetAngle,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private playReaction(need: Need): void {
    if (!this.sprite) return;
    this.idleTween?.pause();
    this.transientTween?.stop();
    const sprite = this.sprite;
    const onComplete = () => this.complete();

    switch (need) {
      case 'hunger':
        this.transientTween = this.tweens.add({
          targets: sprite,
          scaleX: { from: 0.85, to: 1 },
          scaleY: { from: 1.15, to: 1 },
          duration: 220,
          ease: 'Bounce.Out',
          onComplete,
        });
        break;
      case 'happiness':
        this.transientTween = this.tweens.add({
          targets: sprite,
          y: sprite.y - 10,
          angle: { from: 0, to: 8 },
          duration: 200,
          yoyo: true,
          ease: 'Sine.easeOut',
          onComplete,
        });
        break;
      case 'cleanliness':
        this.transientTween = this.tweens.add({
          targets: sprite,
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
          targets: sprite,
          y: sprite.y + 6,
          duration: 300,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete,
        });
        break;
    }

    this.spawnParticle(REACTION_PARTICLE[need], sprite.x, sprite.y - 16);
  }

  private playMoodShift(to: Mood): void {
    if (!this.sprite) return;
    this.idleTween?.pause();
    this.transientTween?.stop();
    const sprite = this.sprite;
    const onComplete = () => this.complete();

    if (to === 'happy') {
      this.transientTween = this.tweens.add({
        targets: sprite,
        y: sprite.y - 14,
        duration: 220,
        yoyo: true,
        onComplete,
      });
      this.spawnParticle('particle-star', sprite.x, sprite.y - 20);
      return;
    }
    if (to === 'sad') {
      this.transientTween = this.tweens.add({
        targets: sprite,
        scaleY: { from: 1, to: 0.85 },
        duration: 250,
        yoyo: true,
        onComplete,
      });
      return;
    }
    this.transientTween = this.tweens.add({
      targets: sprite,
      scale: { from: 0.95, to: 1 },
      duration: 200,
      onComplete,
    });
  }

  private playRunningAway(): void {
    if (!this.sprite) return;
    this.idleTween?.stop();
    this.transientTween?.stop();
    const sprite = this.sprite;
    this.spawnParticle('particle-poof', sprite.x, sprite.y);
    this.transientTween = this.tweens.add({
      targets: sprite,
      y: sprite.y - 30,
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
