import Phaser from 'phaser';
import { GameStateManager, PlotData, AnimalInstance } from '../systems/GameStateManager';
import { EconomyManager } from '../systems/EconomyManager';
import { ExperienceManager } from '../systems/ExperienceManager';
import { TimeManager } from '../systems/TimeManager';
import { StorehouseManager } from '../systems/StorehouseManager';
import { QuestManager, Quest } from '../systems/QuestManager';
import { CROPS } from '../data/CropData';
import { ANIMALS } from '../data/AnimalData';
import { GameTheme } from '../data/GameTheme';

export class FarmScene extends Phaser.Scene {
    private gameState: GameStateManager;
    private economyManager: EconomyManager;
    private experienceManager: ExperienceManager;
    private timeManager: TimeManager;
    private questManager: QuestManager;
    private storehouseManager: StorehouseManager;

    private plots: Map<string, Phaser.GameObjects.Container> = new Map();
    private animalSprites: Map<string, Phaser.GameObjects.Container> = new Map();

    private gridSize = { rows: 6, cols: 8 };
    private tileSize = 64;
    private gridOffset = { x: 100, y: 150 };

    // New UI Elements
    private uiContainer!: Phaser.GameObjects.Container;
    private moneyText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;

    private actionDock!: Phaser.GameObjects.Container;
    private toolButtons: Map<string, Phaser.GameObjects.Container> = new Map();
    private selectedSeed: string | null = null;
    private selectedTool: 'cursor' | 'water' | 'seed' | 'bug_spray' | 'weed_spray' = 'cursor';

    constructor() {
        super('FarmScene');
        this.gameState = GameStateManager.getInstance();
        this.economyManager = new EconomyManager();
        this.experienceManager = new ExperienceManager();
        this.timeManager = new TimeManager();
        this.questManager = QuestManager.getInstance();
        this.storehouseManager = new StorehouseManager();
    }

    create() {
        // Clear local caches to prevent using stale (destroyed) references on scene restart
        this.plots.clear();
        this.animalSprites.clear();
        this.toolButtons.clear();

        const { width, height } = this.cameras.main;

        this.add.tileSprite(0, 0, width, height, 'grass').setOrigin(0);

        // Particle System
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('star_particle', 8, 8);
        graphics.destroy();

        this.gridOffset = { x: (width - this.gridSize.cols * this.tileSize) / 2, y: (height - this.gridSize.rows * this.tileSize) / 2 };

        this.createFarmGrid();
        this.renderPlots();
        this.renderAnimals();

        // New HUD System
        this.createHUD();
        this.createActionDock();
        this.updateHUD(); // Initial stats

        this.time.addEvent({
            delay: 1000,
            callback: this.updateBySecond,
            callbackScope: this,
            loop: true
        });

        this.gameState.events.on('currency_changed', this.updateHUD, this);
        this.gameState.events.on('xp_changed', this.updateHUD, this);
        this.gameState.events.on('level_up', (data: { level: number }) => {
            this.showFloatingText(width / 2, height / 2, `LEVEL UP! ${data.level}`, '#ffffff', 40);
            const emitter = this.add.particles(width / 2, height / 2, 'star_particle', {
                speed: { min: 100, max: 300 },
                scale: { start: 2, end: 0 },
                lifespan: 1500,
                quantity: 30,
                blendMode: 'ADD',
                emitting: false
            });
            emitter.explode(30);
            this.time.delayedCall(2000, () => emitter.destroy());
        });
        this.gameState.events.on('quest_completed', (quest: Quest) => {
            this.showFloatingText(width / 2, height / 2 - 50, `Quest Complete!\n+${quest.rewardCoin} Coins`, '#00ff00', 32);
            // this.updateHUD();
        });

        // Listen for shop buying animals
        this.gameState.events.on('request_buy_animal', (animalId: string) => {
            this.buyAnimal(animalId);
        });
    }

