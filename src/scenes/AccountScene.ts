import Phaser from 'phaser';
import { FirebaseManager } from '../systems/FirebaseManager';
import { GameStateManager } from '../systems/GameStateManager';

export class AccountScene extends Phaser.Scene {
    constructor() {
        super('AccountScene');
    }

    create() {
        const { width, height } = this.scale;
        const firebase = FirebaseManager.getInstance();
        const gameState = GameStateManager.getInstance();

        // Background
        this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

        // Panel
        const panel = this.add.rectangle(width / 2, height / 2, 400, 500, 0xffffff).setStrokeStyle(4, 0x4caf50);

        // Close Button
        const closeBtn = this.add.text(width / 2 + 180, height / 2 - 230, 'X', {
            fontSize: '28px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => this.scene.stop());

        // Profile Title
        this.add.text(width / 2, height / 2 - 200, 'MY ACCOUNT', {
            fontSize: '32px',
            color: '#4caf50',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // User Info
        this.add.text(width / 2, height / 2 - 130, firebase.getUserEmail(), {
            fontSize: '20px',
            color: '#333'
        }).setOrigin(0.5);

        // Stats
        const statsY = height / 2 - 50;
        this.add.text(width / 2, statsY, `Level: ${gameState.player.level}`, { fontSize: '24px', color: '#333' }).setOrigin(0.5);
        this.add.text(width / 2, statsY + 40, `Coins: $${gameState.player.coins}`, { fontSize: '24px', color: '#333' }).setOrigin(0.5);
        this.add.text(width / 2, statsY + 80, `Experience: ${gameState.player.xp}`, { fontSize: '24px', color: '#333' }).setOrigin(0.5);

        // Logout Button
        const logoutBtn = this.add.container(width / 2, height / 2 + 180);
        const lBg = this.add.rectangle(0, 0, 200, 50, 0xf44336).setStrokeStyle(2, 0x000000);
        const lText = this.add.text(0, 0, 'LOGOUT', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        logoutBtn.add([lBg, lText]);
        logoutBtn.setSize(200, 50).setInteractive({ useHandCursor: true });

        logoutBtn.on('pointerdown', async () => {
            await firebase.logout();
            this.scene.stop('FarmScene');
            this.scene.stop('MainMenuScene');
            this.scene.start('LoginScene');
        });

        // Animation
        this.tweens.add({
            targets: panel,
            scaleX: { from: 0.5, to: 1 },
            scaleY: { from: 0.5, to: 1 },
            duration: 200,
            ease: 'Back.easeOut'
        });
    }
}
