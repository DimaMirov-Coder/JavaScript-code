export function levelUpSystem(player, xp, level, maxLevel, levelsPerUpgrade, amount) {
    // Проверка, достигнута ли максимальная граница уровня
    if (level >= maxLevel) {
        player.sendMessage('Достигнут максимальный уровень')
      return;
    }
  
    // Увеличение опыта
    xp += amount;
  
    // Проверка, достаточно ли опыта для повышения уровня
    while (xp >= levelsPerUpgrade) {
      xp -= levelsPerUpgrade; // Уменьшение опыта после повышения уровня
      level++; // Увеличение уровня
  
      // Проверка, достигнута ли максимальная граница уровня после повышения
      if (level >= maxLevel) {
        // console.warn("Вы достигли максимального уровня.");
        break;
      }
    }
  
    // Вывод информации об уровне и опыте
    player.runCommandAsync(`scoreboard players set @s level ${level}`)
    // console.warn("Уровень:", level);
    // console.warn("Опыт:", xp);
}