    private updateBySecond() {
        // Crops
        this.gameState.farmPlots.forEach(plotData => {
            if (plotData.state === 'growing' && plotData.cropId) {
                const growthInfo = this.timeManager.getCropState(plotData.row, plotData.col);
                if (growthInfo) {
                    if (growthInfo.isReady && plotData.state !== 'ready') {
                        plotData.state = 'ready';
                        this.updatePlotVisuals(plotData);
                        this.gameState.saveGame();
                    } else if (growthInfo.isWilted && plotData.state !== 'wilted') {
                        plotData.state = 'wilted';
                        this.updatePlotVisuals(plotData);
                        this.gameState.saveGame();
                    } else {
                        // Random Pest Spawning (Low chance per second)
                        if (!plotData.hasBug && !plotData.hasWeed && Math.random() < 0.005) { // 0.5% chance per second
                            if (Math.random() > 0.5) plotData.hasBug = true;
                            else plotData.hasWeed = true;
                            this.updatePlotVisuals(plotData);
                            this.gameState.saveGame();
                        }
                    }
                }
            }
        });

        // Animals production
        const now = Date.now();
        this.gameState.animals.forEach(animal => {
            const config = ANIMALS[animal.animalId];
            if (!config) return;

            if (animal.state === 'idle') {
                const timeSince = (now - animal.lastProductTime) / 1000;
                if (timeSince >= config.productionTime) {
                    animal.state = 'producing';
                    this.updateAnimalVisuals(animal);
                    this.gameState.saveGame();
                }
            }
        });
    }

