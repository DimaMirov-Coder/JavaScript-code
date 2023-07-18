import { system, world } from "@minecraft/server";

let max = 500;
let price = 100;
let limit = 5;
let pre = "#";
const prefix = "§7[§bLand§7] §r";
let land = [];
let cache = [];
let settings = [];
runCommand("scoreboard objectives add database dummy");
runCommand("scoreboard objectives add Money dummy");

system.runInterval(() => {
	initDB_Land();
	initSettings();
	const players = [...world.getPlayers()];
	if (players.length > 0) {
		for (const player of players) {
			if (player.hasTag("info")) {
				let pos = {
					x: Math.floor(player.location.x),
					z: Math.floor(player.location.z),
					dim: player.dimension.id
				};
				let lands = checkLand(pos);
				if (lands != undefined) {
					player.runCommandAsync(`titleraw @s actionbar {"rawtext":[{"text":"Приват: §e${lands.name}\n§rВладелец: §e${lands.owner}\n§rКоординаты: §e(${lands.x1}, ${lands.z1}) (${lands.x2}, ${lands.z2})"}]}`);
				} else {
					player.runCommandAsync("title @s actionbar Дикие земли");
				}
			}
		}
	}
}, 1);

function runCommand(command) {
	try {
		return { error: false, ...world.getDimension(`overworld`).runCommandAsync(command) };
	} catch (error) {
		return { error: true };
	}
}

function initSettings() {
	world.scoreboard.getObjective('database').getScores().forEach(i => {
		if (i.participant.displayName.match(/(?<=\$setting\()[0-1\s]+(?=\))/g) != null) {
			let json = JSON.parse(binaryToText(i.participant.displayName.match(/(?<=\$setting\()[0-1\s]+(?=\))/g).join("")));
			if (settings.find((c) => c.max == json.max && c.pref == json.pref && c.limit == json.limit && c.price == c.price) == undefined) {
				settings = [];
				settings.push(json);
				max = settings[0].max;
				price = settings[0].price;
				limit = settings[0].limit;
				pre = settings[0].pref;
			}
		}
	});
}

function initDB_Land() {
	world.scoreboard.getObjective('database').getScores().forEach(i => {
		if (i.participant.displayName.match(/(?<=\$land\()[0-1\s]+(?=\))/g) != null) {
			let json = JSON.parse(binaryToText(i.participant.displayName.match(/(?<=\$land\()[0-1\s]+(?=\))/g).join("")));
			if (land.find((c) => c.name == json.name && c.owner == json.owner && c.dim == json.dim) == undefined) {
				land.push(json);
			}
		}
	});
}

function isInLand(pos) {
	for (let i = 0; i < land.length; i++) {
		let xz = land[i];
		if (xz.xmin >= pos.xmin && xz.xmax <= pos.xmax && xz.zmin >= pos.zmin && xz.zmax <= pos.zmax && pos.dim === xz.dim) {
			return true;
		}
	}
	return false;
}

function isInLand2(pos) {
	for (let i = 0; i < land.length; i++) {
		let xz = land[i];
		if (pos.xmin <= xz.xmax && pos.xmax >= xz.xmin && pos.zmin <= xz.zmax && pos.zmax >= xz.zmin && pos.dim === xz.dim) {
			return true;
		}
	}
	return false;
}

function checkLand(pos) {
	for (let i = 0; i < land.length; i++) {
		let xz = land[i];
		if (xz.xmin <= pos.x && xz.xmax >= pos.x && xz.zmin <= pos.z && xz.zmax >= pos.z && xz.dim == pos.dim) {
			return land[i];
		}
	}
	return undefined;
}

function getMoney(player) {
	return world.scoreboard.getObjective('Money').getScore(player.scoreboard);
}

function textToBinary(text) {
	return text.split("").map((char) => {
		return char.charCodeAt(0).toString(2);
	}).join(" ");
}

function binaryToText(binary) {
	return binary.split(" ").map((char) => {
		return String.fromCharCode(parseInt(char, 2));
	}).join("");
}

function getLands(player) {
	const lands = [];
	if (land.length > 0) {
		land.forEach((e) => {
			if (e.owner === player.name) {
				lands.push(e);
			}
		});
		if (lands.length > 0) {
			return lands;
		}
	}
	return undefined;
}

function getDim(dim) {
	switch (dim) {
		case "minecraft:overworld":
			return "§2Overworld";
		case "minecraft:nether":
			return "§cNether";
		case "minecraft:the_end":
			return "§5The End";
		default:
			return "§0Unknown";
	}
}

