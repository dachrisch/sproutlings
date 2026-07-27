import Phaser from 'phaser';
import { bus, EVENTS } from '../bus';
import * as store from '../store';
import { moodFor } from '../state';
import type { Monster, Need } from '../types';

export class PetScene extends Phaser.Scene {
  private sprite?: Phaser.GameObjects.Image;
  private idleTween?: Phaser.Tweens.Tween;

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

    this.sprite = this.add.image(80, 80, monster.speciesId).setOrigin(0.5);
    this.cameras.main.filters.internal.addGlow(0x0f380f, 1, 0);
    this.startIdleTween(monster);

    bus.on(EVENTS.MONSTER_UPDATED, this.onMonsterUpdated, this);
    bus.on(EVENTS.ACTION, this.onAction, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off(EVENTS.MONSTER_UPDATED, this.onMonsterUpdated, this);
      bus.off(EVENTS.ACTION, this.onAction, this);
    });
  }

  private onMonsterUpdated(monster: Monster | null): void {
    if (!monster) {
      this.scene.start('Hatch');
      return;
    }
    if (this.sprite && this.sprite.texture.key !== monster.speciesId) {
      this.sprite.setTexture(monster.speciesId);
    }
    this.startIdleTween(monster);
  }

  private onAction(_need: Need): void {
    if (!this.sprite) return;
    this.tweens.add({
      targets: this.sprite,
      scale: { from: 1.15, to: 1 },
      duration: 200,
      ease: 'Bounce.Out',
    });
  }

  private startIdleTween(monster: Monster): void {
    if (!this.sprite) return;
    this.idleTween?.stop();
    const mood = moodFor(monster);
    const bounce = mood === 'happy' ? 6 : mood === 'sad' ? 1 : 3;
    const duration = mood === 'sad' ? 1400 : 700;
    this.idleTween = this.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - bounce,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
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
