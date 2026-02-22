"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiSuggest = geminiSuggest;
/**
 * Заглушка для Gemini.
 * Здесь ты подключишь реальный SDK/REST, но архитектура уже готова.
 */
async function geminiSuggest(input) {
    const text = "AI(placeholder): Я получил запрос. Подключи Gemini API ключ в functions config и заменим эту заглушку на реальный вызов.";
    const hints = [
        "Проверь заполненность буферных рядов.",
        "Проверь ленту: 2 места, TTL 1.5 часа.",
        "Сначала выбирай Steg по FIFO (дата этикетки)."
    ];
    return { text, hints };
}
