export const CATALOG_VERSION = "2026.11.1";
export const CATALOG_REVIEWED_AT = "2026-11-16";

const text = (en, ru, uz) => ({ en, ru, "uz-Latn": uz || en });

export const COUNTRY_META = {
  RU: { name: text("Russia", "Россия", "Rossiya"), flag: "🇷🇺" },
  UZ: { name: text("Uzbekistan", "Узбекистан", "O‘zbekiston"), flag: "🇺🇿" },
  KZ: { name: text("Kazakhstan", "Казахстан", "Qozog‘iston"), flag: "🇰🇿" },
  KG: { name: text("Kyrgyzstan", "Кыргызстан", "Qirg‘iziston"), flag: "🇰🇬" },
  TJ: { name: text("Tajikistan", "Таджикистан", "Tojikiston"), flag: "🇹🇯" },
  AM: { name: text("Armenia", "Армения", "Armaniston"), flag: "🇦🇲" },
  AZ: { name: text("Azerbaijan", "Азербайджан", "Ozarbayjon"), flag: "🇦🇿" },
  BY: { name: text("Belarus", "Беларусь", "Belarus"), flag: "🇧🇾" },
  MD: { name: text("Moldova", "Молдова", "Moldova"), flag: "🇲🇩" },
  GE: { name: text("Georgia", "Грузия", "Gruziya"), flag: "🇬🇪" },
  TM: { name: text("Turkmenistan", "Туркменистан", "Turkmaniston"), flag: "🇹🇲" },
  DE: { name: text("Germany", "Германия", "Germaniya"), flag: "🇩🇪" },
  FR: { name: text("France", "Франция", "Fransiya"), flag: "🇫🇷" },
  ES: { name: text("Spain", "Испания", "Ispaniya"), flag: "🇪🇸" },
  PT: { name: text("Portugal", "Португалия", "Portugaliya"), flag: "🇵🇹" },
  IT: { name: text("Italy", "Италия", "Italiya"), flag: "🇮🇹" },
  NL: { name: text("Netherlands", "Нидерланды", "Niderlandiya"), flag: "🇳🇱" },
  BE: { name: text("Belgium", "Бельгия", "Belgiya"), flag: "🇧🇪" },
  AT: { name: text("Austria", "Австрия", "Avstriya"), flag: "🇦🇹" },
  CH: { name: text("Switzerland", "Швейцария", "Shveytsariya"), flag: "🇨🇭" },
  CZ: { name: text("Czechia", "Чехия", "Chexiya"), flag: "🇨🇿" },
  PL: { name: text("Poland", "Польша", "Polsha"), flag: "🇵🇱" },
  IE: { name: text("Ireland", "Ирландия", "Irlandiya"), flag: "🇮🇪" },
  GB: { name: text("United Kingdom", "Великобритания", "Buyuk Britaniya"), flag: "🇬🇧" },
  SE: { name: text("Sweden", "Швеция", "Shvetsiya"), flag: "🇸🇪" },
  NO: { name: text("Norway", "Норвегия", "Norvegiya"), flag: "🇳🇴" },
  FI: { name: text("Finland", "Финляндия", "Finlyandiya"), flag: "🇫🇮" },
  DK: { name: text("Denmark", "Дания", "Daniya"), flag: "🇩🇰" },
  GR: { name: text("Greece", "Греция", "Gretsiya"), flag: "🇬🇷" },
  CY: { name: text("Cyprus", "Кипр", "Kipr"), flag: "🇨🇾" },
  EE: { name: text("Estonia", "Эстония", "Estoniya"), flag: "🇪🇪" },
  AE: { name: text("United Arab Emirates", "Объединённые Арабские Эмираты", "Birlashgan Arab Amirliklari"), flag: "🇦🇪" },
  JP: { name: text("Japan", "Япония", "Yaponiya"), flag: "🇯🇵" },
  KR: { name: text("South Korea", "Южная Корея", "Janubiy Koreya"), flag: "🇰🇷" },
  CN: { name: text("China", "Китай", "Xitoy"), flag: "🇨🇳" },
  HK: { name: text("Hong Kong", "Гонконг", "Gonkong"), flag: "🇭🇰" },
  SG: { name: text("Singapore", "Сингапур", "Singapur"), flag: "🇸🇬" },
  TH: { name: text("Thailand", "Таиланд", "Tailand"), flag: "🇹🇭" },
  MY: { name: text("Malaysia", "Малайзия", "Malayziya"), flag: "🇲🇾" },
  ID: { name: text("Indonesia", "Индонезия", "Indoneziya"), flag: "🇮🇩" },
  VN: { name: text("Vietnam", "Вьетнам", "Vyetnam"), flag: "🇻🇳" },
  PH: { name: text("Philippines", "Филиппины", "Filippin"), flag: "🇵🇭" },
  TW: { name: text("Taiwan", "Тайвань", "Tayvan"), flag: "🇹🇼" },
  US: { name: text("United States", "США", "Amerika Qo‘shma Shtatlari"), flag: "🇺🇸" },
  OTHER: { name: text("Other", "Другая", "Boshqa"), flag: "🌐" },
};

