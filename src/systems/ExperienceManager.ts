import { GameStateManager } from './GameStateManager';

export class ExperienceManager {
    private gameState: GameStateManager;

    constructor() {
        this.gameState = GameStateManager.getInstance();
    }

    public addXp(amount: number) {
        this.gameState.player.xp += amount;
        this.checkLevelUp();

        this.gameState.saveGame();
        this.gameState.events.emit('xp_changed', {
            xp: this.gameState.player.xp,
            level: this.gameState.player.level
        });
    }

    // Simple level formula: Level * 100 XP required for next level
    public getXpForNextLevel(level: number): number {
        return level * 100;
    }

    private checkLevelUp() {
        let currentLevel = this.gameState.player.level;
        let currentXp = this.gameState.player.xp;
        let requiredXp = this.getXpForNextLevel(currentLevel);

        while (currentXp >= requiredXp) {
            currentXp -= requiredXp;
            currentLevel++;
            requiredXp = this.getXpForNextLevel(currentLevel);

            this.gameState.events.emit('level_up', { level: currentLevel });
        }

        this.gameState.player.level = currentLevel;
        // Ideally we keep total XP and calculate level from function, 
        // but for simplicity we'll keep it accumulating
    }
}
