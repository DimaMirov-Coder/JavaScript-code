import {system} from "@minecraft/server";

system.runInterval(() => {
    for (let player of world.getAllPlayers()) {
        let xp = getScore('exp', player); // Текущий опыт
        let level = 0; // Текущий уровень
        const maxLevel = 100; // Максимальная граница уровня
        const levelsPerUpgrade = 500; // Количество уровней для повышения
        let amount = 0; // Количество опыта, которое нужно добавить

        levelUpSystem(player, xp, level, maxLevel, levelsPerUpgrade, amount);
    }
})
