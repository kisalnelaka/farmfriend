import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Preload loading bar graphics
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading Farm Friend...',
            style: {
                font: '20px monospace',
                color: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        // Event listeners for loading
        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();

            this.createGameAssets();
            this.scene.start('MainMenuScene');
        });

        // Load Grid Sprite Sheet (4x4, assuming 1024x1024 image -> 256x256 frames)
        this.load.spritesheet('sprites', 'assets/sprites.png', { frameWidth: 256, frameHeight: 256 });
    }

    create() {
        // Fallback start if needed
    }

    private createMissingAssets() {
        // Alias missing assets to existing ones to prevent crashes and provide visuals
        const createTintedAlias = (sourceKey: string, destKey: string, color: number) => {
            if (this.textures.exists(sourceKey) && !this.textures.exists(destKey)) {
                const t = this.textures.get(sourceKey);
                // Create a canvas texture from the source
                const newT = this.textures.createCanvas(destKey, 64, 64);
                if (newT) {
                    const ctx = newT.context;
                    // Draw original
                    newT.draw(0, 0, t.getSourceImage() as HTMLImageElement);

                    // PROPER TINTING:
                    // 1. Source-In to fill the shape with color (preserves alpha)
                    ctx.globalCompositeOperation = 'source-in';
                    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
                    ctx.fillRect(0, 0, 64, 64);

                    // 2. Multiply to blend it back over the original for shading? 
                    // Actually, 'source-in' replaces the content. We lost the details.
                    // Better approach:
                    // Draw original again on top with 'multiply'?
                    // Let's try:
                    // 1. Draw Color Rect
                    // 2. Draw Image with 'destination-in' (masks the color to the image shape)
                    // 3. Draw Image with 'multiply' (adds shading back) - risky if image is dark.

                    // Simple, Robust approach for "Icons":
                    // Just draw the color with 'source-in' gives a flat silhouette.
                    // To keep inner details:
                    // 1. Clear
                    // 2. Draw Image
                    // 3. Set globalCompositeOperation = 'multiply';
                    // 4. Draw Color Rect over it.
                    // 5. Set globalCompositeOperation = 'destination-in';
                    // 6. Draw Image (to mask alpha again)

                    newT.clear();
                    newT.draw(0, 0, t.getSourceImage() as HTMLImageElement);

                    ctx.globalCompositeOperation = 'multiply';
                    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
                    ctx.fillRect(0, 0, 64, 64);

                    ctx.globalCompositeOperation = 'destination-in';
                    newT.draw(0, 0, t.getSourceImage() as HTMLImageElement);

                    ctx.globalCompositeOperation = 'source-over'; // Reset

                    newT.refresh();
                }
            }
        };

        // Mappings for missing crops (using existing shapes)
        createTintedAlias('crop_sunflower', 'crop_corn', 0xffff00); // Yellow
        createTintedAlias('crop_turnip', 'crop_eggplant', 0x800080); // Purple
        createTintedAlias('crop_turnip', 'crop_tomato', 0xff4444); // Red
        createTintedAlias('crop_turnip', 'crop_watermelon', 0x006400); // Green
        createTintedAlias('crop_carrot', 'crop_pineapple', 0xffd700); // Gold
    }

    private createGameAssets() {
        // ... (existing code, keeping it intact but just ensuring method is placed)
        // Row 1
        this.extractTexture('crop_stage_1', 0);
        this.extractTexture('crop_turnip', 1);
        this.extractTexture('crop_carrot', 2);
        this.extractTexture('crop_potato', 3);

        // Row 2
        this.extractTexture('crop_sunflower', 4);
        this.extractTexture('icon_water', 5);
        this.extractTexture('icon_bug_spray', 6);
        this.extractTexture('icon_weed_spray', 7);

        // Row 3 (Shop is frame 8)
        this.extractTexture('icon_shop', 8);
        this.extractTexture('animal_chicken', 9);
        this.extractTexture('animal_cow', 10);
        this.extractTexture('animal_sheep', 11);

        // Row 4
        this.extractTexture('animal_pig', 12);
        this.extractTexture('animal_dog', 13);
        this.extractTexture('soil', 14);
        this.extractTexture('soil_wet', 15);

        this.createMissingAssets();

        // Procedural fallbacks checks
        if (!this.textures.exists('grass')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x76c54e); g.fillRect(0, 0, 64, 64);
            g.fillStyle(0x6ab446); g.fillRect(10, 10, 10, 10); g.fillRect(40, 30, 8, 8);
            g.generateTexture('grass', 64, 64);
        }

        if (!this.textures.exists('button')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x4a90e2);
            g.fillRoundedRect(0, 0, 200, 60, 10);
            g.generateTexture('button', 200, 60);
        }

        if (!this.textures.exists('crop_mature')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xff0000); g.fillCircle(32, 32, 20);
            g.generateTexture('crop_mature', 64, 64);
        }
    }

    private extractTexture(key: string, frame: number) {
        if (!this.textures.exists(key)) {
            const texture = this.textures.get('sprites');

            const t = this.textures.createCanvas(key, 64, 64);
            if (t) {
                const srcFrame = texture.frames[frame];
                if (srcFrame && srcFrame.source.image) {
                    const sourceImage = srcFrame.source.image as HTMLImageElement;
                    const ctx = t.context;

                    // Draw image to canvas
                    ctx.drawImage(
                        sourceImage,
                        srcFrame.cutX, srcFrame.cutY, srcFrame.width, srcFrame.height,
                        0, 0, 64, 64
                    );

                    // Pixel manipulation for transparency (Remove White Background)
                    const imgData = ctx.getImageData(0, 0, 64, 64);
                    const data = imgData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        // Threshold: >230 is safe for "white"
                        if (r > 230 && g > 230 && b > 230) {
                            data[i + 3] = 0;
                        }
                    }
                    ctx.putImageData(imgData, 0, 0);

                    t.refresh();
                }
            }
        }
    }
}
