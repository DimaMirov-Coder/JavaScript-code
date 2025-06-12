system.runInterval(() => {
    const dimension = world.getDimension('overworld');
    const startPos = { x: 85, y: -56, z: 38 };
    const startBlock = dimension.getBlock(startPos);

    // Проверяем, что начальный блок — сундук
    if (startBlock.typeId !== "minecraft:chest") return;

    const visited = new Set();

    // Поиск цепочки алмазных блоков, ведущей к другому сундуку
    function searchChain(currentBlock) {
        const posKey = `${currentBlock.x},${currentBlock.y},${currentBlock.z}`;
        if (visited.has(posKey)) return null;
        visited.add(posKey);

        // Проверяем соседей (6 направлений)
        const neighbors = [
            currentBlock.above(),
            currentBlock.below(),
            currentBlock.north(),
            currentBlock.south(),
            currentBlock.east(),
            currentBlock.west(),
        ].filter(b => b != null);

        for (const neighbor of neighbors) {
            if (neighbor.typeId === "minecraft:chest" && !(neighbor.x === startBlock.x && neighbor.y === startBlock.y && neighbor.z === startBlock.z)) {
                // Нашли второй сундук — возвращаем его
                return neighbor;
            }
            if (neighbor.typeId === "minecraft:diamond_block") {
                // Продолжаем поиск по алмазным блокам
                const result = searchChain(neighbor);
                if (result) return result;
            }
        }
        return null;
    }

    const targetChestBlock = searchChain(startBlock);
    if (!targetChestBlock) {
        //console.warn("Второй сундук не найден в цепочке алмазных блоков");
        return;
    }

    // Получаем компоненты контейнеров сундуков
    const startContainer = startBlock.getComponent("minecraft:inventory").container;
    const targetContainer = targetChestBlock.getComponent("minecraft:inventory").container;

    if (!startContainer || !targetContainer) {
        console.warn("Один из сундуков не имеет компонента контейнера");
        return;
    }

    // Перебираем слоты начального сундука и переносим предметы
    for (let slot = 0; slot < startContainer.size; slot++) {
        const item = startContainer.getItem(slot);
        if (item) {
            // Пытаемся положить предмет в первый свободный слот целевого сундука
            for (let targetSlot = 0; targetSlot < targetContainer.size; targetSlot++) {
                const targetItem = targetContainer.getItem(targetSlot);
                if (!targetItem) {
                    if(item.amount <= 1) {
                        startContainer.transferItem(slot, targetContainer)
                        console.warn(`Перенёс ${item.typeId} из сундука (${startBlock.x},${startBlock.y},${startBlock.z}) в сундук (${targetChestBlock.x},${targetChestBlock.y},${targetChestBlock.z})`);
                    }
                    
                    return; // переносим только один предмет за вызов
                }
            }
            // Если места нет — ничего не делаем
            console.warn("Нет места в целевом сундуке");
            return;
        }
    }
}, 10);
