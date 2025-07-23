export class EconomyManager {
    constructor(player) {
        this.player = player;
    }

    /**
     * Получить текущий баланс игрока по валюте
     * @param {string} currency - Название валюты
     * @returns {number}
     */
    getBalance(currency) {
        const value = this.player.getDynamicProperty(`eco:${currency}`);
        return typeof value === 'number' ? value : 0;
    }

    /**
     * Установить баланс игрока по валюте
     * @param {string} currency - Название валюты
     * @param {number} amount - Сколько установить
     */
    setBalance(currency, amount) {
        this.player.setDynamicProperty(`eco:${currency}`, Math.max(0, amount));
    }

    /**
     * Добавить деньги игроку
     * @param {string} currency - Название валюты
     * @param {number} amount - Сколько добавить
     */
    add(currency, amount) {
        const current = this.getBalance(currency);
        this.setBalance(currency, current + amount);
    }

    /**
     * Снять деньги у игрока
     * @param {string} currency - Название валюты
     * @param {number} amount - Сколько снять
     * @returns {boolean} - Успешно ли снятие
     */
    subtract(currency, amount) {
        const current = this.getBalance(currency);
        if (current < amount) return false;
        this.setBalance(currency, current - amount);
        return true;
    }

    /**
     * Проверить, есть ли у игрока достаточно денег
     * @param {string} currency - Название валюты
     * @param {number} amount - Сколько нужно
     * @returns {boolean}
     */
    has(currency, amount) {
        return this.getBalance(currency) >= amount;
    }

    /**
     * Удалить валюту у игрока (обнулить)
     * @param {string} currency - Название валюты
     */
    reset(currency) {
        this.setBalance(currency, 0);
    }
}
