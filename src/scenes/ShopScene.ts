import Phaser from 'phaser';
import { GameStateManager } from '../systems/GameStateManager';
import { EconomyManager } from '../systems/EconomyManager';
import { StorehouseManager } from '../systems/StorehouseManager';
import { CROPS } from '../data/CropData';
import { ANIMALS } from '../data/AnimalData';
import { GameTheme } from '../data/GameTheme';

export class ShopScene extends Phaser.Scene {
    private gameState: GameStateManager;
    private economyManager: EconomyManager;
    private storehouseManager: StorehouseManager;

    private currentTab: 'seeds' | 'animals' | 'sell' = 'seeds';
    private container!: Phaser.GameObjects.Container;
    private contentContainer!: Phaser.GameObjects.Container;
    private feedbackContainer!: Phaser.GameObjects.Container;

    constructor() {
        super('ShopScene');
        this.gameState = GameStateManager.getInstance();
        this.economyManager = new EconomyManager();
        this.storehouseManager = new StorehouseManager();
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Dark Overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0).setInteractive();

        // Main Panel Config
        const panelW = 800;
        const panelH = 550;
        const panelX = width / 2;
        const panelY = height / 2;

        this.container = this.add.container(panelX, panelY);

        // Panel Background
        const bg = this.add.rectangle(0, 0, panelW, panelH, GameTheme.colors.panel).setStrokeStyle(4, 0xdddddd);
        // Header Bar
        const headerBg = this.add.rectangle(0, -panelH / 2 + 40, panelW, 80, GameTheme.colors.primary);

        this.container.add([bg, headerBg]);