    private createHUD() {
        const width = this.scale.width;
        const height = 80; // Top Bar Height

        this.uiContainer = this.add.container(0, 0);

        // Dashboard Background
        const bg = this.add.rectangle(0, 0, width, height, GameTheme.colors.panel).setOrigin(0);
        const shadow = this.add.rectangle(0, height, width, 5, 0x000000, 0.1).setOrigin(0);

        // Logo / Title
        const title = this.add.text(20, 25, 'Farm Friend', {
            fontSize: '28px',
            color: GameTheme.colors.primary.toString(16).replace('0x', '#'),
            fontStyle: 'bold'
        });

        // Stats Container (Right aligned)
        const statsX = width - 350;

        // Coins
        const coinBg = this.add.rectangle(statsX, 40, 100, 40, 0xfff3e0).setStrokeStyle(2, GameTheme.colors.secondary);
        this.moneyText = this.add.text(statsX, 40, '0', {
            fontSize: '20px',
            color: '#ff9800',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Level / XP
        const lvlBg = this.add.rectangle(statsX + 120, 40, 100, 40, 0xe3f2fd).setStrokeStyle(2, GameTheme.colors.info);
        this.levelText = this.add.text(statsX + 120, 40, 'Lvl 1', {
            fontSize: '20px',
            color: '#2196f3',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Neighbors Button
        const friendBtn = this.add.container(width - 100, 40);
        const fBg = this.add.rectangle(0, 0, 140, 40, GameTheme.colors.primary).setStrokeStyle(2, 0xffffff);
        const fText = this.add.text(0, 0, 'Neighbors', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        friendBtn.add([fBg, fText]);
        friendBtn.setSize(140, 40).setInteractive({ useHandCursor: true });

        friendBtn.on('pointerdown', () => {
            this.scene.start('NeighborScene');
        });

        this.uiContainer.add([bg, shadow, title, coinBg, this.moneyText, lvlBg, this.levelText, friendBtn]);
    }

    private updateHUD() {
        if (this.moneyText) this.moneyText.setText(`$${this.gameState.player.coins}`);
        if (this.levelText) this.levelText.setText(`Lvl ${this.gameState.player.level}`);
    }

    private createActionDock() {
        const width = this.scale.width;
        const height = this.scale.height;
        const dockHeight = 100;

        this.actionDock = this.add.container(0, height - dockHeight);

        // Dock Background
        const bg = this.add.rectangle(0, 0, width, dockHeight, 0xffffff).setOrigin(0);
        const border = this.add.rectangle(0, 0, width, 2, 0xcccccc).setOrigin(0);

        this.actionDock.add([bg, border]);

        // Tool Buttons (Centered)
        const tools = [
            { id: 'cursor', label: '👆', color: 0x999999 },
            { id: 'water', label: '💧', color: GameTheme.colors.info },
            { id: 'bug_spray', label: '🐛', color: GameTheme.colors.danger },
            { id: 'weed_spray', label: '🌿', color: GameTheme.colors.primary },
            { id: 'shop', label: '🏪', color: GameTheme.colors.secondary }
        ];

        const startX = width / 2 - (tools.length * 80) / 2;

        tools.forEach((tool, index) => {
            const x = startX + index * 90 + 45;
            const y = 50;

            const btnContainer = this.add.container(x, y);
            const circle = this.add.circle(0, 0, 35, tool.color);
            const text = this.add.text(0, 0, tool.label, { fontSize: '32px' }).setOrigin(0.5);

            circle.setInteractive({ useHandCursor: true });
            circle.on('pointerdown', () => {
                if (tool.id === 'shop') {
                    this.scene.launch('ShopScene');
                } else {
                    this.setTool(tool.id as any);
                }
            });

            btnContainer.add([circle, text]);
            this.actionDock.add(btnContainer);
            this.toolButtons.set(tool.id, btnContainer);
        });

        // Seed Bar above dock
        this.createSeedBar(height - dockHeight - 60);
    }

    private setTool(tool: string) {
        this.selectedTool = tool as any;
        if (tool !== 'seed') this.selectedSeed = null;

        // Highlight active tool logic here (scale up active)
        this.toolButtons.forEach((btn, id) => {
            const circle = btn.list[0] as any; // Cast to any to avoid 'Circle' namespace error
            if (id === tool) {
                this.tweens.add({ targets: btn, scale: 1.2, duration: 200 });
                if (circle.setStrokeStyle) circle.setStrokeStyle(4, 0xffffff);
            } else {
                this.tweens.add({ targets: btn, scale: 1, duration: 200 });
                if (circle.setStrokeStyle) circle.setStrokeStyle(0);
            }
        });
    }

    private createFarmGrid() {
        if (this.gameState.farmPlots.length === 0) {
            for (let row = 0; row < this.gridSize.rows; row++) {
                for (let col = 0; col < this.gridSize.cols; col++) {
                    this.gameState.farmPlots.push({
                        row, col,
                        cropId: null,
                        plantTime: 0,
                        state: 'empty',
                        isWatered: false,
                        hasBug: false,
                        hasWeed: false
                    });
                }
            }
            this.gameState.saveGame();
        }
    }

    private renderPlots() {
        this.gameState.farmPlots.forEach(plotData => {
            const x = this.gridOffset.x + plotData.col * this.tileSize;
            const y = this.gridOffset.y + plotData.row * this.tileSize;

            let container = this.plots.get(`${plotData.row}-${plotData.col}`);
            if (!container) {
                container = this.add.container(x, y);
                const soil = this.add.image(0, 0, 'soil').setOrigin(0);
                soil.setInteractive({ useHandCursor: true });
                soil.on('pointerdown', () => this.handlePlotClick(plotData));
                container.add(soil);
                this.plots.set(`${plotData.row}-${plotData.col}`, container);
            }
            this.updatePlotVisuals(plotData);
        });
    }

    private updatePlotVisuals(plotData: PlotData) {
        const container = this.plots.get(`${plotData.row}-${plotData.col}`);
        if (!container) return;

        // Reset container content but keep soil (index 0)
        if (container.list.length > 1) {
            container.list.slice(1).forEach(child => child.destroy());
        }

        // Handle Soil Visual (Watered = Darker)
        const soil = container.list[0] as Phaser.GameObjects.Image;
        if (soil) {
            if (plotData.isWatered && plotData.state === 'growing') {
                soil.setTint(0xaaaaaa); // Darken for wet soil
            } else {
                soil.clearTint();
            }
        }

        if (plotData.state === 'growing' || plotData.state === 'ready') {
            const cropId = plotData.cropId;
            if (cropId) {
                // Determine texture key
                let texture = 'crop_stage_1';
                if (plotData.state === 'ready') {
                    // Try to match specific crop texture if it exists
                    // e.g. crop_turnip, crop_carrot
                    // If not found, fallback to crop_mature or just tint crop_turnip?
                    // We generated textures for 'crop_turnip', 'crop_carrot', 'crop_potato'
                    texture = `crop_${cropId}`;
                }

                // Check if texture exists, else fallback
                if (!this.textures.exists(texture)) {
                    texture = plotData.state === 'ready' ? 'crop_mature' : 'crop_stage_1';
                }

                const crop = this.add.image(32, 32, texture);

                // Only tint if we are using the generic stage 1, otherwise use full color graphic
                if (texture === 'crop_stage_1') {
                    const cropParams = CROPS[cropId];
                    if (cropParams) crop.setTint(cropParams.color);
                }

                container.add(crop);
            }
        } else if (plotData.state === 'wilted') {
            const withered = this.add.rectangle(32, 32, 40, 40, 0x555555);
            container.add(withered);
        }
    }

    private renderAnimals() {
        this.gameState.animals.forEach(animal => {
            this.createAnimalSprite(animal);
        });
    }

    private createAnimalSprite(animal: AnimalInstance) {
        let container = this.animalSprites.get(animal.id);
        if (!container) {
            container = this.add.container(animal.x, animal.y);
            const config = ANIMALS[animal.animalId];

            // Texture lookup
            const texture = `animal_${animal.animalId}`; // e.g. animal_chicken
            let body;

            if (this.textures.exists(texture)) {
                body = this.add.image(0, 0, texture);
            } else {
                // Fallback
                body = this.add.circle(0, 0, 20, config ? config.color : 0xffffff);
            }

            body.setInteractive({ useHandCursor: true });
            body.on('pointerdown', () => this.handleAnimalClick(animal));

            container.add(body);
            this.animalSprites.set(animal.id, container);
            this.updateAnimalVisuals(animal);

            this.tweens.add({
                targets: container,
                x: animal.x + (Math.random() * 40 - 20),
                y: animal.y + (Math.random() * 40 - 20),
                duration: 3000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        return container;
    }

    private updateAnimalVisuals(animal: AnimalInstance) {
        const container = this.animalSprites.get(animal.id);
        if (!container) return;

        if (container.list.length > 1) {
            container.list.slice(1).forEach(child => child.destroy());
        }

        if (animal.state === 'producing') {
            const productIcon = this.add.text(0, -30, '!', {
                fontSize: '24px',
                color: '#ffff00',
                backgroundColor: '#000000',
                padding: { x: 5, y: 5 }
            }).setOrigin(0.5);
            container.add(productIcon);
        }
    }

    // [Restoring handleAnimalClick, harvestCrop, showFloatingText, buyAnimal, createControls]

    private handleAnimalClick(animal: AnimalInstance) {
        if (animal.state === 'producing') {
            const config = ANIMALS[animal.animalId];
            if (config) {
                this.economyManager.earn(config.productPrice);
                this.experienceManager.addXp(config.productXp);
                this.showFloatingText(animal.x, animal.y, `+${config.productPrice} Coins`, '#ffd700');

                animal.state = 'idle';
                animal.lastProductTime = Date.now();
                this.updateAnimalVisuals(animal);
                this.gameState.saveGame();
            }
        } else {
            const config = ANIMALS[animal.animalId];
            const remaining = Math.ceil(config.productionTime - ((Date.now() - animal.lastProductTime) / 1000));
            this.showFloatingText(animal.x, animal.y, `${config.name}: ${Math.max(0, remaining)}s left`);
        }
    }

    private harvestCrop(plotData: PlotData) {
        if (!plotData.cropId) return;
        const cropConfig = CROPS[plotData.cropId];
        this.experienceManager.addXp(cropConfig.xp);

        // Add to inventory instead of auto-selling
        this.storehouseManager.addItem(plotData.cropId, 1);

        const x = this.gridOffset.x + plotData.col * this.tileSize + 32;
        const y = this.gridOffset.y + plotData.row * this.tileSize;
        this.showFloatingText(x, y, `+1 ${cropConfig.name}`, '#ffff00');
        this.showFloatingText(x, y - 20, `+${cropConfig.xp} XP`, '#ffffff');

        // Particles
        const emitter = this.add.particles(x, y, 'star_particle', {
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0 },
            lifespan: 800,
            quantity: 10,
            blendMode: 'ADD'
        });
        // Auto kill emitter
        this.time.delayedCall(1000, () => emitter.destroy());

        this.questManager.updateProgress('harvest', plotData.cropId);
        this.updateHUD();

        plotData.state = 'empty';
        plotData.cropId = null;
        this.updatePlotVisuals(plotData);
        this.gameState.saveGame();
    }

    private showFloatingText(x: number, y: number, text: string, color: string = '#ffff00', fontSize: number = 20) {
        const floatText = this.add.text(x, y, text, {
            fontSize: `${fontSize}px`,
            color: color,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => floatText.destroy()
        });
    }

    private buyAnimal(animalId: string) {
        const config = ANIMALS[animalId];
        if (!config) return;

        if (this.economyManager.spend(config.purchasePrice)) {
            const x = this.gridOffset.x + Math.random() * (this.gridSize.cols * this.tileSize);
            const y = this.gridOffset.y + Math.random() * (this.gridSize.rows * this.tileSize);

            const newAnimal: AnimalInstance = {
                id: Date.now().toString(),
                animalId: animalId,
                x, y,
                purchaseTime: Date.now(),
                lastProductTime: Date.now(),
                state: 'idle'
            };

            this.gameState.animals.push(newAnimal);
            this.createAnimalSprite(newAnimal);
            this.gameState.saveGame();

            this.questManager.updateProgress('buy_animal', animalId);
            this.updateHUD();

            this.showFloatingText(400, 300, `Bought ${config.name}!`);
        } else {
            this.showFloatingText(400, 300, 'Too expensive!');
        }
    }

    private handlePlotClick(plotData: PlotData) {
        console.log(`Clicked plot [${plotData.row},${plotData.col}] State: ${plotData.state} Watered: ${plotData.isWatered}`);

        if (this.selectedTool === 'water') {
            if (plotData.state === 'growing' && !plotData.isWatered) {
                // Water the crop
                plotData.isWatered = true;
                this.experienceManager.addXp(1);
                this.showFloatingText(this.input.x, this.input.y, 'Watered! +1 XP', '#00bfff');
                this.updatePlotVisuals(plotData); // Update visual immediately
                this.gameState.saveGame();

                // Visual feedback (Particles)
                const emitter = this.add.particles(this.input.x, this.input.y, 'star_particle', {
                    speed: { min: 50, max: 150 },
                    scale: { start: 1, end: 0 },
                    tint: 0x00bfff,
                    lifespan: 500,
                    quantity: 10
                });
                this.time.delayedCall(500, () => emitter.destroy());

                return;
            } else if (plotData.state === 'growing' && plotData.isWatered) {
                this.showFloatingText(this.input.x, this.input.y, 'Already Watered', '#8888ff');
                return;
            }
        }
        // Bug/Weed Tools in Action Dock
        else if (this.selectedTool === 'bug_spray') {
            if (plotData.hasBug) {
                plotData.hasBug = false;
                this.experienceManager.addXp(2);
                this.showFloatingText(this.input.x, this.input.y, 'Bug Removed! +2 XP', '#ff5555');
                this.updatePlotVisuals(plotData);
                this.gameState.saveGame();
                return;
            }
        } else if (this.selectedTool === 'weed_spray') {
            if (plotData.hasWeed) {
                plotData.hasWeed = false;
                this.experienceManager.addXp(2);
                this.showFloatingText(this.input.x, this.input.y, 'Weed Removed! +2 XP', '#55aa55');
                this.updatePlotVisuals(plotData);
                this.gameState.saveGame();
                return;
            }
        }

        // Default Cursor / Seed logic
        if (plotData.state === 'empty') {
            if (this.selectedSeed) {
                this.plantCrop(plotData, this.selectedSeed);
            } else {
                this.showFloatingText(this.input.x, this.input.y, 'Select a seed!');
            }
        } else if (plotData.state === 'ready') {
            this.harvestCrop(plotData);
        } else if (plotData.state === 'wilted') {
            // Dig out logic
            plotData.state = 'empty';
            plotData.cropId = null;
            plotData.isWatered = false;
            plotData.hasBug = false;
            plotData.hasWeed = false;

            this.updatePlotVisuals(plotData);
            this.gameState.saveGame();

            this.showFloatingText(this.input.x, this.input.y, 'Dug Out!', '#aaaaaa');
            // Play a little particle effect
            const emitter = this.add.particles(this.input.x, this.input.y, 'soil', {
                speed: { min: 50, max: 100 },
                scale: { start: 0.5, end: 0 },
                lifespan: 400,
                quantity: 5
            });
            this.time.delayedCall(400, () => emitter.destroy());
        }
    }

    private createSeedBar(bottomY: number) {
        // Styled "Seed Pouch" container
        const cropKeys = Object.keys(CROPS);
        const width = this.scale.width;

        // Compact bar width
        const itemWidth = 50;
        const gap = 10;
        const barWidth = cropKeys.length * (itemWidth + gap) + 40;

        const startX = (width - barWidth) / 2;
        const seedBarY = bottomY - 30; // Shift up slightly

        this.seedBarContainer = this.add.container(startX, seedBarY);

        // Background Pouch
        const bg = this.add.rectangle(barWidth / 2, itemWidth / 2 + 20, barWidth, itemWidth + 30, 0x8d6e63).setStrokeStyle(3, 0x5d4037);
        this.seedBarContainer.add(bg);

        // Pouch Label
        const label = this.add.text(barWidth / 2, -10, 'SEED POUCH', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', backgroundColor: '#5d4037', padding: { x: 4, y: 2 } }).setOrigin(0.5);
        this.seedBarContainer.add(label);

        cropKeys.forEach((cropId, index) => {
            const key = cropId + '_seed';
            const count = this.storehouseManager.getQuantity(key);

            const x = 30 + index * (itemWidth + gap);
            const y = 35;

            // Seed Slot
            const slot = this.add.rectangle(x, y, itemWidth, itemWidth + 10, 0xdec4a6).setStrokeStyle(2, 0x5d4037);

            // Icon
            const textureKey = `crop_${cropId}`; // e.g., crop_turnip
            let seedIcon: Phaser.GameObjects.Image;

            if (this.textures.exists(textureKey)) {
                seedIcon = this.add.image(x, y - 5, textureKey).setDisplaySize(40, 40);
            } else {
                const color = CROPS[cropId] ? CROPS[cropId].color : 0xcccccc;
                seedIcon = this.add.circle(x, y - 8, 12, color) as any;
            }

            // Count Badge

            // Count Badge
            const countBg = this.add.circle(x + 18, y + 18, 10, 0xff0000);
            const countText = this.add.text(x + 18, y + 18, `${count}`, { fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

            // Interaction
            slot.setInteractive({ useHandCursor: true });
            slot.on('pointerdown', () => {
                this.selectedSeed = cropId;
                this.selectedTool = 'seed';
                this.setTool('seed');

                // Visual feedback
                this.tweens.add({ targets: [slot, seedIcon], scale: 1.1, duration: 100, yoyo: true });
                this.showFloatingText(startX + x, seedBarY - 20, `${CROPS[cropId].name} Selected`, '#ffffff');
            });

            this.seedBarContainer.add([slot, seedIcon, countBg, countText]);

            // Listen for updates
            this.gameState.events.on('inventory_changed', () => {
                const newCount = this.storehouseManager.getQuantity(key);
                countText.setText(`${newCount}`);
                // Dim if empty
                slot.setAlpha(newCount > 0 ? 1 : 0.5);
                seedIcon.setAlpha(newCount > 0 ? 1 : 0.5);
                countBg.setVisible(newCount > 0);
            });
        });
    }

    private seedBarContainer!: Phaser.GameObjects.Container;

    // Override plantCrop to consume seed item
    private plantCrop(plotData: PlotData, cropId: string) {
        // ... existing plant logic ...
        // Check inventory
        const seedKey = cropId + '_seed';
        if (this.storehouseManager.hasItem(seedKey, 1)) {
            this.storehouseManager.removeItem(seedKey, 1);
            this.doPlant(plotData, cropId);
        } else {
            this.showFloatingText(this.input.x, this.input.y, 'No Seeds!', '#ff0000');
        }
    }

    private doPlant(plotData: PlotData, cropId: string) {
        const cropConfig = CROPS[cropId];
        plotData.cropId = cropId;
        plotData.state = 'growing';
        plotData.plantTime = Date.now();
        this.updatePlotVisuals(plotData);
        this.gameState.saveGame();

        this.questManager.updateProgress('plant', cropId);

        // Visual
        this.showFloatingText(this.input.x, this.input.y, 'Planted!', '#ffffff');
        this.updateHUD();
    }
}
