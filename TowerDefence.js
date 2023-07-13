const map = new MolangVariableMap()
/**
 * @param {Vector} lookAt
 * @param {Array<number>} size
 */
function draw(lookAt, size) {
    for(let i = 0; i < size[0] + 1; i++) {
        const {x, y, z} = lookAt
        const loc = {
            x: x + i - size[0] / 2 + 0.5,
            y: y + 1,
            z: z - size[1] / 2 + 0.5
        }
        world.getDimension('overworld').spawnParticle('h:access', loc, map)
        loc.z += size[1]
        world.getDimension('overworld').spawnParticle('h:access', loc, map)
    }
    for(let i = 0; i < size[1] + 1; i++) {
        const {x, y, z} = lookAt
        const loc = {
            x: x - size[0] / 2 + 0.5,
            y: y + 1,
            z: z + i - size[1] / 2 + 0.5
        }
        world.getDimension('overworld').spawnParticle('h:access', loc, map)
        loc.x += size[0]
        world.getDimension('overworld').spawnParticle('h:access', loc, map)
    }
}

system.runInterval(() => {
    for(const player of world.getPlayers()) {
        let viewBlock = player.getBlockFromViewDirection()
        // console.warn(JSON.stringify(player.getBlockFromViewDirection().location))
        if(!viewBlock?.location) continue
        draw(viewBlock.location, [5,5])
    }
})

world.events.beforeItemUseOn.subscribe(async (event) => {
    const {source: player} = event
    event.cancel = true
    if(player.isBuissy) return
    player.isBuissy = true

    const tower = new ui.MessageFormData()
        tower.title('Установить структуру?')
        tower.body(`Do you to place tower?`)
        tower.button1(`Confirm`)
        tower.button2(`Close`)
        const result = await tower.show(player)
        delete player.isBuissy
        if(result.selection) {
            const loc = player.getBlockFromViewDirection()?.location
            if(!loc) return
            const size = [5,5]
            loc.x -= size[0] / 2 - 1
            loc.z -= size[1] / 2 - 1
            loc.y += 1

            await player.dimension.runCommandAsync(`structure load tower ${loc.x} ${loc.y} ${loc.z} 0_degrees none`)
        }
})
