import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ru: {
    translation: {
      app: "SMART-STEG-PRO 6.0",
      login: "Вход",
      email: "Email",
      password: "Пароль",
      signIn: "Войти",
      signOut: "Выйти",
      dashboard: "Дашборд",
      warehouse: "Склад",
      profiles: "Профили",
      stegCatalog: "Каталог Steg",
      aiCenter: "AI Центр",
      reports: "Отчёты",
      admin: "Админ",
      rules: "Правила",
      save: "Сохранить",
      cancel: "Отмена",
      confirm: "Подтвердить",
      undo: "Отменить последнее",
      importXlsx: "Импорт XLSX",
      manualEntry: "Ручной ввод",
      buffer: "Буфер",
      belt: "Лента",
      production: "В производство",
      returnFromProd: "Возврат из производства",
      row: "Ряд",
      floor: "Этаж",
      slot: "Ячейка",
      steg: "Steg",
      qty: "Количество",
      length: "Длина",
      labelDate: "Дата этикетки"
    }
  },
  de: {
    translation: {
      app: "SMART-STEG-PRO 6.0",
      login: "Anmeldung",
      email: "E-Mail",
      password: "Passwort",
      signIn: "Anmelden",
      signOut: "Abmelden",
      dashboard: "Dashboard",
      warehouse: "Lager",
      profiles: "Profile",
      stegCatalog: "Steg-Katalog",
      aiCenter: "AI Center",
      reports: "Berichte",
      admin: "Admin",
      rules: "Regeln",
      save: "Speichern",
      cancel: "Abbrechen",
      confirm: "Bestätigen",
      undo: "Letzte Aktion rückgängig",
      importXlsx: "XLSX importieren",
      manualEntry: "Manuelle Eingabe",
      buffer: "Puffer",
      belt: "Förderband",
      production: "In die Produktion",
      returnFromProd: "Rückkehr aus Produktion",
      row: "Reihe",
      floor: "Ebene",
      slot: "Platz",
      steg: "Steg",
      qty: "Menge",
      length: "Länge",
      labelDate: "Etikett-Datum"
    }
  }
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: "ru",
  fallbackLng: "ru",
  interpolation: { escapeValue: false }
});

export default i18n;