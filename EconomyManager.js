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

    /**
     * Форматирует число в сокращённый вид с суффиксами
     * 1000 -> 1к, 1500000 -> 1.5м и т.д.
     * @param {number} number
     * @returns {string}
     */
    formatNumber(number) {
        if (number < 1000) return number.toString();

        const suffixes = [
            { value: 1e12, symbol: 'т' }, // триллион
            { value: 1e9, symbol: 'г' },  // миллиард (г = гига)
            { value: 1e6, symbol: 'м' },  // миллион
            { value: 1e3, symbol: 'к' }   // тысяча
        ];

        for (const suffix of suffixes) {
            if (number >= suffix.value) {
                const base = number / suffix.value;
                return base.toFixed(2) + suffix.symbol;
            }
        }

        return number.toString();
    }
}
