import Phaser from 'phaser';
import * as store from '../store';

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

    egg.setInteractive({ useHandCursor: true });
    egg.on('pointerdown', () => {
      store.hatchNewMonster();
      label.setText('Hatching...');
      this.tweens.add({
        targets: egg,
        scale: 1.4,
        duration: 300,
        yoyo: true,
        onComplete: () => this.scene.start('Pet'),
      });
    });
  }
}
