import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background
        this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);

        // Title
        const title = this.add.text(width / 2, height / 3, 'Farm Friend', {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Play Button container
        const playBtn = this.add.container(width / 2, height / 2);

        const btnBg = this.add.image(0, 0, 'button');
        const btnText = this.add.text(0, 0, 'PLAY', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        playBtn.add([btnBg, btnText]);
        playBtn.setSize(200, 60);

        // Make interactive
        btnBg.setInteractive({ useHandCursor: true });

        btnBg.on('pointerover', () => {
            btnBg.setTint(0xdddddd);
        });

        btnBg.on('pointerout', () => {
            btnBg.clearTint();
        });

        btnBg.on('pointerdown', () => {
            btnBg.setTint(0xaaaaaa);
        });

        btnBg.on('pointerup', () => {
            this.scene.start('FarmScene');
        });

        // Account Button
        const accountBtn = this.add.container(width / 2, height / 2 + 80);
        const accBg = this.add.rectangle(0, 0, 200, 60, 0x4caf50).setStrokeStyle(2, 0xffffff);
        const accText = this.add.text(0, 0, 'ACCOUNT', { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        accountBtn.add([accBg, accText]);
        accountBtn.setSize(200, 60).setInteractive({ useHandCursor: true });

        accountBtn.on('pointerdown', () => {
            this.scene.launch('AccountScene');
        });

        // Simple tween for title
        this.tweens.add({
            targets: title,
            y: height / 3 - 20,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}
