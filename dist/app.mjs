import {
  CATEGORY_META, SCHEMA_VERSION, addDays, calendarLinks, createId,
  daysBetween, formatReminderSequence, generateICS, getCalendarEventCount, getItemStatus,
  getNextOccurrence, groupItemsForToday, makeItemFromCatalog,
  parseISODate, parseReminderSequence, sortItems, toISODate, validateBackup,
} from "./logic.mjs";
import {
  CATALOG, CATALOG_REVIEWED_AT, CATALOG_VERSION, COUNTRY_META,
  catalogCountryName, localized, matchCatalog,
} from "./catalog.mjs";
import { SUPPORTED_LOCALES, t } from "./i18n.mjs";

const DB_NAME = "nextdue-local";
const DB_VERSION = 1;
const STORE_NAME = "state";
const STATE_KEY = "app";

const COUNTRIES = [
  ["", "—"], ["RU", "Russia"], ["UZ", "Uzbekistan"], ["KZ", "Kazakhstan"], ["KG", "Kyrgyzstan"], ["TJ", "Tajikistan"],
  ["AM", "Armenia"], ["AZ", "Azerbaijan"], ["BY", "Belarus"], ["MD", "Moldova"], ["GE", "Georgia"], ["TM", "Turkmenistan"],
  ["DE", "Germany"], ["FR", "France"], ["ES", "Spain"], ["PT", "Portugal"], ["IT", "Italy"], ["NL", "Netherlands"],
  ["BE", "Belgium"], ["AT", "Austria"], ["CH", "Switzerland"], ["CZ", "Czechia"], ["PL", "Poland"], ["IE", "Ireland"],
  ["GB", "United Kingdom"], ["SE", "Sweden"], ["NO", "Norway"], ["FI", "Finland"], ["DK", "Denmark"], ["GR", "Greece"],
  ["CY", "Cyprus"], ["EE", "Estonia"], ["AE", "United Arab Emirates"], ["JP", "Japan"], ["KR", "South Korea"], ["CN", "China"],
  ["HK", "Hong Kong"], ["SG", "Singapore"], ["TH", "Thailand"], ["MY", "Malaysia"], ["ID", "Indonesia"], ["VN", "Vietnam"],
  ["PH", "Philippines"], ["TW", "Taiwan"], ["US", "United States"], ["OTHER", "Other"],
];

const UZ_COUNTRY_NAMES = {
  KZ: "Qozog‘iston", KG: "Qirg‘iziston", TJ: "Tojikiston", AM: "Armaniston", AZ: "Ozarbayjon", BY: "Belarus", MD: "Moldova", GE: "Gruziya", TM: "Turkmaniston",
  AE: "Birlashgan Arab Amirliklari", DE: "Germaniya", ES: "Ispaniya", FR: "Fransiya", IT: "Italiya", NL: "Niderlandiya", BE: "Belgiya", AT: "Avstriya",
  CH: "Shveytsariya", CZ: "Chexiya", PL: "Polsha", IE: "Irlandiya", GB: "Buyuk Britaniya", SE: "Shvetsiya", NO: "Norvegiya", FI: "Finlyandiya",
  DK: "Daniya", GR: "Gretsiya", CY: "Kipr", EE: "Estoniya", PT: "Portugaliya", JP: "Yaponiya", KR: "Janubiy Koreya", CN: "Xitoy", HK: "Gonkong",
  SG: "Singapur", TH: "Tailand", MY: "Malayziya", ID: "Indoneziya", VN: "Vyetnam", PH: "Filippin", TW: "Tayvan", US: "Amerika Qo‘shma Shtatlari",
};

const PURPOSES = {
  work: ["Work", "Работа", "Ish"], study: ["Study", "Учёба", "O‘qish"], family: ["Family", "Семья", "Oila"],
  visit: ["Visit or tourism", "Визит или туризм", "Tashrif yoki turizm"], business: ["Business", "Бизнес", "Biznes"],
  long_term: ["Long-term residence", "Долгосрочное проживание", "Uzoq muddatli yashash"], protection: ["Protection", "Защита", "Himoya"],
  unknown: ["Not sure yet", "Пока не знаю", "Hozircha bilmayman"],
};

const ROUTES = {
  citizen: ["Citizen — no immigration route needed", "Гражданство — миграционное основание не нужно", "Fuqaro — migratsiya asosi kerak emas"],
  not_sure: ["Not sure yet", "Пока не знаю", "Hozircha bilmayman"],
  visa_free: ["Visa-free / short stay", "Безвизовый / краткий визит", "Vizasiz / qisqa muddat"], visa: ["Visa", "Виза", "Viza"],
  work_patent: ["Work patent", "Трудовой патент", "Mehnat patenti"], work_permit: ["Work permit — qualifying category", "Разрешение на работу — подходящая категория", "Ish ruxsati — tegishli toifa"],
  eaeu_employment: ["EAEU employment — patent not required", "Работа по ЕАЭС — патент не требуется", "YEOII bo‘yicha ish — patent kerak emas"],
  rvp: ["Temporary residence permit (RVP)", "РВП", "Vaqtinchalik yashash ruxsati (RVP)"],
  rvpo: ["Education temporary residence (RVPO)", "РВПО", "Ta’lim uchun vaqtinchalik yashash (RVPO)"],
  vnzh: ["Residence permit (VNZH)", "ВНЖ", "Yashash guvohnomasi (VNZH)"],
  ru_student: ["Student visa or temporary stay", "Учебная виза или временное пребывание", "Talaba vizasi yoki vaqtincha qolish"],
  ru_family: ["Family-based stay", "Пребывание по семье", "Oila asosida qolish"], ru_business: ["Business visa / qualifying route", "Деловая виза / подходящее основание", "Biznes vizasi / tegishli asos"],
  eu_free_movement: ["EU/EEA free-movement right", "Право свободного передвижения ЕС/ЕЭЗ", "YI/EEA erkin harakatlanish huquqi"],
  eu_work: ["National work visa or permit", "Национальная рабочая виза или разрешение", "Milliy ish vizasi yoki ruxsati"],
  eu_blue_card: ["EU Blue Card — if eligible", "Голубая карта ЕС — при соответствии", "YI Ko‘k kartasi — mos bo‘lsa"],
  eu_study: ["Student visa or residence permit", "Учебная виза или ВНЖ", "Talaba vizasi yoki yashash ruxsati"],
  eu_family: ["Family reunification", "Воссоединение семьи", "Oila birlashuvi"], eu_visit: ["Short stay / visitor visa", "Краткий визит / гостевая виза", "Qisqa tashrif / mehmon vizasi"],
  eu_long_term: ["National long-stay or residence permit", "Национальная долгосрочная виза или ВНЖ", "Milliy uzoq muddatli viza yoki yashash ruxsati"],
  generic_work: ["Country-specific work permit", "Рабочее разрешение этой страны", "Mamlakatga xos ish ruxsati"],
  generic_study: ["Student visa or permit", "Учебная виза или разрешение", "Talaba vizasi yoki ruxsati"],
  generic_family: ["Family route", "Основание по семье", "Oila asosi"], generic_visit: ["Visitor or visa-free stay", "Гостевой или безвизовый въезд", "Mehmon yoki vizasiz qolish"],
  generic_long_term: ["Long-term residence route", "Долгосрочное проживание", "Uzoq muddatli yashash asosi"],
};

const EAEU_COUNTRIES = new Set(["AM", "BY", "KZ", "KG", "RU"]);
const EU_EEA_COUNTRIES = new Set(["AT", "BE", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "IE", "IT", "NL", "NO", "PL", "PT", "SE"]);

const ASSET_TYPES = {
  property: { icon: "building", en: "Property", ru: "Недвижимость", uz: "Ko‘chmas mulk" },
  land: { icon: "map", en: "Land", ru: "Земля", uz: "Yer" },
  vehicle: { icon: "car", en: "Vehicle", ru: "Транспорт", uz: "Transport" },
  business: { icon: "briefcase", en: "Business / self-employment", ru: "Бизнес / самозанятость", uz: "Biznes / o‘zini o‘zi band qilish" },
  pet: { icon: "heart", en: "Pet", ru: "Питомец", uz: "Uy hayvoni" },
  other: { icon: "bookmark", en: "Other", ru: "Другое", uz: "Boshqa" },
};

const GOALS = {
  organize: ["Stay organized", "Навести порядок", "Tartibga solish"],
  travel: ["Plan travel", "Планировать поездки", "Sayohatni rejalash"],
  move: ["Move or live across countries", "Переехать или жить в нескольких странах", "Ko‘chish yoki bir necha mamlakatda yashash"],
};

function defaultState() {
  return {
    version: SCHEMA_VERSION,
    onboarded: false,
    locale: "en",
    profile: { goal: "move", activeCountries: [] },
    people: [{ id: "person-me", name: "Me", relationship: "self", citizenships: [], jurisdictions: [] }],
    assets: [], items: [], dismissedCatalogIds: [],
    settings: { privacySafeTitles: true, preparationMilestones: true, horizonMonths: 24 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

function migrateV1(value) {
  if (!value || value.version !== 1) return value;
  const person = {
    id: "person-me", name: "Me", relationship: "self",
    citizenships: value.profile?.citizenship ? [value.profile.citizenship] : [],
    jurisdictions: value.profile?.residence ? [{ country: value.profile.residence, type: "residence" }] : [],
  };
  const defaultCountry = value.profile?.destination || value.profile?.residence || "";
  const assets = (value.profile?.possessions || []).map((type, index) => ({ id: `migrated-${type}-${index}`, type, label: assetTypeLabel(type, "en"), country: defaultCountry, ownerId: person.id }));
  return {
    ...defaultState(), version: 2, onboarded: Boolean(value.onboarded),
    profile: { goal: value.profile?.goal || "organize", activeCountries: [...new Set([person.citizenships[0], defaultCountry].filter(Boolean))] },
    people: [person], assets,
    items: (value.items || []).map((item) => {
      const offsets = item.reminderOffsets || ({ early: [180, 120, 90, 30], standard: [60, 30, 7], compact: [30, 7, 1], monthly: [7, 1, 0] }[item.reminderPlan] || [60, 30, 7]);
      return { ...item, country: item.jurisdiction || defaultCountry, subjectId: person.id, assetId: null, reminderInput: formatReminderSequence(offsets), reminderOffsets: offsets };
    }), settings: value.settings || defaultState().settings,
  };
}

function migrateState(value) {
  const migrated = migrateV1(value);
  if (!migrated || migrated.version === SCHEMA_VERSION) return migrated;
  if (![2, 3].includes(migrated.version)) return migrated;
  return {
    ...migrated,
    version: SCHEMA_VERSION,
    people: (migrated.people || []).map((person) => ({
      ...person,
      citizenships: [...new Set(person.citizenships || [])],
      residenceCountry: person.residenceCountry || (person.jurisdictions || []).find((relation) => relation.type === "residence")?.country || "",
      jurisdictions: (person.jurisdictions || []).map((relation) => {
        const citizenships = person.citizenships || []; const domestic = citizenships.includes(relation.country);
        const oldBasis = relation.basis || "unspecified";
        const purpose = relation.purpose || ({ employment: "work", study: "study", family: "family", tourist: "visit", business: "business", refugee: "protection" }[oldBasis] || "unknown");
        const countryRoute = relation.country === "RU" && ["work_patent", "work_permit", "rvp", "rvpo", "vnzh"].includes(oldBasis) ? oldBasis : (domestic ? "citizen" : "not_sure");
        const issued = Boolean(relation.statusLabel || (relation.validUntil && !["unspecified", "employment", "study", "family", "tourist", "business"].includes(oldBasis)));
        return { id: relation.id || createId("relation"), country: relation.country, type: relation.type === "relevant" || relation.type === "other" ? "destination" : (relation.type || "residence"), contextType: relation.type === "residence" ? "lives_now" : "planned_move", purpose, route: relation.route || countryRoute, basis: relation.route || countryRoute, statusDocument: issued ? { label: relation.statusLabel || "", printedExpiry: relation.validUntil || "", status: "active" } : null, note: relation.note || "" };
      }),
    })),
    assets: (migrated.assets || []).map((asset) => ({ ...asset, details: asset.details || "" })),
  };
}

let state = defaultState();
let setupStep = 1;
let setupDraft = {
  locale: "en", goal: "move", citizenships: [], residenceCountry: "", residencePurpose: "unknown", residenceRoute: "not_sure",
  plans: [],
  assets: [],
};
let activeView = "today";
let dbMode = "indexeddb";
let planFilters = { view: "checklist", status: "all", country: "all", personId: "all", assetId: "all", open: false };
let countryPickerTarget = null;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME); };
    request.onsuccess = () => resolve(request.result);
  });
}

async function loadState() {
  try {
    const db = await openDatabase();
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(STATE_KEY);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    db.close();
    return value ? validateBackup(migrateState(value)) : defaultState();
  } catch {
    dbMode = "localstorage";
    try { const value = localStorage.getItem("nextdue-state"); return value ? validateBackup(migrateState(JSON.parse(value))) : defaultState(); } catch { return defaultState(); }
  }
}

