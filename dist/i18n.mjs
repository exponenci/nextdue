export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "uz-Latn", label: "O‘zbekcha" },
];

const MESSAGES = {
  en: {
    today: "Today", plan: "Plan", registry: "People & assets", catalog: "Country packs", settings: "Settings",
    addDeadline: "Add obligation", addAsset: "Add possession", addPerson: "Add person", exportCalendar: "Export calendar",
    actNow: "Act now", addDates: "Add dates", comingUp: "Coming up", covered: "Covered",
    sourceBacked: "Source-backed catalog", lastReviewed: "Last reviewed", officialSource: "Open source", whyShown: "Why you see this",
    starterPack: "Review your starter packs", notGenerated: "No AI plan generation. Every suggestion comes from a reviewed catalog rule.",
    interfaceLanguage: "Language", country: "Country", owner: "Owner", linkedAsset: "Linked possession", reminderSequence: "Reminder sequence",
    reminderHelp: "Days before the deadline, separated by / — for example 180/90/30/7/1/0.", save: "Save", cancel: "Cancel",
    privateByDefault: "Private by default", savedHere: "Saved on this device", signIn: "Sign in", externalSaas: "External SaaS build",
    catalogDisclaimer: "Starter packs are advisory and may not be complete. Confirm applicability with the relevant authority.",
  },
  ru: {
    today: "Сегодня", plan: "План", registry: "Люди и имущество", catalog: "Пакеты стран", settings: "Настройки",
    addDeadline: "Добавить обязанность", addAsset: "Добавить имущество", addPerson: "Добавить человека", exportCalendar: "Экспорт календаря",
    actNow: "Действовать сейчас", addDates: "Добавить даты", comingUp: "Скоро", covered: "Под контролем",
    sourceBacked: "Каталог с источниками", lastReviewed: "Проверено", officialSource: "Открыть источник", whyShown: "Почему это показано",
    starterPack: "Проверьте стартовые пакеты", notGenerated: "Никакой AI-генерации плана. Каждая подсказка приходит из проверенного правила каталога.",
    interfaceLanguage: "Язык", country: "Страна", owner: "Владелец", linkedAsset: "Связанное имущество", reminderSequence: "Последовательность напоминаний",
    reminderHelp: "Дни до срока через / — например 180/90/30/7/1/0.", save: "Сохранить", cancel: "Отмена",
    privateByDefault: "Приватно по умолчанию", savedHere: "Сохранено на этом устройстве", signIn: "Войти", externalSaas: "Внешняя SaaS-версия",
    catalogDisclaimer: "Стартовые пакеты носят рекомендательный характер и могут быть неполными. Подтвердите применимость в профильном органе.",
  },
  "uz-Latn": {
    today: "Bugun", plan: "Reja", registry: "Odamlar va mulk", catalog: "Mamlakat paketlari", settings: "Sozlamalar",
    addDeadline: "Majburiyat qo‘shish", addAsset: "Mulk qo‘shish", addPerson: "Shaxs qo‘shish", exportCalendar: "Kalendarni eksport qilish",
    actNow: "Hozir bajaring", addDates: "Sanalarni kiriting", comingUp: "Yaqinda", covered: "Nazoratda",
    sourceBacked: "Manbali katalog", lastReviewed: "Tekshirilgan", officialSource: "Manbani ochish", whyShown: "Nega ko‘rsatilgan",
    starterPack: "Boshlang‘ich paketlarni tekshiring", notGenerated: "AI reja yaratmaydi. Har bir tavsiya tekshirilgan katalog qoidasidan keladi.",
    interfaceLanguage: "Til", country: "Mamlakat", owner: "Egasi", linkedAsset: "Bog‘langan mulk", reminderSequence: "Eslatma ketma-ketligi",
    reminderHelp: "Muddatdan oldingi kunlar / orqali — masalan 180/90/30/7/1/0.", save: "Saqlash", cancel: "Bekor qilish",
    privateByDefault: "Standart bo‘yicha maxfiy", savedHere: "Ushbu qurilmada saqlangan", signIn: "Kirish", externalSaas: "Tashqi SaaS versiyasi",
    catalogDisclaimer: "Boshlang‘ich paketlar maslahat xarakterida va to‘liq bo‘lmasligi mumkin. Tegishli organda tekshiring.",
  },
};

export function t(locale, key) {
  return MESSAGES[locale]?.[key] || MESSAGES.en[key] || key;
}
