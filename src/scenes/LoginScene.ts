import Phaser from 'phaser';
import { FirebaseManager } from '../systems/FirebaseManager';

export class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
    }

    preload() {
        this.load.html('loginForm', 'assets/ui/login.html');
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.image(width / 2, height / 2, 'grass').setDisplaySize(width, height).setAlpha(0.6);

        // Add some farm-themed floating elements
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            this.add.image(x, y, 'star_particle').setAlpha(0.2).setScale(Math.random() * 2);
        }

        this.add.text(width / 2, height / 2 - 220, 'FARM FRIEND', {
            fontSize: '64px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#2e7d32',
            strokeThickness: 10,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 10, fill: true }
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 160, 'The Original Farm Management Game', {
            fontSize: '20px',
            color: '#e8f5e9',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Form
        const element = this.add.dom(width / 2, height / 2 + 50).createFromCache('loginForm');

        const loginBtn = element.getChildByID('login-btn') as HTMLButtonElement;
        const registerBtn = element.getChildByID('register-btn') as HTMLButtonElement;
        const emailInput = element.getChildByID('email') as HTMLInputElement;
        const passwordInput = element.getChildByID('password') as HTMLInputElement;
        const errorMsg = element.getChildByID('error-msg') as HTMLParagraphElement;

        const firebase = FirebaseManager.getInstance();

        loginBtn.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passwordInput.value;

            if (!email || !password) {
                this.showError(errorMsg, 'Please fill all fields');
                return;
            }

            try {
                loginBtn.disabled = true;
                loginBtn.innerText = 'Loading...';
                await firebase.login(email, password);
                this.scene.start('BootScene');
            } catch (error: any) {
                loginBtn.disabled = false;
                loginBtn.innerText = 'Login';
                this.showError(errorMsg, error.message || 'Login failed');
            }
        });

        registerBtn.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passwordInput.value;

            if (!email || !password) {
                this.showError(errorMsg, 'Please fill all fields');
                return;
            }

            try {
                registerBtn.disabled = true;
                registerBtn.innerText = 'Creating...';
                await firebase.register(email, password);
                this.scene.start('BootScene');
            } catch (error: any) {
                registerBtn.disabled = false;
                registerBtn.innerText = 'Create Account';
                this.showError(errorMsg, error.message || 'Registration failed');
            }
        });
    }

    private showError(el: HTMLParagraphElement, msg: string) {
        el.innerText = msg;
        el.style.display = 'block';
    }
}
