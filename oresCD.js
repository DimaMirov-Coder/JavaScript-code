import { world, system } from "@minecraft/server";

world.afterEvents.playerBreakBlock.subscribe((eventData) => {
    const { itemStackBeforeBreak, brokenBlockPermutation, block } = eventData;
    if (!itemStackBeforeBreak?.typeId.includes("_pickaxe")) return
    let Ores = []
    if (itemStackBeforeBreak.typeId.includes("_pickaxe") && brokenBlockPermutation.type.id.includes('_ore') || brokenBlockPermutation.type.id.includes('_debris')) {
        Ores = brokenBlockPermutation.type.id
        block.setType('minecraft:bedrock');
        system.waitTicks(200).then(() => {
            block.setType(Ores);
        })
    };
});
