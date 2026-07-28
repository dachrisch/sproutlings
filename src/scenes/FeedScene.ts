import Phaser from 'phaser';
import { bus, EVENTS } from '../bus';

const CREATURE_X = 80;
const CREATURE_Y = 72;
const BOWL_X = 108;
const BOWL_Y = 110;

export class FeedScene extends Phaser.Scene {
  constructor() {
    super('FeedScene');
  }

  create(data: { speciesId: string }): void {
    this.cameras.main.setBackgroundColor('#9bbc0f');
    this.drawBackground();

    const creature = this.add.image(CREATURE_X, CREATURE_Y, data.speciesId).setOrigin(0.5);
    const bowl = this.add.image(BOWL_X, BOWL_Y, 'prop-food-bowl').setOrigin(0.5).setScale(1.2);

    // Phase 1: creature looks at bowl (300ms)
    this.tweens.add({
      targets: creature,
      scaleX: 0.9,
      duration: 300,
      ease: 'Sine.easeInOut',
    });

    // Phase 2: walk toward bowl (400ms, starts at 300ms)
    this.time.delayedCall(300, () => {
      this.tweens.add({
        targets: creature,
        x: BOWL_X - 16,
        y: BOWL_Y - 20,
        angle: 5,
        duration: 400,
        ease: 'Sine.easeInOut',
      });
    });

    // Phase 3: eat morsels (start at 700ms)
    this.time.delayedCall(700, () => this.eatMorsel(creature, BOWL_X, BOWL_Y - 12));
    this.time.delayedCall(1300, () => this.eatMorsel(creature, BOWL_X + 4, BOWL_Y - 14));
    this.time.delayedCall(1900, () => this.eatMorsel(creature, BOWL_X - 4, BOWL_Y - 10));

    // Phase 4: happy return (start at 2500ms)
    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: creature,
        x: CREATURE_X,
        y: CREATURE_Y - 12,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        ease: 'Back.Out',
        onComplete: () => this.spawnParticle('particle-star', CREATURE_X, CREATURE_Y - 24),
      });
    });

    this.time.delayedCall(2800, () => {
      this.tweens.add({
        targets: creature,
        y: CREATURE_Y,
        duration: 200,
        ease: 'Sine.easeInOut',
      });
    });

    // Fade out
    this.time.delayedCall(3000, () => {
      this.tweens.add({ targets: bowl, alpha: 0, duration: 300 });
      this.tweens.add({
        targets: creature,
        alpha: 0,
        duration: 300,
        ease: 'Sine.easeIn',
        onComplete: () => this.finish(),
      });
    });

    this.time.delayedCall(3500, () => this.finish());
  }

  private eatMorsel(creature: Phaser.GameObjects.Image, morselX: number, morselY: number): void {
    const morsel = this.add.image(morselX, morselY, 'prop-food-morsel').setOrigin(0.5);

    this.tweens.add({
      targets: creature,
      scaleX: 1.15,
      scaleY: 0.85,
      duration: 150,
      ease: 'Sine.easeOut',
      onComplete: () => {
        morsel.setScale(0.7);
      },
    });

    this.time.delayedCall(150, () => {
      this.tweens.add({
        targets: morsel,
        scale: 0,
        alpha: 0,
        duration: 200,
        ease: 'Sine.easeIn',
      });
    });

    this.time.delayedCall(350, () => {
      this.tweens.add({
        targets: creature,
        scaleX: 1,
        scaleY: 1,
        duration: 250,
        ease: 'Sine.easeInOut',
      });
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
    graphics.lineBetween(20, 120, 140, 120);
  }

  private finish(): void {
    bus.emit(EVENTS.SCENE_COMPLETE);
    this.scene.stop('FeedScene');
  }
}