world.events.beforeItemUseOn.subscribe(event => {
	let player = event.source;
	let block = world.getDimension(player.dimension.id).getBlock(event.getBlockLocation());
	let pos = {
		x: Math.floor(block.location.x),
		z: Math.floor(block.location.z),
		dim: player.dimension.id
	};
	let iLand = checkLand(pos);
	if (iLand != undefined) {
	    let access = iLand.access;
		if (iLand.owner == player.name || access.includes(player.name) || player.isOp() || player.hasTag("admin")) {
			return -1;
		} else {
			player.sendMessage(prefix + "§7Sorry, you can't access land owned by: " + iLand.owner);
			event.cancel = true;
			return -1;
		}
	}
});

world.events.blockBreak.subscribe(event => {
	let block = event.block;
	let player = event.player;
	let pos = {
		x: Math.floor(block.location.x),
		z: Math.floor(block.location.z),
		dim: player.dimension.id
	};
	let iLand = checkLand(pos);
	if (iLand != undefined) {
	    let access = iLand.access;
		if (iLand.owner == player.name || access.includes(player.name) || player.isOp() || player.hasTag("admin")) {
			return -1;
		} else {
			player.dimension.fillBlocks(block.location, block.location, event.brokenBlockPermutation);
			player.runCommandAsync("kill @e[type=item,r=10]");
			player.sendMessage(prefix + "§7Sorry, you can't access land owned by: " + iLand.owner);
			return -1;
		}
	}
});