async function persistState() {
  state.updatedAt = new Date().toISOString();
  try {
    if (dbMode === "localstorage") throw new Error("fallback");
    const db = await openDatabase();
    await new Promise((resolve, reject) => { const tx = db.transaction(STORE_NAME, "readwrite"); tx.objectStore(STORE_NAME).put(state, STATE_KEY); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    db.close();
  } catch { dbMode = "localstorage"; localStorage.setItem("nextdue-state", JSON.stringify(state)); }
}

function icon(name, size = 20) { return `<svg class="icon" width="${size}" height="${size}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`; }
function escapeHTML(value) { return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[char]); }
function tx(en, ru, uz) { return state.locale === "ru" ? ru : state.locale === "uz-Latn" ? (uz || en) : en; }
function assetTypeLabel(type, locale = state.locale) { const meta = ASSET_TYPES[type] || ASSET_TYPES.other; return locale === "ru" ? meta.ru : locale === "uz-Latn" ? meta.uz : meta.en; }
function localizedTuple(tuple, locale = state.locale) { return locale === "ru" ? tuple[1] : locale === "uz-Latn" ? tuple[2] : tuple[0]; }
function purposeLabel(value, locale = state.locale) { return localizedTuple(PURPOSES[value] || PURPOSES.unknown, locale); }
function routeLabel(value, locale = state.locale) { return localizedTuple(ROUTES[value] || ROUTES.not_sure, locale); }
function purposeOptions(selected, includeUnknown = true) { return Object.entries(PURPOSES).filter(([value]) => includeUnknown || value !== "unknown").map(([value, labels]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${escapeHTML(localizedTuple(labels))}</option>`).join(""); }
function routeChoices(country, purpose, citizenships = []) {
  if (!country || !purpose || purpose === "unknown") return ["not_sure"];
  if (country === "RU") {
    if (citizenships.includes("RU")) return ["citizen"];
    if (purpose === "work") return [...(citizenships.some((code) => EAEU_COUNTRIES.has(code)) ? ["eaeu_employment"] : ["work_patent", "work_permit"]), "rvp", "vnzh", "not_sure"];
    if (purpose === "study") return ["ru_student", "rvpo", "rvp", "vnzh", "not_sure"];
    if (purpose === "family") return ["ru_family", "rvp", "vnzh", "not_sure"];
    if (purpose === "visit") return ["visa_free", "visa", "not_sure"];
    if (purpose === "business") return ["ru_business", "rvp", "vnzh", "not_sure"];
    if (purpose === "long_term") return ["rvp", "vnzh", "not_sure"];
    return ["not_sure"];
  }
  if (EU_EEA_COUNTRIES.has(country)) {
    const freeMovement = citizenships.some((code) => EU_EEA_COUNTRIES.has(code));
    if (purpose === "work") return [...(freeMovement ? ["eu_free_movement"] : ["eu_work", "eu_blue_card"]), "not_sure"];
    if (purpose === "study") return [...(freeMovement ? ["eu_free_movement"] : ["eu_study"]), "not_sure"];
    if (purpose === "family") return ["eu_family", "not_sure"];
    if (purpose === "visit") return ["eu_visit", "not_sure"];
    if (purpose === "long_term") return ["eu_long_term", "not_sure"];
    if (purpose === "business") return ["eu_work", "eu_long_term", "not_sure"];
    return ["not_sure"];
  }
  const generic = { work: "generic_work", study: "generic_study", family: "generic_family", visit: "generic_visit", business: "generic_work", long_term: "generic_long_term" }[purpose];
  return [generic || "not_sure", "not_sure"].filter((value, index, list) => list.indexOf(value) === index);
}
function routeOptions(country, purpose, citizenships, selected) { return routeChoices(country, purpose, citizenships).map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${escapeHTML(routeLabel(value))}</option>`).join(""); }
function countryName(code, locale = state.locale) {
  if (!code) return tx("Not set", "Не указано", "Ko‘rsatilmagan");
  if (code === "OTHER") return locale === "ru" ? "Другая" : locale === "uz-Latn" ? "Boshqa" : "Other";
  if (COUNTRY_META[code]) return catalogCountryName(code, locale);
  if (locale === "uz-Latn" && UZ_COUNTRY_NAMES[code]) return UZ_COUNTRY_NAMES[code];
  try { return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code; } catch { return COUNTRIES.find(([value]) => value === code)?.[1] || code; }
}
function flagForCountry(code) { if (!code || code === "OTHER") return "🌐"; return code.replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt())); }
function countryOptions(selected, includeBlank = true) { return COUNTRIES.filter(([code]) => includeBlank || code).map(([code, fallback]) => `<option value="${code}" ${selected === code ? "selected" : ""}>${code ? `${flagForCountry(code)} ${escapeHTML(countryName(code))}` : escapeHTML(fallback)}</option>`).join(""); }
function countryPickerButton(value, target, { label, exclude = [] } = {}) {
  const copy = value ? `${flagForCountry(value)} ${countryName(value)}` : (label || tx("Choose a country", "Выберите страну", "Mamlakatni tanlang"));
  return `<button type="button" class="country-picker-button ${value ? "selected" : ""}" data-action="open-country-picker" data-country-target="${escapeHTML(target)}" data-country-value="${escapeHTML(value || "")}" data-country-exclude="${escapeHTML(exclude.filter(Boolean).join(","))}"><span>${escapeHTML(copy)}</span>${icon("chevron-right", 16)}</button>`;
}
function updateCountryPickerButton(button, value) {
  if (!button) return; button.dataset.countryValue = value || ""; button.classList.toggle("selected", Boolean(value));
  const label = button.querySelector("span"); if (label) label.textContent = value ? `${flagForCountry(value)} ${countryName(value)}` : tx("Choose a country", "Выберите страну", "Mamlakatni tanlang");
}
function formatDate(value, short = false) {
  const date = parseISODate(value); if (!date) return tx("Date not set", "Дата не указана", "Sana ko‘rsatilmagan");
  if (state.locale === "uz-Latn") { const months = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"]; const label = `${date.getUTCDate()}-${months[date.getUTCMonth()]}`; return short ? label : `${date.getUTCFullYear()}-yil ${label}`; }
  return new Intl.DateTimeFormat(state.locale, { day: "numeric", month: "short", year: short ? undefined : "numeric", timeZone: "UTC" }).format(date);
}
function personName(id) { const person = state.people.find((entry) => entry.id === id); if (!person) return tx("Household", "Семья", "Oila"); return person.relationship === "self" && person.id === "person-me" ? tx("Me", "Я", "Men") : person.name; }
function displayAssetLabel(asset) { if (!asset) return ""; const meta = ASSET_TYPES[asset.type] || ASSET_TYPES.other; return [meta.en, meta.ru, meta.uz].includes(asset.label) ? assetTypeLabel(asset.type) : asset.label; }
function assetName(id) { return displayAssetLabel(state.assets.find((asset) => asset.id === id)); }
function itemTitle(item) { const entry = item.catalogId ? CATALOG.find((catalogItem) => catalogItem.id === item.catalogId) : null; return entry ? localized(entry.title, state.locale) : item.title; }
function announce(message) { const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("show"); window.setTimeout(() => toast.classList.remove("show"), 2800); }
function setLanguage(locale) { state.locale = locale; document.documentElement.lang = locale === "uz-Latn" ? "uz" : locale; }
function syncActiveCountries() {
  state.profile.activeCountries = [...new Set([
    ...state.people.flatMap((person) => [...(person.citizenships || []), ...(person.jurisdictions || []).map((relation) => relation.country)]),
    ...state.assets.map((asset) => asset.country), ...state.items.map((item) => item.country),
  ].filter(Boolean))];
}

function setDocumentTitle() {
  const titles = { today: t(state.locale, "today"), plan: t(state.locale, "plan"), registry: t(state.locale, "registry"), catalog: t(state.locale, "catalog"), settings: t(state.locale, "settings") };
  document.title = state.onboarded ? `${titles[activeView]} · NextDue` : "NextDue · Life admin across countries";
}

function render() {
  setLanguage(state.locale || "en"); setDocumentTitle();
  const setup = document.querySelector("#setup-view"); const app = document.querySelector("#app-shell");
  if (!state.onboarded) { setup.hidden = false; app.hidden = true; renderSetup(); return; }
  setup.hidden = true; app.hidden = false; updateNavigationLabels();
  document.querySelectorAll("[data-view]").forEach((button) => { const selected = button.dataset.view === activeView; button.classList.toggle("active", selected); if (selected) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current"); });
  const renderer = { today: renderToday, plan: renderPlan, registry: renderRegistry, catalog: renderCatalog, settings: renderSettings }[activeView] || renderToday;
  document.querySelector("#view-root").innerHTML = renderer();
}

function updateNavigationLabels() {
  for (const view of ["today", "plan", "registry", "catalog", "settings"]) document.querySelectorAll(`[data-view="${view}"] .nav-label`).forEach((el) => { el.textContent = t(state.locale, view); });
  const local = document.querySelector("#local-badge-copy"); if (local) local.innerHTML = `<strong>${t(state.locale, "privateByDefault")}</strong><small>${t(state.locale, "savedHere")}</small>`;
  updateStaticLabels();
}

function replaceOptions(select, options) {
  if (!select) return;
  const selected = select.value;
  select.innerHTML = options.map(([value, label]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${escapeHTML(label)}</option>`).join("");
}

function updateStaticLabels() {
  const setText = (selector, value) => { const element = document.querySelector(selector); if (element) element.textContent = value; };
  const setPlaceholder = (selector, value) => { const element = document.querySelector(selector); if (element) element.placeholder = value; };
  const setFormLabel = (formId, name, value) => { const input = document.querySelector(`${formId} [name="${name}"]`); const label = input?.closest("label")?.querySelector(":scope > span"); if (label) label.textContent = value; };

  const mobileAdd = document.querySelector(".mobile-add");
  if (mobileAdd) mobileAdd.setAttribute("aria-label", t(state.locale, "addDeadline"));
  document.querySelectorAll('[data-action="close-dialog"][aria-label]').forEach((button) => button.setAttribute("aria-label", tx("Close", "Закрыть", "Yopish")));

  setText("#item-dialog .eyebrow", tx("Your plan", "Ваш план", "Rejangiz"));
  setFormLabel("#item-form", "title", tx("Obligation or document", "Обязанность или документ", "Majburiyat yoki hujjat"));
  setFormLabel("#item-form", "category", tx("Category", "Категория", "Toifa"));
  setFormLabel("#item-form", "kind", tx("Date type", "Тип даты", "Sana turi"));
  setFormLabel("#item-form", "date", tx("Confirmed date", "Подтверждённая дата", "Tasdiqlangan sana"));
  setFormLabel("#item-form", "frequency", tx("Repeats", "Повторяется", "Takrorlanadi"));
  setFormLabel("#item-form", "country", tx("Country / jurisdiction", "Страна / юрисдикция", "Mamlakat / yurisdiksiya"));
  setFormLabel("#item-form", "subjectId", tx("Owner / person", "Владелец / человек", "Egasi / shaxs"));
  setFormLabel("#item-form", "assetId", t(state.locale, "linkedAsset"));
  setFormLabel("#item-form", "reminderInput", t(state.locale, "reminderSequence"));
  setFormLabel("#item-form", "notes", tx("Private note (optional)", "Личная заметка (необязательно)", "Shaxsiy izoh (ixtiyoriy)"));
  setText('#item-form [name="date"] + small', tx("Leave blank until you verify it.", "Оставьте пустым до проверки.", "Tekshirmaguningizcha bo‘sh qoldiring."));
  setText('#item-form [name="reminderInput"] + small', t(state.locale, "reminderHelp"));
  setPlaceholder('#item-form [name="title"]', tx("e.g. Property tax notice", "например, уведомление по налогу на имущество", "masalan, mol-mulk solig‘i xabarnomasi"));
  setPlaceholder('#item-form [name="notes"]', tx("What to prepare or where to check", "Что подготовить и где проверить", "Nimani tayyorlash yoki qayerda tekshirish"));
  replaceOptions(document.querySelector('#item-form [name="category"]'), [
    ["identity", tx("Identity & travel", "Документы и поездки", "Shaxsni tasdiqlash va safar")],
    ["residence", tx("Residence", "Проживание", "Yashash")], ["tax", tx("Tax & money", "Налоги и деньги", "Soliq va pul")],
    ["transport", tx("Transport", "Транспорт", "Transport")], ["property", tx("Property", "Имущество", "Mulk")],
    ["family", tx("Family", "Семья", "Oila")], ["health", tx("Health", "Здоровье", "Salomatlik")], ["custom", tx("Custom", "Другое", "Boshqa")],
  ]);
  replaceOptions(document.querySelector('#item-form [name="kind"]'), [
    ["expiry", tx("Expires on", "Истекает", "Amal qilish muddati")], ["due", tx("Due once", "Разовый срок", "Bir martalik muddat")], ["recurring", tx("Repeats", "Повторяется", "Takrorlanadi")],
  ]);
  replaceOptions(document.querySelector('#item-form [name="frequency"]'), [["monthly", tx("Monthly", "Ежемесячно", "Har oy")], ["yearly", tx("Yearly", "Ежегодно", "Har yili")]]);
  setText("#delete-item", tx("Remove", "Удалить", "Olib tashlash"));
  setText('#item-form [data-action="close-dialog"].secondary-button', t(state.locale, "cancel"));
  setText('#item-form [data-action="save-item"]', tx("Save obligation", "Сохранить обязанность", "Majburiyatni saqlash"));

  setText("#asset-dialog .eyebrow", t(state.locale, "registry"));
  setFormLabel("#asset-form", "type", tx("Type", "Тип", "Turi"));
  setFormLabel("#asset-form", "label", tx("Exact possession", "Конкретный объект", "Aniq mulk"));
  setFormLabel("#asset-form", "details", tx("Details", "Детали", "Tafsilotlar"));
  setFormLabel("#asset-form", "country", t(state.locale, "country"));
  setFormLabel("#asset-form", "ownerId", t(state.locale, "owner"));
  setPlaceholder('#asset-form [name="label"]', tx("e.g. Toyota Camry or Tashkent apartment", "например, Toyota Camry или квартира в Ташкенте", "masalan, Toyota Camry yoki Toshkentdagi kvartira"));
  setPlaceholder('#asset-form [name="details"]', tx("e.g. 2022 hybrid, plate ending 42", "например, гибрид 2022 года, номер оканчивается на 42", "masalan, 2022 gibrid, raqam oxiri 42"));
  replaceOptions(document.querySelector('#asset-form [name="type"]'), Object.keys(ASSET_TYPES).map((value) => [value, assetTypeLabel(value)]));
  setText('#asset-form [data-action="close-dialog"].secondary-button', t(state.locale, "cancel"));
  setText('#asset-form [data-action="save-asset"]', tx("Save possession", "Сохранить имущество", "Mulkni saqlash"));

  setText("#person-dialog .eyebrow", tx("Household", "Семья", "Oila"));
  setFormLabel("#person-form", "name", tx("Name or private label", "Имя или приватная метка", "Ism yoki maxfiy belgi"));
  setPlaceholder('#person-form [name="name"]', tx("e.g. Child 1", "например, Ребёнок 1", "masalan, Bola 1"));
  setText('#person-form [data-action="close-dialog"].secondary-button', t(state.locale, "cancel"));
  setText('#person-form [data-action="save-person"]', tx("Save person", "Сохранить человека", "Shaxsni saqlash"));

  setText("#country-dialog .eyebrow", tx("Person & country", "Человек и страна", "Shaxs va mamlakat"));
  setFormLabel("#country-form", "recordKind", tx("Add as", "Что добавить", "Nima qo‘shish"));
  setFormLabel("#country-form", "purpose", tx("Purpose", "Цель", "Maqsad"));
  setFormLabel("#country-form", "route", tx("Route or status", "Основание или статус", "Asos yoki maqom"));
  setFormLabel("#country-form", "statusLabel", tx("Document or status name", "Название документа или статуса", "Hujjat yoki maqom nomi"));
  setFormLabel("#country-form", "printedExpiry", tx("When does this permit or status expire?", "Когда истекает это разрешение или статус?", "Bu ruxsat yoki maqom qachon tugaydi?"));
  setFormLabel("#country-form", "note", tx("Note", "Примечание", "Izoh"));
  replaceOptions(document.querySelector('#country-form [name="recordKind"]'), [["relationship", tx("Work, study, visit, or move", "Работа, учёба, поездка или переезд", "Ish, o‘qish, tashrif yoki ko‘chish")], ["citizenship", tx("Citizenship", "Гражданство", "Fuqarolik")]]);
  setText('#country-form [data-action="close-dialog"].secondary-button', t(state.locale, "cancel"));
  setText('#country-form [data-action="save-country-relation"]', t(state.locale, "save"));
  setText("#delete-country-relation", tx("Remove", "Удалить", "Olib tashlash"));
}

function renderSetup() {
  state.locale = setupDraft.locale;
  document.querySelector("#setup-root").innerHTML = `
    <header class="setup-header"><a class="brand" href="#" data-action="setup-home"><span class="brand-mark">${icon("layers", 18)}</span><span>NextDue</span></a><span class="catalog-version">${t(state.locale, "sourceBacked")} · ${CATALOG_VERSION}</span></header>
    <main class="setup-main setup-v2"><section class="setup-intro"><span class="eyebrow">${tx("Life admin across borders", "Документы и обязанности между странами", "Mamlakatlararo hujjatlar va majburiyatlar")}</span><h1>${tx("Never miss an important deadline.", "Не пропускайте важные сроки.", "Muhim muddatni o‘tkazib yubormang.")}</h1><p>${tx("Tell us your citizenship, where you live, and what you own. NextDue builds a clear country-specific checklist for documents, taxes, and renewals.", "Укажите гражданство, где вы живёте и чем владеете. NextDue соберёт понятный чек-лист документов, налогов и продлений по каждой стране.", "Fuqarolik, yashash joyi va mulkingizni kiriting. NextDue hujjatlar, soliqlar va yangilanishlar uchun aniq mamlakat ro‘yxatini tuzadi.")}</p></section>
    <section class="setup-card"><div class="setup-progress-row"><span>${tx("Build your registry", "Создайте реестр", "Reyestr yarating")}</span><span>${setupStep}/4</span></div><div class="progress-track"><span style="width:${setupStep * 25}%"></span></div>${renderSetupStep()}</section></main>`;
}

function renderSetupStep() {
  if (setupStep === 1) return `<div class="setup-copy"><p class="step-kicker">${tx("Language & focus", "Язык и цель", "Til va maqsad")}</p><h2>${tx("How should NextDue work for you?", "Как NextDue должен работать для вас?", "NextDue siz uchun qanday ishlashi kerak?")}</h2></div><label><span>${t(state.locale, "interfaceLanguage")}</span><select id="setup-locale">${SUPPORTED_LOCALES.map((locale) => `<option value="${locale.code}" ${setupDraft.locale === locale.code ? "selected" : ""}>${locale.label}</option>`).join("")}</select></label><div class="choice-stack compact-choices">${Object.entries(GOALS).map(([value, labels]) => `<button class="choice-card ${setupDraft.goal === value ? "selected" : ""}" data-action="choose-goal" data-value="${value}"><span class="choice-icon">${icon(value === "move" ? "globe" : value === "travel" ? "plane" : "check-circle")}</span><span><strong>${state.locale === "ru" ? labels[1] : state.locale === "uz-Latn" ? labels[2] : labels[0]}</strong></span><span class="radio-dot"></span></button>`).join("")}</div>${setupActions(false)}`;
  if (setupStep === 2) {
    const citizenshipSet = new Set(setupDraft.citizenships);
    const isDomestic = setupDraft.residenceCountry && citizenshipSet.has(setupDraft.residenceCountry);
    const residenceRouteChoices = routeChoices(setupDraft.residenceCountry, setupDraft.residencePurpose, setupDraft.citizenships);
    if (!residenceRouteChoices.includes(setupDraft.residenceRoute)) setupDraft.residenceRoute = residenceRouteChoices[0];
    return `<div class="setup-copy"><p class="step-kicker">${tx("Citizenship & residence", "Гражданство и проживание", "Fuqarolik va yashash")}</p><h2>${tx("First, tell us where you belong and live.", "Сначала укажите гражданство и где вы живёте.", "Avval fuqaroligingiz va yashash joyingizni kiriting.")}</h2><p>${tx("We ask about permits only when you live in a country where you are not a citizen.", "О разрешениях спросим только при проживании не в стране гражданства.", "Ruxsatlar faqat fuqarolik mamlakatingizdan tashqarida yashasangiz so‘raladi.")}</p></div>
      <div class="setup-subsection"><div class="mini-section-heading"><strong>${tx("Citizenship", "Гражданство", "Fuqarolik")}</strong><button class="text-button" data-action="setup-add-citizenship">${icon("plus", 15)} ${tx("Add another", "Добавить ещё", "Yana qo‘shish")}</button></div>
      <div class="country-chip-list">${setupDraft.citizenships.map((country, index) => `<div class="country-chip-edit">${countryPickerButton(country, `setup-citizenship-${index}`, { exclude: setupDraft.citizenships.filter((_, itemIndex) => itemIndex !== index) })}<button class="icon-button" data-action="setup-remove-citizenship" data-index="${index}" aria-label="${tx("Remove citizenship", "Удалить гражданство", "Fuqarolikni olib tashlash")}">${icon("close", 16)}</button></div>`).join("") || `<p class="form-note">${tx("Add at least one citizenship.", "Добавьте хотя бы одно гражданство.", "Kamida bitta fuqarolik qo‘shing.")}</p>`}</div></div>
      <div class="setup-subsection residence-section"><div class="mini-section-heading"><strong>${tx("Where do you live now?", "Где вы живёте сейчас?", "Hozir qayerda yashaysiz?")}</strong></div>
      ${setupDraft.citizenships.length ? `<div class="same-country-options">${setupDraft.citizenships.map((country) => `<button type="button" class="same-country-card ${setupDraft.residenceCountry === country ? "selected" : ""}" data-action="setup-same-residence" data-country="${country}"><span>${flagForCountry(country)}</span><span><strong>${countryName(country)}</strong><small>${tx("Same as my citizenship", "Страна моего гражданства", "Fuqarolik mamlakatim")}</small></span>${icon("check-circle", 18)}</button>`).join("")}</div>` : ""}
      <label><span>${tx("Or I live in another country", "Или я живу в другой стране", "Yoki boshqa mamlakatda yashayman")}</span>${countryPickerButton(isDomestic ? "" : setupDraft.residenceCountry, "setup-residence", { label: tx("Choose another country", "Выбрать другую страну", "Boshqa mamlakatni tanlang"), exclude: setupDraft.citizenships })}</label>
      ${isDomestic ? `<div class="context-note success">${icon("check-circle", 17)}<span>${tx("No immigration route is needed for a citizen living in their own country.", "Для гражданина, живущего в своей стране, миграционное основание не требуется.", "O‘z mamlakatida yashovchi fuqaroga migratsiya asosi kerak emas.")}</span></div>` : setupDraft.residenceCountry ? `<div class="route-panel"><label><span>${tx(`What is your main reason for being in ${countryName(setupDraft.residenceCountry)}?`, `Какова основная цель проживания в стране «${countryName(setupDraft.residenceCountry)}»?`, `${countryName(setupDraft.residenceCountry)}da bo‘lishingizning asosiy sababi nima?`)}</span><select data-setup-residence-purpose>${purposeOptions(setupDraft.residencePurpose, false)}</select></label><label><span>${tx("Which route applies?", "Какое основание подходит?", "Qaysi asos mos keladi?")}</span><select data-setup-residence-route>${routeOptions(setupDraft.residenceCountry, setupDraft.residencePurpose, setupDraft.citizenships, setupDraft.residenceRoute)}</select><small>${tx("Only routes compatible with this country, citizenship, and purpose are shown.", "Показаны только варианты, совместимые со страной, гражданством и целью.", "Faqat mamlakat, fuqarolik va maqsadga mos variantlar ko‘rsatilgan.")}</small></label></div>` : ""}</div>
      <div class="setup-subsection"><div class="mini-section-heading"><div><strong>${tx("Trips and future moves", "Поездки и будущие переезды", "Safarlar va kelajakdagi ko‘chishlar")}</strong><small>${tx("Optional and separate from where you live now.", "Необязательно и отдельно от текущего места проживания.", "Ixtiyoriy va hozirgi yashash joyidan alohida.")}</small></div><button class="text-button" data-action="setup-add-plan">${icon("plus", 15)} ${tx("Add country", "Добавить страну", "Mamlakat qo‘shish")}</button></div>
      <div class="plan-draft-list">${setupDraft.plans.map((plan, index) => `<div class="plan-draft-card"><div class="plan-draft-head">${countryPickerButton(plan.country, `setup-plan-${index}`, { exclude: [...setupDraft.citizenships, setupDraft.residenceCountry, ...setupDraft.plans.filter((_, itemIndex) => itemIndex !== index).map((item) => item.country)] })}<button class="icon-button" data-action="setup-remove-plan" data-index="${index}">${icon("close", 16)}</button></div><div class="form-grid two"><label><span>${tx("Purpose", "Цель", "Maqsad")}</span><select data-setup-plan-index="${index}" data-field="purpose">${purposeOptions(plan.purpose, false)}</select></label><label><span>${tx("Likely route", "Вероятное основание", "Ehtimoliy asos")}</span><select data-setup-plan-index="${index}" data-field="route">${routeOptions(plan.country, plan.purpose, setupDraft.citizenships, plan.route)}</select></label></div></div>`).join("") || `<p class="form-note">${tx("Add only countries you actually plan to visit or move to.", "Добавляйте только страны реальной поездки или переезда.", "Faqat haqiqatan borish yoki ko‘chishni rejalagan mamlakatlarni qo‘shing.")}</p>`}</div></div>${setupActions(true)}`;
  }
  if (setupStep === 3) return `<div class="setup-copy"><p class="step-kicker">${tx("Named possessions", "Конкретное имущество", "Aniq mulklar")}</p><h2>${tx("Add every object separately.", "Добавьте каждый объект отдельно.", "Har bir obyektni alohida qo‘shing.")}</h2><p>${tx("Two cars or homes can have different countries, owners, and obligations.", "У двух машин или квартир могут быть разные страны, владельцы и обязанности.", "Ikki avtomobil yoki uy turli mamlakat, egasi va majburiyatlarga ega bo‘lishi mumkin.")}</p></div>
    <div class="dynamic-rows asset-draft-list">${setupDraft.assets.map((asset, index) => `<div class="asset-draft-card"><div class="form-grid two"><label><span>${tx("Type", "Тип", "Turi")}</span><select data-setup-asset-index="${index}" data-field="type">${Object.keys(ASSET_TYPES).map((type) => `<option value="${type}" ${asset.type === type ? "selected" : ""}>${assetTypeLabel(type)}</option>`).join("")}</select></label><label><span>${tx("Exact possession", "Конкретный объект", "Aniq mulk")}</span><input value="${escapeHTML(asset.label || "")}" data-setup-asset-index="${index}" data-field="label" placeholder="${tx("e.g. Toyota Camry", "например, Toyota Camry", "masalan, Toyota Camry")}"></label></div><label><span>${tx("Country", "Страна", "Mamlakat")}</span>${countryPickerButton(asset.country, `setup-asset-${index}`)}</label><button class="text-button danger" data-action="setup-remove-asset" data-index="${index}">${icon("trash", 15)} ${tx("Remove", "Удалить", "Olib tashlash")}</button></div>`).join("")}</div>
    <button class="secondary-button full" data-action="setup-add-asset">${icon("plus", 16)} ${tx("Add another possession", "Добавить ещё имущество", "Yana mulk qo‘shish")}</button>${setupActions(true)}`;
  const graph = graphFromDraft(); const matches = matchCatalog(graph);
  return `<div class="setup-copy"><p class="step-kicker">${t(state.locale, "sourceBacked")}</p><h2>${tx("Review your checklist", "Проверьте свой чек-лист", "Ro‘yxatingizni tekshiring")}</h2><p>${tx("Every published rule that matches your citizenship, residence route, plans, or exact possessions is shown.", "Показаны все опубликованные правила, подходящие по гражданству, основанию проживания, планам и конкретному имуществу.", "Fuqarolik, yashash asosi, rejalar va aniq mulkka mos barcha qoidalar ko‘rsatilgan.")}</p></div><div class="pack-summary">${[...new Set(matches.map((match) => match.entry.country))].map((country) => `<span>${flagForCountry(country)} ${countryName(country)} · ${matches.filter((m) => m.entry.country === country).length}</span>`).join("")}</div>${matches.length ? `<div class="suggestion-list catalog-suggestions">${matches.map((match) => catalogSuggestion(match)).join("")}</div>` : `<div class="mini-empty"><p>${tx("No reviewed rules match yet. You can still add your own obligations after setup.", "Подходящих проверенных правил пока нет. После настройки можно добавить свои обязанности.", "Hozircha mos tekshirilgan qoidalar yo‘q. Sozlashdan keyin o‘z majburiyatlaringizni qo‘shishingiz mumkin.")}</p></div>`}${setupActions(true, true)}`;
}

function setupActions(back, finish = false) { return `<div class="setup-actions">${back ? `<button class="secondary-button" data-action="setup-back">${tx("Back", "Назад", "Orqaga")}</button>` : "<span></span>"}<button class="primary-button" data-action="${finish ? "finish-setup" : "setup-next"}">${finish ? tx("Create my registry", "Создать мой реестр", "Reyestrimni yaratish") : tx("Continue", "Продолжить", "Davom etish")} ${icon("arrow-right", 17)}</button></div>`; }
function catalogSuggestion(match) { const entry = match.entry; const selected = entry.checklistKind !== "import_customs_foreign_plate"; return `<label class="suggestion-row rich"><input type="checkbox" name="catalog-suggestion" value="${entry.id}|${match.subjectId || ""}|${match.assetId || ""}" ${selected ? "checked" : ""}><span class="suggestion-check">${icon("check", 15)}</span><span><strong>${escapeHTML(localized(entry.title, state.locale))}</strong><small>${flagForCountry(entry.country)} ${escapeHTML(countryName(entry.country))} · ${escapeHTML(localized(entry.audience, state.locale))}</small></span><span class="source-tag">${entry.checklistKind === "import_customs_foreign_plate" ? tx("If applicable", "Если применимо", "Agar tegishli bo‘lsa") : CATALOG_REVIEWED_AT}</span></label>`; }
function graphFromDraft() {
  const citizenships = [...new Set(setupDraft.citizenships.filter(Boolean))];
  const jurisdictions = [];
  if (setupDraft.residenceCountry) jurisdictions.push({ id: "draft-residence", country: setupDraft.residenceCountry, type: "residence", contextType: "lives_now", purpose: citizenships.includes(setupDraft.residenceCountry) ? "long_term" : setupDraft.residencePurpose, route: citizenships.includes(setupDraft.residenceCountry) ? "citizen" : setupDraft.residenceRoute, basis: citizenships.includes(setupDraft.residenceCountry) ? "citizen" : setupDraft.residenceRoute });
  for (const plan of setupDraft.plans.filter((entry) => entry.country && !citizenships.includes(entry.country))) jurisdictions.push({ id: plan.id || createId("relation"), country: plan.country, type: "destination", contextType: "planned_move", purpose: plan.purpose, route: plan.route, basis: plan.route });
  const person = { id: "person-me", name: tx("Me", "Я", "Men"), relationship: "self", citizenships, residenceCountry: setupDraft.residenceCountry, jurisdictions };
  const assets = setupDraft.assets.filter((asset) => asset.country).map((asset, index) => ({ id: asset.id || `asset-${asset.type}-${index}`, type: asset.type, label: String(asset.label || "").trim() || assetTypeLabel(asset.type), country: asset.country, ownerId: person.id, details: "" }));
  return { people: [person], assets };
}

async function finishSetup() {
  const graph = graphFromDraft(); const selected = new Set([...document.querySelectorAll('input[name="catalog-suggestion"]:checked')].map((input) => input.value));
  const matches = matchCatalog(graph).filter((match) => selected.has(`${match.entry.id}|${match.subjectId || ""}|${match.assetId || ""}`));
  state = defaultState(); state.onboarded = true; state.locale = setupDraft.locale;
  state.profile = { goal: setupDraft.goal, activeCountries: [] };
  state.people = graph.people; state.assets = graph.assets;
  state.items = matches.map((match) => makeItemFromCatalog(match, { title: localized(match.entry.title, state.locale), reason: localized(match.entry.summary, state.locale), catalogVersion: CATALOG_VERSION, person: graph.people.find((person) => person.id === match.subjectId)?.name || "" }));
  syncActiveCountries(); await persistState(); activeView = "today"; render(); announce(tx("Registry created.", "Реестр создан.", "Reyestr yaratildi."));
}

function viewHeader(eyebrow, title, copy, actions = "item") {
  const buttons = actions === "item" ? `<button class="primary-button compact" data-action="add-item">${icon("plus", 17)} ${t(state.locale, "addDeadline")}</button>` : actions === "asset" ? `<div class="header-actions"><button class="secondary-button compact" data-action="add-person">${icon("user", 16)} ${t(state.locale, "addPerson")}</button><button class="primary-button compact" data-action="add-asset">${icon("plus", 16)} ${t(state.locale, "addAsset")}</button></div>` : "";
  return `<div class="view-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${copy}</p></div>${buttons}</div>`;
}

function scheduleDescription(item) {
  if (!parseISODate(item.schedule?.date)) return tx("Add a confirmed date", "Добавьте подтверждённую дату", "Tasdiqlangan sanani kiriting");
  if (item.schedule.kind === "recurring") return `${item.schedule.frequency === "monthly" ? tx("Monthly", "Ежемесячно", "Har oy") : tx("Yearly", "Ежегодно", "Har yili")} · ${formatDate(getNextOccurrence(item), true)}`;
  return `${item.schedule.kind === "expiry" ? tx("Expires", "Истекает", "Tugaydi") : tx("Due", "Срок", "Muddat")} ${formatDate(item.schedule.date)}`;
}

function statusLabel(status) {
  const map = { overdue: ["Past due", "Просрочено", "Muddati o‘tgan"], now: ["Action needed", "Нужно действовать", "Harakat kerak"], soon: ["Plan soon", "Скоро", "Yaqinda"], covered: ["On track", "Под контролем", "Nazoratda"], missing: ["Date missing", "Нет даты", "Sana yo‘q"], completed: ["Completed", "Завершено", "Bajarildi"] };
  const labels = map[status.key] || map.missing; return state.locale === "ru" ? labels[1] : state.locale === "uz-Latn" ? labels[2] : labels[0];
}

function nextActionLabel(item) {
  if (!parseISODate(item.schedule?.date)) return tx("Add the date to schedule reminders", "Добавьте дату, чтобы запланировать напоминания", "Eslatmalar uchun sanani kiriting");
  const dueDate = getNextOccurrence(item); const days = daysBetween(new Date(), dueDate);
  const offsets = item.reminderOffsets?.length ? item.reminderOffsets : [60, 30, 7]; const firstOffset = Math.max(...offsets);
  if (days < 0) return tx(`${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} past due`, `Просрочено на ${Math.abs(days)} дн.`, `Muddat ${Math.abs(days)} kun o‘tgan`);
  if (days === 0) return tx("Due today", "Срок сегодня", "Muddat bugun");
  if (days <= firstOffset) return days === 1 ? tx("Due tomorrow · start now", "Срок завтра · начните сейчас", "Muddat ertaga · hozir boshlang") : tx(`Due in ${days} days · start now`, `Срок через ${days} дн. · начните сейчас`, `Muddat ${days} kundan keyin · hozir boshlang`);
  const untilStart = days - firstOffset;
  return untilStart === 1 ? tx("Start tomorrow", "Начните завтра", "Ertaga boshlang") : tx(`Start in ${untilStart} days`, `Начните через ${untilStart} дн.`, `${untilStart} kundan keyin boshlang`);
}

function validationMessage(message) {
  if (state.locale === "en") return message;
  if (message.includes("at least one reminder")) return tx(message, "Введите хотя бы один день напоминания.", "Kamida bitta eslatma kunini kiriting.");
  if (message.includes("without empty values")) return tx(message, "Используйте / между днями без пустых значений.", "/ ni bo‘sh qiymatlarsiz ishlating.");
  if (message.includes("whole number")) return tx(message, "Каждое значение должно быть целым числом дней.", "Har bir qiymat butun kun bo‘lishi kerak.");
  if (message.includes("between 0 and 3650")) return tx(message, "Допустимы значения от 0 до 3650 дней.", "Qiymatlar 0 dan 3650 kungacha bo‘lishi kerak.");
  if (message.includes("duplicate")) return tx(message, "Удалите повторяющиеся дни напоминаний.", "Takroriy eslatma kunlarini olib tashlang.");
  return message;
}

function itemCard(item, calendar = true) {
  const status = getItemStatus(item); const meta = CATEGORY_META[item.category] || CATEGORY_META.custom; const title = itemTitle(item);
  return `<article class="item-card scope-card"><div class="item-icon category-${item.category}">${icon(meta.icon, 20)}</div><div class="item-main"><div class="item-title-row"><h3>${escapeHTML(title)}</h3><span class="status status-${status.tone}">${statusLabel(status)}</span></div><p class="scope-line"><span>${COUNTRY_META[item.country]?.flag || "🌐"} ${escapeHTML(countryName(item.country))}</span><span>${escapeHTML(personName(item.subjectId))}</span>${item.assetId ? `<span>${escapeHTML(assetName(item.assetId))}</span>` : ""}</p><p class="item-meta">${escapeHTML(scheduleDescription(item))}</p><p class="next-action">${icon("arrow-bend", 15)} ${escapeHTML(nextActionLabel(item))}</p></div><div class="item-actions">${calendar && parseISODate(item.schedule?.date) ? `<button class="icon-button" data-action="calendar-menu" data-id="${item.id}" aria-label="${tx("Calendar options for", "Параметры календаря для", "Kalendar parametrlari")}: ${escapeHTML(title)}">${icon("calendar", 18)}</button>` : ""}<button class="icon-button" data-action="edit-item" data-id="${item.id}" aria-label="${tx("Edit", "Изменить", "Tahrirlash")}: ${escapeHTML(title)}">${icon("edit", 18)}</button></div></article>`;
}

function renderGroup(title, subtitle, items) { if (!items.length) return ""; return `<section class="item-group"><div class="section-heading"><div><h2>${title}</h2><p>${subtitle}</p></div><span class="count">${items.length}</span></div><div class="item-list">${items.map((item) => itemCard(item)).join("")}</div></section>`; }

function renderToday() {
  const groups = groupItemsForToday(state.items); const activeCountries = state.profile.activeCountries || []; const attention = groups.now.length;
  const title = attention ? tx(`${attention} item${attention === 1 ? "" : "s"} need attention`, `${attention} ${attention === 1 ? "задача требует" : "задачи требуют"} внимания`, `${attention} ta vazifa e’tibor talab qiladi`) : groups.missing.length ? tx(`${groups.missing.length} dates need confirmation`, `${groups.missing.length} дат нужно подтвердить`, `${groups.missing.length} ta sanani tasdiqlash kerak`) : tx("Everything is on track", "Всё под контролем", "Hammasi nazoratda");
  return `${viewHeader(tx("Household overview", "Обзор семьи", "Oila ko‘rinishi"), title, tx("One list across people, possessions, and countries.", "Единый список по людям, имуществу и странам.", "Odamlar, mulk va mamlakatlar uchun bitta ro‘yxat."))}<section class="country-strip">${activeCountries.map((country) => `<button data-action="open-catalog-country" data-country="${country}"><span>${flagForCountry(country)}</span><strong>${countryName(country)}</strong><small>${state.items.filter((item) => item.country === country).length} ${tx("tracked", "в плане", "rejada")}</small></button>`).join("")}<button class="add-country" data-action="change-view" data-view="registry">${icon("plus", 18)}<strong>${tx("People & countries", "Люди и страны", "Odamlar va mamlakatlar")}</strong></button></section>${renderGroup(t(state.locale, "actNow"), tx("Inside the action window.", "Уже в окне действий.", "Harakat oynasida."), groups.now)}${renderGroup(t(state.locale, "addDates"), tx("Add an exact date to schedule it.", "Добавьте точную дату.", "Aniq sanani kiriting."), groups.missing)}${renderGroup(t(state.locale, "comingUp"), tx("Plan these next.", "Следующие в плане.", "Keyingi reja."), groups.upcoming)}${renderGroup(t(state.locale, "covered"), tx("Nothing needed now.", "Сейчас ничего не требуется.", "Hozir hech narsa talab qilinmaydi."), groups.covered)}`;
}

function renderPlan() {
  const filtered = state.items.filter((item) => {
    if (planFilters.country !== "all" && item.country !== planFilters.country) return false;
    if (planFilters.personId !== "all" && item.subjectId !== planFilters.personId) return false;
    if (planFilters.assetId !== "all" && item.assetId !== planFilters.assetId) return false;
    const status = getItemStatus(item);
    if (planFilters.status === "needs" && parseISODate(item.schedule?.date)) return false;
    if (planFilters.status === "soon" && !["overdue", "now", "soon"].includes(status.key)) return false;
    if (planFilters.status === "later" && !["covered"].includes(status.key)) return false;
    if (planFilters.status === "completed" && item.status !== "completed") return false;
    return true;
  });
  const dated = sortItems(filtered.filter((item) => parseISODate(item.schedule?.date) && item.status === "active")); const missing = filtered.filter((item) => !parseISODate(item.schedule?.date) && item.status === "active"); const groups = new Map();
  dated.forEach((item) => { const key = getNextOccurrence(item).slice(0, 7); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); });
  const allActive = state.items.filter((item) => item.status === "active");
  const needsCount = allActive.filter((item) => !parseISODate(item.schedule?.date)).length;
  const dueSoonCount = allActive.filter((item) => ["overdue", "now", "soon"].includes(getItemStatus(item).key)).length;
  const filterCount = [planFilters.country, planFilters.personId, planFilters.assetId].filter((value) => value !== "all").length;
  const soon = filtered.filter((item) => parseISODate(item.schedule?.date) && ["overdue", "now", "soon"].includes(getItemStatus(item).key) && item.status === "active");
  const scheduled = filtered.filter((item) => parseISODate(item.schedule?.date) && !soon.includes(item) && item.status === "active");
  const completed = filtered.filter((item) => item.status === "completed");
  const activeChips = [planFilters.country !== "all" ? `<button data-action="clear-plan-filter" data-filter="country">${flagForCountry(planFilters.country)} ${countryName(planFilters.country)} ×</button>` : "", planFilters.personId !== "all" ? `<button data-action="clear-plan-filter" data-filter="personId">${escapeHTML(personName(planFilters.personId))} ×</button>` : "", planFilters.assetId !== "all" ? `<button data-action="clear-plan-filter" data-filter="assetId">${escapeHTML(assetName(planFilters.assetId))} ×</button>` : ""].filter(Boolean).join("");
  const checklist = `${renderGroup(tx("Needs information", "Нужна информация", "Ma’lumot kerak"), tx("Add a date or confirm a missing fact.", "Добавьте дату или подтвердите недостающий факт.", "Sana kiriting yoki yetishmayotgan ma’lumotni tasdiqlang."), missing)}${renderGroup(tx("Action soon", "Скоро действовать", "Tez orada harakat"), tx("Inside the preparation or due window.", "Уже в окне подготовки или срока.", "Tayyorgarlik yoki muddat oynasida."), soon)}${renderGroup(tx("Scheduled", "Запланировано", "Rejalashtirilgan"), tx("Confirmed dates that are under control.", "Подтверждённые даты под контролем.", "Tasdiqlangan sanalar nazoratda."), scheduled)}${renderGroup(tx("Completed", "Завершено", "Bajarildi"), "", completed)}`;
  const timeline = `<div class="timeline">${[...groups.entries()].map(([month, items]) => `<section class="timeline-month"><div class="month-label"><span>${new Intl.DateTimeFormat(state.locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(parseISODate(`${month}-01`))}</span><i></i></div><div class="timeline-items">${items.map((item) => itemCard(item)).join("")}</div></section>`).join("")}</div>`;
  return `${viewHeader(tx("Your next actions", "Ближайшие действия", "Keyingi harakatlar"), t(state.locale, "plan"), tx(`${needsCount} need dates · ${dueSoonCount} due soon`, `${needsCount} без дат · ${dueSoonCount} скоро`, `${needsCount} ta sana kerak · ${dueSoonCount} ta yaqin`), "none")}<div class="plan-toolbar"><div class="segmented"><button class="${planFilters.view === "checklist" ? "active" : ""}" data-action="set-plan-view" data-value="checklist">${tx("Checklist", "Чек-лист", "Ro‘yxat")}</button><button class="${planFilters.view === "timeline" ? "active" : ""}" data-action="set-plan-view" data-value="timeline">${tx("Timeline", "Таймлайн", "Vaqt jadvali")}</button></div><div class="plan-toolbar-actions"><button class="secondary-button compact" data-action="toggle-plan-filters">${icon("sliders", 16)} ${tx("Filters", "Фильтры", "Filtrlar")}${filterCount ? ` (${filterCount})` : ""}</button><button class="secondary-button compact export-plan" data-action="export-calendar">${icon("download", 16)} ${t(state.locale, "exportCalendar")}</button></div></div><div class="plan-status-tabs">${[["all", tx("All", "Все", "Barchasi")], ["needs", tx("Needs dates", "Без дат", "Sana kerak")], ["soon", tx("Due soon", "Скоро", "Yaqin")], ["later", tx("Later", "Позже", "Keyin")]].map(([value, label]) => `<button class="${planFilters.status === value ? "active" : ""}" data-action="set-plan-status" data-value="${value}">${label}</button>`).join("")}</div>${activeChips ? `<div class="active-filter-chips">${activeChips}<button data-action="clear-plan-filters">${tx("Clear all", "Сбросить", "Tozalash")}</button></div>` : ""}${planFilters.open ? `<aside class="plan-filter-panel"><div class="filter-panel-head"><strong>${tx("Filters", "Фильтры", "Filtrlar")}</strong><button class="icon-button" data-action="toggle-plan-filters">${icon("close", 17)}</button></div><label><span>${tx("Country", "Страна", "Mamlakat")}</span><select data-plan-filter="country"><option value="all">${tx("All countries", "Все страны", "Barcha mamlakatlar")}</option>${state.profile.activeCountries.map((country) => `<option value="${country}" ${planFilters.country === country ? "selected" : ""}>${flagForCountry(country)} ${countryName(country)}</option>`).join("")}</select></label><label><span>${tx("Person", "Человек", "Shaxs")}</span><select data-plan-filter="personId"><option value="all">${tx("Everyone", "Все", "Barchasi")}</option>${state.people.map((person) => `<option value="${person.id}" ${planFilters.personId === person.id ? "selected" : ""}>${escapeHTML(personName(person.id))}</option>`).join("")}</select></label>${state.assets.length ? `<label><span>${tx("Applies to possession", "Относится к имуществу", "Mulkka tegishli")}</span><select data-plan-filter="assetId"><option value="all">${tx("All possessions", "Все объекты", "Barcha mulklar")}</option>${state.assets.filter((asset) => planFilters.country === "all" || asset.country === planFilters.country).map((asset) => `<option value="${asset.id}" ${planFilters.assetId === asset.id ? "selected" : ""}>${escapeHTML(displayAssetLabel(asset))} · ${flagForCountry(asset.country)} ${countryName(asset.country)}</option>`).join("")}</select></label>` : ""}<button class="secondary-button full" data-action="clear-plan-filters">${tx("Clear filters", "Сбросить фильтры", "Filtrlarni tozalash")}</button></aside>` : ""}<div class="plan-content">${planFilters.view === "timeline" ? timeline : checklist}</div>${!filtered.length ? `<div class="mini-empty"><p>${tx("No obligations match these filters.", "По этим фильтрам ничего не найдено.", "Bu filtrlarga mos majburiyat yo‘q.")}</p><button class="secondary-button compact" data-action="clear-plan-filters">${tx("Clear filters", "Сбросить фильтры", "Filtrlarni tozalash")}</button></div>` : ""}`;
}

function renderRegistry() {
  return `${viewHeader(tx("People & possessions", "Люди и имущество", "Odamlar va mulk"), t(state.locale, "registry"), tx("Citizenship, current residence, plans, and each exact possession stay separate.", "Гражданство, текущее проживание, планы и каждый объект хранятся отдельно.", "Fuqarolik, hozirgi yashash, rejalar va har bir mulk alohida saqlanadi."), "asset")}<div class="registry-grid"><section class="registry-column"><div class="section-heading"><div><h2>${tx("People", "Люди", "Odamlar")}</h2><p>${tx("Citizenship and where each person lives.", "Гражданство и место проживания каждого человека.", "Har bir shaxsning fuqaroligi va yashash joyi.")}</p></div></div>${state.people.map(personCard).join("")}</section><section class="registry-column"><div class="section-heading"><div><h2>${tx("Exact possessions", "Конкретное имущество", "Aniq mulklar")}</h2><p>${tx("Each car, home, land plot, or business gets its own checklist.", "У каждой машины, жилья, участка или бизнеса — свой чек-лист.", "Har bir avtomobil, uy, yer yoki biznesning o‘z ro‘yxati bor.")}</p></div></div>${state.assets.length ? state.assets.map(assetCard).join("") : `<div class="mini-empty"><p>${tx("No possessions yet.", "Имущество пока не добавлено.", "Hali mulk yo‘q.")}</p><button class="secondary-button compact" data-action="add-asset">${t(state.locale, "addAsset")}</button></div>`}</section></div>`;
}

function personCard(person) {
  const name = personName(person.id);
  const citizenships = (person.citizenships || []).map((country) => `<button class="relation-chip citizenship-chip" data-action="edit-country" data-person-id="${person.id}" data-citizenship-country="${country}"><span>${COUNTRY_META[country]?.flag || "🌐"} ${countryName(country)}</span><small>${tx("Citizen", "Гражданство", "Fuqarolik")}</small></button>`).join("");
  const relations = (person.jurisdictions || []).map((relation) => `<button class="relation-chip" data-action="edit-country" data-person-id="${person.id}" data-relation-id="${relation.id}"><span>${flagForCountry(relation.country)} ${countryName(relation.country)}</span><small>${relation.type === "residence" ? tx("Lives here", "Живёт здесь", "Shu yerda yashaydi") : tx("Planned", "В планах", "Rejada")} · ${purposeLabel(relation.purpose)} · ${routeLabel(relation.route || relation.basis)}${relation.statusDocument?.printedExpiry || relation.validUntil ? ` · ${tx("expires", "до", "tugaydi")} ${formatDate(relation.statusDocument?.printedExpiry || relation.validUntil, true)}` : ""}</small></button>`).join("");
  return `<article class="person-registry-card"><div class="person-card-head"><span class="avatar">${escapeHTML(name.slice(0, 1).toUpperCase())}</span><div><h3>${escapeHTML(name)}</h3><small>${state.items.filter((item) => item.subjectId === person.id).length} ${tx("obligations", "обязанностей", "majburiyat")}</small></div><button class="icon-button" data-action="edit-person" data-id="${person.id}" aria-label="${tx("Edit person", "Изменить человека", "Shaxsni tahrirlash")}: ${escapeHTML(name)}">${icon("edit", 18)}</button></div><div class="relation-list">${citizenships}${relations}<button class="relation-chip add-relation" data-action="add-country" data-person-id="${person.id}">${icon("plus", 14)} <span>${tx("Add citizenship, trip, or move", "Добавить гражданство, поездку или переезд", "Fuqarolik, safar yoki ko‘chish qo‘shish")}</span></button></div></article>`;
}

function assetCard(asset) { const meta = ASSET_TYPES[asset.type] || ASSET_TYPES.other; return `<article class="registry-card"><span class="item-icon category-${asset.type === "vehicle" ? "transport" : asset.type === "business" ? "tax" : asset.type}">${icon(meta.icon, 19)}</span><div><h3>${escapeHTML(displayAssetLabel(asset))}</h3><p>${assetTypeLabel(asset.type)} · ${COUNTRY_META[asset.country]?.flag || "🌐"} ${countryName(asset.country)} · ${personName(asset.ownerId)}</p>${asset.details ? `<p>${escapeHTML(asset.details)}</p>` : ""}<small>${state.items.filter((item) => item.assetId === asset.id).length} ${tx("linked obligations", "связанных обязанностей", "bog‘langan majburiyat")}</small></div><button class="icon-button" data-action="edit-asset" data-id="${asset.id}" aria-label="${tx("Edit", "Изменить", "Tahrirlash")}: ${escapeHTML(displayAssetLabel(asset))}">${icon("edit", 18)}</button></article>`; }

function renderCatalog() {
  const trackedIds = new Set(state.items.map((item) => item.catalogId));
  const matched = matchCatalog(state); const matchedIds = new Set(matched.map((item) => item.entry.id));
  const related = [...new Set([...state.people.flatMap((person) => person.citizenships || []), ...state.people.flatMap((person) => (person.jurisdictions || []).map((relation) => relation.country)), ...state.assets.map((asset) => asset.country)])];
  const countries = [...new Set(CATALOG.map((entry) => entry.country))].sort((a, b) => { const ai = related.indexOf(a); const bi = related.indexOf(b); if (ai >= 0 || bi >= 0) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi); return countryName(a).localeCompare(countryName(b), state.locale); });
  const ordered = [...CATALOG].sort((a, b) => { const ac = countries.indexOf(a.country) - countries.indexOf(b.country); if (ac) return ac; const am = matchedIds.has(a.id) ? 0 : 1; const bm = matchedIds.has(b.id) ? 0 : 1; return am - bm || localized(a.title, state.locale).localeCompare(localized(b.title, state.locale), state.locale); });
  return `${viewHeader(t(state.locale, "sourceBacked"), t(state.locale, "catalog"), tx("All published rules are browsable. Your citizenship, residence, plans, and possessions appear first.", "Все опубликованные правила доступны для просмотра. Сначала — ваши гражданства, проживание, планы и имущество.", "Barcha e’lon qilingan qoidalarni ko‘rish mumkin. Avval sizning fuqaroligingiz, yashashingiz, rejalaringiz va mulkingiz ko‘rsatiladi."), "none")}<div class="catalog-summary"><strong>${matched.length} ${tx("match your profile", "подходят вашему профилю", "profilingizga mos")}</strong><span>${CATALOG.length} ${tx("published rules", "опубликованных правил", "e’lon qilingan qoida")} · ${t(state.locale, "lastReviewed")}: ${CATALOG_REVIEWED_AT}</span></div><div class="catalog-toolbar"><div class="catalog-tabs"><button class="active" data-country-filter="all">${tx("All", "Все", "Barchasi")} · ${CATALOG.length}</button>${countries.map((country) => `<button data-country-filter="${country}">${flagForCountry(country)} ${countryName(country)} · ${CATALOG.filter((entry) => entry.country === country).length}</button>`).join("")}</div></div><div class="catalog-grid">${ordered.map((entry) => catalogCard(entry, trackedIds.has(entry.id), matchedIds.has(entry.id))).join("")}</div><aside class="principle-card">${icon("info", 20)}<div><strong>${t(state.locale, "catalogDisclaimer")}</strong><p>${tx("A rule can be browsed without applying to you. NextDue adds it only when your saved facts make it applicable, or when it is a manual document you choose to track.", "Правило можно просмотреть, даже если оно к вам не относится. NextDue добавит его только при совпадении сохранённых фактов или если это документ для ручного отслеживания.", "Qoida sizga tegishli bo‘lmasa ham ko‘rish mumkin. NextDue uni faqat saqlangan ma’lumotlar mos kelsa yoki qo‘lda kuzatiladigan hujjat bo‘lsa qo‘shadi.")}</p></div></aside>`;
}

function catalogCard(entry, tracked, matched = false) {
  const confidenceLabel = entry.confidence === "high" ? tx("High confidence", "Высокая уверенность", "Yuqori ishonch") : entry.confidence === "medium-high" ? tx("Medium-high confidence", "Уверенность выше средней", "O‘rtachadan yuqori ishonch") : entry.confidence;
  const riskLabel = entry.risk === "high_applicability" ? tx("Check applicability", "Проверьте применимость", "Mosligini tekshiring") : confidenceLabel;
  const eligible = matched || entry.match?.kind === "manual";
  const disabled = tracked || !eligible;
  const buttonLabel = tracked ? tx("Tracked", "В плане", "Rejada") : eligible ? tx("Add to plan", "Добавить в план", "Rejaga qo‘shish") : tx("Does not match profile", "Не подходит профилю", "Profilga mos emas");
  return `<article class="catalog-card ${matched ? "matched" : ""}" data-catalog-country="${entry.country}"><div class="catalog-card-top"><span class="country-badge">${flagForCountry(entry.country)} ${countryName(entry.country)}</span>${matched ? `<span class="match-badge">${icon("check", 13)} ${tx("For you", "Для вас", "Siz uchun")}</span>` : `<span class="confidence ${entry.risk === "high_applicability" ? "risk" : ""}">${riskLabel}</span>`}</div><h2>${escapeHTML(localized(entry.title, state.locale))}</h2><p>${escapeHTML(localized(entry.summary, state.locale))}</p><dl><div><dt>${tx("For", "Для кого", "Kim uchun")}</dt><dd>${escapeHTML(localized(entry.audience, state.locale))}</dd></div><div><dt>${t(state.locale, "lastReviewed")}</dt><dd>${CATALOG_REVIEWED_AT}</dd></div></dl><div class="catalog-card-actions"><a href="${entry.source.url}" target="_blank" rel="noopener">${icon("external", 15)} ${t(state.locale, "officialSource")}</a><button class="${tracked || !eligible ? "secondary-button" : "primary-button"} compact" data-action="add-catalog" data-id="${entry.id}" ${disabled ? "disabled" : ""}>${buttonLabel}</button></div></article>`;
}

function renderSettings() {
  return `${viewHeader(tx("Control centre", "Центр управления", "Boshqaruv markazi"), t(state.locale, "settings"), tx("Language, calendar behavior, portability, and the external SaaS path.", "Язык, календарь, переносимость и внешняя SaaS-версия.", "Til, kalendar va tashqi SaaS yo‘li."), "none")}<div class="settings-grid"><section class="settings-card"><div class="settings-title"><span class="settings-icon">${icon("globe", 20)}</span><div><h2>${t(state.locale, "interfaceLanguage")}</h2><p>English · Русский · O‘zbekcha</p></div></div><select id="language-select">${SUPPORTED_LOCALES.map((locale) => `<option value="${locale.code}" ${state.locale === locale.code ? "selected" : ""}>${locale.label}</option>`).join("")}</select></section><section class="settings-card"><div class="settings-title"><span class="settings-icon">${icon("calendar", 20)}</span><div><h2>${t(state.locale, "exportCalendar")}</h2><p>${getCalendarEventCount(state.items, state.settings)} ${tx("events over 24 months", "событий на 24 месяца", "24 oylik tadbirlar")}</p></div></div><label class="toggle-row"><span><strong>${tx("Privacy-safe titles", "Безопасные названия", "Maxfiy nomlar")}</strong><small>${tx("Generic event names by default.", "Общие названия по умолчанию.", "Standart umumiy nomlar.")}</small></span><input type="checkbox" data-setting="privacySafeTitles" ${state.settings.privacySafeTitles ? "checked" : ""}><i></i></label><button class="primary-button full" data-action="export-calendar">${icon("download", 16)} ${t(state.locale, "exportCalendar")}</button></section><section class="settings-card saas-card"><div class="settings-title"><span class="settings-icon">${icon("cloud", 20)}</span><div><h2>${t(state.locale, "externalSaas")}</h2><p>Next.js · Auth.js · PostgreSQL · Docker</p></div></div><p>${tx("Prepared for Google sign-in and generic OIDC on your own domain. Sign-in and calendar consent remain separate.", "Подготовлено для входа через Google и generic OIDC на вашем домене. Вход и доступ к календарю разделены.", "Google va OIDC orqali o‘z domeningizda kirish uchun tayyor.")}</p><button class="secondary-button full" data-action="saas-info">${icon("external", 16)} ${tx("View deployment plan", "План развёртывания", "Joylashtirish rejasi")}</button></section><section class="settings-card"><div class="settings-title"><span class="settings-icon">${icon("database", 20)}</span><div><h2>${tx("Your data", "Ваши данные", "Ma’lumotlaringiz")}</h2><p>${t(state.locale, "savedHere")}</p></div></div><div class="data-actions"><button class="secondary-button full" data-action="backup-data">${icon("download", 16)} JSON</button><button class="secondary-button full" data-action="restore-data">${icon("upload", 16)} ${tx("Restore", "Восстановить", "Tiklash")}</button></div></section></div>`;
}

function openItemDialog(item = null) {
  const dialog = document.querySelector("#item-dialog"); const form = document.querySelector("#item-form"); form.reset();
  form.elements.id.value = item?.id || ""; form.elements.title.value = item?.title || ""; form.elements.category.value = item?.category || "identity";
  form.elements.kind.value = item?.schedule?.kind || "expiry"; form.elements.date.value = item?.schedule?.date || ""; form.elements.frequency.value = item?.schedule?.frequency || "yearly";
  form.elements.reminderInput.value = item?.reminderInput || "180/90/30/7/1/0";
  form.elements.country.innerHTML = countryOptions(item?.country || state.profile.activeCountries?.[0] || "RU", false);
  form.elements.subjectId.innerHTML = state.people.map((person) => `<option value="${person.id}" ${item?.subjectId === person.id ? "selected" : ""}>${escapeHTML(personName(person.id))}</option>`).join("");
  form.elements.assetId.innerHTML = `<option value="">${tx("No linked possession", "Без привязки к имуществу", "Mulkka bog‘lanmagan")}</option>${state.assets.map((asset) => `<option value="${asset.id}" ${item?.assetId === asset.id ? "selected" : ""}>${escapeHTML(displayAssetLabel(asset))} · ${countryName(asset.country)}</option>`).join("")}`;
  form.elements.notes.value = item?.notes || "";
  dialog.querySelector("#item-dialog-title").textContent = item ? tx("Edit obligation", "Изменить обязанность", "Majburiyatni o‘zgartirish") : t(state.locale, "addDeadline");
  dialog.querySelector("#delete-item").hidden = !item; updateScheduleFields(); updateReminderPreview(); dialog.showModal();
}

function updateScheduleFields() { const form = document.querySelector("#item-form"); form.querySelector("#frequency-field").hidden = form.elements.kind.value !== "recurring"; }
function updateReminderPreview() {
  const form = document.querySelector("#item-form"); const output = document.querySelector("#reminder-preview");
  try {
    const offsets = parseReminderSequence(form.elements.reminderInput.value); const date = form.elements.date.value;
    output.className = "reminder-preview valid";
    output.textContent = date ? offsets.map((offset) => `${offset} → ${formatDate(toISODate(addDays(date, -offset)), true)}`).join(" · ") : offsets.map((offset) => `${offset}d`).join(" · ");
  } catch (error) { output.className = "reminder-preview invalid"; output.textContent = validationMessage(error.message); }
}

function openAssetDialog(asset = null) {
  const form = document.querySelector("#asset-form"); form.reset(); form.elements.id.value = asset?.id || ""; form.elements.type.value = asset?.type || "property"; form.elements.label.value = asset?.label || "";
  form.elements.details.value = asset?.details || "";
  form.elements.country.value = asset?.country || state.profile.activeCountries?.[0] || "";
  updateCountryPickerButton(document.querySelector("#asset-country-picker"), form.elements.country.value);
  form.elements.ownerId.innerHTML = state.people.map((person) => `<option value="${person.id}" ${asset?.ownerId === person.id ? "selected" : ""}>${escapeHTML(personName(person.id))}</option>`).join("");
  document.querySelector("#asset-dialog-title").textContent = asset ? tx("Edit possession", "Изменить имущество", "Mulkni o‘zgartirish") : t(state.locale, "addAsset"); document.querySelector("#asset-dialog").showModal();
}

function openPersonDialog(person = null) {
  const form = document.querySelector("#person-form"); const primaryRelation = person?.jurisdictions?.find((item) => item.type === "residence") || person?.jurisdictions?.[0]; form.reset(); form.elements.id.value = person?.id || ""; form.elements.name.value = person?.name || "";
  form.elements.citizenship.value = person?.citizenships?.[0] || "";
  form.elements.residence.value = person?.residenceCountry || primaryRelation?.country || person?.citizenships?.[0] || "";
  updateCountryPickerButton(document.querySelector("#person-citizenship-picker"), form.elements.citizenship.value);
  const residencePicker = document.querySelector("#person-residence-picker"); residencePicker.dataset.countryExclude = form.elements.citizenship.value && form.elements.residence.value !== form.elements.citizenship.value ? form.elements.citizenship.value : ""; updateCountryPickerButton(residencePicker, form.elements.residence.value);
  document.querySelector("#person-dialog-title").textContent = person ? tx("Edit person", "Изменить человека", "Shaxsni o‘zgartirish") : t(state.locale, "addPerson"); document.querySelector("#person-dialog").showModal();
}

function updateCountryRelationFields() {
  const form = document.querySelector("#country-form");
  const isCitizenship = form.elements.recordKind.value === "citizenship";
  document.querySelector("#country-relation-fields").hidden = isCitizenship;
  for (const input of document.querySelectorAll("#country-relation-fields input, #country-relation-fields select, #country-relation-fields textarea")) input.disabled = isCitizenship;
  updateCountryRecordRouteOptions();
}

function updateIssuedStatusFields() {
  const form = document.querySelector("#country-form");
  const fields = document.querySelector("#issued-status-fields");
  fields.hidden = !form.elements.hasDocument.checked;
  for (const input of fields.querySelectorAll("input")) input.disabled = fields.hidden;
}

function updateCountryRecordRouteOptions() {
  const form = document.querySelector("#country-form"); if (!form?.elements?.route) return;
  const person = state.people.find((entry) => entry.id === form.elements.personId.value);
  const choices = routeChoices(form.elements.country.value, form.elements.purpose.value, person?.citizenships || []);
  const selected = choices.includes(form.elements.route.value) ? form.elements.route.value : choices[0];
  form.elements.route.innerHTML = routeOptions(form.elements.country.value, form.elements.purpose.value, person?.citizenships || [], selected);
}

function openCountryDialog(personId, relationId = "", citizenshipCountry = "") {
  const person = state.people.find((entry) => entry.id === personId); if (!person) return;
  const relation = relationId ? person.jurisdictions?.find((entry) => entry.id === relationId) : null;
  const form = document.querySelector("#country-form"); form.reset();
  form.elements.personId.value = personId; form.elements.relationId.value = relation?.id || ""; form.elements.originalCountry.value = citizenshipCountry || "";
  form.elements.recordKind.value = citizenshipCountry ? "citizenship" : "relationship";
  form.elements.country.value = citizenshipCountry || relation?.country || "";
  form.elements.purpose.innerHTML = purposeOptions(relation?.purpose || "visit", false); form.elements.purpose.value = relation?.purpose || "visit";
  form.elements.route.innerHTML = routeOptions(form.elements.country.value, form.elements.purpose.value, person.citizenships || [], relation?.route || relation?.basis || "not_sure");
  const statusDocument = relation?.statusDocument; form.elements.hasDocument.checked = Boolean(statusDocument || relation?.statusLabel || relation?.validUntil);
  form.elements.statusLabel.value = statusDocument?.label || relation?.statusLabel || ""; form.elements.printedExpiry.value = statusDocument?.printedExpiry || relation?.validUntil || ""; form.elements.note.value = relation?.note || "";
  const picker = document.querySelector("#country-record-picker"); picker.dataset.countryExclude = [...(person.citizenships || []).filter((country) => country !== citizenshipCountry), ...(person.jurisdictions || []).filter((item) => item.id !== relationId).map((item) => item.country)].join(","); updateCountryPickerButton(picker, form.elements.country.value);
  const editing = Boolean(relation || citizenshipCountry); document.querySelector("#country-dialog-title").textContent = editing ? tx("Edit country details", "Изменить данные о стране", "Mamlakat ma’lumotlarini tahrirlash") : tx("Add citizenship, trip, or move", "Добавить гражданство, поездку или переезд", "Fuqarolik, safar yoki ko‘chish qo‘shish");
  document.querySelector("#delete-country-relation").hidden = !editing; updateCountryRelationFields(); updateIssuedStatusFields(); document.querySelector("#country-dialog").showModal();
}

async function saveItem() {
  const form = document.querySelector("#item-form"); const data = new FormData(form); let offsets;
  try { offsets = parseReminderSequence(data.get("reminderInput")); } catch (error) { announce(validationMessage(error.message)); return; }
  const id = data.get("id"); const existing = state.items.find((item) => item.id === id); const title = String(data.get("title") || "").trim();
  if (!title) { announce(tx("Add a name.", "Добавьте название.", "Nom kiriting.")); return; }
  const timestamp = new Date().toISOString();
  const item = { ...(existing || {}), id: existing?.id || createId("custom"), title, category: data.get("category"), country: data.get("country"), jurisdiction: data.get("country"), subjectId: data.get("subjectId"), assetId: data.get("assetId") || null, provenance: existing?.provenance || "user", confirmation: "confirmed", schedule: { kind: data.get("kind"), date: data.get("date"), frequency: data.get("frequency") || "yearly", interval: 1 }, reminderInput: data.get("reminderInput"), reminderOffsets: offsets, status: existing?.status || "active", notes: String(data.get("notes") || "").trim().slice(0, 500), createdAt: existing?.createdAt || timestamp, updatedAt: timestamp };
  state.items = existing ? state.items.map((entry) => entry.id === existing.id ? item : entry) : [...state.items, item];
  await persistState(); document.querySelector("#item-dialog").close(); render(); announce(tx("Saved.", "Сохранено.", "Saqlandi."));
}

async function saveAsset() {
  const form = document.querySelector("#asset-form"); const data = new FormData(form); const id = data.get("id"); const existing = state.assets.find((asset) => asset.id === id);
  if (!data.get("country")) { announce(tx("Choose the possession’s country.", "Выберите страну имущества.", "Mulk mamlakatini tanlang.")); return; }
  const asset = { id: existing?.id || createId("asset"), type: data.get("type"), label: String(data.get("label") || "").trim() || assetTypeLabel(data.get("type")), details: String(data.get("details") || "").trim(), country: data.get("country"), ownerId: data.get("ownerId") };
  state.assets = existing ? state.assets.map((entry) => entry.id === existing.id ? asset : entry) : [...state.assets, asset]; syncActiveCountries();
  if (!existing) {
    const existingKeys = new Set(state.items.map((item) => `${item.catalogId}|${item.assetId || ""}`));
    for (const match of matchCatalog(state).filter((item) => item.assetId === asset.id)) {
      if (match.entry.checklistKind === "import_customs_foreign_plate") continue;
      const key = `${match.entry.id}|${asset.id}`; if (existingKeys.has(key)) continue;
      state.items.push(makeItemFromCatalog(match, { title: localized(match.entry.title, state.locale), reason: localized(match.entry.summary, state.locale), catalogVersion: CATALOG_VERSION, person: personName(match.subjectId) }));
    }
  }
  await persistState(); document.querySelector("#asset-dialog").close(); render(); announce(tx("Possession saved.", "Имущество сохранено.", "Mulk saqlandi."));
}

async function savePerson() {
  const form = document.querySelector("#person-form"); const data = new FormData(form); const id = data.get("id"); const existing = state.people.find((person) => person.id === id);
  if (!data.get("citizenship") || !data.get("residence")) { announce(tx("Choose citizenship and where this person lives.", "Выберите гражданство и место проживания.", "Fuqarolik va yashash joyini tanlang.")); return; }
  const citizenships = [...(existing?.citizenships || [])]; const citizenship = data.get("citizenship");
  if (citizenship) { if (citizenships.length) citizenships[0] = citizenship; else citizenships.push(citizenship); }
  const jurisdictions = [...(existing?.jurisdictions || [])]; const residence = data.get("residence");
  if (residence) {
    const primaryIndex = jurisdictions.findIndex((item) => item.type === "residence"); const current = primaryIndex >= 0 ? jurisdictions[primaryIndex] : null;
    const domestic = citizenships.includes(residence); const sameCountry = current?.country === residence;
    const relation = { ...(sameCountry ? current : {}), id: current?.id || createId("relation"), country: residence, type: "residence", contextType: "lives_now", purpose: domestic ? "long_term" : (sameCountry ? current?.purpose : "unknown"), route: domestic ? "citizen" : (sameCountry ? current?.route : "not_sure"), basis: domestic ? "citizen" : (sameCountry ? current?.route : "not_sure") };
    if (primaryIndex >= 0) jurisdictions[primaryIndex] = relation; else jurisdictions.push(relation);
  }
  const person = { id: existing?.id || createId("person"), name: String(data.get("name") || "").trim() || tx("Person", "Человек", "Shaxs"), relationship: existing?.relationship || "dependant", citizenships: [...new Set(citizenships.filter(Boolean))], residenceCountry: residence || existing?.residenceCountry || "", jurisdictions };
  state.people = existing ? state.people.map((entry) => entry.id === existing.id ? person : entry) : [...state.people, person]; syncActiveCountries();
  await persistState(); document.querySelector("#person-dialog").close(); render(); announce(tx("Person saved.", "Человек сохранён.", "Shaxs saqlandi."));
}

async function saveCountryRelation() {
  const form = document.querySelector("#country-form"); const data = new FormData(form); const person = state.people.find((entry) => entry.id === data.get("personId")); const country = data.get("country");
  if (!person || !country) { announce(tx("Choose a country.", "Выберите страну.", "Mamlakatni tanlang.")); return; }
  const relationId = data.get("relationId"); const originalCountry = data.get("originalCountry");
  if (data.get("recordKind") === "citizenship") {
    if (relationId) person.jurisdictions = (person.jurisdictions || []).filter((entry) => entry.id !== relationId);
    person.citizenships = [...new Set([...(person.citizenships || []).filter((entry) => entry !== originalCountry), country])];
    person.jurisdictions = (person.jurisdictions || []).filter((entry) => entry.country !== country || entry.type === "residence");
  } else {
    if ((person.citizenships || []).includes(country)) { announce(tx("Use the citizenship record for this country; no foreign route is needed.", "Для этой страны используйте запись о гражданстве — иностранное основание не нужно.", "Bu mamlakat uchun fuqarolik yozuvidan foydalaning; xorijiy asos kerak emas.")); return; }
    if (originalCountry) person.citizenships = (person.citizenships || []).filter((entry) => entry !== originalCountry);
    const existingRelation = (person.jurisdictions || []).find((entry) => entry.id === relationId); const route = data.get("route") || "not_sure";
    const relation = { id: relationId || createId("relation"), country, type: existingRelation?.type || "destination", contextType: existingRelation?.contextType || "planned_move", purpose: data.get("purpose") || "unknown", route, basis: route, statusDocument: data.get("hasDocument") ? { label: String(data.get("statusLabel") || "").trim(), printedExpiry: data.get("printedExpiry") || "", status: "active" } : null, note: String(data.get("note") || "").trim() };
    person.jurisdictions = relationId ? (person.jurisdictions || []).map((entry) => entry.id === relationId ? relation : entry) : [...(person.jurisdictions || []), relation];
  }
  syncActiveCountries(); await persistState(); document.querySelector("#country-dialog").close(); render(); announce(tx("Country details saved.", "Данные о стране сохранены.", "Mamlakat ma’lumotlari saqlandi."));
}

async function deleteCountryRelation() {
  const form = document.querySelector("#country-form"); const person = state.people.find((entry) => entry.id === form.elements.personId.value); if (!person) return;
  const relationId = form.elements.relationId.value; const originalCountry = form.elements.originalCountry.value;
  if (relationId) person.jurisdictions = (person.jurisdictions || []).filter((entry) => entry.id !== relationId);
  if (originalCountry) person.citizenships = (person.citizenships || []).filter((entry) => entry !== originalCountry);
  syncActiveCountries(); await persistState(); document.querySelector("#country-dialog").close(); render(); announce(tx("Country details removed.", "Данные о стране удалены.", "Mamlakat ma’lumotlari olib tashlandi."));
}

function downloadText(filename, text, type) { const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
function exportCalendar() { const valid = state.items.filter((item) => parseISODate(item.schedule?.date) && item.status === "active").map((item) => ({ ...item, title: itemTitle(item) })); if (!valid.length) { announce(tx("Add at least one date first.", "Сначала добавьте хотя бы одну дату.", "Avval kamida bitta sana kiriting.")); return; } downloadText("nextdue-calendar.ics", generateICS(valid, state.settings), "text/calendar;charset=utf-8"); }

async function addCatalogItem(id) {
  const entry = CATALOG.find((item) => item.id === id); if (!entry || state.items.some((item) => item.catalogId === id)) return;
  const possible = matchCatalog(state).find((match) => match.entry.id === id); const match = possible || { entry, subjectId: state.people[0]?.id || null, assetId: null };
  if (!possible && entry.match?.kind !== "manual") { announce(tx("This rule does not match the citizenship, purpose, route, or possession you saved.", "Это правило не подходит к сохранённым гражданству, цели, основанию или имуществу.", "Bu qoida saqlangan fuqarolik, maqsad, asos yoki mulkka mos emas.")); return; }
  state.items.push(makeItemFromCatalog(match, { title: localized(entry.title, state.locale), reason: localized(entry.summary, state.locale), catalogVersion: CATALOG_VERSION, person: personName(match.subjectId) })); state.profile.activeCountries = [...new Set([...(state.profile.activeCountries || []), entry.country])];
  await persistState(); render(); announce(tx("Added to your plan. Confirm the date next.", "Добавлено в план. Теперь подтвердите дату.", "Rejaga qo‘shildi. Endi sanani tasdiqlang."));
}

function filterCatalog(country) {
  document.querySelectorAll("[data-catalog-country]").forEach((card) => { card.hidden = country !== "all" && card.dataset.catalogCountry !== country; });
  document.querySelectorAll("[data-country-filter]").forEach((button) => button.classList.toggle("active", button.dataset.countryFilter === country));
}

function renderCountryPickerList(query = "") {
  const list = document.querySelector("#country-picker-list"); if (!list || !countryPickerTarget) return;
  const normalized = query.trim().toLocaleLowerCase(state.locale); const excluded = new Set(countryPickerTarget.exclude || []);
  const related = new Set([...(state.profile?.activeCountries || []), ...(setupDraft.citizenships || []), setupDraft.residenceCountry, ...(setupDraft.plans || []).map((plan) => plan.country), ...(setupDraft.assets || []).map((asset) => asset.country)].filter(Boolean));
  const options = COUNTRIES.filter(([code]) => code && !excluded.has(code)).filter(([code]) => {
    if (!normalized) return true; const names = [countryName(code), COUNTRIES.find(([value]) => value === code)?.[1] || "", code].join(" ").toLocaleLowerCase(state.locale); return names.includes(normalized);
  }).sort(([a], [b]) => Number(related.has(b)) - Number(related.has(a)) || countryName(a).localeCompare(countryName(b), state.locale));
  list.innerHTML = options.length ? options.map(([code]) => `<button type="button" role="option" class="country-option ${countryPickerTarget.value === code ? "selected" : ""}" data-action="choose-country" data-country="${code}"><span class="country-option-flag">${flagForCountry(code)}</span><span><strong>${escapeHTML(countryName(code))}</strong><small>${code}${related.has(code) ? ` · ${tx("Your country", "Ваша страна", "Sizning mamlakatingiz")}` : ""}</small></span>${countryPickerTarget.value === code ? icon("check", 17) : ""}</button>`).join("") : `<p class="mini-empty">${tx("No countries found.", "Страны не найдены.", "Mamlakat topilmadi.")}</p>`;
}

function openCountryPicker(target, value = "", exclude = []) {
  countryPickerTarget = { target, value, exclude };
  const dialog = document.querySelector("#country-picker-dialog"); const search = document.querySelector("#country-search"); search.value = ""; renderCountryPickerList(); dialog.showModal(); window.setTimeout(() => search.focus(), 0);
}

function applyCountryPick(country) {
  const target = countryPickerTarget?.target || "";
  if (target === "setup-citizenship-new") setupDraft.citizenships.push(country);
  else if (target.startsWith("setup-citizenship-")) setupDraft.citizenships[Number(target.split("-").pop())] = country;
  else if (target === "setup-residence") { setupDraft.residenceCountry = country; setupDraft.residencePurpose = "work"; setupDraft.residenceRoute = routeChoices(country, "work", setupDraft.citizenships)[0]; }
  else if (target === "setup-plan-new") setupDraft.plans.push({ id: createId("draft-plan"), country, purpose: "visit", route: routeChoices(country, "visit", setupDraft.citizenships)[0] });
  else if (target.startsWith("setup-plan-")) { const plan = setupDraft.plans[Number(target.split("-").pop())]; if (plan) { plan.country = country; plan.route = routeChoices(country, plan.purpose, setupDraft.citizenships)[0]; } }
  else if (target.startsWith("setup-asset-")) { const asset = setupDraft.assets[Number(target.split("-").pop())]; if (asset) asset.country = country; }
  else {
    const mapping = { "person-citizenship": ["#person-form", "citizenship", "#person-citizenship-picker"], "person-residence": ["#person-form", "residence", "#person-residence-picker"], "asset-country": ["#asset-form", "country", "#asset-country-picker"], "country-record": ["#country-form", "country", "#country-record-picker"] };
    const config = mapping[target]; if (config) { const form = document.querySelector(config[0]); form.elements[config[1]].value = country; updateCountryPickerButton(document.querySelector(config[2]), country); if (target === "person-citizenship" && !form.elements.residence.value) { form.elements.residence.value = country; const residenceButton = document.querySelector("#person-residence-picker"); residenceButton.dataset.countryExclude = country; updateCountryPickerButton(residenceButton, country); } if (target === "country-record") updateCountryRecordRouteOptions(); }
  }
  document.querySelector("#country-picker-dialog").close(); countryPickerTarget = null; if (target.startsWith("setup-")) render();
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]"); if (!target) return; const action = target.dataset.action;
  if (action === "setup-home") { event.preventDefault(); setupStep = 1; render(); }
  if (action === "choose-goal") { setupDraft.goal = target.dataset.value; render(); }
  if (action === "setup-next") { if (setupStep === 2 && (!setupDraft.citizenships.length || !setupDraft.residenceCountry)) { announce(tx("Add citizenship and current residence first.", "Сначала добавьте гражданство и текущее место проживания.", "Avval fuqarolik va hozirgi yashash joyini qo‘shing.")); } else { setupStep = Math.min(4, setupStep + 1); render(); } }
  if (action === "setup-back") { setupStep = Math.max(1, setupStep - 1); render(); }
  if (action === "setup-add-citizenship") openCountryPicker("setup-citizenship-new", "", setupDraft.citizenships);
  if (action === "setup-remove-citizenship") { setupDraft.citizenships.splice(Number(target.dataset.index), 1); render(); }
  if (action === "setup-same-residence") { setupDraft.residenceCountry = target.dataset.country; setupDraft.residencePurpose = "long_term"; setupDraft.residenceRoute = "citizen"; render(); }
  if (action === "setup-add-plan") openCountryPicker("setup-plan-new", "", [...setupDraft.citizenships, setupDraft.residenceCountry, ...setupDraft.plans.map((plan) => plan.country)]);
  if (action === "setup-remove-plan") { setupDraft.plans.splice(Number(target.dataset.index), 1); render(); }
  if (action === "setup-add-asset") { setupDraft.assets.push({ id: createId("draft-asset"), type: "property", label: "", country: setupDraft.residenceCountry || setupDraft.citizenships[0] || "" }); render(); }
  if (action === "setup-remove-asset") { setupDraft.assets.splice(Number(target.dataset.index), 1); render(); }
  if (action === "finish-setup") await finishSetup();
  if (action === "change-view") { activeView = target.dataset.view; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  if (action === "open-catalog-country") { activeView = "catalog"; render(); window.setTimeout(() => filterCatalog(target.dataset.country), 0); }
  if (action === "add-item") openItemDialog();
  if (action === "edit-item") openItemDialog(state.items.find((item) => item.id === target.dataset.id));
  if (action === "save-item") await saveItem();
  if (action === "add-asset") openAssetDialog();
  if (action === "edit-asset") openAssetDialog(state.assets.find((asset) => asset.id === target.dataset.id));
  if (action === "save-asset") await saveAsset();
  if (action === "add-person") openPersonDialog();
  if (action === "edit-person") openPersonDialog(state.people.find((person) => person.id === target.dataset.id));
  if (action === "save-person") await savePerson();
  if (action === "add-country") openCountryDialog(target.dataset.personId);
  if (action === "edit-country") openCountryDialog(target.dataset.personId, target.dataset.relationId, target.dataset.citizenshipCountry);
  if (action === "save-country-relation") await saveCountryRelation();
  if (action === "add-catalog") await addCatalogItem(target.dataset.id);
  if (action === "export-calendar") exportCalendar();
  if (action === "backup-data") downloadText(`nextdue-backup-${toISODate(new Date())}.json`, JSON.stringify(state, null, 2), "application/json");
  if (action === "restore-data") document.querySelector("#restore-input").click();
  if (action === "calendar-menu") { const item = state.items.find((entry) => entry.id === target.dataset.id); const localizedItem = { ...item, title: itemTitle(item) }; const links = calendarLinks(localizedItem); if (!links) return; const dialog = document.querySelector("#calendar-dialog"); dialog.querySelector("#calendar-item-name").textContent = localizedItem.title; dialog.querySelector("#google-link").href = links.google; dialog.querySelector("#outlook-link").href = links.outlook; dialog.showModal(); }
  if (action === "close-dialog") target.closest("dialog").close();
  if (action === "saas-info") document.querySelector("#saas-dialog").showModal();
  if (action === "open-country-picker") openCountryPicker(target.dataset.countryTarget, target.dataset.countryValue || "", (target.dataset.countryExclude || "").split(",").filter(Boolean));
  if (action === "choose-country") applyCountryPick(target.dataset.country);
  if (action === "set-plan-view") { planFilters.view = target.dataset.value; render(); }
  if (action === "set-plan-status") { planFilters.status = target.dataset.value; render(); }
  if (action === "toggle-plan-filters") { planFilters.open = !planFilters.open; render(); }
  if (action === "clear-plan-filter") { planFilters[target.dataset.filter] = "all"; render(); }
  if (action === "clear-plan-filters") { planFilters = { ...planFilters, country: "all", personId: "all", assetId: "all", open: false }; render(); }
});

document.addEventListener("change", async (event) => {
  if (event.target.id === "setup-locale") { setupDraft.locale = event.target.value; render(); }
  if (event.target.dataset.setupCitizenshipIndex !== undefined) setupDraft.citizenships[Number(event.target.dataset.setupCitizenshipIndex)] = event.target.value;
  if (event.target.dataset.setupResidencePurpose !== undefined) { setupDraft.residencePurpose = event.target.value; setupDraft.residenceRoute = routeChoices(setupDraft.residenceCountry, event.target.value, setupDraft.citizenships)[0]; render(); }
  if (event.target.dataset.setupResidenceRoute !== undefined) setupDraft.residenceRoute = event.target.value;
  if (event.target.dataset.setupPlanIndex !== undefined) { const plan = setupDraft.plans[Number(event.target.dataset.setupPlanIndex)]; if (plan) { plan[event.target.dataset.field] = event.target.value; if (event.target.dataset.field === "purpose") { plan.route = routeChoices(plan.country, plan.purpose, setupDraft.citizenships)[0]; render(); } } }
  if (event.target.dataset.setupAssetIndex !== undefined) { const asset = setupDraft.assets[Number(event.target.dataset.setupAssetIndex)]; if (asset) asset[event.target.dataset.field] = event.target.value; }
  if (event.target.dataset.planFilter) { const filter = event.target.dataset.planFilter; planFilters[filter] = event.target.value; if (filter === "country" && planFilters.assetId !== "all") { const selectedAsset = state.assets.find((asset) => asset.id === planFilters.assetId); if (selectedAsset?.country !== event.target.value && event.target.value !== "all") planFilters.assetId = "all"; } if (filter === "assetId" && event.target.value !== "all") planFilters.country = state.assets.find((asset) => asset.id === event.target.value)?.country || planFilters.country; render(); }
  if (event.target.closest("#country-form") && event.target.name === "recordKind") updateCountryRelationFields();
  if (event.target.closest("#country-form") && event.target.name === "purpose") updateCountryRecordRouteOptions();
  if (event.target.closest("#country-form") && event.target.name === "hasDocument") updateIssuedStatusFields();
  if (event.target.id === "language-select") { setLanguage(event.target.value); await persistState(); render(); }
  if (event.target.name === "kind") updateScheduleFields();
  if (event.target.name === "date" || event.target.name === "reminderInput") updateReminderPreview();
  if (event.target.dataset.setting) { state.settings[event.target.dataset.setting] = event.target.checked; await persistState(); render(); }
});

document.addEventListener("input", (event) => {
  if (event.target.name === "reminderInput" || event.target.name === "date") updateReminderPreview();
  if (event.target.dataset.setupAssetIndex !== undefined) { const asset = setupDraft.assets[Number(event.target.dataset.setupAssetIndex)]; if (asset) asset[event.target.dataset.field] = event.target.value; }
  if (event.target.id === "country-search") renderCountryPickerList(event.target.value);
});
document.addEventListener("click", (event) => { const filter = event.target.closest("[data-country-filter]"); if (filter) filterCatalog(filter.dataset.countryFilter); });

document.querySelector("#delete-item").addEventListener("click", async () => {
  const id = document.querySelector("#item-form").elements.id.value;
  if (id && window.confirm(tx("Remove this obligation?", "Удалить эту обязанность?", "Bu majburiyat o‘chirilsinmi?"))) { state.items = state.items.filter((item) => item.id !== id); await persistState(); document.querySelector("#item-dialog").close(); render(); }
});

document.querySelector("#delete-country-relation").addEventListener("click", async () => {
  if (window.confirm(tx("Remove these country details?", "Удалить эти данные о стране?", "Bu mamlakat ma’lumotlari olib tashlansinmi?"))) await deleteCountryRelation();
});

document.querySelector("#restore-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0]; if (!file || file.size > 1_000_000) return;
  try { state = validateBackup(migrateState(JSON.parse(await file.text()))); await persistState(); activeView = "today"; render(); announce(tx("Backup restored.", "Резервная копия восстановлена.", "Nusxa tiklandi.")); } catch (error) { announce(error.message); }
  event.target.value = "";
});

document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));

state = await loadState();
setLanguage(state.locale || "en");
render();
