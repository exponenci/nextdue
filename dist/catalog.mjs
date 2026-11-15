export const CATALOG_VERSION = "2026.11";
export const CATALOG_REVIEWED_AT = "2026-11-15";

const text = (en, ru, uz) => ({ en, ru, "uz-Latn": uz || en });

export const COUNTRY_META = {
  RU: { name: text("Russia", "Россия", "Rossiya"), flag: "🇷🇺" },
  UZ: { name: text("Uzbekistan", "Узбекистан", "O‘zbekiston"), flag: "🇺🇿" },
};

export const CATALOG = [
  {
    id: "ru_internal_passport_age_replacement",
    country: "RU",
    category: "identity",
    subjectType: "person",
    title: text("Internal passport: issue or age replacement", "Внутренний паспорт: получение или замена по возрасту", "Ichki pasport: olish yoki yosh bo‘yicha almashtirish"),
    summary: text("For Russian citizens: issue at 14; replace at 20 and 45. The previous passport has a limited grace period after the triggering date.", "Для граждан РФ: получение в 14 лет, замена в 20 и 45 лет. После даты события действует ограниченный переходный срок.", "Rossiya fuqarolari uchun: 14 yoshda olish, 20 va 45 yoshda almashtirish."),
    audience: text("Russian citizen", "Гражданин РФ", "Rossiya fuqarosi"),
    timing: { kind: "age_milestones", ages: [14, 20, 45], graceDays: 90 },
    defaultReminders: "180/90/30/7/0",
    confidence: "high",
    risk: "normal",
    source: { title: "Government Regulation No. 2267", url: "https://www.consultant.ru/document/cons_doc_LAW_466454/6125ca6a5baabbd3bbff7302f2c6e114b94061fa/" },
  },
  {
    id: "ru_international_passport_expiry",
    country: "RU",
    category: "identity",
    subjectType: "person",
    title: text("International passport expiry", "Срок действия загранпаспорта", "Xorijga chiqish pasporti muddati"),
    summary: text("Traditional passports are normally valid for 5 years; biometric passports for 10 years. Track the printed date.", "Паспорт старого образца обычно действует 5 лет, биометрический — 10 лет. Отслеживайте дату в документе.", "Oddiy pasport odatda 5 yil, biometrik pasport 10 yil amal qiladi."),
    audience: text("Russian citizen or traveler", "Гражданин РФ или путешественник", "Rossiya fuqarosi yoki sayohatchi"),
    timing: { kind: "expiry_manual" },
    defaultReminders: "365/180/120/90/30/7/0",
    confidence: "high",
    risk: "normal",
    source: { title: "Federal Law 114-FZ, Article 10", url: "https://www.consultant.ru/document/cons_doc_LAW_11376/3c9f5011b93965025dfc3c97e23f34b9dc019400/" },
  },
  {
    id: "ru_driving_licence_expiry",
    country: "RU",
    category: "transport",
    subjectType: "person",
    title: text("Driving licence expiry", "Срок действия водительского удостоверения", "Haydovchilik guvohnomasi muddati"),
    summary: text("Normally valid for 10 years. Some 2022–2025 expiries received an automatic extension, so keep the printed date and extension status separate.", "Обычно действует 10 лет. Для части удостоверений со сроком 2022–2025 было автопродление — храните напечатанную дату и статус продления отдельно.", "Odatda 10 yil amal qiladi. Hujjatdagi sana va uzaytirish holatini alohida saqlang."),
    audience: text("Driver", "Водитель", "Haydovchi"),
    timing: { kind: "expiry_manual" },
    defaultReminders: "180/90/30/7/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Russian driving licence regulation", url: "https://www.consultant.ru/document/cons_doc_LAW_170282/ea49bd9cde0631b9c9e5eb0c19789132534e85ae/" },
  },
  {
    id: "ru_individual_property_tax_notice",
    country: "RU",
    category: "property",
    subjectType: "asset",
    assetTypes: ["property", "vehicle", "land"],
    title: text("Individual property tax notice", "Налоговое уведомление по имуществу физлица", "Jismoniy shaxs mulk solig‘i xabarnomasi"),
    summary: text("For taxable property, land, or vehicles: payment is generally due by 1 December following the tax period. Confirm against the official notice.", "Для облагаемой недвижимости, земли или транспорта: общий срок уплаты — до 1 декабря следующего года. Подтвердите по налоговому уведомлению.", "Soliqqa tortiladigan mulk, yer yoki transport uchun rasmiy xabarnomani tekshiring."),
    audience: text("Owner of taxable property, land, or vehicle", "Владелец облагаемого имущества, земли или транспорта", "Soliqqa tortiladigan mulk egasi"),
    timing: { kind: "annual", month: 12, day: 1 },
    defaultReminders: "60/30/14/7/1/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Federal Tax Service: tax notice", url: "https://www.nalog.gov.ru/rn77/promo/nu/" },
  },
  {
    id: "ru_npd_monthly_tax",
    country: "RU",
    category: "tax",
    subjectType: "asset",
    assetTypes: ["business"],
    title: text("Self-employed (NPD) monthly tax", "Ежемесячный налог НПД", "O‘zini o‘zi band qilganlar oylik solig‘i"),
    summary: text("For registered NPD taxpayers: payment is generally due by the 28th of the following month, with holiday shifts.", "Для зарегистрированных плательщиков НПД: обычно уплата до 28-го числа следующего месяца с переносами на праздники.", "NPD to‘lovchilari uchun odatda keyingi oyning 28-kunigacha."),
    audience: text("Registered NPD/self-employed taxpayer", "Зарегистрированный плательщик НПД", "NPD bo‘yicha ro‘yxatdan o‘tgan shaxs"),
    timing: { kind: "monthly", day: 28 },
    defaultReminders: "7/3/1/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Federal Tax Service: NPD payment", url: "https://www.nalog.gov.ru/rn49/news/activities_fts/16639667/" },
  },
  {
    id: "ru_foreigner_migration_registration",
    country: "RU",
    category: "residence",
    subjectType: "person",
    title: text("Foreigner migration registration review", "Проверка миграционного учёта иностранца", "Chet el fuqarosining migratsiya ro‘yxati"),
    summary: text("The default notification window is 7 working days after arrival at a place of stay, but status and accommodation exceptions are common.", "Базовый срок уведомления — 7 рабочих дней после прибытия в место пребывания, но есть многочисленные исключения по статусу и размещению.", "Asosiy muddat yashash joyiga kelgandan keyin 7 ish kuni, lekin istisnolar ko‘p."),
    audience: text("Foreigner arriving or staying in Russia", "Иностранец, прибывающий или находящийся в РФ", "Rossiyaga kelayotgan chet el fuqarosi"),
    timing: { kind: "relative_manual", days: 7, workingDays: true },
    defaultReminders: "7/3/1/0",
    confidence: "high",
    risk: "high_applicability",
    source: { title: "Federal Law 109-FZ, Article 20", url: "https://www.consultant.ru/document/cons_doc_LAW_61569/259e33be7736b57036467f128672f0ce6ca81f9d/" },
  },
  {
    id: "ru_residence_permit_annual_confirmation",
    country: "RU",
    category: "residence",
    subjectType: "person",
    title: text("Residence permit annual confirmation", "Ежегодное подтверждение проживания по ВНЖ", "Yashash ruxsatini yillik tasdiqlash"),
    summary: text("For a foreigner with a residence permit: usually within 2 months after each anniversary of receiving it. Additional conditions can apply.", "Для иностранца с ВНЖ: обычно в течение 2 месяцев после каждой годовщины получения. Возможны дополнительные условия.", "Yashash ruxsati bor chet el fuqarosi uchun odatda har bir yillik sanadan keyin 2 oy ichida."),
    audience: text("Foreigner with a Russian residence permit", "Иностранец с ВНЖ РФ", "Rossiyada yashash ruxsati bor chet el fuqarosi"),
    timing: { kind: "annual_anniversary", windowDays: 60 },
    defaultReminders: "60/30/14/7/1/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Federal Law 115-FZ, Article 8", url: "https://www.consultant.ru/document/cons_doc_LAW_37868/cd5e24d0cd9cb837fa7a84e8f45ab9df1a3dbbbb/" },
  },
  {
    id: "uz_id_card_expiry",
    country: "UZ",
    category: "identity",
    subjectType: "person",
    title: text("ID card expiry", "Срок действия ID-карты", "ID-karta amal qilish muddati"),
    summary: text("Validity depends on age: 2 years from birth to 1, 5 years from 1–16, and 10 years from age 16. Track the printed date.", "Срок зависит от возраста: 2 года до года, 5 лет от 1 до 16 лет, 10 лет с 16 лет. Отслеживайте дату в документе.", "Amal qilish muddati yoshga bog‘liq: 1 yoshgacha 2 yil, 1–16 yoshda 5 yil, 16 yoshdan 10 yil."),
    audience: text("Uzbekistan citizen or eligible resident", "Гражданин Узбекистана или соответствующий резидент", "O‘zbekiston fuqarosi yoki tegishli rezident"),
    timing: { kind: "expiry_manual" },
    defaultReminders: "180/90/30/7/0",
    confidence: "high",
    risk: "normal",
    source: { title: "MyGov: passport and ID card", url: "https://my.gov.uz/en/life-situations/38d089e4-697c-494a-a5ac-d2ca1eeea49a" },
  },
  {
    id: "uz_driving_licence_expiry",
    country: "UZ",
    category: "transport",
    subjectType: "person",
    title: text("Driving licence expiry", "Срок действия водительского удостоверения", "Haydovchilik guvohnomasi muddati"),
    summary: text("A national driving licence is issued for 10 years. Track the printed date.", "Национальное водительское удостоверение выдаётся на 10 лет. Отслеживайте дату в документе.", "Milliy haydovchilik guvohnomasi 10 yilga beriladi."),
    audience: text("Driver", "Водитель", "Haydovchi"),
    timing: { kind: "expiry_manual" },
    defaultReminders: "180/90/30/7/0",
    confidence: "high",
    risk: "normal",
    source: { title: "Cabinet Resolution No. 152", url: "https://www.lex.uz/uz/acts/-6433695?ONDATE=14.04.2023+00" },
  },
  {
    id: "uz_foreigner_temporary_registration",
    country: "UZ",
    category: "residence",
    subjectType: "person",
    title: text("Foreigner temporary registration review", "Проверка временной регистрации иностранца", "Chet el fuqarosini vaqtincha ro‘yxatdan o‘tkazish"),
    summary: text("The default window is 3 working days after entry or an address change. Hotels often register guests; exceptions apply.", "Базовый срок — 3 рабочих дня после въезда или смены адреса. В гостиницах регистрацию часто оформляет объект размещения; есть исключения.", "Asosiy muddat kirish yoki manzil o‘zgarishidan keyin 3 ish kuni. Istisnolar mavjud."),
    audience: text("Foreign visitor", "Иностранный посетитель", "Chet ellik mehmon"),
    timing: { kind: "relative_manual", days: 3, workingDays: true },
    defaultReminders: "3/1/0",
    confidence: "high",
    risk: "high_applicability",
    source: { title: "MyGov for foreigners", url: "https://my.gov.uz/en/for-foreigners" },
  },
  {
    id: "uz_passport_readiness_entry",
    country: "UZ",
    category: "identity",
    subjectType: "person",
    title: text("Passport validity before Uzbekistan entry", "Проверка срока паспорта перед въездом в Узбекистан", "O‘zbekistonga kirishdan oldin pasport muddati"),
    summary: text("Travel-readiness check: official guidance states at least 6 months of passport validity at entry. Confirm for your citizenship and trip.", "Проверка перед поездкой: официальная памятка указывает минимум 6 месяцев действия паспорта при въезде. Подтвердите для своего гражданства и маршрута.", "Safar tekshiruvi: kirishda pasport kamida 6 oy amal qilishi kerakligi ko‘rsatilgan."),
    audience: text("Foreigner entering Uzbekistan", "Иностранец, въезжающий в Узбекистан", "O‘zbekistonga kirayotgan chet el fuqarosi"),
    timing: { kind: "travel_readiness", validityDays: 183 },
    defaultReminders: "180/120/90/30/7/0",
    confidence: "medium-high",
    risk: "conditional",
    source: { title: "MyGov for foreigners", url: "https://my.gov.uz/uz/for-foreigners/" },
  },
  {
    id: "uz_property_land_tax_installments",
    country: "UZ",
    category: "property",
    subjectType: "asset",
    assetTypes: ["property", "land"],
    title: text("Property and land tax instalments", "Платежи по налогу на имущество и землю", "Mol-mulk va yer solig‘i to‘lovlari"),
    summary: text("For applicable individual owners: two equal instalments by 15 April and 15 October. Confirm against the official notice.", "Для применимых владельцев-физлиц: две равные части до 15 апреля и 15 октября. Подтвердите по официальному уведомлению.", "Tegishli jismoniy shaxslar uchun: 15-aprel va 15-oktabrgacha ikki teng qism."),
    audience: text("Applicable owner of real estate or land", "Применимый владелец недвижимости или земли", "Tegishli ko‘chmas mulk yoki yer egasi"),
    timing: { kind: "annual_multiple", dates: [{ month: 4, day: 15 }, { month: 10, day: 15 }] },
    defaultReminders: "60/30/14/7/1/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Uzbekistan Tax Committee", url: "https://gov.uz/ru/soliq/news/view/215512" },
  },
];

export function localized(value, locale = "en") {
  return value?.[locale] || value?.en || "";
}

export function catalogCountryName(code, locale = "en") {
  return localized(COUNTRY_META[code]?.name, locale) || code;
}

export function matchCatalog({ people = [], assets = [] }) {
  const matches = [];
  for (const entry of CATALOG) {
    if (entry.subjectType === "person") {
      for (const person of people) {
        const citizenship = person.citizenships?.includes(entry.country);
        const jurisdiction = person.jurisdictions?.some((item) => item.country === entry.country);
        const isForeigner = jurisdiction && !citizenship;
        let applies = citizenship || jurisdiction;
        if (entry.id.includes("foreigner") || entry.id.includes("residence_permit")) applies = isForeigner;
        if (applies) matches.push({ entry, subjectId: person.id, assetId: null });
      }
    } else {
      for (const asset of assets) {
        if (asset.country !== entry.country) continue;
        if (entry.assetTypes && !entry.assetTypes.includes(asset.type)) continue;
        matches.push({ entry, subjectId: asset.ownerId || null, assetId: asset.id });
      }
    }
  }
  return matches;
}
