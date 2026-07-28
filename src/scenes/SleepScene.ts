import Phaser from 'phaser';
import { bus, EVENTS } from '../bus';

const CREATURE_X = 80;
const CREATURE_Y = 72;

export class SleepScene extends Phaser.Scene {
  constructor() {
    super('SleepScene');
  }

  create(data: { speciesId: string }): void {
    this.cameras.main.setBackgroundColor('#306230');
    this.drawBackground();

    const pillow = this.add.image(CREATURE_X, CREATURE_Y + 18, 'prop-pillow').setOrigin(0.5).setScale(1.3);
    const creature = this.add.image(CREATURE_X, CREATURE_Y - 4, data.speciesId).setOrigin(0.5);

    // Phase 1: yawn/stretch (800ms)
    this.tweens.add({
      targets: creature,
      scaleX: 1.2,
      scaleY: 0.8,
      duration: 400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 1,
    });

    // Phase 2: lie down onto pillow (start at 800ms)
    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: creature,
        y: CREATURE_Y + 8,
        angle: 15,
        scaleX: 1.1,
        scaleY: 0.75,
        duration: 500,
        ease: 'Sine.easeInOut',
      });
    });

    // Phase 3: dim (start at 1300ms)
    this.time.delayedCall(1300, () => {
      this.tweens.add({
        targets: creature,
        alpha: 0.7,
        duration: 300,
        ease: 'Sine.easeInOut',
      });
    });

    // Zzz particles during sleep (start at 1200ms)
    this.time.delayedCall(1200, () => {
      for (let i = 0; i < 4; i++) {
        this.time.delayedCall(i * 350, () => this.spawnZzz());
      }
    });

    // Gentle snore pulse (start at 1400ms)
    this.time.delayedCall(1400, () => {
      this.tweens.add({
        targets: creature,
        scaleX: { from: 1.05, to: 1.15 },
        scaleY: { from: 0.7, to: 0.8 },
        duration: 400,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
      });
    });

    // Wake up (start at 2600ms)
    this.time.delayedCall(2600, () => {
      this.tweens.add({
        targets: creature,
        y: CREATURE_Y - 4,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 400,
        ease: 'Back.Out',
        onComplete: () => this.spawnParticle('particle-star', CREATURE_X, CREATURE_Y - 24),
      });
    });

    // Fade out (start at 3000ms)
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [creature, pillow],
        alpha: 0,
        duration: 200,
        ease: 'Sine.easeIn',
        onComplete: () => this.finish(),
      });
    });

    this.time.delayedCall(3500, () => this.finish());
  }

  private spawnZzz(): void {
    const zzz = this.add.image(CREATURE_X + 16, CREATURE_Y - 10, 'particle-zzz').setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: zzz,
      alpha: { from: 0, to: 0.8 },
      x: CREATURE_X + 24,
      y: CREATURE_Y - 30,
      scale: { from: 0.6, to: 1 },
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: zzz,
          alpha: 0,
          y: CREATURE_Y - 40,
          duration: 300,
          onComplete: () => zzz.destroy(),
        });
      },
    });
  }

  private spawnParticle(textureKey: string, x: number, y: number): void {
    const p = this.add.image(x, y, textureKey).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: p,
      alpha: { from: 0, to: 1 },
      y: y - 16,
      scale: { from: 0.5, to: 1.2 },
      duration: 350,
      yoyo: true,
      onComplete: () => p.destroy(),
    });
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x0f380f, 0.2);
    for (let x = 0; x <= 160; x += 4) {
      graphics.lineBetween(x, 0, x, 144);
    }
    for (let y = 0; y <= 144; y += 4) {
      graphics.lineBetween(0, y, 160, y);
    }
    const moon = this.add.circle(136, 20, 6, 0x8bac0f, 0.6);
    this.tweens.add({
      targets: moon,
      alpha: { from: 0.4, to: 0.8 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private finish(): void {
    bus.emit(EVENTS.SCENE_COMPLETE);
    this.scene.stop('SleepScene');
  }
}
