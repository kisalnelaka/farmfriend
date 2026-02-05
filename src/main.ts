import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { FarmScene } from './scenes/FarmScene';
import { ShopScene } from './scenes/ShopScene';
import { NeighborScene } from './scenes/NeighborScene';
import { UIPlugin } from './ui/UIPlugin'; // We'll create this later or use standard scene UI

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    backgroundColor: '#87CEEB', // Sky blue default
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [
        BootScene,
        MainMenuScene,
        FarmScene,
        ShopScene,
        NeighborScene
    ],
    // We can add plugins here later if needed
};

new Phaser.Game(config);
