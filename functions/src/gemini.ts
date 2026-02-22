/**
 * Заглушка для Gemini.
 * Здесь ты подключишь реальный SDK/REST, но архитектура уже готова.
 */
export async function geminiSuggest(input: {
  prompt: string;
  context?: Record<string, any>;
}): Promise<{ text: string; hints: string[] }> {
  const text =
    "AI(placeholder): Я получил запрос. Подключи Gemini API ключ в functions config и заменим эту заглушку на реальный вызов.";
  const hints = [
    "Проверь заполненность буферных рядов.",
    "Проверь ленту: 2 места, TTL 1.5 часа.",
    "Сначала выбирай Steg по FIFO (дата этикетки)."
  ];
  return { text, hints };
}