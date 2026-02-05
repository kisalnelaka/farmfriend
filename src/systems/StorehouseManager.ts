import { GameStateManager } from './GameStateManager';
import { CROPS } from '../data/CropData';
import { ANIMALS } from '../data/AnimalData';

export class StorehouseManager {
    private gameState: GameStateManager;

    constructor() {
        this.gameState = GameStateManager.getInstance();
    }

    public addItem(itemId: string, amount: number = 1) {
        if (!this.gameState.player.inventory[itemId]) {
            this.gameState.player.inventory[itemId] = 0;
        }
        this.gameState.player.inventory[itemId] += amount;
        this.gameState.saveGame();
        this.gameState.events.emit('inventory_changed', this.gameState.player.inventory);
    }

    public removeItem(itemId: string, amount: number = 1): boolean {
        if (!this.gameState.player.inventory[itemId] || this.gameState.player.inventory[itemId] < amount) {
            return false;
        }
        this.gameState.player.inventory[itemId] -= amount;
        if (this.gameState.player.inventory[itemId] <= 0) {
            delete this.gameState.player.inventory[itemId];
        }
        this.gameState.saveGame();
        this.gameState.events.emit('inventory_changed', this.gameState.player.inventory);
        return true;
    }

    public hasItem(itemId: string, amount: number = 1): boolean {
        return (this.gameState.player.inventory[itemId] || 0) >= amount;
    }

    public getQuantity(itemId: string): number {
        return this.gameState.player.inventory[itemId] || 0;
    }

    public sellItem(itemId: string, amount: number = 1): number {
        if (!this.removeItem(itemId, amount)) return 0;

        let price = 0;
        // Check crops
        if (CROPS[itemId]) {
            price = CROPS[itemId].sellPrice;
        }

        // Fallback for valid items that missed config or generic items
        if (price === 0) {
            console.warn(`Item ${itemId} has no price defined. Using default.`);
            price = 10;
        }

        const totalValue = price * amount;
        if (totalValue > 0) {
            // Add coins
            const gameState = GameStateManager.getInstance();
            gameState.player.coins += totalValue;
            gameState.saveGame();
            gameState.events.emit('currency_changed', {});
        } else {
            console.error(`Sell failed for ${itemId}: Value is 0`);
        }

        return totalValue;
    }
}
