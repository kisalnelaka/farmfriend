import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.ts';
import { LoginScene } from './scenes/LoginScene.ts';
import { MainMenuScene } from './scenes/MainMenuScene.ts';
import { FarmScene } from './scenes/FarmScene.ts';
import { ShopScene } from './scenes/ShopScene.ts';
import { NeighborScene } from './scenes/NeighborScene.ts';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    dom: {
        createContainer: true
    },
    backgroundColor: '#87CEEB',
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
        LoginScene,
        MainMenuScene,
        FarmScene,
        ShopScene,
        NeighborScene
    ],
    // We can add plugins here later if needed
};

new Phaser.Game(config);
