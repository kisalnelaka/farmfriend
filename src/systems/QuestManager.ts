import { GameStateManager } from './GameStateManager';
import { EconomyManager } from './EconomyManager';
import { ExperienceManager } from './ExperienceManager';

export interface Quest {
    id: string;
    title: string;
    description: string;
    type: 'plant' | 'harvest' | 'buy_animal';
    targetId: string; // e.g., 'turnip', 'chicken'
    count: number;
    current: number;
    rewardCoin: number;
    rewardXp: number;
    isCompleted: boolean;
}

export class QuestManager {
    private static instance: QuestManager;
    public activeQuest: Quest | null = null;

    private gameState: GameStateManager;

    // Dependencies injected usually, but simplified here

    private constructor() {
        this.gameState = GameStateManager.getInstance();
        this.generateNewQuest();
    }

    public static getInstance(): QuestManager {
        if (!QuestManager.instance) {
            QuestManager.instance = new QuestManager();
        }
        return QuestManager.instance;
    }

    public generateNewQuest() {
        // Simple random quest generator
        const types = ['plant', 'harvest', 'buy_animal'];
        const type = types[Math.floor(Math.random() * types.length)] as Quest['type'];

        let targetId = '';
        let title = '';
        let count = 1;

        if (type === 'plant' || type === 'harvest') {
            targetId = Math.random() > 0.5 ? 'turnip' : 'carrot';
            count = Math.floor(Math.random() * 5) + 3;
            title = `${type.charAt(0).toUpperCase() + type.slice(1)} ${count} ${targetId}s`;
        } else {
            targetId = 'chicken';
            title = 'Buy a Chicken';
        }

        this.activeQuest = {
            id: Date.now().toString(),
            title,
            description: title,
            type,
            targetId,
            count,
            current: 0,
            rewardCoin: 100,
            rewardXp: 50,
            isCompleted: false
        };

        // Signal update
    }

    public updateProgress(type: Quest['type'], targetId: string, amount: number = 1) {
        if (!this.activeQuest || this.activeQuest.isCompleted) return;

        if (this.activeQuest.type === type && this.activeQuest.targetId === targetId) {
            this.activeQuest.current += amount;

            if (this.activeQuest.current >= this.activeQuest.count) {
                this.completeQuest();
            }
        }
    }

    private completeQuest() {
        if (!this.activeQuest) return;

        this.activeQuest.isCompleted = true;

        // Give rewards
        // Hacky access to managers for now since they are stateless logic mostly
        // Ideally use events or pass managers in
        const gameState = GameStateManager.getInstance();
        gameState.player.coins += this.activeQuest.rewardCoin;
        gameState.player.xp += this.activeQuest.rewardXp;
        gameState.saveGame();

        gameState.events.emit('quest_completed', this.activeQuest);
        gameState.events.emit('currency_changed', {});

        // Generate new quest after delay?
        setTimeout(() => this.generateNewQuest(), 5000);
    }
}
