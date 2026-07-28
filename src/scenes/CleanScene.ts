import Phaser from 'phaser';
import { bus, EVENTS } from '../bus';

const CREATURE_X = 80;
const CREATURE_Y = 72;

export class CleanScene extends Phaser.Scene {
  constructor() {
    super('CleanScene');
  }

  create(data: { speciesId: string }): void {
    this.cameras.main.setBackgroundColor('#9bbc0f');
    this.drawBackground();

    const creature = this.add.image(CREATURE_X, CREATURE_Y, data.speciesId).setOrigin(0.5);
    const sponge = this.add.image(CREATURE_X + 28, CREATURE_Y - 16, 'prop-sponge').setOrigin(0.5).setScale(1.2).setAlpha(0);

    // Phase 1: sponge appears (200ms)
    this.tweens.add({
      targets: sponge,
      alpha: 1,
      x: CREATURE_X + 20,
      y: CREATURE_Y - 10,
      duration: 200,
      ease: 'Sine.easeOut',
    });

    // Phase 2: scrub top (start at 200ms)
    this.time.delayedCall(200, () => {
      this.tweens.add({
        targets: sponge,
        x: CREATURE_X - 10,
        angle: -10,
        duration: 200,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: 1,
        onUpdate: () => {
          if (Math.random() < 0.3) this.spawnBubble(sponge.x, sponge.y + 8);
        },
      });
    });

    // Phase 3: scrub side (start at 600ms)
    this.time.delayedCall(600, () => {
      this.tweens.add({
        targets: sponge,
        x: CREATURE_X + 14,
        y: CREATURE_Y + 8,
        angle: 10,
        duration: 200,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: 1,
        onUpdate: () => {
          if (Math.random() < 0.3) this.spawnBubble(sponge.x, sponge.y + 8);
        },
      });
    });

    // Phase 4: sponge retreats (start at 1000ms)
    this.time.delayedCall(1000, () => {
      this.tweens.add({
        targets: sponge,
        x: CREATURE_X + 24,
        y: CREATURE_Y - 14,
        angle: 0,
        duration: 200,
        ease: 'Sine.easeInOut',
      });
    });

    // Spawn bubble burst (start at 1200ms)
    this.time.delayedCall(1200, () => {
      for (let i = 0; i < 5; i++) {
        this.time.delayedCall(i * 120, () => {
          this.spawnBubble(CREATURE_X + (Math.random() - 0.5) * 20, CREATURE_Y + 4);
        });
      }
    });

    // Final sparkle (start at 1900ms)
    this.time.delayedCall(1900, () => {
      this.spawnParticle('particle-star', CREATURE_X - 8, CREATURE_Y - 20);
      this.spawnParticle('particle-star', CREATURE_X + 8, CREATURE_Y - 16);
      this.spawnParticle('particle-droplet', CREATURE_X, CREATURE_Y - 24);
    });

    // Happy wiggle (start at 2100ms)
    this.time.delayedCall(2100, () => {
      this.tweens.add({
        targets: creature,
        angle: { from: -5, to: 5 },
        duration: 80,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
      });
    });

    // Fade (start at 2400ms)
    this.time.delayedCall(2400, () => {
      this.tweens.add({
        targets: [creature, sponge],
        alpha: 0,
        duration: 200,
        ease: 'Sine.easeIn',
        onComplete: () => this.finish(),
      });
    });

    this.time.delayedCall(2900, () => this.finish());
  }

  private spawnBubble(x: number, y: number): void {
    const bubble = this.add.image(x, y, 'prop-bubbles').setOrigin(0.5).setAlpha(0).setScale(0.6);
    this.tweens.add({
      targets: bubble,
      alpha: { from: 0, to: 0.7 },
      y: y - 20,
      scale: { from: 0.6, to: 1 },
      duration: 400,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: bubble,
          alpha: 0,
          y: y - 32,
          duration: 300,
          onComplete: () => bubble.destroy(),
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
    graphics.lineStyle(1, 0x8bac0f, 0.3);
    for (let x = 0; x <= 160; x += 4) {
      graphics.lineBetween(x, 0, x, 144);
    }
    for (let y = 0; y <= 144; y += 4) {
      graphics.lineBetween(0, y, 160, y);
    }
    graphics.lineStyle(2, 0x306230, 0.5);
    graphics.lineBetween(16, 100, 144, 100);
    graphics.fillStyle(0x8bac0f, 0.2);
    graphics.fillRect(16, 100, 128, 44);
  }

  private finish(): void {
    bus.emit(EVENTS.SCENE_COMPLETE);
    this.scene.stop('CleanScene');
  }
}
