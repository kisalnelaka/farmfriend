import Phaser from 'phaser';

export interface PlayerData {
    coins: number;
    credits: number;
    level: number;
    xp: number;
    name: string;
    inventory: Record<string, number>;
}

export interface PlotData {
    row: number;
    col: number;
    cropId: string | null;
    plantTime: number; // Timestamp
    state: 'empty' | 'growing' | 'ready' | 'wilted';
    isWatered: boolean;
    hasBug: boolean;
    hasWeed: boolean;
}

export interface AnimalInstance {
    id: string; // Unique instance ID
    animalId: string; // Type (chicken, cow)
    x: number;
    y: number;
    purchaseTime: number;
    lastProductTime: number;
    state: 'idle' | 'eating' | 'producing';
}

export class GameStateManager {
    private static instance: GameStateManager;

    public player: PlayerData;
    public farmPlots: PlotData[];

    public animals: AnimalInstance[];

    // Signaler for events
    public events: Phaser.Events.EventEmitter;

    private constructor() {
        this.events = new Phaser.Events.EventEmitter();

        // Default initial state
        this.player = {
            coins: 500,
            credits: 0,
            level: 1,
            xp: 0,
            name: 'Farmer',
            inventory: {}
        };

        this.farmPlots = [];
        this.animals = [];

        this.loadGame();
    }

    public static getInstance(): GameStateManager {
        if (!GameStateManager.instance) {
            GameStateManager.instance = new GameStateManager();
        }
        return GameStateManager.instance;
    }

    public saveGame() {
        const data = {
            player: this.player,
            farmPlots: this.farmPlots,
            animals: this.animals,
            timestamp: Date.now()
        };
        localStorage.setItem('farmfriend_save', JSON.stringify(data));
        console.log('Game saved');
    }

    public loadGame() {
        const saveStr = localStorage.getItem('farmfriend_save');
        if (saveStr) {
            try {
                const data = JSON.parse(saveStr);
                // Merge player data to ensure new fields like inventory exist
                this.player = { ...this.player, ...data.player };
                if (!this.player.inventory) {
                    this.player.inventory = {};
                }

                this.farmPlots = data.farmPlots;
                this.animals = data.animals || [];
                // We should also handle offline time calculation here via TimeManager later
            } catch (e) {
                console.error('Failed to load save', e);
            }
        }
    }

    public resetGame() {
        localStorage.removeItem('farmfriend_save');
        location.reload();
    }
}
