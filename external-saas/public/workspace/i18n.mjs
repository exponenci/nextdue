export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "uz-Latn", label: "O‘zbekcha" },
];

const MESSAGES = {
  en: {
    plan: "Plan", registry: "People & assets", catalog: "Country rules", settings: "Settings",
    addDeadline: "Add obligation", addAsset: "Add possession", addPerson: "Add person", exportCalendar: "Export calendar",
    actNow: "Act now", addDates: "Add dates", comingUp: "Coming up", covered: "Covered",
    sourceBacked: "Source-backed catalog", lastReviewed: "Last reviewed", officialSource: "Open source", whyShown: "Why you see this",
    interfaceLanguage: "Language", country: "Country", owner: "Owner", linkedAsset: "Linked possession", reminderSequence: "Reminder sequence",
    reminderHelp: "Days before the deadline, separated by / — for example 180/90/30/7/1/0.", save: "Save", cancel: "Cancel",
    privateByDefault: "Private by default", savedHere: "Saved on this device", testMode: "Test mode", clearedOnReload: "Cleared on reload", testModeExplanation: "Data is kept only while this page stays open. A full page reload clears IndexedDB and local storage so every test starts from the onboarding flow.", signIn: "Sign in", externalSaas: "External SaaS build",
    catalogDisclaimer: "Rules show their source and review date. Confirm any rule marked as conditional.",
  },
  ru: {
    plan: "План", registry: "Люди и имущество", catalog: "Правила стран", settings: "Настройки",
    addDeadline: "Добавить обязанность", addAsset: "Добавить имущество", addPerson: "Добавить человека", exportCalendar: "Экспорт календаря",
    actNow: "Действовать сейчас", addDates: "Добавить даты", comingUp: "Скоро", covered: "Под контролем",
    sourceBacked: "Каталог с источниками", lastReviewed: "Проверено", officialSource: "Открыть источник", whyShown: "Почему это показано",
    interfaceLanguage: "Язык", country: "Страна", owner: "Владелец", linkedAsset: "Связанное имущество", reminderSequence: "Последовательность напоминаний",
    reminderHelp: "Дни до срока через / — например 180/90/30/7/1/0.", save: "Сохранить", cancel: "Отмена",
    privateByDefault: "Приватно по умолчанию", savedHere: "Сохранено на этом устройстве", testMode: "Тестовый режим", clearedOnReload: "Очищается при перезагрузке", testModeExplanation: "Данные хранятся, пока открыта эта страница. Полная перезагрузка очищает IndexedDB и локальное хранилище, поэтому каждый тест начинается с анкеты.", signIn: "Войти", externalSaas: "Внешняя SaaS-версия",
    catalogDisclaimer: "У каждого правила указаны источник и дата проверки. Условные правила требуют подтверждения.",
  },
  "uz-Latn": {
    plan: "Reja", registry: "Odamlar va mulk", catalog: "Mamlakat qoidalari", settings: "Sozlamalar",
    addDeadline: "Majburiyat qo‘shish", addAsset: "Mulk qo‘shish", addPerson: "Shaxs qo‘shish", exportCalendar: "Kalendarni eksport qilish",
    actNow: "Hozir bajaring", addDates: "Sanalarni kiriting", comingUp: "Yaqinda", covered: "Nazoratda",
    sourceBacked: "Manbali katalog", lastReviewed: "Tekshirilgan", officialSource: "Manbani ochish", whyShown: "Nega ko‘rsatilgan",
    interfaceLanguage: "Til", country: "Mamlakat", owner: "Egasi", linkedAsset: "Bog‘langan mulk", reminderSequence: "Eslatma ketma-ketligi",
    reminderHelp: "Muddatdan oldingi kunlar / orqali — masalan 180/90/30/7/1/0.", save: "Saqlash", cancel: "Bekor qilish",
    privateByDefault: "Standart bo‘yicha maxfiy", savedHere: "Ushbu qurilmada saqlangan", testMode: "Test rejimi", clearedOnReload: "Qayta yuklanganda tozalanadi", testModeExplanation: "Ma’lumotlar ushbu sahifa ochiq turguncha saqlanadi. Sahifa to‘liq qayta yuklanganda IndexedDB va lokal xotira tozalanadi, shuning uchun har bir test anketa bilan boshlanadi.", signIn: "Kirish", externalSaas: "Tashqi SaaS versiyasi",
    catalogDisclaimer: "Har bir qoida manba va tekshiruv sanasini ko‘rsatadi. Shartli qoidalarni tasdiqlang.",
  },
};

export function t(locale, key) {
  return MESSAGES[locale]?.[key] || MESSAGES.en[key] || key;
}
