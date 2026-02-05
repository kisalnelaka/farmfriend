import { GameStateManager } from './GameStateManager';

export class EconomyManager {
    private gameState: GameStateManager;

    constructor() {
        this.gameState = GameStateManager.getInstance();
    }

    public canAfford(cost: number, currency: 'coins' | 'credits' = 'coins'): boolean {
        if (currency === 'coins') {
            return this.gameState.player.coins >= cost;
        } else {
            return this.gameState.player.credits >= cost;
        }
    }

    public spend(amount: number, currency: 'coins' | 'credits' = 'coins'): boolean {
        if (!this.canAfford(amount, currency)) return false;

        if (currency === 'coins') {
            this.gameState.player.coins -= amount;
        } else {
            this.gameState.player.credits -= amount;
        }

        this.gameState.saveGame();
        this.gameState.events.emit('currency_changed', {
            coins: this.gameState.player.coins,
            credits: this.gameState.player.credits
        });

        return true;
    }

    public earn(amount: number, currency: 'coins' | 'credits' = 'coins') {
        if (currency === 'coins') {
            this.gameState.player.coins += amount;
        } else {
            this.gameState.player.credits += amount;
        }

        this.gameState.saveGame();
        this.gameState.events.emit('currency_changed', {
            coins: this.gameState.player.coins,
            credits: this.gameState.player.credits
        });
    }
}
