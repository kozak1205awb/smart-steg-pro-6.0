/**
 * Плагин-интерфейс OCR (гибкость).
 * Сейчас заглушка: мы сохраняем rawText вручную/через импорт.
 * Позже подключим: Tesseract.js / Google Vision / сторонний сервис.
 */
export interface OcrEngine {
  name: string;
  extractText(file: File): Promise<string>;
}

export const NoopOcr: OcrEngine = {
  name: "noop",
  async extractText() {
    return "";
  }
};