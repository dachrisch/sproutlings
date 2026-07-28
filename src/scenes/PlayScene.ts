import Phaser from 'phaser';
import { bus, EVENTS } from '../bus';

const CREATURE_X = 80;
const CREATURE_Y = 72;

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
  }

  create(data: { speciesId: string }): void {
    this.cameras.main.setBackgroundColor('#9bbc0f');
    this.drawBackground();

    const creature = this.add.image(CREATURE_X, CREATURE_Y, data.speciesId).setOrigin(0.5);
    const ball = this.add.image(CREATURE_X + 30, CREATURE_Y + 20, 'prop-ball').setOrigin(0.5).setScale(1.2);

    // Phase 1: notice ball (400ms)
    this.tweens.add({
      targets: creature,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 200,
      ease: 'Sine.easeInOut',
      yoyo: true,
    });

    // Phase 2: hop toward ball (start at 400ms)
    this.time.delayedCall(400, () => {
      this.tweens.add({
        targets: creature,
        x: CREATURE_X + 18,
        y: CREATURE_Y + 8,
        duration: 300,
        ease: 'Sine.easeInOut',
      });
    });

    // Phase 3: bat ball 1 (start at 700ms)
    this.time.delayedCall(700, () => {
      this.tweens.add({
        targets: ball,
        y: ball.y - 24,
        x: ball.x - 10,
        angle: -15,
        duration: 250,
        ease: 'Sine.easeOut',
        yoyo: true,
      });
    });

    this.time.delayedCall(950, () => {
      this.tweens.add({
        targets: creature,
        x: CREATURE_X + 10,
        y: CREATURE_Y,
        duration: 250,
        ease: 'Sine.easeInOut',
      });
    });

    // Phase 4: bat ball 2 (start at 1200ms)
    this.time.delayedCall(1200, () => {
      this.tweens.add({
        targets: ball,
        y: ball.y - 30,
        x: CREATURE_X + 36,
        angle: 20,
        duration: 300,
        ease: 'Sine.easeOut',
        yoyo: true,
        onComplete: () => {
          this.spawnParticle('particle-star', ball.x, ball.y - 10);
        },
      });
    });

    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: creature,
        x: CREATURE_X + 20,
        y: CREATURE_Y + 4,
        duration: 300,
        ease: 'Sine.easeInOut',
      });
    });

    // Phase 5: chase ball (start at 1800ms)
    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: ball,
        x: 140,
        angle: 360,
        duration: 400,
        ease: 'Sine.easeIn',
      });
      this.tweens.add({
        targets: creature,
        x: 120,
        scaleX: 0.95,
        duration: 400,
        ease: 'Sine.easeIn',
      });
    });

    // Phase 6: return and celebrate (start at 2200ms)
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: creature,
        x: CREATURE_X,
        y: CREATURE_Y - 14,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        ease: 'Back.Out',
        onComplete: () => {
          this.spawnParticle('particle-star', CREATURE_X - 10, CREATURE_Y - 24);
          this.spawnParticle('particle-star', CREATURE_X + 10, CREATURE_Y - 20);
        },
      });
    });

    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: creature,
        y: CREATURE_Y,
        duration: 200,
        ease: 'Sine.easeInOut',
      });
    });

    // Fade (start at 2700ms)
    this.time.delayedCall(2700, () => {
      this.tweens.add({
        targets: [creature, ball],
        alpha: 0,
        duration: 200,
        ease: 'Sine.easeIn',
        onComplete: () => this.finish(),
      });
    });

    this.time.delayedCall(3200, () => this.finish());
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
    graphics.lineStyle(2, 0x306230, 0.4);
    graphics.lineBetween(10, 110, 150, 110);
  }

  private finish(): void {
    bus.emit(EVENTS.SCENE_COMPLETE);
    this.scene.stop('PlayScene');
  }
}
