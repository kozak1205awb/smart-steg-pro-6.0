"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forecastSteg = forecastSteg;
/**
 * Заглушка прогноза.
 * В реальности здесь будет расчет: остатки + планы + историческая скорость.
 */
async function forecastSteg(_) {
    return {
        summary: "Forecast(placeholder): добавим расчёт на основе movements + plans + текущего склада.",
        items: [
            { steg: "PA1", risk: "warn" },
            { steg: "PA2", risk: "ok" },
            { steg: "PA5", risk: "critical" }
        ]
    };
}