world.events.beforeChat.subscribe(event => {
    const sender = event.sender;
    const message = event.message;
    if(message.substring(0, 1) != pre){
        return -1;
    }
    const command = message.substring(1).split(" ");
    switch (command[0]) {
        case "land":
            switch (command[1]) {
                case "help":
                    sender.sendMessage(prefix + "Cписок комманд для создания привата:");
					if (sender.hasTag("admin") || sender.isOp()) {
						sender.sendMessage(prefix + "§eАдмин комманды:");
						sender.sendMessage(prefix + "> §6" + pre + "land prefix <prefix> §7| Set prefix command.");
						sender.sendMessage(prefix + "> §6" + pre + "land maxblock <max> §7| Set limit blocks that can be claimed.");
						sender.sendMessage(prefix + "> §6" + pre + "land limit <limit> §7| Set limit land per player.");
						sender.sendMessage(prefix + "> §6" + pre + "land costperblock <cost> §7| Set cost per block.");
						sender.sendMessage(prefix + "> §6" + pre + "land view-settings §7| View the settings.");
						sender.sendMessage(prefix + "> §6" + pre + "land reset-settings §7| Reset all settings.");
						sender.sendMessage(prefix + "§aОбычные комманды:");
					}
					sender.sendMessage(prefix + "> " + pre + "startp §7| §eУстановить первую точки привата.");
					sender.sendMessage(prefix + "> " + pre + "endp §7| §eУстановить вторую точку привата.");
					sender.sendMessage(prefix + "> " + pre + "landbuy <name> §7| §eПодтвердить создание привата.");
					sender.sendMessage(prefix + "> " + pre + "landsell <id> §7| §eПродать свой приват.");
					sender.sendMessage(prefix + "> " + pre + "land list §7| §eОтображает список приватов которыми вы владеете.");
					sender.sendMessage(prefix + "> " + pre + "land info <id> §7| §eОтображает информацию о вашем привате.");
					sender.sendMessage(prefix + "> " + pre + "land here §7| §eSeeing the land owner in your position §c(ПОКА НЕ ЗНАЮ КАК ЭТО ПЕРЕВЕСТИ).");
					sender.sendMessage(prefix + "> " + pre + "land invite <player> §7| §eДобавить игрока в приват.");
					sender.sendMessage(prefix + "> " + pre + "land kick <player> §7| §eИсключить игрока из привата.");
					sender.sendMessage(prefix + "> " + pre + "land accept <id> §7| §eПринять приглашение на добавление в приват.");
                break;
                case "here":
					let pos = {
						x: Math.floor(sender.location.x),
						z: Math.floor(sender.location.z),
						dim: sender.dimension.id
					};
					if (checkLand(pos) != undefined) {
						sender.sendMessage(prefix + "This land belongs to " + checkLand(pos).owner);
						event.cancel = true;
						return -1;
					}
					sender.sendMessage(prefix + "No one claims land here.");
				break;
				case "list":
					if (getLands(sender) == undefined) {
					    let satuLagi = [];
					    land.forEach((la) => {
					        if (la.access.includes(sender.name)) {
					            satuLagi.push(la);
					        }
					    });
					    if (satuLagi.length > 0) {
					        sender.sendMessage(prefix + "Accessible land (" + satuLagi.length + "):");
					        satuLagi.forEach((b) => {
					            sender.sendMessage(prefix + "> §f" + b.name + ": §e(" + b.x1 + ", " + b.z1 + ") (" + b.x2 + ", " + b.z2 + ") §b| " + getDim(b.dim));
					        });
					        event.cancel = true;
					        return -1;
					    }
					    sender.sendMessage(prefix + "§7You don't have any land.");
					    event.cancel = true;
					    return -1;
					}
					let senderLand = getLands(sender);
					sender.sendMessage(prefix + "List your land: (" + senderLand.length + "/" + limit + "):");
					senderLand.forEach((a) => {
						sender.sendMessage(prefix + "> §f" + a.name + ": §e(" + a.x1 + ", " + a.z1 + ") (" + a.x2 + ", " + a.z2 + ") §b| " + getDim(a.dim) + " §b| §fID: §a" + a.id);
					});
					let satuLagi = [];
					land.forEach((la) => {
						if (la.access.includes(sender.name)) {
							satuLagi.push(la);
						}
					});
					if (satuLagi.length > 0) {
						sender.sendMessage(prefix + "Accessible land (" + satuLagi.length + "):");
						satuLagi.forEach((b) => {
							sender.sendMessage(prefix + "> §f" + b.name + ": §e(" + b.x1 + ", " + b.z1 + ") (" + b.x2 + ", " + b.z2 + ") §b| " + getDim(b.dim));
						});
					}
				break;
				case "view-settings":
					if (sender.hasTag("admin") || sender.isOp()) {
						sender.sendMessage(prefix + "§eSettings:");
						sender.sendMessage(prefix + "> Limit: §b" + limit);
						sender.sendMessage(prefix + "> Cost per block: §b" + price);
						sender.sendMessage(prefix + "> Max block: §b" + max);
						sender.sendMessage(prefix + "> Prefix: §b" + pre);
						event.cancel = true;
						return -1;
					}
					sender.sendMessage(prefix + "§7You don't have permission to access this command");
				break;
				case "reset-settings":
				    if (sender.hasTag("admin") || sender.isOp()) {
				        let sett = {
				            pref: pre,
							limit: limit,
							max: max,
							price: price
				        }
				        sender.runCommandAsync("scoreboard players reset \"$setting(" + textToBinary(JSON.stringify(sett)) + ")\" database");
				        settings = [];
				        pre = "#";
				        limit = 3;
				        max = 500;
				        price = 100;
				        sender.sendMessage(prefix + "All settings have been changed!");
				        event.cancel = true;
				        return -1;
				    }
				    sender.sendMessage(prefix + "§7You don't have permission to access this command");
				break;
				case "invite":
					if (command.length == 2) {
						sender.sendMessage(prefix + "§7Введите имя игрока! Используйте §6" + pre + "land invite <игрок>§7!");
						event.cancel = true;
						return -1;
					}
					command.splice(0, 2);
					let pName = command.join(" ");
					let invitePos = {
						x: Math.floor(sender.location.x),
						z: Math.floor(sender.location.z),
						dim: sender.dimension.id
					};
					let iLand = checkLand(invitePos);
					if (iLand == undefined) {
						sender.sendMessage(prefix + "§7Stand on your land to invite friends");
						event.cancel = true;
						return -1;
					}
					if (iLand.owner != sender.name) {
						sender.sendMessage(prefix + "§7Stand on your land to invite friends");
						event.cancel = true;
						return -1;
					}
					let players = [...world.getPlayers()];
					let target = [];
					players.forEach((p) => {
						if (p.name == pName) {
							target.push(p);
						}
					});
					if (target.length == 0) {
						sender.sendMessage(prefix + "§7Sorry! " + pName + " is not onilne player. ");
						event.cancel = true;
						return -1;
					}
					if (target[0].name == sender.name) {
						sender.sendMessage(prefix + "§7Can't invite yourself.");
						event.cancel = true;
						return -1;
					}
					if (iLand.access.includes(target[0].name)) {
					    sender.sendMessage(prefix + "§7Player " + target[0].name + " already have access!");
						event.cancel = true;
						return -1;
					}
					target[0].sendMessage(prefix + "You are invited to access the land with the id: " + iLand.id);
					target[0].sendMessage(prefix + "Type §6" + pre + "land accept " + iLand.id + " §rto accept!");
					sender.sendMessage(prefix + "Your friend " + target[0].name + " has been invited to access your land, wait for him to accept.");
					let cacheInvite = {
						name: target[0].name,
						id: iLand.id,
						owner: iLand.owner
					}
					cache.push(cacheInvite);
				break;
				case "accept":
					if (command.length == 2) {
						sender.sendMessage(prefix + "§7Input ID land! Use §6" + pre + "land accept <id>§7!");
						event.cancel = true;
						return -1;
					}
					let landName = command[2];
					if (cache.find((i) => i.name == sender.name && i.id == landName) == undefined) {
						sender.sendMessage(prefix + "§7Can't find invitation!");
						event.cancel = true;
						return -1;
					}
					let index = cache.indexOf(cache.find((c) => c.name == sender.name && c.id == landName));
					if (land.find((c) => c.id == landName && c.owner == cache[index].owner) == undefined) {
						sender.sendMessage(prefix + "§7Sorry! Maybe the land with ID \"" + landName + "\" has been removed.");
						cache.splice(index, 1);
						event.cancel = true;
						return -1;
					}
					let dt = land.indexOf(land.find((c) => c.id == landName && c.owner == cache[index].owner));
					let landArr = land[dt];
					sender.runCommandAsync("scoreboard players reset \"$land(" + textToBinary(JSON.stringify(landArr)) + ")\" database");
					land[dt].access.push(sender.name);
					let landData = {
						owner: landArr.owner,
						name: landArr.name,
						id: landArr.id,
						access: landArr.access,
						dim: landArr.dim,
						xmin: landArr.xmin,
						xmax: landArr.xmax,
						zmin: landArr.zmin,
						zmax: landArr.zmax,
						x1: landArr.x1,
						z1: landArr.z1,
						x2: landArr.x2,
						z2: landArr.z2
					};
					sender.runCommandAsync("scoreboard players add \"$land(" + textToBinary(JSON.stringify(landData)) + ")\" database 1");
					sender.runCommandAsync(`tellraw "${cache[index].owner}" {"rawtext":[{"text":"${prefix}§fPlayer ${sender.name} now can access your land!"}]}`);
					land = [];
					cache.splice(index, 1);
					sender.sendMessage(prefix + "You have joined the land: " + landName);
				break;
				case "kick":
				    if (command.length == 2) {
						sender.sendMessage(prefix + "§7Input player name! Use §6" + pre + "land kick <player>§7!");
						event.cancel = true;
						return -1;
					}
					let kickPos = {
						x: Math.floor(sender.location.x),
						z: Math.floor(sender.location.z),
						dim: sender.dimension.id
					};
					let kLand = checkLand(kickPos);
					if (kLand == undefined) {
						sender.sendMessage(prefix + "§7Stand on your land to kick player.");
						event.cancel = true;
						return -1;
					}
					if (kLand.owner != sender.name) {
						sender.sendMessage(prefix + "§7Stand on your land to kick player.");
						event.cancel = true;
						return -1;
					}
					command.splice(0, 2);
					let tName = command.join(" ");
					if (!kLand.access.includes(tName)) {
					    sender.sendMessage(prefix + "§7Player not found in access list.");
						event.cancel = true;
						return -1;
					}
					sender.runCommandAsync("scoreboard players reset \"$land(" + textToBinary(JSON.stringify(kLand)) + ")\" database");
					let listP = kLand.access;
					listP.splice(listP.indexOf(tName), 1);
					let kickData = {
					    owner: kLand.owner,
					    name: kLand.name,
					    id: kLand.id,
					    access: listP,
					    dim: kLand.dim,
					    xmin: kLand.xmin,
					    xmax: kLand.xmax,
					    zmin: kLand.zmin,
					    zmax: kLand.zmax,
					    x1: kLand.x1,
					    z1: kLand.z1,
					    x2: kLand.x2,
					    z2: kLand.z2
					}
					sender.runCommandAsync("scoreboard players add \"$land(" + textToBinary(JSON.stringify(kickData)) + ")\" database 1");
					sender.sendMessage(prefix + "Now " + tName + " can't access your land!");
					sender.runCommandAsync(`tellraw "${tName}" {"rawtext":[{"text":"${prefix}§fNow, you can't access land with ID: ${kLand.id}"}]}`);
					land = [];
				break;
				case "info":
				    if (command.length == 2) {
				        if (sender.isOp() || sender.hasTag("admin")) {
				            let pos = {
				                x: Math.floor(sender.location.x),
				                z: Math.floor(sender.location.z),
				                dim: sender.dimension.id
				            }
				            if (checkLand(pos) != undefined) {
				                let infoLand = checkLand(pos);
				                sender.sendMessage(prefix + "Информация о привате \"" + infoLand.id + "\":");
				                sender.sendMessage(prefix + "> Имя привата: §e" + infoLand.name);
				                sender.sendMessage(prefix + "> ID: §e" + infoLand.id);
				                sender.sendMessage(prefix + "> Владелец: §e" + infoLand.owner);
				                sender.sendMessage(prefix + "> Участники: §e" + infoLand.access.join(", "));
				                sender.sendMessage(prefix + "> Измерение: " + getDim(infoLand.dim));
				                sender.sendMessage(prefix + "> Координаты: §e(" + infoLand.x1 + ", " + infoLand.z1 + ") (" + infoLand.x2 + ", " + infoLand.z2 + ")");
				                let iBlocks1 = ((infoLand.xmax + 1) - infoLand.xmin);
				                let iBlocks2 = ((infoLand.zmax + 1) - infoLand.zmin);
				                sender.sendMessage(prefix + "> Размер привата: §e" + iBlocks1 + "x" + iBlocks2 + " блок(ов).");
				                event.cancel = true;
				                return -1;
				            }
				            sender.sendMessage(prefix + "§7Input ID Land! Use or standing on land whose information will be known!");
				            event.cancel = true;
				            return -1;
				        }
				        sender.sendMessage(prefix + "§7Input ID Land! Use §6" + pre + "land info <id>§7!");
						event.cancel = true;
						return -1;
				    }
				    let IDLand = command[2];
				    if (land.find((c) => c.id == IDLand && c.owner == sender.name) == undefined) {
				        sender.sendMessage(prefix + "§7You never own land with ID \"" + IDLand + "\"!");
						event.cancel = true;
						return -1;
				    }
				    let infoLand = land[land.indexOf(land.find((c) => c.id == IDLand && c.owner == sender.name))];
				    sender.sendMessage(prefix + "Land information with ID \"" + IDLand + "\":");
				    sender.sendMessage(prefix + "> Name: §e" + infoLand.name);
				    sender.sendMessage(prefix + "> ID: §e" + infoLand.id);
				    sender.sendMessage(prefix + "> Owner: §e" + infoLand.owner);
				    sender.sendMessage(prefix + "> Access: §e" + infoLand.access.join(", "));
				    sender.sendMessage(prefix + "> Dimension: " + getDim(infoLand.dim));
				    sender.sendMessage(prefix + "> Coor: §e(" + infoLand.x1 + ", " + infoLand.z1 + ") (" + infoLand.x2 + ", " + infoLand.z2 + ")");
				    let iBlocks1 = ((infoLand.xmax + 1) - infoLand.xmin);
				    let iBlocks2 = ((infoLand.zmax + 1) - infoLand.zmin);
				    sender.sendMessage(prefix + "> Range: §e" + iBlocks1 + "x" + iBlocks2 + " blocks.");
				    let sellCost = Math.floor((price * (((infoLand.xmax + 1) - infoLand.xmin) * ((infoLand.zmax + 1) - infoLand.zmin))) * (70 / 100));
				    sender.sendMessage(prefix + "> Sell cost: §e" + sellCost);
				break;
				case "prefix":
					if (sender.hasTag("admin") || sender.isOp()) {
						if (command.length == 2) {
							sender.sendMessage(prefix + "§7Input prefix! Use §6" + pre + "land prefix <prefix>§7!");
							event.cancel = true;
							return -1;
						}
						let pref = command[2].substring(0, 1);
						if (pref === "/" || pref === "\\") {
							sender.sendMessage(prefix + "§7Can't change prefix using \"/\" or \"\\\"!");
							event.cancel = true;
							return -1;
						}
						let preBefore = {
							pref: pre,
							limit: limit,
							max: max,
							price: price
						};
						let preSaving = {
							pref: pref,
							limit: limit,
							max: max,
							price: price
						};
						sender.runCommandAsync("scoreboard players reset \"$setting(" + textToBinary(JSON.stringify(preBefore)) + ")\" database");
						sender.runCommandAsync("scoreboard players add \"$setting(" + textToBinary(JSON.stringify(preSaving)) + ")\" database 1");
						sender.sendMessage(prefix + "Success changing settings!");
						settings = [];
						event.cancel = true;
						return -1;
					}
					sender.sendMessage(prefix + "§7You don't have permission to access this command");
				break;
				case "limit":
					if (sender.hasTag("admin") || sender.isOp()) {
						if (command.length == 2) {
							sender.sendMessage(prefix + "§7Input limit! Use §6" + pre + "land limit <limit>§7!");
							event.cancel = true;
							return -1;
						}
						let lmt = parseInt(command[2]);
						if (!Number.isInteger(lmt)) {
							sender.sendMessage(prefix + "§7Input only number!");
							event.cancel = true;
							return -1;
						}
						let limitBefore = {
							pref: pre,
							limit: limit,
							max: max,
							price: price
						};
						let limitSaving = {
							pref: pre,
							limit: Math.floor(lmt),
							max: max,
							price: price
						};
						sender.runCommandAsync("scoreboard players reset \"$setting(" + textToBinary(JSON.stringify(limitBefore)) + ")\" database");
						sender.runCommandAsync("scoreboard players add \"$setting(" + textToBinary(JSON.stringify(limitSaving)) + ")\" database 1");
						sender.sendMessage(prefix + "Success changing settings!");
						settings = [];
						event.cancel = true;
						return -1;
					}
					sender.sendMessage(prefix + "§7You don't have permission to access this command");
				break;
				case "costperblock":
					if (sender.hasTag("admin") || sender.isOp()) {
						if (command.length == 2) {
							sender.sendMessage(prefix + "§7Input cost! Use §6" + pre + "land costperblock <cost>§7!");
							event.cancel = true;
							return -1;
						}
						let cost = parseInt(command[2]);
						if (!Number.isInteger(cost)) {
							sender.sendMessage(prefix + "§7Input only number!");
							event.cancel = true;
							return -1;
						}
						let costBefore = {
							pref: pre,
							limit: limit,
							max: max,
							price: price
						};
						let costSaving = {
							pref: pre,
							limit: limit,
							max: max,
							price: Math.floor(cost)
						};
						sender.runCommandAsync("scoreboard players reset \"$setting(" + textToBinary(JSON.stringify(costBefore)) + ")\" database");
						sender.runCommandAsync("scoreboard players add \"$setting(" + textToBinary(JSON.stringify(costSaving)) + ")\" database 1");
						sender.sendMessage(prefix + "Success changing settings!");
						settings = [];
						event.cancel = true;
						return -1;
					}
					sender.sendMessage(prefix + "§7You don't have permission to access this command");
				break;
				case "maxblock":
					if (sender.hasTag("admin") || sender.isOp()) {
						if (command.length == 2) {
							sender.sendMessage(prefix + "§7Input maxblock! Use §6" + pre + "land maxblock <maxblock>§7!");
							event.cancel = true;
							return -1;
						}
						let mx = parseInt(command[2]);
						if (!Number.isInteger(mx)) {
							sender.sendMessage(prefix + "§7Input only number!");
							event.cancel = true;
							return -1;
						}
						let maxBefore = {
							pref: pre,
							limit: limit,
							max: max,
							price: price
						};
						let maxSaving = {
							pref: pre,
							limit: limit,
							max: Math.floor(mx),
							price: price
						};
						sender.runCommandAsync("scoreboard players reset \"$setting(" + textToBinary(JSON.stringify(maxBefore)) + ")\" database");
						sender.runCommandAsync("scoreboard players add \"$setting(" + textToBinary(JSON.stringify(maxSaving)) + ")\" database 1");
						sender.sendMessage(prefix + "Success changing settings!");
						settings = [];
						event.cancel = true;
						return -1;
					}
					sender.sendMessage(prefix + "§7You don't have permission to access this command");
				break;
                default:
                    sender.sendMessage(prefix + "§7Invalid usage! Please use §6" + pre + "land help §7for more information.");
                break;
            }
        break;
        case "startp":
            sender.runCommandAsync("scoreboard players add @s Money 0");
            if (getLands(sender) != undefined) {
				let sland = getLands(sender);
				if (sland.length >= limit) {
					sender.sendMessage(prefix + "§7Sorry you have reached the limit to own land.");
					event.cancel = true;
					return -1;
				}
			}
			let startPos = {
				x: Math.floor(sender.location.x),
				z: Math.floor(sender.location.z),
				dim: sender.dimension.id
			};
			if (checkLand(startPos) != undefined) {
				sender.sendMessage(prefix + "§7Sorry, this land is already owned by " + checkLand(startPos).owner);
				event.cancel = true;
				return -1;
			}
			if (cache.find((c) => c.name == sender.name && c.type == "startp" && c.dim == sender.dimension.id) != undefined) {
				let index = cache.indexOf(cache.find((c) => c.name == sender.name && c.type == "startp" && c.dim == sender.dimension.id));
				cache.splice(index, 1);
			}
			let sposData = {
				name: sender.name,
				x: Math.floor(sender.location.x),
				z: Math.floor(sender.location.z),
				type: "startp",
				dim: sender.dimension.id
			};
			cache.push(sposData);
			sender.sendMessage(prefix + "First position saved at §e(" + Math.floor(sender.location.x) + ", " + Math.floor(sender.location.z) + ")§2!");
        break;
        case "endp":
            sender.runCommandAsync("scoreboard players add @s Money 0");
            if (getLands(sender) != undefined) {
				let sland = getLands(sender);
				if (sland.length >= limit) {
					sender.sendMessage(prefix + "§7Sorry you have reached the limit to own land.");
					event.cancel = true;
					return -1;
				}
			}
			if (cache.find((c) => c.name == sender.name && c.type == "startp" && c.dim == sender.dimension.id) == undefined) {
				sender.sendMessage(prefix + "§7Please set the first position!");
				event.cancel = true;
				return -1;
			}
			if (cache.find((c) => c.name == sender.name && c.type == "endp" && c.dim == sender.dimension.id) != undefined) {
				let index = cache.indexOf(cache.find((c) => c.name == sender.name && c.type == "endp" && c.dim == sender.dimension.id));
				cache.splice(index, 1);
			}
			let endPos = {
				x: Math.floor(sender.location.x),
				z: Math.floor(sender.location.z),
				dim: sender.dimension.id
			};
			if (checkLand(endPos) != undefined) {
				sender.sendMessage(prefix + "§7Sorry, this land is already owned by " + checkLand(endPos).owner);
				event.cancel = true;
				return -1;
			}
			let sdat = cache[cache.indexOf(cache.find((c) => c.name == sender.name && c.type == "startp" && c.dim == sender.dimension.id))];
			let exmax = Math.max(sdat.x, Math.floor(sender.location.x));
			let exmin = Math.min(sdat.x, Math.floor(sender.location.x));
			let ezmax = Math.max(sdat.z, Math.floor(sender.location.z));
			let ezmin = Math.min(sdat.z, Math.floor(sender.location.z));
			let eblocks1 = (exmax + 1) - exmin;
			let eblocks2 = (ezmax + 1) - ezmin;
			let range = {
				xmin: exmin,
				xmax: exmax,
				zmin: ezmin,
				zmax: ezmax,
				dim: sender.dimension.id
			};
			if (isInLand(range)) {
				sender.sendMessage(prefix + "§7There is land within this range.");
				event.cancel = true;
				return -1;
			}
			if (isInLand2(range)) {
				sender.sendMessage(prefix + "§7There is land within this range.");
				event.cancel = true;
				return -1;
			}
			if (eblocks1 <= max && eblocks2 <= max) {
				sender.sendMessage(prefix + "Second position saved at §e(" + Math.floor(sender.location.x) + ", " + Math.floor(sender.location.z) + ")§2!");
				let landData = {
					name: sender.name,
					x: Math.floor(sender.location.x),
					z: Math.floor(sender.location.z),
					type: "endp",
					dim: sender.dimension.id
				};
				cache.push(landData);
				sender.sendMessage(prefix + "Confirmation of purchase of land!");
				sender.sendMessage(prefix + "> Dimension§f: " + getDim(sender.dimension.id));
				let cost = price * (((exmax + 1) - exmin) * ((ezmax + 1) - ezmin));
				sender.sendMessage(prefix + "> Cost§f: §e" + cost);
				sender.sendMessage(prefix + "> Coor§f: §e(" + sdat.x + ", " + sdat.z + ") §e(" + Math.floor(sender.location.x) + ", " + Math.floor(sender.location.z) + ") §f(" + eblocks1 + "x" + eblocks2 + " blocks)");
				sender.sendMessage(prefix + "Type §6" + pre + "landbuy <name>§r to buy this land.");
				event.cancel = true;
				return -1;
			}
			sender.sendMessage(prefix + "§7Sorry, the maximum block limit that can be claimed is " + max + "x" + max + ".");
        break;
        case "landbuy":
            sender.runCommandAsync("scoreboard players add @s Money 0");
            if (getLands(sender) != undefined) {
				let senderLand = getLands(sender);
				if (senderLand.length >= limit) {
					sender.sendMessage(prefix + "§7Sorry you have reached the limit to own land.");
					event.cancel = true;
					return -1;
				}
			}
			if (cache.find((c) => c.name == sender.name && c.type == "startp" && c.dim == sender.dimension.id) == undefined) {
				sender.sendMessage(prefix + "§7Please set the first position!");
				event.cancel = true;
				return -1;
			}
			if (cache.find((c) => c.name == sender.name && c.type == "endp" && c.dim == sender.dimension.id) == undefined) {
				sender.sendMessage(prefix + "§7Please set the second position!");
				event.cancel = true;
				return -1;
			}
			if (command.length == 1) {
				sender.sendMessage(prefix + "§7Input land name! Use §6" + pre + "landbuy <name>§7!");
				event.cancel = true;
				return -1;
			}
			command.splice(command.indexOf("landbuy"), 1);
			let nameLand = command.join(" ");
			if (land.find((c) => c.owner == sender.name && c.name == nameLand && c.dim == sender.dimension.id) != undefined) {
				sender.sendMessage(prefix + "§7Can't have 2 lands with the same name.");
				event.cancel = true;
				return -1;
			}
			let startp = cache[cache.indexOf(cache.find((c) => c.name == sender.name && c.type == "startp" && c.dim == sender.dimension.id))];
			let endp = cache[cache.indexOf(cache.find((c) => c.name == sender.name && c.type == "endp" && c.dim == sender.dimension.id))];
			let bxmin = Math.min(startp.x, endp.x);
			let bxmax = Math.max(startp.x, endp.x);
			let bzmin = Math.min(startp.z, endp.z);
			let bzmax = Math.max(startp.z, endp.z);
			let cost = Math.floor(price * (((bxmax + 1) - bxmin) * ((bzmax + 1) - bzmin)));
			console.warn(cost)
			if (getMoney(sender) < cost) {
				sender.sendMessage(prefix + "§7You don't have enough Money to buy this land.");
				let sp = cache.indexOf(cache.find((c) => c.name == sender.name && c.type == "startp"));
				let ep = cache.indexOf(cache.find((c) => c.name == sender.name && c.type == "endp"));
				cache.splice(sp, 1);
				cache.splice(ep, 1);
				event.cancel = true;
				return -1;
			}
			let buyData = {
				owner: sender.name,
				name: nameLand,
				id: command.join("_").toLowerCase(),
				access: [],
				dim: sender.dimension.id,
				xmin: bxmin,
				xmax: bxmax,
				zmin: bzmin,
				zmax: bzmax,
				x1: startp.x,
				z1: startp.z,
				x2: endp.x,
				z2: endp.z
			};
			sender.runCommandAsync("scoreboard players set \"$land(" + textToBinary(JSON.stringify(buyData)) + ")\" database 1");
			sender.sendMessage(prefix + "Success! You have bought this land!");
			sender.sendMessage(prefix + "> Name: §e" + buyData.name);
			sender.sendMessage(prefix + "> ID: §e" + buyData.id);
			sender.sendMessage(prefix + "> Dimension: " + getDim(buyData.dim));
			let bblocks1 = buyData.xmax - buyData.xmin;
			let bblocks2 = buyData.zmax - buyData.zmin;
			sender.sendMessage(prefix + "> Coor: §e(" + buyData.x1 + ", " + buyData.z1 + ") §e(" + buyData.x1 + ", " + buyData.z2 + ") §f(" + bblocks1 + "x" + bblocks2 + " blocks)");
			sender.sendMessage(prefix + "Type §6" + pre + "land list §rto see list of your lands.");
			let sp = cache.indexOf(cache.find((c) => c.name == sender.name && c.type == "startp"));
			let ep = cache.indexOf(cache.find((c) => c.name == sender.name && c.type == "endp"));
			cache.splice(sp, 1);
			cache.splice(ep, 1);
			sender.runCommandAsync("scoreboard players remove @s Money " + cost);
        break;
        case "landsell":
            if (command.length == 1) {
				sender.sendMessage(prefix + "§7Input ID Land! Use §6" + pre + "§6landsell <id>§7!");
				event.cancel = true;
				return -1;
			}
			let lName = command[1];
			if (land.find((c) => c.owner == sender.name && c.id == lName) == undefined) {
				sender.sendMessage(prefix + "§7Unable to find land, check using §6" + pre + "land list§7.");
				event.cancel = true;
				return -1;
			}
			let ind = land.indexOf(land.find((c) => c.owner == sender.name && c.id == lName));
			let d = land[ind];
			let sc = (price * (((d.xmax + 1) - d.xmin) * ((d.zmax + 1) - d.zmin))) * (70 / 100);
			sender.runCommandAsync("scoreboard players reset \"$land(" + textToBinary(JSON.stringify(d)) + ")\" database");
			land.splice(ind, 1);
			sender.sendMessage(prefix + "Success! You have sold land with id: " + lName + "!");
			sender.runCommandAsync("scoreboard players add @s Money " + Math.floor(sc));
			land = [];
        break;
        default:
            sender.sendMessage(prefix + "§7Invalid usage! Please use §6" + pre + "land help §7for more information.");
        break;
    }
    event.cancel = true;
});
