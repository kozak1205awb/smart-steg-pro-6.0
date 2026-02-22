/**
 * Заглушка прогноза.
 * В реальности здесь будет расчет: остатки + планы + историческая скорость.
 */
export async function forecastSteg(_: {
  horizonDays: number;
}): Promise<{ summary: string; items: Array<{ steg: string; risk: "ok" | "warn" | "critical" }> }> {
  return {
    summary:
      "Forecast(placeholder): добавим расчёт на основе movements + plans + текущего склада.",
    items: [
      { steg: "PA1", risk: "warn" },
      { steg: "PA2", risk: "ok" },
      { steg: "PA5", risk: "critical" }
    ]
  };
}