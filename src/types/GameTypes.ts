export interface CropConfig {
    id: string;
    name: string;
    seedPrice: number;
    sellPrice: number;
    xp: number;
    growthTime: number; // in seconds
    minLevel: number;
    stages: number; // number of growth stages
    color: number; // Placeholder color for debug
}

export interface AnimalConfig {
    id: string;
    name: string;
    purchasePrice: number;
    sellPrice: number; // Price of the animal itself
    productName: string;
    productPrice: number;
    productXp: number;
    productionTime: number; // in seconds
    minLevel: number;
    color: number; // Also debug color
}

export enum GameState {
    LOADING,
    MENU,
    PLAYING,
    SHOP,
    VISITING
}
