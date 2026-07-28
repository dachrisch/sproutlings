import Phaser from 'phaser';
import * as store from '../store';
import { showNameEntry } from '../ui/nameEntry';
import { SPECIES } from '../data/species';

export class HatchScene extends Phaser.Scene {
  constructor() {
    super('Hatch');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#9bbc0f');
    const egg = this.add.text(80, 60, '\u{1F95A}', { fontSize: '48px' }).setOrigin(0.5);
    const label = this.add
      .text(80, 110, 'Tap the egg', { fontSize: '14px', color: '#0f380f' })
      .setOrigin(0.5);
    const crack1 = this.add.image(80, 60, 'egg-crack-1').setOrigin(0.5).setVisible(false);
    const crack2 = this.add.image(80, 60, 'egg-crack-2').setOrigin(0.5).setVisible(false);

    const idlePulse = this.tweens.add({
      targets: egg,
      scale: { from: 1, to: 1.05 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    egg.setInteractive({ useHandCursor: true });
    egg.once('pointerdown', () => {
      egg.disableInteractive();
      idlePulse.stop();
      egg.setScale(1);
      label.setText('Hatching...');
      this.playCrackSequence(egg, crack1, crack2, label);
    });
  }

  private playCrackSequence(
    egg: Phaser.GameObjects.Text,
    crack1: Phaser.GameObjects.Image,
    crack2: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Text,
  ): void {
    const jolt = (angle: number, onComplete: () => void): void => {
      this.tweens.add({
        targets: egg,
        angle: { from: -angle, to: angle },
        duration: 90,
        yoyo: true,
        repeat: 1,
        onComplete,
      });
    };

    jolt(6, () => {
      crack1.setVisible(true);
      jolt(10, () => {
        crack2.setVisible(true);
        jolt(14, () => this.revealSpecies(egg, crack1, crack2, label));
      });
    });
  }

  private revealSpecies(
    egg: Phaser.GameObjects.Text,
    crack1: Phaser.GameObjects.Image,
    crack2: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Text,
  ): void {
    const species = SPECIES[Math.floor(Math.random() * SPECIES.length)];
    const sprite = this.add.image(80, 60, species.id).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: egg,
      scale: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        egg.destroy();
        crack1.destroy();
        crack2.destroy();
      },
    });
    this.tweens.add({
      targets: sprite,
      scale: 1,
      duration: 250,
      ease: 'Back.Out',
    });

    label.setText('Name your pet!');
    showNameEntry((name) => {
      store.hatchNewMonster(name, species.id);
      this.playWelcomeFlourish(sprite, () => this.scene.start('Pet'));
    });
  }

  private playWelcomeFlourish(sprite: Phaser.GameObjects.Image, onComplete: () => void): void {
    const sparkle = this.add.image(sprite.x, sprite.y - 20, 'particle-star').setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: sparkle,
      alpha: { from: 0, to: 1 },
      y: sprite.y - 32,
      scale: { from: 0.6, to: 1.2 },
      duration: 300,
      yoyo: true,
      onComplete: () => {
        sparkle.destroy();
        onComplete();
      },
    });
  }
}
