import { PlotData } from './GameStateManager';
import { CROPS } from '../data/CropData';

export interface Neighbor {
    id: string;
    name: string;
    level: number;
    plots: PlotData[];
    avatar: string; // Color or texture key
}

export class NeighborManager {
    private static instance: NeighborManager;
    public neighbors: Neighbor[] = [];

    private constructor() {
        this.generateNeighbors();
    }

    public static getInstance(): NeighborManager {
        if (!NeighborManager.instance) {
            NeighborManager.instance = new NeighborManager();
        }
        return NeighborManager.instance;
    }

    private generateNeighbors() {
        // Create some fake friends
        const names = ['Barnaby', 'Mary', 'Old MacDonald', 'Daisy'];

        names.forEach((name, index) => {
            this.neighbors.push({
                id: `ai_${index}`,
                name: name,
                level: 1 + index * 2,
                plots: this.generateRandomplots(6 * 8), // Standard grid
                avatar: '0x' + Math.floor(Math.random() * 16777215).toString(16)
            });
        });
    }

    public generateRandomplots(count: number): PlotData[] {
        const plots: PlotData[] = [];
        const cropKeys = Object.keys(CROPS);

        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / 8);
            const col = i % 8;

            // Random state
            const r = Math.random();
            let state: PlotData['state'] = 'empty';
            let cropId: string | null = null;

            if (r > 0.5) {
                // Planted
                // Correct logic: High range = Ready, Mid-High = Wilted, Low-Mid = Growing
                // r > 0.85 -> Ready
                // r > 0.75 -> Wilted
                // Else -> Growing
                if (r > 0.85) state = 'ready';
                else if (r > 0.75) state = 'wilted';
                else state = 'growing';

                cropId = cropKeys[Math.floor(Math.random() * cropKeys.length)];
            }

            plots.push({
                row, col,
                cropId,
                state,
                plantTime: Date.now() - Math.random() * 100000,
                isWatered: Math.random() > 0.5
            });
        }
        return plots;
    }

    // Refresh neighbor farms (call effectively when visiting to simulate activity)
    public refreshNeighbor(neighborId: string) {
        const neighbor = this.neighbors.find(n => n.id === neighborId);
        if (neighbor) {
            neighbor.plots = this.generateRandomplots(neighbor.plots.length);
        }
    }
}