        // Title
        const title = this.add.text(0, -panelH / 2 + 40, 'MARKETPLACE', {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(title);

        // Close Button
        const closeBtn = this.add.container(panelW / 2 - 40, -panelH / 2 + 40);
        const closeCircle = this.add.circle(0, 0, 20, 0xffffff);
        const closeText = this.add.text(0, 0, '✕', { color: GameTheme.colors.danger.toString(16).replace('0x', '#'), fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);
        closeBtn.add([closeCircle, closeText]);
        closeBtn.setSize(40, 40).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => {
            this.scene.resume('FarmScene');
            this.scene.stop();
        });
        this.container.add(closeBtn);

        // Tabs
        this.createTabs(panelW, panelH);

        // Content Area
        this.contentContainer = this.add.container(0, 0);
        this.container.add(this.contentContainer);

        // Feedback
        this.feedbackContainer = this.add.container(0, 0);
        this.container.add(this.feedbackContainer);

        this.refreshContent();

        // Listeners
        this.gameState.events.on('currency_changed', () => this.refreshContent());
        this.gameState.events.on('inventory_changed', () => this.refreshContent());
    }

    private createTabs(w: number, h: number) {
        const tabs = [
            { id: 'seeds', label: 'SEEDS' },
            { id: 'animals', label: 'ANIMALS' },
            { id: 'sell', label: 'SELL BARN' }
        ];

        const tabW = 180;
        const tabH = 50;
        const startX = -(tabs.length * (tabW + 10)) / 2 + tabW / 2;
        const y = -h / 2 + 110;

        tabs.forEach((tab, index) => {
            const x = startX + index * (tabW + 10);
            const isActive = this.currentTab === tab.id;

            const color = isActive ? GameTheme.colors.secondary : 0xeeeeee;
            const textColor = isActive ? '#ffffff' : '#666666';

            const btn = this.add.rectangle(0, 0, tabW, tabH, color, isActive ? 1 : 1).setStrokeStyle(isActive ? 0 : 1, 0xcccccc);
            const label = this.add.text(0, 0, tab.label, {
                fontSize: '18px',
                color: textColor,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const container = this.add.container(x, y, [btn, label]);
            container.setSize(tabW, tabH).setInteractive({ useHandCursor: true });

            container.on('pointerdown', () => {
                this.currentTab = tab.id as any;
                this.scene.restart(); // Easy way to refresh tab visuals completely
            });

            this.container.add(container);
        });
    }

    private currentPage: number = 0;
    private itemsPerPage: number = 6; // Fits nicely in 3x2

    private refreshContent() {
        this.contentContainer.removeAll(true);
        this.contentContainer.y = -20;

        let items: any[] = [];
        let type: 'seed' | 'animal' | 'sell' = 'seed';

        if (this.currentTab === 'seeds') {
            items = Object.values(CROPS);
            type = 'seed';
        } else if (this.currentTab === 'animals') {
            items = Object.values(ANIMALS);
            type = 'animal';
        } else if (this.currentTab === 'sell') {
            const inventory = this.gameState.player.inventory;
            // Sell logic is different structure
            this.renderSellGrid();
            return;
        }

        // Pagination Logic
        const totalPages = Math.ceil(items.length / this.itemsPerPage);
        if (this.currentPage >= totalPages) this.currentPage = 0;

        const startIdx = this.currentPage * this.itemsPerPage;
        const visibleItems = items.slice(startIdx, startIdx + this.itemsPerPage);

        this.renderGrid(visibleItems, type as 'seed' | 'animal');

        // Render Pagination Controls
        if (totalPages > 1) {
            this.renderPaginationControls(totalPages);
        }
    }

    private renderPaginationControls(totalPages: number) {
        const y = 200; // Bottom area
        const prev = this.add.text(-50, y, '<', { fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const next = this.add.text(50, y, '>', { fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const pageInfo = this.add.text(0, y, `${this.currentPage + 1}/${totalPages}`, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);

        prev.on('pointerdown', () => {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.refreshContent();
            }
        });

        next.on('pointerdown', () => {
            if (this.currentPage < totalPages - 1) {
                this.currentPage++;
                this.refreshContent();
            }
        });

        this.contentContainer.add([prev, next, pageInfo]);
    }

    private renderGrid(items: any[], type: 'seed' | 'animal') {
        const cols = 3;
        const cardW = 220;
        const cardH = 140;
        const padX = 20;
        const padY = 20;

        const startX = -((cols * (cardW + padX)) / 2) + cardW / 2;
        const startY = -60; // Shift up slightly

        items.forEach((item, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (cardW + padX);
            const y = startY + row * (cardH + padY);

            const card = this.add.container(x, y);

            // Card BG
            const bg = this.add.rectangle(0, 0, cardW, cardH, 0xffffff).setStrokeStyle(1, 0xcccccc);
            const shadow = this.add.rectangle(4, 4, cardW, cardH, 0x000000, 0.1);
            card.add([shadow, bg]);

            // Name
            const name = this.add.text(0, -45, item.name, { fontSize: '18px', color: '#333333', fontStyle: 'bold' }).setOrigin(0.5);

            // Icon logic to use Sprite
            let icon: Phaser.GameObjects.Image | Phaser.GameObjects.Circle;
            const textureKey = type === 'seed' ? `crop_${item.id}` : `animal_${item.id}`;

            if (this.textures.exists(textureKey)) {
                icon = this.add.image(-70, 0, textureKey).setDisplaySize(50, 50);
            } else {
                const iconColor = item.color || 0x888888;
                icon = this.add.circle(-70, 0, 25, iconColor);
            }

            // Info
            const priceVal = type === 'seed' ? item.seedPrice : item.purchasePrice;
            const price = this.add.text(10, -5, `${priceVal} 💰`, { fontSize: '18px', color: '#e65100' }).setOrigin(0, 0.5);

            // Buy Button
            const btnBg = this.add.rectangle(0, 45, 180, 30, GameTheme.colors.primary).setInteractive({ useHandCursor: true });
            const btnText = this.add.text(0, 45, 'BUY', { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

            btnBg.on('pointerdown', () => {
                if (type === 'seed') {
                    this.buyItem(item, 'seed');
                } else {
                    this.buyItem(item, 'animal');
                }
            });

            card.add([name, icon as any, price, btnBg, btnText]);
            this.contentContainer.add(card);
        });
    }

    private renderSellGrid() {
        const inventory = this.gameState.player.inventory;
        const items = Object.entries(inventory).filter(([id, qty]) => !id.endsWith('_seed') && qty > 0);

        if (items.length === 0) {
            this.contentContainer.add(this.add.text(0, 0, 'Your Barn is Empty!', { fontSize: '24px', color: '#888888' }).setOrigin(0.5));
            return;
        }

        // Simple Pagination for Sell too
        const totalPages = Math.ceil(items.length / this.itemsPerPage);
        if (this.currentPage >= totalPages) this.currentPage = 0;
        const startIdx = this.currentPage * this.itemsPerPage;
        const visibleItems = items.slice(startIdx, startIdx + this.itemsPerPage);

        const cols = 3;
        const cardW = 220;
        const cardH = 120;
        const padX = 20;
        const padY = 20;
        const startX = -((cols * (cardW + padX)) / 2) + cardW / 2;
        const startY = -60;

        visibleItems.forEach((entry, index) => {
            const [itemId, qty] = entry;
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (cardW + padX);
            const y = startY + row * (cardH + padY);

            const card = this.add.container(x, y);
            const bg = this.add.rectangle(0, 0, cardW, cardH, 0xffffff).setStrokeStyle(1, 0xcccccc);

            let name = itemId;
            let price = 10;
            if (CROPS[itemId]) {
                name = CROPS[itemId].name;
                price = CROPS[itemId].sellPrice;
            } else {
                // Check animal products
                // Simple map for now based on AnimalData
                const productMap: any = {
                    'Egg': 15, 'Milk': 50, 'Wool': 60, 'Truffle': 80
                };
                if (productMap[name]) {
                    price = productMap[name];
                }
            }

            const nameTxt = this.add.text(0, -30, `${name} (x${qty})`, { fontSize: '18px', color: '#333333', fontStyle: 'bold' }).setOrigin(0.5);
            const priceTxt = this.add.text(0, 0, `Value: ${price}`, { fontSize: '14px', color: '#666666' }).setOrigin(0.5);

            const sellBtn = this.add.rectangle(0, 35, 180, 30, GameTheme.colors.secondary).setInteractive({ useHandCursor: true });
            const sellLbl = this.add.text(0, 35, 'SELL All', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);

            sellBtn.on('pointerdown', () => {
                const earned = qty * price;
                // StorehouseManager.sellItem unfortunately relies on hardcoded prices or simple logic.
                // We will manually remove and credit here if Storehouse doesn't support generic selling.
                // Checking Storehouse ... it likely needs update. 
                // For now, let's just do it manually here to be safe and "Hack" it.
                this.storehouseManager.removeItem(itemId, qty);
                this.economyManager.earn(earned);

                this.showFeedback(`+${earned} Coins`, x, y);
                this.time.delayedCall(100, () => this.refreshContent()); // Refresh UI
            });

            card.add([bg, nameTxt, priceTxt, sellBtn, sellLbl]);
            this.contentContainer.add(card);
        });

        if (totalPages > 1) {
            this.renderPaginationControls(totalPages);
        }
    }

    private buyItem(item: any, type: 'seed' | 'animal') {
        const price = type === 'seed' ? item.seedPrice : item.purchasePrice;

        if (this.economyManager.spend(price)) {
            if (type === 'seed') {
                this.storehouseManager.addItem(item.id + '_seed', 1);
                this.showFeedback(`Bought ${item.name}`, 0, 0);
            } else {
                this.gameState.events.emit('request_buy_animal', item.id);
                this.showFeedback('Animal sent to Farm!', 0, 0);
            }
        } else {
            this.showFeedback('Not enough coins!', 0, 0, '#ff0000');
        }
    }

    private showFeedback(text: string, x: number, y: number, color: string = '#4caf50') {
        const t = this.add.text(x, y, text, {
            fontSize: '24px',
            color: color,
            stroke: '#ffffff',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.feedbackContainer.add(t);
        this.tweens.add({
            targets: t, y: y - 50, alpha: 0, duration: 1000,
            onComplete: () => t.destroy()
        });
    }
}