export const CATALOG = [
  {
    id: "ru_internal_passport_age_replacement",
    country: "RU",
    category: "identity",
    subjectType: "person",
    match: { kind: "citizenship" },
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
    match: { kind: "citizenship" },
    title: text("International passport expiry", "Срок действия загранпаспорта", "Xorijga chiqish pasporti muddati"),
    summary: text("Traditional passports are normally valid for 5 years; biometric passports for 10 years. Track the printed date.", "Паспорт старого образца обычно действует 5 лет, биометрический — 10 лет. Отслеживайте дату в документе.", "Oddiy pasport odatda 5 yil, biometrik pasport 10 yil amal qiladi."),
    audience: text("Russian citizen", "Гражданин РФ", "Rossiya fuqarosi"),
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
    match: { kind: "manual" },
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
    checklistKind: "tax_fee",
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
    id: "ru_foreigner_entry_migration_record",
    country: "RU",
    category: "residence",
    subjectType: "person",
    match: { kind: "foreigner_presence" },
    title: text("Entry and migration record", "Документ о въезде и миграционная карта", "Kirish va migratsiya qaydi"),
    summary: text("Track the actual border or entry record issued for this stay, including the stated purpose where recorded. The document and dates depend on the entry route; confirm what was issued instead of inventing a deadline.", "Сохраните фактически выданный документ о въезде или миграционную карту, включая указанную цель въезда. Документ и даты зависят от способа въезда — подтвердите выданные данные, не назначая условный срок.", "Ushbu safar uchun berilgan kirish yoki migratsiya hujjatini, maqsad ko‘rsatilgan bo‘lsa uni ham saqlang. Hujjat va sanalar kirish usuliga bog‘liq; muddatni taxmin qilmang."),
    audience: text("Foreign national entering or staying in Russia", "Иностранный гражданин, въезжающий или находящийся в России", "Rossiyaga kirayotgan yoki unda bo‘lgan chet el fuqarosi"),
    outcome: "document_candidate",
    actor: "foreign_national",
    trigger: "entry_record_issued",
    timing: { kind: "user_supplied", sourceField: "entry_or_migration_record" },
    defaultReminders: "30/7/1/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Federal Law 115-FZ, Article 5", url: "https://www.consultant.ru/document/cons_doc_LAW_37868/e9d581e7e11d7901295efd89c869ae044dd3d20f/" },
  },
  {
    id: "ru_foreigner_migration_registration",
    country: "RU",
    category: "residence",
    subjectType: "person",
    match: { kind: "foreigner_presence" },
    title: text("Migration registration at the place of stay", "Миграционный учёт по месту пребывания", "Yashash joyi bo‘yicha migratsiya ro‘yxati"),
    summary: text("Registration is triggered by arrival at the actual place of stay. A 7-working-day rule is common, but the responsible actor and exceptions depend on accommodation, status, and treaties; confirm the trigger and receiving party first.", "Учёт возникает после прибытия в фактическое место пребывания. Часто действует срок 7 рабочих дней, но исполнитель и исключения зависят от размещения, статуса и международных соглашений — сначала подтвердите событие и принимающую сторону.", "Ro‘yxatga olish haqiqiy yashash joyiga kelish bilan boshlanadi. Ko‘pincha 7 ish kuni qo‘llanadi, lekin mas’ul tomon va istisnolar turar joy, maqom va shartnomalarga bog‘liq."),
    audience: text("Foreigner arriving or staying in Russia", "Иностранец, прибывающий или находящийся в РФ", "Rossiyaga kelayotgan chet el fuqarosi"),
    outcome: "obligation_candidate",
    actor: "receiving_party_or_permitted_actor",
    trigger: "arrival_at_place_of_stay",
    timing: { kind: "relative_event", days: 7, workingDays: true, exceptionsRequireConfirmation: true },
    defaultReminders: "7/3/1/0",
    confidence: "high",
    risk: "high_applicability",
    source: { title: "Federal Law 109-FZ, migration registration", url: "https://www.consultant.ru/document/cons_doc_LAW_65707/fae587ce7120a45554e98af00cc6d09cae10d27f/" },
  },
  {
    id: "ru_work_patent_document",
    country: "RU",
    category: "residence",
    subjectType: "person",
    match: { kind: "route", purposes: ["work"], routes: ["work_patent"], excludeCitizenships: ["RU", "AM", "BY", "KZ", "KG"] },
    title: text("Work patent and application record", "Трудовой патент и документы подачи", "Mehnat patenti va ariza hujjatlari"),
    summary: text("Patent route for a visa-free foreign worker who is not covered by the EAEU employment exemption or another selected status. Track entry, application, issue, region, profession if stated, and paid-through dates; a patent is not a work permit.", "Патентный маршрут для безвизового иностранного работника без льготы ЕАЭС или другого выбранного статуса. Отслеживайте въезд, подачу, выдачу, регион, профессию при наличии и оплаченный период; патент не является разрешением на работу.", "YEOII imtiyozi yoki boshqa tanlangan maqomi bo‘lmagan vizasiz chet el ishchisi uchun patent yo‘li. Kirish, ariza, berilish, hudud, kasb va to‘langan davrni kuzating; patent ish ruxsatnomasi emas."),
    audience: text("Eligible visa-free foreign worker on the patent route", "Безвизовый иностранный работник на патентном маршруте", "Patent yo‘lidagi vizasiz chet el ishchisi"),
    outcome: "document_candidate",
    actor: "foreign_worker",
    trigger: "entry_for_work",
    timing: { kind: "relative_event", days: 30, event: "entry_to_russia", exceptionsRequireConfirmation: true },
    defaultReminders: "30/14/7/1/0",
    confidence: "high",
    risk: "high_applicability",
    source: { title: "Federal Law 115-FZ, Article 13.3", url: "https://www.consultant.ru/document/cons_doc_LAW_37868/78903dca1f0ac1f3abc08d2f8cd1c0e2fddc826b/" },
  },
  {
    id: "ru_work_permit_document",
    country: "RU",
    category: "residence",
    subjectType: "person",
    match: { kind: "route", purposes: ["work"], routes: ["work_permit"], excludeCitizenships: ["RU", "AM", "BY", "KZ", "KG"] },
    title: text("Work permit for the selected category", "Разрешение на работу для выбранной категории", "Tanlangan toifa uchun ish ruxsatnomasi"),
    summary: text("Use only when a specific Article 13 work-permit category applies. Record the category, employer authorization, region, profession, issue and expiry dates; do not treat this as an alternative name for a patent.", "Используйте только для конкретной категории разрешения по статье 13. Сохраните категорию, разрешение работодателя, регион, профессию, даты выдачи и окончания; это не другое название патента.", "Faqat 13-modda bo‘yicha aniq ish ruxsatnomasi toifasi qo‘llanganda foydalaning. Toifa, ish beruvchi ruxsati, hudud, kasb, berilish va tugash sanalarini saqlang; bu patentning boshqa nomi emas."),
    audience: text("Foreign worker in a selected work-permit category", "Иностранный работник выбранной категории разрешения на работу", "Tanlangan ish ruxsatnomasi toifasidagi chet el ishchisi"),
    outcome: "document_candidate",
    actor: "foreign_worker_and_employer",
    trigger: "qualifying_work_permit_category_selected",
    timing: { kind: "user_supplied", sourceField: "work_permit" },
    defaultReminders: "180/90/30/7/1/0",
    confidence: "high",
    risk: "high_applicability",
    source: { title: "Federal Law 115-FZ, Article 13", url: "https://www.consultant.ru/document/cons_doc_LAW_37868/c137c6f66afe76bc2b195f1d1743662a5fc3d372/" },
  },
  {
    id: "ru_eaeu_employment_exemption",
    country: "RU",
    category: "residence",
    subjectType: "person",
    match: { kind: "route", purposes: ["work"], routes: ["eaeu_employment"], citizenships: ["AM", "BY", "KZ", "KG"] },
    title: text("EAEU employment route: no patent or work permit", "Работа по ЕАЭС: без патента и разрешения на работу", "YEOII bo‘yicha ish: patentsiz va ish ruxsatisiz"),
    summary: text("For an Armenian, Belarusian, Kazakhstani or Kyrgyzstani citizen working under the EAEU route, keep the employment or civil contract and migration records. Do not add the ordinary Russian patent or work-permit packet.", "Для гражданина Армении, Беларуси, Казахстана или Кыргызстана на маршруте ЕАЭС сохраните трудовой либо гражданско-правовой договор и миграционные документы. Не добавляйте обычный российский патент или пакет разрешения на работу.", "YEOII yo‘li bo‘yicha ishlayotgan Armaniston, Belarus, Qozog‘iston yoki Qirg‘iziston fuqarosi uchun mehnat yoki fuqarolik shartnomasi va migratsiya hujjatlarini saqlang. Oddiy Rossiya patenti yoki ish ruxsati paketini qo‘shmang."),
    audience: text("EAEU citizen employed in Russia under the treaty route", "Гражданин ЕАЭС, работающий в России по союзному маршруту", "Rossiyada ittifoq qoidalari bo‘yicha ishlayotgan YEOII fuqarosi"),
    outcome: "document_candidate",
    actor: "foreign_worker_and_employer",
    trigger: "eaeu_employment_contract",
    timing: { kind: "user_supplied", sourceField: "employment_or_civil_contract" },
    defaultReminders: "30/14/7/1/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Eurasian Economic Commission: migration and employment Q&A", url: "https://eec.eaeunion.org/upload/medialibrary/a53/voprosy_migratsii.pdf" },
  },
  {
    id: "ru_work_medical_examination",
    country: "RU",
    category: "health",
    subjectType: "person",
    match: { kind: "route", purposes: ["work"], routes: ["work_patent"], excludeCitizenships: ["RU", "AM", "BY", "KZ", "KG"] },
    title: text("Medical examination for the patent route", "Медицинское освидетельствование для патента", "Patent uchun tibbiy ko‘rik"),
    summary: text("Track the examination documents required for the selected patent application and any later renewal required by the current rules. Use the dates printed by the authorised provider.", "Сохраните документы медосвидетельствования для выбранной подачи на патент и последующего обновления, если оно требуется действующими правилами. Используйте даты уполномоченной медорганизации.", "Tanlangan patent arizasi uchun tibbiy ko‘rik hujjatlarini va amaldagi qoidalar talab qilsa keyingi yangilanishni kuzating. Vakolatli tibbiyot tashkiloti sanalaridan foydalaning."),
    audience: text("Foreign worker applying for or holding a work patent", "Иностранный работник, оформляющий или имеющий патент", "Patent olayotgan yoki patentga ega chet el ishchisi"),
    outcome: "document_candidate",
    actor: "foreign_worker",
    trigger: "patent_application_or_required_renewal",
    timing: { kind: "user_supplied", sourceField: "medical_certificate" },
    defaultReminders: "30/14/7/1/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Federal Law 115-FZ, Article 13.3", url: "https://www.consultant.ru/document/cons_doc_LAW_37868/78903dca1f0ac1f3abc08d2f8cd1c0e2fddc826b/" },
  },
  {
    id: "ru_work_medical_cover",
    country: "RU",
    category: "health",
    subjectType: "person",
    match: { kind: "route", purposes: ["work"], routes: ["work_patent"], excludeCitizenships: ["RU", "AM", "BY", "KZ", "KG"] },
    title: text("VHI policy or qualifying medical-services agreement", "Полис ДМС или подходящий договор на медицинские услуги", "Ixtiyoriy tibbiy sug‘urta yoki mos tibbiy xizmat shartnomasi"),
    summary: text("Record the actual policy or qualifying medical-services agreement used for the patent route, including its territory and coverage dates. Do not create a fictitious expiry date when another valid coverage basis is used.", "Сохраните фактический полис ДМС или подходящий договор на медуслуги для патентного маршрута, включая территорию и сроки покрытия. Не создавайте условную дату окончания, если используется другое допустимое основание покрытия.", "Patent yo‘li uchun ishlatilgan haqiqiy tibbiy sug‘urta yoki xizmat shartnomasini, hududi va qamrov sanalari bilan saqlang. Boshqa yaroqli asos bo‘lsa, soxta tugash sanasini yaratmang."),
    audience: text("Foreign worker on the patent route", "Иностранный работник на патентном маршруте", "Patent yo‘lidagi chet el ishchisi"),
    outcome: "document_candidate",
    actor: "foreign_worker",
    trigger: "patent_application_or_coverage_change",
    timing: { kind: "expiry_manual" },
    defaultReminders: "60/30/14/7/1/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Federal Law 115-FZ, Article 13.3", url: "https://www.consultant.ru/document/cons_doc_LAW_37868/78903dca1f0ac1f3abc08d2f8cd1c0e2fddc826b/" },
  },
  {
    id: "ru_work_language_law_evidence",
    country: "RU",
    category: "residence",
    subjectType: "person",
    match: { kind: "route", purposes: ["work"], routes: ["work_patent"], excludeCitizenships: ["RU", "AM", "BY", "KZ", "KG"] },
    title: text("Russian language, history and law evidence or exemption", "Подтверждение русского языка, истории и права или льготы", "Rus tili, tarixi va huquqi bo‘yicha hujjat yoki imtiyoz"),
    summary: text("Store either the accepted evidence or the exact statutory exemption used for this application. Different documents and exemptions have different validity rules, so the system asks for the printed or confirmed date.", "Сохраните принятое подтверждение либо точное законное основание освобождения для этой подачи. У документов и льгот разные правила действия, поэтому дату нужно подтвердить по документу.", "Ushbu ariza uchun qabul qilingan dalil yoki aniq qonuniy imtiyozni saqlang. Hujjatlar va imtiyozlarning amal qilish qoidalari turlicha, sanani hujjat bo‘yicha tasdiqlang."),
    audience: text("Patent applicant unless a statutory exemption applies", "Заявитель на патент, если не действует законная льгота", "Qonuniy imtiyoz bo‘lmasa patent arizachisi"),
    outcome: "document_candidate",
    actor: "foreign_worker",
    trigger: "patent_application",
    timing: { kind: "user_supplied", sourceField: "language_or_exemption_evidence" },
    defaultReminders: "60/30/14/7/1/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Federal Law 115-FZ, Article 15.1", url: "https://www.consultant.ru/document/cons_doc_LAW_37868/443b9d69fea13cc5f1b681847cd6c139a2002c63/" },
  },
  {
    id: "ru_foreign_worker_contract",
    country: "RU",
    category: "residence",
    subjectType: "person",
    match: { kind: "route", purposes: ["work"], routes: ["work_patent", "work_permit", "eaeu_employment"], excludeCitizenships: ["RU"] },
    title: text("Employment or civil contract", "Трудовой или гражданско-правовой договор", "Mehnat yoki fuqarolik-huquqiy shartnoma"),
    summary: text("Track the signed contract, start and end dates, employer, region and any route-specific conditions. For EAEU employment this contract is part of the exemption branch; it does not create a patent requirement.", "Сохраните подписанный договор, даты начала и окончания, работодателя, регион и условия выбранного маршрута. Для работы по ЕАЭС договор относится к льготному маршруту и не создаёт требование патента.", "Imzolangan shartnoma, boshlanish va tugash sanalari, ish beruvchi, hudud va yo‘lga xos shartlarni saqlang. YEOII bandligida bu imtiyoz yo‘lining qismi bo‘lib, patent talabini yaratmaydi."),
    audience: text("Foreign worker and contracting employer", "Иностранный работник и заключающий договор работодатель", "Chet el ishchisi va shartnoma tuzuvchi ish beruvchi"),
    outcome: "document_candidate",
    actor: "foreign_worker_and_employer",
    trigger: "contract_signed",
    timing: { kind: "user_supplied", sourceField: "employment_or_civil_contract" },
    defaultReminders: "30/14/7/1/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Federal Law 115-FZ, Article 13", url: "https://www.consultant.ru/document/cons_doc_LAW_37868/c137c6f66afe76bc2b195f1d1743662a5fc3d372/" },
  },
  {
    id: "ru_patent_advance_tax_payments",
    country: "RU",
    category: "tax",
    subjectType: "person",
    match: { kind: "route", purposes: ["work"], routes: ["work_patent"], excludeCitizenships: ["RU", "AM", "BY", "KZ", "KG"] },
    title: text("Advance patent tax payments", "Авансовые платежи НДФЛ по патенту", "Patent bo‘yicha avans soliq to‘lovlari"),
    summary: text("The patent remains valid only for the paid period. Enter the actual paid-through date from receipts and schedule the next payment before that period ends; the catalog does not assume a universal calendar day.", "Патент действует только в пределах оплаченного периода. Введите фактическую дату, до которой внесён платёж, по квитанциям и планируйте следующий платёж до её окончания; каталог не назначает единый день месяца.", "Patent faqat to‘langan davr ichida amal qiladi. Kvitansiyadan haqiqiy to‘langan sanani kiriting va keyingi to‘lovni shu davr tugashidan oldin rejalang; katalog umumiy oy kunini taxmin qilmaydi."),
    audience: text("Work-patent holder", "Владелец трудового патента", "Mehnat patenti egasi"),
    outcome: "obligation_candidate",
    actor: "foreign_worker",
    trigger: "current_paid_period_end",
    timing: { kind: "user_supplied", recurrence: "user_selected", anchor: "user_confirmed_paid_through" },
    defaultReminders: "14/7/3/1/0",
    confidence: "high",
    risk: "high_applicability",
    source: { title: "Federal Law 115-FZ, Article 13.3", url: "https://www.consultant.ru/document/cons_doc_LAW_37868/78903dca1f0ac1f3abc08d2f8cd1c0e2fddc826b/" },
  },
  {
    id: "ru_patent_contract_copy_submission",
    country: "RU",
    category: "residence",
    subjectType: "person",
    match: { kind: "route", purposes: ["work"], routes: ["work_patent"], excludeCitizenships: ["RU", "AM", "BY", "KZ", "KG"] },
    title: text("Patent holder’s contract-copy submission", "Подача копии договора владельцем патента", "Patent egasining shartnoma nusxasini topshirishi"),
    summary: text("Where Article 13.3 requires it, the patent holder submits a copy of the employment or civil contract after the patent is issued. Track the patent issue date and the submission receipt separately.", "Когда это требуется статьёй 13.3, владелец патента подаёт копию трудового или гражданско-правового договора после выдачи патента. Храните отдельно дату выдачи патента и подтверждение подачи.", "13.3-modda talab qilganda patent egasi patent berilgandan keyin mehnat yoki fuqarolik shartnomasi nusxasini topshiradi. Patent berilgan sana va topshirish tasdig‘ini alohida saqlang."),
    audience: text("Work-patent holder after signing a contract", "Владелец трудового патента после заключения договора", "Shartnoma tuzgan mehnat patenti egasi"),
    outcome: "obligation_candidate",
    actor: "foreign_worker",
    trigger: "patent_issued_and_contract_signed",
    timing: { kind: "relative_event", months: 2, event: "patent_issue" },
    defaultReminders: "30/14/7/3/1/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Federal Law 115-FZ, Article 13.3", url: "https://www.consultant.ru/document/cons_doc_LAW_37868/78903dca1f0ac1f3abc08d2f8cd1c0e2fddc826b/" },
  },
  {
    id: "ru_employer_foreign_worker_notifications",
    country: "RU",
    category: "residence",
    subjectType: "person",
    match: { kind: "route", purposes: ["work"], routes: ["work_patent", "work_permit", "eaeu_employment"], excludeCitizenships: ["RU"] },
    title: text("Employer notifications for a foreign worker", "Уведомления работодателя по иностранному работнику", "Chet el ishchisi bo‘yicha ish beruvchi xabarnomalari"),
    summary: text("The employer or customer of services—not the worker—normally handles the prescribed notification after a qualifying contract is concluded or terminated. Confirm the event, form, authority and any category-specific exception.", "Установленное уведомление после заключения или прекращения подходящего договора обычно подаёт работодатель или заказчик работ, а не работник. Подтвердите событие, форму, орган и исключения выбранной категории.", "Tegishli shartnoma tuzilganda yoki tugatilganda belgilangan xabarnomani odatda ishchi emas, ish beruvchi yoki xizmat buyurtmachisi topshiradi. Voqea, shakl, organ va toifaga xos istisnolarni tasdiqlang."),
    audience: text("Employer or services customer engaging a foreign worker", "Работодатель или заказчик работ иностранного работника", "Chet el ishchisini jalb qilgan ish beruvchi yoki xizmat buyurtmachisi"),
    outcome: "obligation_candidate",
    actor: "employer_or_services_customer",
    trigger: "contract_concluded_or_terminated",
    timing: { kind: "relative_event", days: 3, workingDays: true, event: "contract_conclusion_or_termination" },
    defaultReminders: "3/1/0",
    confidence: "high",
    risk: "high_applicability",
    source: { title: "Federal Law 115-FZ, Article 13", url: "https://www.consultant.ru/document/cons_doc_LAW_37868/c137c6f66afe76bc2b195f1d1743662a5fc3d372/" },
  },
  {
    id: "ru_rvp_annual_residence_confirmation",
    country: "RU",
    category: "residence",
    subjectType: "person",
    match: { kind: "route", routes: ["rvp"] },
    title: text("RVP annual residence confirmation", "Ежегодное подтверждение проживания по РВП", "RVP bo‘yicha yillik yashash tasdig‘i"),
    summary: text("Track the anniversary and the confirmation required for the specific RVP. The trigger is receipt of RVP; verify the current evidence, submission channel and any exception for the holder.", "Отслеживайте годовщину и подтверждение для конкретного РВП. Событие отсчитывается от получения РВП; проверьте актуальные документы, способ подачи и исключения для владельца.", "Aniq RVP uchun yillik sana va tasdiqni kuzating. Hisob RVP olingan kundan boshlanadi; amaldagi hujjatlar, topshirish usuli va istisnolarni tekshiring."),
    audience: text("Foreigner holding a Russian RVP", "Иностранец с РВП России", "Rossiya RVP maqomiga ega chet el fuqarosi"),
    outcome: "obligation_candidate",
    actor: "status_holder",
    trigger: "rvp_anniversary",
    timing: { kind: "annual_anniversary", sourceField: "rvp_issue_date" },
    defaultReminders: "60/30/14/7/1/0",
    confidence: "high",
    risk: "conditional",
    source: { title: "Federal Law 115-FZ, Article 6", url: "https://www.consultant.ru/document/cons_doc_LAW_37868/c9b9574537c49598dac3a13845550e8995a3f405/" },
  },
  {
    id: "ru_residence_permit_annual_confirmation",
    country: "RU",
    category: "residence",
    subjectType: "person",
    match: { kind: "route", routes: ["vnzh", "permanent_residence"] },
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
    match: { kind: "citizenship" },
    title: text("ID card expiry", "Срок действия ID-карты", "ID-karta amal qilish muddati"),
    summary: text("Validity depends on age: 2 years from birth to 1, 5 years from 1–16, and 10 years from age 16. Track the printed date.", "Срок зависит от возраста: 2 года до года, 5 лет от 1 до 16 лет, 10 лет с 16 лет. Отслеживайте дату в документе.", "Amal qilish muddati yoshga bog‘liq: 1 yoshgacha 2 yil, 1–16 yoshda 5 yil, 16 yoshdan 10 yil."),
    audience: text("Uzbekistan citizen", "Гражданин Узбекистана", "O‘zbekiston fuqarosi"),
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
    match: { kind: "manual" },
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
    match: { kind: "foreigner_presence" },
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
    match: { kind: "foreigner_presence" },
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

// These are jurisdiction-neutral prompts, not assertions about a country's law.
// matchCatalog clones them to the exact vehicle country and asset id. They stay
// outside CATALOG so the public country catalog does not present them as reviewed
// national rules before an exact vehicle exists.
export const GENERIC_ASSET_CATALOG = [
  {
    id: "vehicle_registration_title",
    country: "ASSET",
    category: "transport",
    subjectType: "asset",
    assetTypes: ["vehicle"],
    checklistKind: "registration_title",
    title: text("Vehicle registration and title", "Регистрация транспорта и документ о праве", "Transport ro‘yxati va mulk hujjati"),
    summary: text("Add the registration certificate, title or ownership record for this exact vehicle. Requirements and replacement events depend on its country and region; enter only dates confirmed by the document or authority.", "Добавьте свидетельство о регистрации, документ о праве или иной реестр для этого конкретного транспорта. Требования и замена зависят от страны и региона — вводите только подтверждённые документом или органом даты.", "Aynan shu transport uchun ro‘yxat guvohnomasi, mulk yoki egalik hujjatini qo‘shing. Talablar mamlakat va hududga bog‘liq; faqat hujjat yoki organ tasdiqlagan sanalarni kiriting."),
    audience: text("Owner or registered keeper of this exact vehicle", "Владелец или зарегистрированный пользователь этого транспорта", "Aynan shu transport egasi yoki ro‘yxatdagi foydalanuvchisi"),
    outcome: "document_candidate",
    actor: "vehicle_owner_or_keeper",
    trigger: "vehicle_acquired_registered_or_details_changed",
    timing: { kind: "user_supplied", sourceField: "vehicle_registration_or_title" },
    defaultReminders: "60/30/14/7/1/0",
    confidence: "requires_confirmation",
    risk: "jurisdiction_specific",
    source: { title: "Confirm with the vehicle registration authority", url: null, required: true },
  },
  {
    id: "vehicle_compulsory_insurance",
    country: "ASSET",
    category: "transport",
    subjectType: "asset",
    assetTypes: ["vehicle"],
    checklistKind: "insurance",
    title: text("Compulsory vehicle insurance", "Обязательное страхование транспорта", "Majburiy transport sug‘urtasi"),
    summary: text("Track the actual compulsory-liability policy or other mandatory cover for this exact vehicle. Confirm whether it applies, the insured territory, and the printed start and end dates.", "Отслеживайте фактический полис обязательной ответственности или иное обязательное покрытие для этого транспорта. Подтвердите применимость, территорию страхования и напечатанные даты начала и окончания.", "Aynan shu transport uchun majburiy javobgarlik polisi yoki boshqa majburiy qoplamani kuzating. Qo‘llanishi, hududi va hujjatdagi boshlanish hamda tugash sanalarini tasdiqlang."),
    audience: text("Owner or keeper where compulsory cover applies", "Владелец или пользователь, если требуется обязательное покрытие", "Majburiy qoplama talab qilinadigan egasi yoki foydalanuvchisi"),
    outcome: "document_candidate",
    actor: "vehicle_owner_or_keeper",
    trigger: "policy_issued_or_vehicle_use_begins",
    timing: { kind: "expiry_manual" },
    defaultReminders: "60/30/14/7/1/0",
    confidence: "requires_confirmation",
    risk: "jurisdiction_specific",
    source: { title: "Confirm with the insurance or transport authority", url: null, required: true },
  },
  {
    id: "vehicle_roadworthiness_inspection",
    country: "ASSET",
    category: "transport",
    subjectType: "asset",
    assetTypes: ["vehicle"],
    checklistKind: "inspection",
    title: text("Roadworthiness or technical inspection", "Техосмотр или проверка пригодности к эксплуатации", "Texnik yoki yo‘lga yaroqlilik ko‘rigi"),
    summary: text("Confirm whether inspection applies to this vehicle class, age and use, then record the certificate or next authority-confirmed date. The catalog does not assume one national interval.", "Проверьте, требуется ли осмотр для класса, возраста и использования этого транспорта, затем добавьте сертификат или подтверждённую органом следующую дату. Каталог не назначает единый интервал.", "Transport toifasi, yoshi va foydalanishiga ko‘ra ko‘rik kerakligini tekshiring, so‘ng sertifikat yoki organ tasdiqlagan keyingi sanani kiriting. Katalog yagona muddatni taxmin qilmaydi."),
    audience: text("Vehicle owner or operator where inspection applies", "Владелец или пользователь транспорта, для которого нужен осмотр", "Ko‘rik talab qilinadigan transport egasi yoki boshqaruvchisi"),
    outcome: "obligation_candidate",
    actor: "vehicle_owner_or_operator",
    trigger: "inspection_requirement_confirmed",
    timing: { kind: "user_supplied", sourceField: "inspection_certificate_or_notice" },
    defaultReminders: "60/30/14/7/1/0",
    confidence: "requires_confirmation",
    risk: "jurisdiction_specific",
    source: { title: "Confirm with the roadworthiness authority", url: null, required: true },
  },
  {
    id: "vehicle_tax_fee_notice",
    country: "ASSET",
    category: "tax",
    subjectType: "asset",
    assetTypes: ["vehicle"],
    checklistKind: "tax_fee",
    title: text("Vehicle tax or recurring fee notice", "Уведомление о транспортном налоге или сборе", "Transport solig‘i yoki davriy yig‘im xabarnomasi"),
    summary: text("Add the official tax or recurring-fee notice for this exact vehicle only after confirming that the country, region and ownership period make it applicable. Use the notice date and amount; do not infer a universal annual deadline.", "Добавьте официальное уведомление о налоге или регулярном сборе по этому транспорту только после проверки страны, региона и периода владения. Используйте срок и сумму из уведомления, не назначая общий годовой дедлайн.", "Aynan shu transport uchun soliq yoki davriy yig‘im xabarnomasini mamlakat, hudud va egalik davri mosligini tekshirgandan keyin qo‘shing. Umumiy yillik muddatni taxmin qilmang."),
    audience: text("Owner where a vehicle tax or recurring fee applies", "Владелец, если применяется транспортный налог или регулярный сбор", "Transport solig‘i yoki yig‘imi qo‘llanadigan egasi"),
    outcome: "obligation_candidate",
    actor: "vehicle_owner",
    trigger: "authority_notice_or_confirmed_tax_period",
    timing: { kind: "authority_notice", sourceField: "tax_or_fee_notice" },
    defaultReminders: "60/30/14/7/1/0",
    confidence: "requires_confirmation",
    risk: "jurisdiction_specific",
    source: { title: "Confirm with the tax or transport authority", url: null, required: true },
  },
  {
    id: "vehicle_import_customs_foreign_plate",
    country: "ASSET",
    category: "transport",
    subjectType: "asset",
    assetTypes: ["vehicle"],
    checklistKind: "import_customs_foreign_plate",
    title: text("Import, customs or foreign-plate record", "Ввоз, таможня или документ на иностранные номера", "Import, bojxona yoki xorijiy raqam hujjati"),
    summary: text("If this vehicle was imported, temporarily admitted, or uses foreign plates, record the exact customs or temporary-use document and its confirmed dates. Mark it not applicable for a domestically registered vehicle with no cross-border status.", "Если транспорт ввезён, временно допущен или используется на иностранных номерах, добавьте точный таможенный документ или документ временного использования и подтверждённые даты. Для местной регистрации без трансграничного статуса отметьте неприменимость.", "Transport import qilingan, vaqtincha olib kirilgan yoki xorijiy raqamda bo‘lsa, aniq bojxona yoki vaqtincha foydalanish hujjati va tasdiqlangan sanalarni kiriting. Mahalliy ro‘yxatdagi transport uchun mos emas deb belgilang."),
    audience: text("Owner or user of an imported or foreign-plated vehicle, if applicable", "Владелец или пользователь ввезённого транспорта либо транспорта на иностранных номерах, если применимо", "Import qilingan yoki xorijiy raqamli transport egasi yoki foydalanuvchisi, agar tegishli bo‘lsa"),
    outcome: "document_candidate",
    actor: "vehicle_owner_or_importer",
    trigger: "cross_border_vehicle_status_confirmed",
    timing: { kind: "user_supplied", sourceField: "customs_or_temporary_admission_record" },
    defaultReminders: "60/30/14/7/3/1/0",
    confidence: "requires_confirmation",
    risk: "jurisdiction_specific",
    source: { title: "Confirm with the customs or vehicle authority", url: null, required: true },
  },
];

export function localized(value, locale = "en") {
  return value?.[locale] || value?.en || "";
}

export function catalogCountryName(code, locale = "en") {
  return localized(COUNTRY_META[code]?.name, locale) || code;
}

const LEGACY_PURPOSE_BY_BASIS = {
  employment: "work",
  work_patent: "work",
  work_permit: "work",
  eaeu_employment: "work",
  study: "study",
  ru_student: "study",
  rvpo: "study",
  family: "family",
  ru_family: "family",
  tourist: "visit",
  visit: "visit",
  visa_free: "visit",
  visa: "visit",
  business: "business",
  ru_business: "business",
  rvp: "long_term",
  vnzh: "long_term",
  temporary_residence: "long_term",
  permanent_residence: "long_term",
};

const ROUTE_VALUES = new Set([
  "citizen", "visa_free", "visa", "work_patent", "work_permit", "eaeu_employment",
  "rvp", "rvpo", "vnzh", "ru_student", "ru_family", "ru_business",
  "eu_free_movement", "eu_work", "eu_blue_card", "eu_study", "eu_family",
  "eu_visit", "eu_long_term", "generic_work", "generic_study", "generic_family",
  "generic_visit", "generic_long_term", "temporary_residence", "permanent_residence",
  "not_sure", "unspecified",
]);

const EAEU_WORK_CITIZENSHIPS = new Set(["AM", "BY", "KZ", "KG"]);

function relationPurpose(relation) {
  return relation?.purpose || LEGACY_PURPOSE_BY_BASIS[relation?.route] || LEGACY_PURPOSE_BY_BASIS[relation?.basis] || "unknown";
}

function relationRoute(relation) {
  if (relation?.route) return relation.route;
  return ROUTE_VALUES.has(relation?.basis) ? relation.basis : "not_sure";
}

function relationMatches(match, relation, person) {
  const citizenships = person.citizenships || [];
  if (match.excludeCitizenships?.some((country) => citizenships.includes(country))) return false;
  if (match.citizenships && !match.citizenships.some((country) => citizenships.includes(country))) return false;
  const purpose = relationPurpose(relation);
  const route = relationRoute(relation);
  if (match.kind === "route" && relation.country === "RU") {
    const hasEaeuCitizenship = citizenships.some((country) => EAEU_WORK_CITIZENSHIPS.has(country));
    if (hasEaeuCitizenship && ["work_patent", "work_permit"].includes(route)) return false;
    if (!hasEaeuCitizenship && route === "eaeu_employment") return false;
  }
  if (match.purposes && !match.purposes.includes(purpose)) return false;
  if (match.routes && !match.routes.includes(route)) return false;
  if (match.excludeRoutes?.includes(route)) return false;
  return true;
}

function personMatches(entry, person) {
  const citizenship = (person.citizenships || []).includes(entry.country);
  const relations = (person.jurisdictions || []).filter((relation) => relation.country === entry.country && relation.type !== "citizenship");
  const foreignRelations = citizenship ? [] : relations;
  const match = entry.match || { kind: "citizenship" };

  if (match.kind === "citizenship") return citizenship;
  if (match.kind === "manual") return false;
  if (match.kind === "foreigner_presence") return foreignRelations.some((relation) => relationMatches(match, relation, person));
  if (match.kind === "legal_basis") {
    return foreignRelations.some((relation) => match.values?.includes(relationRoute(relation)) || match.values?.includes(relation.basis));
  }
  if (match.kind === "route") return foreignRelations.some((relation) => relationMatches(match, relation, person));
  return citizenship;
}

export function matchCatalog({ people = [], assets = [] }) {
  const matches = [];
  for (const entry of CATALOG) {
    if (entry.subjectType === "person") {
      for (const person of people) {
        if (personMatches(entry, person)) matches.push({ entry, subjectId: person.id, assetId: null });
      }
    } else {
      for (const asset of assets) {
        if (asset.country !== entry.country) continue;
        if (entry.assetTypes && !entry.assetTypes.includes(asset.type)) continue;
        matches.push({ entry, subjectId: asset.ownerId || null, assetId: asset.id });
      }
    }
  }

  for (const asset of assets) {
    if (asset.type !== "vehicle" || !asset.country) continue;
    const existingKinds = new Set(matches.filter((match) => match.assetId === asset.id).map((match) => match.entry.checklistKind).filter(Boolean));
    for (const template of GENERIC_ASSET_CATALOG) {
      if (existingKinds.has(template.checklistKind)) continue;
      const entry = { ...template, country: asset.country, templateCountry: template.country, jurisdictionScoped: true };
      matches.push({ entry, subjectId: asset.ownerId || null, assetId: asset.id });
    }
  }

  const personById = new Map(people.map((person) => [person.id, person]));
  return matches.sort((left, right) => {
    const leftPerson = personById.get(left.subjectId);
    const rightPerson = personById.get(right.subjectId);
    const leftRank = left.assetId ? 2 : leftPerson?.citizenships?.includes(left.entry.country) ? 0 : 1;
    const rightRank = right.assetId ? 2 : rightPerson?.citizenships?.includes(right.entry.country) ? 0 : 1;
    return leftRank - rightRank;
  });
}
