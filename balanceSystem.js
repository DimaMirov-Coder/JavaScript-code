import { world, system, CommandPermissionLevel, CustomCommandParamType, CustomCommandOrigin, CustomCommandStatus, BlockTypes } from "@minecraft/server";
import { EconomyManager } from "./EconomyManager.js";

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    const balance = {
        name: "custom:balance",
        description: `Проверить свой баланс`,
        permissionLevel: CommandPermissionLevel.Any,
    };
    customCommandRegistry.registerCommand(balance, getBal);
});

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    const setbalance = {
        name: "custom:setbalance",
        description: `Установить количество денег у игрока`,
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [
            { type: CustomCommandParamType.PlayerSelector, name: "Player" },
        ],
        optionalParameters: [
            { type: CustomCommandParamType.Integer, name: "Amount" },
        ]
    };
    customCommandRegistry.registerCommand(setbalance, setBal);
});

function getBal(origin) {
    const pl = origin?.sourceEntity;
    if (!pl) {
        console.error("Player is undefined.");
        return {
            status: CustomCommandStatus.Failure
        };
    }
    const bal = new EconomyManager(pl)
    pl.sendMessage("§lВаш баланс: " + JSON.stringify(bal.getBalance("money")) + "$")
}

function setBal(origin, players, amount) {
    const pl = origin?.sourceEntity;
    for (const player of players) {
        if (!player || !pl) {
            console.error("Player is undefined.");
            return {
                status: CustomCommandStatus.Failure
            };
        }
        const bal = new EconomyManager(player)
        bal.setBalance("money", amount)
        pl.sendMessage(`Вы выдали ${amount} монет игроку ${player.name}`)
        player.sendMessage(`§lИгрок ${pl.name} установил ваш баланс на: ${amount}`)
    }
}
