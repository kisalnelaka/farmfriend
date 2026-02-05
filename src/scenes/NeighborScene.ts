import Phaser from 'phaser';
import { NeighborManager, Neighbor } from '../systems/NeighborManager';
import { GameStateManager, PlotData } from '../systems/GameStateManager';
import { CROPS } from '../data/CropData';
import { EconomyManager } from '../systems/EconomyManager';
import { ExperienceManager } from '../systems/ExperienceManager';

export class NeighborScene extends Phaser.Scene {
    private neighborManager: NeighborManager;
    private gameState: GameStateManager;
    private economyManager: EconomyManager;
    private experienceManager: ExperienceManager;

    private currentNeighbor!: Neighbor;
    private plots: Map<string, Phaser.GameObjects.Container> = new Map();
    private gridSize = { rows: 6, cols: 8 };
    private tileSize = 64;
    private gridOffset = { x: 100, y: 150 };

    constructor() {
        super('NeighborScene');
        this.neighborManager = NeighborManager.getInstance();
        this.gameState = GameStateManager.getInstance();
        this.economyManager = new EconomyManager();
        this.experienceManager = new ExperienceManager();
    }

    init(data: { neighborId: string }) {
        const neighbor = this.neighborManager.neighbors.find(n => n.id === data.neighborId);
        if (neighbor) {
            this.currentNeighbor = neighbor;
        } else {
            // Fallback or error
            this.scene.start('FarmScene');
        }
    }

    create() {
        if (!this.currentNeighbor) return;

        // Clear local caches from previous visits
        this.plots.clear();

        const { width, height } = this.cameras.main;

        // Slightly different background color to distinguish
        this.add.tileSprite(0, 0, width, height, 'grass').setOrigin(0).setTint(0xdddddd);

        // Header
        this.add.rectangle(0, 0, width, 80, 0x000000, 0.6).setOrigin(0);
        this.add.text(width / 2, 40, `Visiting: ${this.currentNeighbor.name}`, {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Return Button
        const homeBtn = this.add.text(20, 40, '< Go Home', {
            fontSize: '24px',
            color: '#ffff00',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        homeBtn.on('pointerdown', () => {
            this.scene.start('FarmScene');
        });

        // Farm Grid
        this.renderPlots();

        // Interaction Hint
        this.add.text(width / 2, height - 50, 'Click crops to interact! (Auto-Tool)', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
    }

    private renderPlots() {
        this.currentNeighbor.plots.forEach(plotData => {
            const x = this.gridOffset.x + plotData.col * this.tileSize;
            const y = this.gridOffset.y + plotData.row * this.tileSize;

            let container = this.plots.get(`${plotData.row}-${plotData.col}`);
            if (!container) {
                container = this.add.container(x, y);
                const soil = this.add.image(0, 0, 'soil').setOrigin(0);
                soil.setInteractive({ useHandCursor: true });
                soil.on('pointerdown', () => this.handlePlotInteraction(plotData));
                container.add(soil);
                this.plots.set(`${plotData.row}-${plotData.col}`, container);
            }
            this.updatePlotVisuals(plotData, container);
        });
    }

    private updatePlotVisuals(plotData: PlotData, container: Phaser.GameObjects.Container) {
        if (container.list.length > 1) {
            container.list.slice(1).forEach(child => child.destroy());
        }

        if (plotData.state === 'growing' || plotData.state === 'ready') {
            const cropId = plotData.cropId;
            if (cropId) {
                // Use the new asset system
                let texture = `crop_${cropId}`;
                if (plotData.state === 'ready') {
                    // Ready crop uses the specific texture (e.g. crop_turnip)
                } else {
                    // Growing uses stage 1
                    texture = 'crop_stage_1';
                }

                // Fallback check
                if (!this.textures.exists(texture)) {
                    texture = plotData.state === 'ready' ? 'crop_mature' : 'crop_stage_1';
                }

                const crop = this.add.image(32, 32, texture);

                // Tint if stage 1 (generic), otherwise show full color
                if (texture === 'crop_stage_1') {
                    const cropParams = CROPS[cropId];
                    if (cropParams) crop.setTint(cropParams.color);
                }

                // Interactive
                crop.setInteractive({ useHandCursor: true });
                crop.on('pointerdown', (pointer: any, localX: any, localY: any, event: any) => {
                    this.handlePlotInteraction(plotData);
                    if (event && event.stopPropagation) event.stopPropagation();
                });

                container.add(crop);
            }
        } else if (plotData.state === 'wilted') {
            const withered = this.add.rectangle(32, 32, 40, 40, 0x555555);
            container.add(withered);
        }
    }

    private handlePlotInteraction(plotData: PlotData) {
        // Visual Feedback: Shake the container
        const container = this.plots.get(`${plotData.row}-${plotData.col}`);
        if (container) {
            this.tweens.add({
                targets: container,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 50,
                yoyo: true,
                repeat: 0
            });
        }

        const x = this.gridOffset.x + plotData.col * this.tileSize + 32;
        const y = this.gridOffset.y + plotData.row * this.tileSize;

        let handled = false;

        if (plotData.state === 'ready') {
            const crop = CROPS[plotData.cropId!];
            if (crop) {
                const stolenAmount = Math.max(1, Math.floor(crop.sellPrice * 0.2));
                this.economyManager.earn(stolenAmount);
                this.showFloatingText(x, y, `Stole ${stolenAmount} Coins!`, '#ff0000');
                plotData.state = 'empty';
                this.experienceManager.addXp(1);
                handled = true;
            }
        } else if (plotData.state === 'growing') {
            if (!plotData.isWatered) {
                this.experienceManager.addXp(1);
                this.showFloatingText(x, y, 'Watered! +1 XP', '#00bfff');
                plotData.isWatered = true;
                handled = true;
            } else {
                this.showFloatingText(x, y, 'Already Watered', '#ffffff');
                handled = true;
            }
        } else if (plotData.state === 'wilted') {
            this.experienceManager.addXp(1);
            this.showFloatingText(x, y, 'Cleaned! +1 XP', '#aaaaaa');
            plotData.state = 'empty';
            handled = true;
        }

        if (!handled) {
            this.showFloatingText(x, y, 'Nothing to do', '#ffffff');
        }

        // Refresh visual
        if (container) this.updatePlotVisuals(plotData, container);
    }

    private showFloatingText(x: number, y: number, text: string, color: string = '#ffff00') {
        const floatText = this.add.text(x, y, text, {
            fontSize: '20px',
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
}
