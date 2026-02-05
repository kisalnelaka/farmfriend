import { AnimalConfig } from '../types/GameTypes';

export const ANIMALS: Record<string, AnimalConfig> = {
    chicken: {
        id: 'chicken',
        name: 'Chicken',
        purchasePrice: 200,
        sellPrice: 100,
        productName: 'Egg',
        productPrice: 15,
        productXp: 3,
        productionTime: 600, // 10 mins
        minLevel: 1,
        color: 0xffebcd // Blanched Almond
    },
    cow: {
        id: 'cow',
        name: 'Cow',
        purchasePrice: 1000,
        sellPrice: 500,
        productName: 'Milk',
        productPrice: 50,
        productXp: 10,
        productionTime: 3600, // 1 hour
        minLevel: 5,
        color: 0xffffff // White (with spots ideally)
    },
    pig: {
        id: 'pig',
        name: 'Pig',
        purchasePrice: 800,
        sellPrice: 400,
        productName: 'Truffle', // Or just "Pig Meat" if we go dark lol, original game had products? Original just had selling? 
        // Checking original: Animals were raised and sold, or gave products. Chicken -> Egg. Cow -> Milk.
        // Pig? Usually just decoration or sold. Let's say "Bacon" implies death. Let's say "Truffle" as a renewable resource for now or just sell the animal.
        // Actually original Barn Buddy animals produced items.
        productPrice: 80,
        productXp: 15,
        productionTime: 5400, // 1.5 hours
        minLevel: 6,
        color: 0xffc0cb // Pink
    },
    sheep: {
        id: 'sheep',
        name: 'Sheep',
        purchasePrice: 1200,
        sellPrice: 600,
        productName: 'Wool',
        productPrice: 60,
        productXp: 12,
        productionTime: 2700, // 45 mins
        minLevel: 8,
        color: 0xd3d3d3 // Light Gray
    },
    dog: {
        id: 'dog',
        name: 'Guard Dog',
        purchasePrice: 5000,
        sellPrice: 0,
        productName: 'Protection',
        productPrice: 0,
        productXp: 0,
        productionTime: 0, // Always active
        minLevel: 10,
        color: 0x8b4513 // Brown
    }
};
