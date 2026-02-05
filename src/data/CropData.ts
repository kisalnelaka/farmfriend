import { CropConfig } from '../types/GameTypes';

export const CROPS: Record<string, CropConfig> = {
    turnip: {
        id: 'turnip',
        name: 'Turnip',
        seedPrice: 15,
        sellPrice: 23,
        xp: 1,
        growthTime: 60, // 1 min (demo speed) -> Real game: 4 hours? Keep it fast for now
        minLevel: 1,
        stages: 4,
        color: 0xffffff // White
    },
    carrot: {
        id: 'carrot',
        name: 'Carrot',
        seedPrice: 20,
        sellPrice: 32,
        xp: 2,
        growthTime: 120, // 2 mins
        minLevel: 1,
        stages: 4,
        color: 0xffa500 // Orange
    },
    corn: {
        id: 'corn',
        name: 'Corn',
        seedPrice: 30,
        sellPrice: 48,
        xp: 3,
        growthTime: 300, // 5 mins
        minLevel: 2,
        stages: 5,
        color: 0xffff00 // Yellow
    },
    potato: {
        id: 'potato',
        name: 'Potato',
        seedPrice: 25,
        sellPrice: 40,
        xp: 2,
        growthTime: 240, // 4 mins
        minLevel: 2,
        stages: 4,
        color: 0x8b4513 // Brown
    },
    eggplant: {
        id: 'eggplant',
        name: 'Eggplant',
        seedPrice: 40,
        sellPrice: 65,
        xp: 4,
        growthTime: 600, // 10 mins
        minLevel: 3,
        stages: 4,
        color: 0x800080 // Purple
    },
    tomato: {
        id: 'tomato',
        name: 'Tomato',
        seedPrice: 50,
        sellPrice: 85,
        xp: 5,
        growthTime: 900, // 15 mins
        minLevel: 4,
        stages: 5,
        color: 0xff0000 // Red
    },
    watermelon: {
        id: 'watermelon',
        name: 'Watermelon',
        seedPrice: 150,
        sellPrice: 260,
        xp: 15,
        growthTime: 3600, // 1 hour
        minLevel: 10,
        stages: 5,
        color: 0x006400 // Dark Green
    },
    pineapple: {
        id: 'pineapple',
        name: 'Pineapple',
        seedPrice: 250,
        sellPrice: 450,
        xp: 25,
        growthTime: 7200, // 2 hours
        minLevel: 15,
        stages: 5,
        color: 0xffd700 // Gold
    }
    // Add more crops as needed
};
