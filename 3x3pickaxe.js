import { world, system, Player } from '@minecraft/server';
import { getOrientation, getOrientationX } from "./functions";


world.afterEvents.playerBreakBlock.subscribe(({ itemStackBeforeBreak, player, block }) => {
    const forbiddenBlock = ['minecraft:bedrock', 'minecraft:grass', 'minecraft:dirt']; // Запрещенный блок
    const tools = ["ptw:wood_hammer","ptw:copper_hammer","ptw:gold_hammer","ptw:stone_hammer","ptw:iron_hammer","ptw:diamond_hammer","ptw:netherite_hammer",];
    const radius = 1; // Радиус разрушения, который можно изменять
    const { x: bX, y: bY, z: bZ } = block.location;
    const playerOrientationY = getOrientation(player.getRotation().y);
    const playerOrientationX = getOrientationX(player.getRotation().x);
    if (player.isSneaking) return
    if (!itemStackBeforeBreak) return;
    if (!tools.includes(itemStackBeforeBreak.typeId)) return;
    for (let deltaY = -radius; deltaY <= radius; deltaY++) {
        for (let deltaXZ = -radius; deltaXZ <= radius; deltaXZ++) {
            if (deltaXZ === 0 && deltaY === 0) continue; // Пропускаем исходный блок
            let x, y, z;
            if (playerOrientationX >= 0) {
                x = bX < 0 ? bX - deltaY : bX + deltaY;
                y = bY;
                z = bZ < 0 ? bZ - deltaXZ : bZ + deltaXZ;
            } else {
                x = playerOrientationY >= 3 ? bX : bX < 0 ? bX - deltaXZ : bX + deltaXZ;
                y = bY < 0 ? bY - deltaY : bY + deltaY;
                z = playerOrientationY < 3 ? bZ : bZ < 0 ? bZ - deltaXZ : bZ + deltaXZ;
            }
            const block = player.dimension.getBlock({ x, y, z });
            if (!block || forbiddenBlock.includes(block.type.id)) continue; // Проверяем, не является ли блок запрещенным
            player.runCommand(`setblock ${x} ${y} ${z} air destroy`);
        }
    }
});