/**
 * Интерфейс QR-сканера (гибкость).
 * В браузере можно подключить html5-qrcode позже.
 */
export interface QrEngine {
  name: string;
  scan(): Promise<string>;
}

export const NoopQr: QrEngine = {
  name: "noop",
  async scan() {
    return "";
  }
};