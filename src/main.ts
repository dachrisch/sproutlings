import Phaser from 'phaser';
import './style.css';
import { BootScene } from './scenes/BootScene';
import { PetScene } from './scenes/PetScene';
import { HatchScene } from './scenes/HatchScene';
import { initControls } from './ui/controls';
import { initNameEntry } from './ui/nameEntry';
import { initAudio } from './audio/synth';
import * as store from './store';

const GAME_WIDTH = 160;
const GAME_HEIGHT = 144;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: '#9bbc0f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PetScene, HatchScene],
});

initControls();
initNameEntry();
initAudio();
store.start();
