export function levelUpSystem(player, xp, level, maxLevel, levelsPerUpgrade, amount) {
    // Проверка, достигнута ли максимальная граница уровня
    if (level >= maxLevel) {
        if(!player.hasTag('maxLevel')) {
            player.onScreenDisplay.setActionBar(`§3§lВы достигли максимального уровня`)
            player.playSound('firework.launch')
            player.runCommand(`summon fireworks_rocket ${player.location.x} ${player.location.y+3} ${player.location.z} ~ ~`)
        }
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
        player.runCommandAsync('title @a times 0 100 0')
        if(!player.hasTag('maxLevel')) {
            player.onScreenDisplay.setActionBar(`§3§lВы достигли максимального уровня`)
            player.playSound('firework.launch')
            player.runCommand(`summon fireworks_rocket ${player.location.x} ${player.location.y+3} ${player.location.z} ~ ~`)
            player.addTag('maxLevel')
        }
        break;
      }
    }
  
    // Вывод информации об уровне и опыте
    player.runCommandAsync(`scoreboard players set @s level ${level}`)
    // console.warn("Уровень:", level);
    // console.warn("Опыт:", xp);
}
