import { GameStateManager } from './GameStateManager';
import { CROPS } from '../data/CropData';

export class TimeManager {
    private gameState: GameStateManager;

    constructor() {
        this.gameState = GameStateManager.getInstance();
    }

    public getCropState(plotRow: number, plotCol: number): {
        stage: number,
        progress: number,
        isReady: boolean,
        isWilted: boolean
    } | null {
        const plot = this.gameState.farmPlots.find(p => p.row === plotRow && p.col === plotCol);
        if (!plot || plot.state === 'empty' || !plot.cropId) return null;

        const cropConfig = CROPS[plot.cropId];
        if (!cropConfig) return null;

        const now = Date.now();
        const elapsedSeconds = (now - plot.plantTime) / 1000;

        // Calculate progress (0 to 1)
        let progress = elapsedSeconds / cropConfig.growthTime;

        // Barn Buddy logic: If unharvested for too long, it wilts.
        // Let's say wilt time = 2x growth time
        const wiltTime = cropConfig.growthTime * 2;

        if (elapsedSeconds > wiltTime) {
            return { stage: cropConfig.stages, progress: 1, isReady: false, isWilted: true };
        }

        if (progress >= 1) {
            return { stage: cropConfig.stages, progress: 1, isReady: true, isWilted: false };
        }

        // Calculate current visual stage
        // stage 1 to total stages
        const stage = Math.floor(progress * (cropConfig.stages - 1)) + 1;

        return { stage, progress, isReady: false, isWilted: false };
    }

    // Logic handles offline time automatically by comparing timestamps.
}
