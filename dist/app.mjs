import {
  CATEGORY_META, SCHEMA_VERSION, addDays, calendarLinks, createId,
  daysBetween, formatReminderSequence, generateICS, getCalendarEventCount, getItemStatus,
  getNextOccurrence, groupItemsForToday, makeItemFromCatalog,
  parseISODate, parseReminderSequence, sortItems, toISODate, validateBackup,
} from "./logic.mjs?v=20261117-v1";
import {
  CATALOG, CATALOG_REVIEWED_AT, CATALOG_VERSION, COUNTRY_META,
  catalogCountryName, localized, matchCatalog,
} from "./catalog.mjs?v=20261117-v1";
import { REGISTRY_COUNTS, REGISTRY_COUNTRIES, REGISTRY_RULES, REGISTRY_SOURCES } from "./registry.mjs?v=20261117-v1";
import {
  ASSET_PERSON_ROLES, assetRolesFor, catalogGraph, citizenshipCodesFor, contextsFor,
  emptyDomainState, migrateDomainState, normalizeCatalogObligation, primaryAssetJurisdiction,
  primaryAssetPerson, routeForContext, validateSubject,
} from "./domain.mjs?v=20261117-v1";
import { SUPPORTED_LOCALES, t } from "./i18n.mjs?v=20261117-v1";

const DB_NAME = "nextdue-local";
const DB_VERSION = 1;
const STORE_NAME = "state";
const STATE_KEY = "app";
const SAAS_MODE = new URLSearchParams(window.location.search).get("mode") === "saas";
const TEST_MODE_RESET_ON_LOAD = true;
let remoteRevision = 0;

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
  rvp: ["Already hold active RVP status", "Уже есть действующий РВП", "Amaldagi RVP maqomi bor"],
  rvpo: ["Education temporary residence (RVPO)", "РВПО", "Ta’lim uchun vaqtinchalik yashash (RVPO)"],
  vnzh: ["Already hold active VNZH status", "Уже есть действующий ВНЖ", "Amaldagi VNZH maqomi bor"],
  ru_student: ["Student visa or temporary stay", "Учебная виза или временное пребывание", "Talaba vizasi yoki vaqtincha qolish"],
  ru_family: ["Family-based stay", "Пребывание по семье", "Oila asosida qolish"], ru_business: ["Business visa / qualifying route", "Деловая виза / подходящее основание", "Biznes vizasi / tegishli asos"],
  eu_free_movement: ["EU/EEA/Swiss free-movement route", "Маршрут свободного передвижения ЕС/ЕЭЗ/Швейцарии", "YI/EEA/Shveytsariya erkin harakatlanish yo‘li"],
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
const EU_EEA_COUNTRIES = new Set(["AT", "BE", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "IE", "IT", "NL", "NO", "PL", "PT", "SE"]);

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
  return emptyDomainState("en");
}

function migrateState(value) {
  return migrateDomainState(value);
}

let state = defaultState();
let setupStep = 1;
let setupDraft = {
  locale: "en", goal: "move", citizenships: [], residenceCountry: "", residencePurpose: "", residenceRoute: "",
  plans: [],
  assets: [],
};
let activeView = "plan";
let dbMode = "indexeddb";
let planFilters = { view: "checklist", status: "all", country: "all", personId: "all", assetType: "all", assetId: "all", open: false };
let ruleFilters = { country: "all", tier: "all", query: "", limit: 60 };
let countryPickerTarget = null;
const REGISTRY_SOURCE_BY_ID = new Map(REGISTRY_SOURCES.map((source) => [source.source_id, source]));
const CATALOG_BY_REGISTRY_ID = new Map(CATALOG.map((entry) => [`published.${entry.id}`, entry]));

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME); };
    request.onsuccess = () => resolve(request.result);
  });
}

async function resetStoredStateForTestMode() {
  try { localStorage.removeItem("nextdue-state"); } catch { /* storage may be unavailable */ }
  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch { /* loadState will use an empty fallback */ }
}

async function loadState() {
  if (SAAS_MODE) {
    dbMode = "remote";
    const response = await fetch("/api/state", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error(`Unable to load your household (${response.status}).`);
    const payload = await response.json();
    remoteRevision = payload.revision || 0;
    return payload.state ? validateBackup(migrateState(payload.state)) : defaultState();
  }
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
  if (SAAS_MODE) {
    try {
      const response = await fetch("/api/state", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ revision: remoteRevision, state }),
      });
      if (response.status === 409) {
        const latest = await fetch("/api/state", { cache: "no-store", credentials: "same-origin" });
        const payload = await latest.json();
        remoteRevision = payload.revision || 0;
        state = payload.state ? validateBackup(migrateState(payload.state)) : defaultState();
        render();
        announce(tx("Newer changes were found and loaded. Please try again.", "Найдены и загружены более новые изменения. Повторите действие.", "Yangi o‘zgarishlar topildi va yuklandi. Qayta urinib ko‘ring."));
        return false;
      }
      if (!response.ok) throw new Error(`Save failed (${response.status}).`);
      const payload = await response.json();
      remoteRevision = payload.revision;
      return true;
    } catch (error) {
      announce(tx("Could not sync changes. Your previous cloud version is safe.", "Не удалось синхронизировать изменения. Предыдущая облачная версия сохранена.", "O‘zgarishlarni sinxronlab bo‘lmadi. Oldingi bulut versiyasi saqlangan."));
      console.error(error);
      return false;
    }
  }
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
function purposeOptions(selected, includeUnknown = true, country = "", citizenships = [], includePlaceholder = false) {
  const supported = Object.entries(PURPOSES).filter(([value]) => {
    if (value === "unknown") return includeUnknown;
    if (!country || value === selected) return true;
    return routeChoices(country, value, citizenships).some((route) => route !== "not_sure");
  });
  const placeholder = includePlaceholder ? `<option value="" ${selected ? "" : "selected"} disabled>${tx("Choose a purpose", "Выберите цель", "Maqsadni tanlang")}</option>` : "";
  return `${placeholder}${supported.map(([value, labels]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${escapeHTML(localizedTuple(labels))}</option>`).join("")}`;
}
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
    if (purpose === "business") return ["not_sure"];
    return ["not_sure"];
  }
  const generic = { work: "generic_work", study: "generic_study", family: "generic_family", visit: "generic_visit", long_term: "generic_long_term" }[purpose];
  return [generic || "not_sure", "not_sure"].filter((value, index, list) => list.indexOf(value) === index);
}
function routeOptions(country, purpose, citizenships, selected, includePlaceholder = false) {
  const placeholder = includePlaceholder ? `<option value="" ${selected ? "" : "selected"} disabled>${tx("Choose a route", "Выберите основание", "Asosni tanlang")}</option>` : "";
  return `${placeholder}${routeChoices(country, purpose, citizenships).map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${escapeHTML(routeLabel(value))}</option>`).join("")}`;
}
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
function personCitizenships(personId) { return citizenshipCodesFor(state, personId); }
function personContexts(personId) { return contextsFor(state, personId); }
function assetCountry(assetOrId) { const assetId = typeof assetOrId === "string" ? assetOrId : assetOrId?.id; return primaryAssetJurisdiction(state, assetId)?.country || ""; }
function assetRoleLabel(role) {
  const labels = {
    owner: ["Owner", "Владелец", "Egasi"], co_owner: ["Co-owner", "Совладелец", "Hamega"],
    registered_owner: ["Registered owner", "Зарегистрированный владелец", "Ro‘yxatdagi ega"], keeper: ["Keeper", "Держатель", "Saqlovchi"],
    operator: ["Operator", "Пользователь", "Foydalanuvchi"], taxpayer: ["Taxpayer", "Налогоплательщик", "Soliq to‘lovchi"],
    responsible_person: ["Responsible", "Ответственный", "Mas’ul"],
  };
  return localizedTuple(labels[role] || labels.responsible_person);
}
function itemPersonId(item) { return item.subjectType === "person" ? item.personId : item.responsiblePersonId; }
function itemAssetId(item) { return item.subjectType === "asset" ? item.assetId : null; }
function itemTitle(item) { const entry = item.catalogId ? CATALOG.find((catalogItem) => catalogItem.id === item.catalogId) : null; return entry ? localized(entry.title, state.locale) : item.title; }
function announce(message) { const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("show"); window.setTimeout(() => toast.classList.remove("show"), 2800); }
function clearFormErrors(form) {
  form.querySelector(".form-error-summary")?.remove();
  for (const input of form.querySelectorAll('[aria-invalid="true"]')) input.removeAttribute("aria-invalid");
  for (const error of form.querySelectorAll(".field-error")) error.remove();
}
function showFormErrors(form, errors) {
  clearFormErrors(form);
  if (!errors.length) return false;
  const summary = document.createElement("div");
  summary.className = "form-error-summary";
  summary.setAttribute("role", "alert");
  summary.tabIndex = -1;
  summary.innerHTML = `<strong>${escapeHTML(tx("Check the highlighted fields", "Проверьте выделенные поля", "Belgilangan maydonlarni tekshiring"))}</strong><ul>${errors.map((error) => `<li>${escapeHTML(error.message)}</li>`).join("")}</ul>`;
  form.querySelector(".modal-body")?.prepend(summary);
  for (const error of errors) {
    const input = form.elements[error.name];
    if (!input || input instanceof RadioNodeList) continue;
    input.setAttribute("aria-invalid", "true");
    const message = document.createElement("small");
    message.className = "field-error";
    message.textContent = error.message;
    input.closest("label")?.append(message);
  }
  summary.focus();
  return true;
}
function setLanguage(locale) { state.locale = locale; document.documentElement.lang = locale === "uz-Latn" ? "uz" : locale; }
function syncActiveCountries() {
  state.profile.activeCountries = [...new Set([
    ...(state.citizenships || []).map((record) => record.country),
    ...(state.countryContexts || []).map((record) => record.country),
    ...(state.assetJurisdictions || []).map((record) => record.country),
    ...state.items.map((item) => item.country),
    ...(state.ruleCandidates || []).map((candidate) => candidate.country),
  ].filter(Boolean))];
}

function catalogItemKey(entryId, subjectId, assetId) {
  return `${entryId}|${subjectId || ""}|${assetId || ""}`;
}

function shouldAutoIncludeCatalogMatch(match) {
  if (match.entry.checklistKind !== "import_customs_foreign_plate") return true;
  const asset = state.assets.find((candidate) => candidate.id === match.assetId);
  return asset?.facts?.vehiclePlateStatus === "foreign" || ["temporary_import", "permanent_import"].includes(asset?.facts?.vehicleImportStatus);
}

function reconcileCatalogItems() {
  const matches = matchCatalog(catalogGraph(state));
  const autoMatches = matches.filter(shouldAutoIncludeCatalogMatch);
  const matchedKeys = new Set(autoMatches.map((match) => catalogItemKey(match.entry.id, match.subjectId, match.assetId)));
  state.items = state.items.filter((item) => {
    if (item.provenance !== "catalog" || !item.catalogId) return true;
    const entry = CATALOG.find((candidate) => candidate.id === item.catalogId);
    if (entry?.match?.kind === "manual") return true;
    return true;
  });
  state.ruleCandidates = (state.ruleCandidates || []).filter((candidate) => candidate.candidateStatus !== "pending" || matchedKeys.has(catalogItemKey(candidate.catalogId, itemPersonId(candidate), itemAssetId(candidate))));
  const existingKeys = new Set([
    ...state.items.map((item) => catalogItemKey(item.catalogId, itemPersonId(item), itemAssetId(item))),
    ...state.ruleCandidates.map((candidate) => catalogItemKey(candidate.catalogId, itemPersonId(candidate), itemAssetId(candidate))),
  ]);
  for (const match of autoMatches) {
    const key = catalogItemKey(match.entry.id, match.subjectId, match.assetId);
    if (existingKeys.has(key)) continue;
    const candidate = normalizeCatalogObligation(makeItemFromCatalog(match, {
      title: localized(match.entry.title, state.locale),
      reason: localized(match.entry.summary, state.locale),
      catalogVersion: CATALOG_VERSION,
      person: personName(match.subjectId),
    }), match.subjectId, "candidate");
    delete candidate.applicability;
    candidate.candidateStatus = "pending";
    candidate.decidedAt = null;
    state.ruleCandidates.push(candidate);
    existingKeys.add(key);
  }
}

function removeAssetAndLinkedItems(currentState, assetId) {
  return {
    ...currentState,
    assets: currentState.assets.filter((asset) => asset.id !== assetId),
    assetJurisdictions: currentState.assetJurisdictions.filter((record) => record.assetId !== assetId),
    assetPersonRoles: currentState.assetPersonRoles.filter((record) => record.assetId !== assetId),
    issuedDocuments: currentState.issuedDocuments.filter((record) => record.assetId !== assetId),
    ruleCandidates: (currentState.ruleCandidates || []).filter((candidate) => candidate.assetId !== assetId),
    items: currentState.items.flatMap((item) => {
      if (item.assetId !== assetId) return [item];
      if (item.provenance === "catalog") return [];
      return [{ ...item, subjectType: "household", assetId: null, personId: null }];
    }),
  };
}

function setDocumentTitle() {
  const titles = { plan: t(state.locale, "plan"), registry: t(state.locale, "registry"), catalog: t(state.locale, "catalog"), settings: t(state.locale, "settings") };
  document.title = state.onboarded ? `${titles[activeView]} · NextDue` : "NextDue · Life admin across countries";
}

function render() {
  setLanguage(state.locale || "en"); setDocumentTitle();
  const setup = document.querySelector("#setup-view"); const app = document.querySelector("#app-shell");
  if (!state.onboarded) { setup.hidden = false; app.hidden = true; renderSetup(); return; }
  setup.hidden = true; app.hidden = false; updateNavigationLabels();
  document.querySelectorAll("[data-view]").forEach((button) => { const selected = button.dataset.view === activeView; button.classList.toggle("active", selected); if (selected) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current"); });
  const renderer = { plan: renderPlan, registry: renderRegistry, catalog: renderCatalog, settings: renderSettings }[activeView] || renderPlan;
  document.querySelector("#view-root").innerHTML = renderer();
}

function updateNavigationLabels() {
  for (const view of ["plan", "registry", "catalog", "settings"]) document.querySelectorAll(`[data-view="${view}"] .nav-label`).forEach((el) => { el.textContent = t(state.locale, view); });
  const local = document.querySelector("#local-badge-copy");
  if (local) local.innerHTML = SAAS_MODE
    ? `<strong>${tx("Private household", "Личное пространство", "Shaxsiy uy xo‘jaligi")}</strong><small>${tx("Synced securely", "Синхронизировано", "Xavfsiz sinxronlangan")}</small>`
    : `<strong>${t(state.locale, "privateByDefault")}</strong><small>${t(state.locale, "savedHere")}</small>`;
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
  setFormLabel("#item-form", "subjectType", tx("About", "К чему относится", "Nimaga tegishli"));
  setFormLabel("#item-form", "personId", tx("Person", "Человек", "Shaxs"));
  setFormLabel("#item-form", "assetId", tx("Possession", "Имущество", "Mulk"));
  setFormLabel("#item-form", "responsiblePersonId", tx("Responsible person", "Ответственный", "Mas’ul shaxs"));
  setFormLabel("#item-form", "applicability", tx("Does this apply?", "Это применимо?", "Bu tegishlimi?"));
  setFormLabel("#item-form", "reminderInput", t(state.locale, "reminderSequence"));
  setFormLabel("#item-form", "notes", tx("Private note (optional)", "Личная заметка (необязательно)", "Shaxsiy izoh (ixtiyoriy)"));
  setText('#item-form [name="date"] + small', tx("Leave blank until you verify it.", "Оставьте пустым до проверки.", "Tekshirmaguningizcha bo‘sh qoldiring."));
  setText('#item-form [name="reminderInput"] + small', tx("Choose the days before the deadline and separate them with /.", "Выберите дни до срока и разделите их знаком /.", "Muddatdan oldingi kunlarni tanlab, / bilan ajrating."));
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
  replaceOptions(document.querySelector('#item-form [name="subjectType"]'), [["household", tx("Household", "Семья", "Oila")], ["person", tx("Person", "Человек", "Shaxs")], ["asset", tx("Possession", "Имущество", "Mulk")]]);
  replaceOptions(document.querySelector('#item-form [name="applicability"]'), [["candidate", tx("Not confirmed yet", "Пока не подтверждено", "Hali tasdiqlanmagan")], ["confirmed", tx("Yes, it applies", "Да, применимо", "Ha, tegishli")], ["not_applicable", tx("No, it does not apply", "Нет, не применимо", "Yo‘q, tegishli emas")]]);
  setText("#delete-item", tx("Remove", "Удалить", "Olib tashlash"));
  setText('#item-form [data-action="close-dialog"].secondary-button', t(state.locale, "cancel"));
  setText('#item-form [data-action="save-item"]', tx("Save obligation", "Сохранить обязанность", "Majburiyatni saqlash"));

  setText("#asset-dialog .eyebrow", t(state.locale, "registry"));
  setFormLabel("#asset-form", "type", tx("Type", "Тип", "Turi"));
  setFormLabel("#asset-form", "label", tx("Private label", "Приватная метка", "Maxfiy belgi"));
  setFormLabel("#asset-form", "vehicleIdentifierSuffix", tx("Registration or plate suffix (optional)", "Окончание номера или знака (необязательно)", "Ro‘yxat yoki raqam oxiri (ixtiyoriy)"));
  setFormLabel("#asset-form", "vehicleClass", tx("Vehicle class (optional)", "Класс транспорта (необязательно)", "Transport turi (ixtiyoriy)"));
  setFormLabel("#asset-form", "vehicleUse", tx("Vehicle use (optional)", "Использование транспорта (необязательно)", "Transportdan foydalanish (ixtiyoriy)"));
  setFormLabel("#asset-form", "vehicleFirstRegisteredOn", tx("First registered (optional)", "Первая регистрация (необязательно)", "Birinchi ro‘yxatga olish (ixtiyoriy)"));
  setFormLabel("#asset-form", "vehiclePlateStatus", tx("Plate status (optional)", "Статус номеров (необязательно)", "Raqam holati (ixtiyoriy)"));
  setFormLabel("#asset-form", "vehicleImportStatus", tx("Import status (optional)", "Статус ввоза (необязательно)", "Import holati (ixtiyoriy)"));
  setFormLabel("#asset-form", "propertyUse", tx("Use (optional)", "Использование (необязательно)", "Foydalanish (ixtiyoriy)"));
  setFormLabel("#asset-form", "businessForm", tx("Legal form or tax status (optional)", "Форма или налоговый статус (необязательно)", "Huquqiy shakl yoki soliq maqomi (ixtiyoriy)"));
  setText("#asset-roles-heading strong", tx("People and roles", "Люди и роли", "Odamlar va rollar"));
  setText("#asset-jurisdictions-heading strong", tx("Additional jurisdictions", "Дополнительные юрисдикции", "Qo‘shimcha yurisdiksiyalar"));
  setPlaceholder('#asset-form [name="label"]', tx("e.g. Toyota Camry or Tashkent apartment", "например, Toyota Camry или квартира в Ташкенте", "masalan, Toyota Camry yoki Toshkentdagi kvartira"));
  replaceOptions(document.querySelector('#asset-form [name="type"]'), [["", tx("Choose a type", "Выберите тип", "Turni tanlang")], ...Object.keys(ASSET_TYPES).map((value) => [value, assetTypeLabel(value)])]);
  replaceOptions(document.querySelector('#asset-form [name="vehicleClass"]'), [["", tx("Not set", "Не указано", "Ko‘rsatilmagan")], ["passenger", tx("Passenger car", "Легковой автомобиль", "Yengil avtomobil")], ["motorcycle", tx("Motorcycle", "Мотоцикл", "Mototsikl")], ["commercial", tx("Commercial vehicle", "Коммерческий транспорт", "Tijorat transporti")], ["trailer", tx("Trailer", "Прицеп", "Tirkama")], ["other", tx("Other", "Другое", "Boshqa")]]);
  replaceOptions(document.querySelector('#asset-form [name="vehicleUse"]'), [["", tx("Not set", "Не указано", "Ko‘rsatilmagan")], ["private", tx("Private", "Личное", "Shaxsiy")], ["commercial", tx("Commercial", "Коммерческое", "Tijorat")], ["taxi", tx("Taxi / rideshare", "Такси / каршеринг", "Taksi / rideshare")], ["other", tx("Other", "Другое", "Boshqa")]]);
  replaceOptions(document.querySelector('#asset-form [name="vehiclePlateStatus"]'), [["", tx("Not set", "Не указано", "Ko‘rsatilmagan")], ["domestic", tx("Domestic plates", "Местные номера", "Mahalliy raqamlar")], ["foreign", tx("Foreign plates", "Иностранные номера", "Xorijiy raqamlar")], ["unregistered", tx("Not registered yet", "Ещё не зарегистрирован", "Hali ro‘yxatdan o‘tmagan")]]);
  replaceOptions(document.querySelector('#asset-form [name="vehicleImportStatus"]'), [["", tx("Not set", "Не указано", "Ko‘rsatilmagan")], ["domestic", tx("Not imported", "Не ввозился", "Import qilinmagan")], ["temporary_import", tx("Temporarily imported", "Временно ввезён", "Vaqtincha import qilingan")], ["permanent_import", tx("Permanently imported", "Ввезён постоянно", "Doimiy import qilingan")]]);
  setText('#asset-form [data-action="close-dialog"].secondary-button', t(state.locale, "cancel"));
  setText('#asset-form [data-action="save-asset"]', tx("Save possession", "Сохранить имущество", "Mulkni saqlash"));
  setText("#delete-asset", tx("Remove possession", "Удалить имущество", "Mulkni olib tashlash"));

  setText("#person-dialog .eyebrow", tx("Household", "Семья", "Oila"));
  setFormLabel("#person-form", "name", tx("Name or private label", "Имя или приватная метка", "Ism yoki maxfiy belgi"));
  setPlaceholder('#person-form [name="name"]', tx("e.g. Child 1", "например, Ребёнок 1", "masalan, Bola 1"));
  setText("#person-form .field-helper small", tx("Choose a current residence only when you want rules for it.", "Укажите текущее проживание, только если нужны правила для этой страны.", "Joriy yashashni faqat shu mamlakat qoidalari kerak bo‘lsa tanlang."));
  setText("#person-form .mini-section-heading strong", tx("Citizenships", "Гражданства", "Fuqaroliklar"));
  setText('#person-form [data-action="add-person-citizenship"]', tx("Add citizenship", "Добавить гражданство", "Fuqarolik qo‘shish"));
  setText('#person-form [data-action="use-citizenship-residence"]', tx("Use citizenship country", "Указать страну гражданства", "Fuqarolik mamlakatini tanlash"));
  setText('#person-form [data-action="close-dialog"].secondary-button', t(state.locale, "cancel"));
  setText('#person-form [data-action="save-person"]', tx("Save person", "Сохранить человека", "Shaxsni saqlash"));

  setText("#country-dialog .eyebrow", tx("Person & country", "Человек и страна", "Shaxs va mamlakat"));
  setFormLabel("#country-form", "recordKind", tx("Add as", "Что добавить", "Nima qo‘shish"));
  setFormLabel("#country-form", "contextType", tx("Context", "Контекст", "Kontekst"));
  setFormLabel("#country-form", "purpose", tx("Purpose", "Цель", "Maqsad"));
  setFormLabel("#country-form", "route", tx("Route or status", "Основание или статус", "Asos yoki maqom"));
  setFormLabel("#country-form", "routeStage", tx("Route stage", "Этап оформления", "Asos bosqichi"));
  setFormLabel("#country-form", "principalPersonId", tx("Related person in this household (optional)", "Связанный человек в семье (необязательно)", "Oiladagi bog‘liq shaxs (ixtiyoriy)"));
  setFormLabel("#country-form", "relationshipType", tx("Relationship to that person", "Кем приходится этому человеку", "U shaxsga munosabat"));
  setFormLabel("#country-form", "documentValidFrom", tx("Valid from (optional)", "Действует с (необязательно)", "Amal boshlanishi (ixtiyoriy)"));
  setFormLabel("#country-form", "startsOn", tx("From (optional)", "С (необязательно)", "Boshlanishi (ixtiyoriy)"));
  setFormLabel("#country-form", "endsOn", tx("Until (optional)", "До (необязательно)", "Tugashi (ixtiyoriy)"));
  setFormLabel("#country-form", "statusLabel", tx("Document or status name", "Название документа или статуса", "Hujjat yoki maqom nomi"));
  setFormLabel("#country-form", "printedExpiry", tx("When does this permit or status expire?", "Когда истекает это разрешение или статус?", "Bu ruxsat yoki maqom qachon tugaydi?"));
  setFormLabel("#country-form", "note", tx("Note", "Примечание", "Izoh"));
  replaceOptions(document.querySelector('#country-form [name="recordKind"]'), [["relationship", tx("Work, study, visit, or move", "Работа, учёба, поездка или переезд", "Ish, o‘qish, tashrif yoki ko‘chish")], ["citizenship", tx("Citizenship", "Гражданство", "Fuqarolik")]]);
  replaceOptions(document.querySelector('#country-form [name="contextType"]'), [["lives_now", tx("Lives here now", "Живёт здесь сейчас", "Hozir shu yerda yashaydi")], ["physical_stay", tx("Current stay", "Текущее пребывание", "Hozirgi qolish")], ["planned_trip", tx("Planned trip", "Планируемая поездка", "Rejalashtirilgan safar")], ["planned_move", tx("Planned move", "Планируемый переезд", "Rejalashtirilgan ko‘chish")], ["tax_residence", tx("Tax residence", "Налоговое резидентство", "Soliq rezidentligi")], ["previous_residence", tx("Previous residence", "Прежнее проживание", "Oldingi yashash")]]);
  replaceOptions(document.querySelector('#country-form [name="routeStage"]'), [["exploring", tx("Exploring", "Изучаю", "O‘rganilmoqda")], ["preparing", tx("Preparing", "Готовлю документы", "Tayyorlanmoqda")], ["applied", tx("Applied", "Заявление подано", "Ariza berilgan")], ["active", tx("Active", "Действует", "Faol")], ["expired", tx("Expired", "Истекло", "Muddati tugagan")], ["ended", tx("Ended", "Завершено", "Tugagan")]]);
  replaceOptions(document.querySelector('#country-form [name="relationshipType"]'), [["spouse", tx("Spouse", "Супруг(а)", "Turmush o‘rtog‘i")], ["child", tx("Child", "Ребёнок", "Farzand")], ["parent", tx("Parent", "Родитель", "Ota-ona")], ["dependant", tx("Dependant", "Иждивенец", "Qaramog‘idagi shaxs")], ["guardian", tx("Guardian", "Опекун", "Vasiy")], ["other", tx("Other", "Другое", "Boshqa")]]);
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
    if (setupDraft.residenceRoute && !residenceRouteChoices.includes(setupDraft.residenceRoute)) setupDraft.residenceRoute = "";
    return `<div class="setup-copy"><p class="step-kicker">${tx("Citizenship & residence", "Гражданство и проживание", "Fuqarolik va yashash")}</p><h2>${tx("First, tell us where you belong and live.", "Сначала укажите гражданство и где вы живёте.", "Avval fuqaroligingiz va yashash joyingizni kiriting.")}</h2><p>${tx("We ask about permits only when you live in a country where you are not a citizen.", "О разрешениях спросим только при проживании не в стране гражданства.", "Ruxsatlar faqat fuqarolik mamlakatingizdan tashqarida yashasangiz so‘raladi.")}</p></div>
      <div class="setup-subsection"><div class="mini-section-heading"><strong>${tx("Citizenship", "Гражданство", "Fuqarolik")}</strong><button class="text-button" data-action="setup-add-citizenship">${icon("plus", 15)} ${tx("Add another", "Добавить ещё", "Yana qo‘shish")}</button></div>
      <div class="country-chip-list">${setupDraft.citizenships.map((country, index) => `<div class="country-chip-edit">${countryPickerButton(country, `setup-citizenship-${index}`, { exclude: setupDraft.citizenships.filter((_, itemIndex) => itemIndex !== index) })}<button class="icon-button" data-action="setup-remove-citizenship" data-index="${index}" aria-label="${tx("Remove citizenship", "Удалить гражданство", "Fuqarolikni olib tashlash")}">${icon("close", 16)}</button></div>`).join("") || `<p class="form-note">${tx("Add at least one citizenship.", "Добавьте хотя бы одно гражданство.", "Kamida bitta fuqarolik qo‘shing.")}</p>`}</div></div>
      <div class="setup-subsection residence-section"><div class="mini-section-heading"><strong>${tx("Where do you live now?", "Где вы живёте сейчас?", "Hozir qayerda yashaysiz?")}</strong></div>
      ${setupDraft.citizenships.length ? `<div class="same-country-options">${setupDraft.citizenships.map((country) => `<button type="button" class="same-country-card ${setupDraft.residenceCountry === country ? "selected" : ""}" data-action="setup-same-residence" data-country="${country}"><span>${flagForCountry(country)}</span><span><strong>${countryName(country)}</strong><small>${tx("Same as my citizenship", "Страна моего гражданства", "Fuqarolik mamlakatim")}</small></span>${icon("check-circle", 18)}</button>`).join("")}</div>` : ""}
      <label><span>${tx("Or I live in another country", "Или я живу в другой стране", "Yoki boshqa mamlakatda yashayman")}</span>${countryPickerButton(isDomestic ? "" : setupDraft.residenceCountry, "setup-residence", { label: tx("Choose another country", "Выбрать другую страну", "Boshqa mamlakatni tanlang"), exclude: setupDraft.citizenships })}</label>
      ${isDomestic ? `<div class="context-note success">${icon("check-circle", 17)}<span>${tx("No immigration route is needed for a citizen living in their own country.", "Для гражданина, живущего в своей стране, миграционное основание не требуется.", "O‘z mamlakatida yashovchi fuqaroga migratsiya asosi kerak emas.")}</span></div>` : setupDraft.residenceCountry ? `<div class="route-panel"><label><span>${tx(`What is your main reason for being in ${countryName(setupDraft.residenceCountry)}?`, `Какова основная цель проживания в стране «${countryName(setupDraft.residenceCountry)}»?`, `${countryName(setupDraft.residenceCountry)}da bo‘lishingizning asosiy sababi nima?`)}</span><select data-setup-residence-purpose>${purposeOptions(setupDraft.residencePurpose, true, setupDraft.residenceCountry, setupDraft.citizenships, true)}</select></label>${setupDraft.residencePurpose && setupDraft.residencePurpose !== "unknown" ? `<label><span>${tx("Which route applies?", "Какое основание подходит?", "Qaysi asos mos keladi?")}</span><select data-setup-residence-route>${routeOptions(setupDraft.residenceCountry, setupDraft.residencePurpose, setupDraft.citizenships, setupDraft.residenceRoute, true)}</select><small>${tx("No route is selected automatically. Choose only what you can confirm.", "Основание не выбирается автоматически. Укажите только подтверждённый вариант.", "Asos avtomatik tanlanmaydi. Faqat tasdiqlangan variantni tanlang.")}</small></label>` : ""}</div>` : ""}</div>
      <div class="setup-subsection"><div class="mini-section-heading"><div><strong>${tx("Trips and future moves", "Поездки и будущие переезды", "Safarlar va kelajakdagi ko‘chishlar")}</strong><small>${tx("Optional and separate from where you live now.", "Необязательно и отдельно от текущего места проживания.", "Ixtiyoriy va hozirgi yashash joyidan alohida.")}</small></div><button class="text-button" data-action="setup-add-plan">${icon("plus", 15)} ${tx("Add country", "Добавить страну", "Mamlakat qo‘shish")}</button></div>
      <div class="plan-draft-list">${setupDraft.plans.map((plan, index) => `<div class="plan-draft-card"><div class="plan-draft-head">${countryPickerButton(plan.country, `setup-plan-${index}`, { exclude: setupDraft.citizenships })}<button class="icon-button" data-action="setup-remove-plan" data-index="${index}">${icon("close", 16)}</button></div><div class="form-grid two"><label><span>${tx("Purpose", "Цель", "Maqsad")}</span><select data-setup-plan-index="${index}" data-field="purpose">${purposeOptions(plan.purpose, true, plan.country, setupDraft.citizenships, true)}</select></label>${plan.purpose && plan.purpose !== "unknown" ? `<label><span>${tx("Legal route", "Правовое основание", "Huquqiy asos")}</span><select data-setup-plan-index="${index}" data-field="route">${routeOptions(plan.country, plan.purpose, setupDraft.citizenships, plan.route, true)}</select></label>` : ""}</div></div>`).join("") || `<p class="form-note">${tx("Add a country more than once when the purpose, route, or period is different.", "Добавляйте страну несколько раз, если отличаются цель, основание или период.", "Maqsad, asos yoki davr boshqacha bo‘lsa, mamlakatni bir necha marta qo‘shing.")}</p>`}</div></div>${setupActions(true)}`;
  }
  if (setupStep === 3) return `<div class="setup-copy"><p class="step-kicker">${tx("Named possessions", "Конкретное имущество", "Aniq mulklar")}</p><h2>${tx("Add every object separately.", "Добавьте каждый объект отдельно.", "Har bir obyektni alohida qo‘shing.")}</h2><p>${tx("Two cars or homes can have different countries, owners, and obligations.", "У двух машин или квартир могут быть разные страны, владельцы и обязанности.", "Ikki avtomobil yoki uy turli mamlakat, egasi va majburiyatlarga ega bo‘lishi mumkin.")}</p></div>
    <div class="dynamic-rows asset-draft-list">${setupDraft.assets.map((asset, index) => `<div class="asset-draft-card"><div class="form-grid two"><label><span>${tx("Type", "Тип", "Turi")}</span><select data-setup-asset-index="${index}" data-field="type"><option value="">${tx("Choose a type", "Выберите тип", "Turni tanlang")}</option>${Object.keys(ASSET_TYPES).map((type) => `<option value="${type}" ${asset.type === type ? "selected" : ""}>${assetTypeLabel(type)}</option>`).join("")}</select></label><label><span>${tx("Private label", "Приватная метка", "Maxfiy belgi")}</span><input value="${escapeHTML(asset.label || "")}" data-setup-asset-index="${index}" data-field="label" placeholder="${tx("e.g. Toyota Camry", "например, Toyota Camry", "masalan, Toyota Camry")}"></label></div>${asset.type ? `<div class="form-grid two"><label><span>${asset.type === "vehicle" ? tx("Registered in", "Зарегистрировано в", "Ro‘yxatdan o‘tgan") : asset.type === "business" ? tx("Established in", "Зарегистрирован в", "Tashkil etilgan") : tx("Located in", "Находится в", "Joylashgan")}</span>${countryPickerButton(asset.country, `setup-asset-${index}`)}</label><label><span>${tx("Your role", "Ваша роль", "Sizning rolingiz")}</span><select data-setup-asset-index="${index}" data-field="role">${ASSET_PERSON_ROLES.map((role) => `<option value="${role}" ${asset.role === role ? "selected" : ""}>${assetRoleLabel(role)}</option>`).join("")}</select></label></div>` : ""}<button class="text-button danger" data-action="setup-remove-asset" data-index="${index}">${icon("trash", 15)} ${tx("Remove", "Удалить", "Olib tashlash")}</button></div>`).join("")}</div>
    <button class="secondary-button full" data-action="setup-add-asset">${icon("plus", 16)} ${tx("Add another possession", "Добавить ещё имущество", "Yana mulk qo‘shish")}</button>${setupActions(true)}`;
  const graph = graphFromDraft(); const matches = matchCatalog(graph);
  return `<div class="setup-copy"><p class="step-kicker">${t(state.locale, "sourceBacked")}</p><h2>${tx("Review candidate matches", "Проверьте найденные кандидаты", "Topilgan nomzodlarni tekshiring")}</h2><p>${tx("These reviewed rules match the facts you entered, but each stays unconfirmed until you verify that it applies. Dates stay empty until you copy them from a document, event, or official notice.", "Эти проверенные правила совпали с указанными фактами, но каждое останется неподтверждённым, пока вы не проверите применимость. Даты останутся пустыми, пока вы не возьмёте их из документа, события или официального уведомления.", "Bu tekshirilgan qoidalar kiritilgan ma’lumotlarga mos, ammo tegishliligi tekshirilmaguncha tasdiqlanmagan bo‘lib qoladi. Sanalar hujjat, voqea yoki rasmiy xabardan olinmaguncha bo‘sh qoladi.")}</p></div><div class="pack-summary">${[...new Set(matches.map((match) => match.entry.country))].map((country) => `<span>${flagForCountry(country)} ${countryName(country)} · ${matches.filter((m) => m.entry.country === country).length}</span>`).join("")}</div>${matches.length ? `<div class="suggestion-list catalog-suggestions">${matches.map((match) => catalogSuggestion(match)).join("")}</div>` : `<div class="mini-empty"><p>${tx("No verified rules match yet. The Rules library still shows research for all 42 countries.", "Подходящих проверенных правил пока нет. В библиотеке всё равно доступно исследование по всем 42 странам.", "Hozircha mos tekshirilgan qoidalar yo‘q. Qoidalar kutubxonasida 42 mamlakat bo‘yicha tadqiqot mavjud.")}</p></div>`}${setupActions(true, true)}`;
}

function setupActions(back, finish = false) { return `<div class="setup-actions">${back ? `<button class="secondary-button" data-action="setup-back">${tx("Back", "Назад", "Orqaga")}</button>` : "<span></span>"}<button class="primary-button" data-action="${finish ? "finish-setup" : "setup-next"}">${finish ? tx("Create my registry", "Создать мой реестр", "Reyestrimni yaratish") : tx("Continue", "Продолжить", "Davom etish")} ${icon("arrow-right", 17)}</button></div>`; }
function catalogSuggestion(match) { const entry = match.entry; const selected = entry.checklistKind !== "import_customs_foreign_plate"; return `<label class="suggestion-row rich"><input type="checkbox" name="catalog-suggestion" value="${entry.id}|${match.subjectId || ""}|${match.assetId || ""}" ${selected ? "checked" : ""}><span class="suggestion-check">${icon("check", 15)}</span><span><strong>${escapeHTML(localized(entry.title, state.locale))}</strong><small>${flagForCountry(entry.country)} ${escapeHTML(countryName(entry.country))} · ${escapeHTML(localized(entry.audience, state.locale))}</small></span><span class="source-tag">${entry.checklistKind === "import_customs_foreign_plate" ? tx("If applicable", "Если применимо", "Agar tegishli bo‘lsa") : `${tx("Reviewed", "Проверено", "Tekshirildi")} ${CATALOG_REVIEWED_AT}`}</span></label>`; }
function graphFromDraft() {
  const citizenships = [...new Set(setupDraft.citizenships.filter(Boolean))];
  const jurisdictions = [];
  if (setupDraft.residenceCountry) jurisdictions.push({ id: "draft-residence", country: setupDraft.residenceCountry, type: "residence", contextType: "lives_now", purpose: citizenships.includes(setupDraft.residenceCountry) ? "long_term" : setupDraft.residencePurpose, route: citizenships.includes(setupDraft.residenceCountry) ? "citizen" : setupDraft.residenceRoute, basis: citizenships.includes(setupDraft.residenceCountry) ? "citizen" : setupDraft.residenceRoute });
  for (const plan of setupDraft.plans.filter((entry) => entry.country && !citizenships.includes(entry.country))) jurisdictions.push({ id: plan.id || createId("relation"), country: plan.country, type: "destination", contextType: "planned_move", purpose: plan.purpose, route: plan.route, basis: plan.route });
  const person = { id: "person-me", name: tx("Me", "Я", "Men"), relationship: "self", citizenships, residenceCountry: setupDraft.residenceCountry, jurisdictions };
  const assets = setupDraft.assets.filter((asset) => asset.type && asset.country).map((asset, index) => ({ id: asset.id || `asset-${asset.type}-${index}`, type: asset.type, label: String(asset.label || "").trim() || assetTypeLabel(asset.type), country: asset.country, ownerId: person.id, details: "" }));
  return { people: [person], assets };
}

async function finishSetup() {
  const graph = graphFromDraft(); const selected = new Set([...document.querySelectorAll('input[name="catalog-suggestion"]:checked')].map((input) => input.value));
  const matches = matchCatalog(graph).filter((match) => selected.has(`${match.entry.id}|${match.subjectId || ""}|${match.assetId || ""}`));
  const legacyItems = matches.map((match) => makeItemFromCatalog(match, { title: localized(match.entry.title, setupDraft.locale), reason: localized(match.entry.summary, setupDraft.locale), catalogVersion: CATALOG_VERSION, person: graph.people.find((person) => person.id === match.subjectId)?.name || "" }));
  state = migrateDomainState({ ...defaultState(), version: 4, onboarded: true, locale: setupDraft.locale, profile: { goal: setupDraft.goal, activeCountries: [] }, people: graph.people, assets: graph.assets, items: legacyItems });
  for (const role of state.assetPersonRoles) {
    const draft = setupDraft.assets.find((asset) => asset.id === role.assetId);
    role.role = draft?.role || "owner";
  }
  state.items = state.items.map((item) => ({ ...item, applicability: "candidate" }));
  syncActiveCountries(); await persistState(); activeView = "plan"; render(); announce(tx("Registry created.", "Реестр создан.", "Reyestr yaratildi."));
}

function viewHeader(eyebrow, title, copy, actions = "item") {
  const buttons = actions === "item" ? `<button class="primary-button compact" data-action="add-item">${icon("plus", 17)} ${t(state.locale, "addDeadline")}</button>` : actions === "plan" ? `<div class="header-actions"><button class="secondary-button compact" data-action="export-calendar">${icon("download", 16)} ${t(state.locale, "exportCalendar")}</button><button class="primary-button compact" data-action="add-item">${icon("plus", 17)} ${t(state.locale, "addDeadline")}</button></div>` : actions === "asset" ? `<div class="header-actions"><button class="secondary-button compact" data-action="add-person">${icon("user", 16)} ${t(state.locale, "addPerson")}</button><button class="primary-button compact" data-action="add-asset">${icon("plus", 16)} ${t(state.locale, "addAsset")}</button></div>` : "";
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

function itemActionState(item) {
  if (!parseISODate(item.schedule?.date)) return "date";
  return "scheduled";
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
  const status = getItemStatus(item); const actionState = itemActionState(item); const meta = CATEGORY_META[item.category] || CATEGORY_META.custom; const title = itemTitle(item);
  const subject = item.subjectType === "asset" ? assetName(item.assetId) : item.subjectType === "person" ? personName(item.personId) : tx("Household", "Семья", "Oila");
  const responsible = item.responsiblePersonId && !(item.subjectType === "person" && item.personId === item.responsiblePersonId) ? personName(item.responsiblePersonId) : "";
  const badge = { tone: status.tone, label: statusLabel(status) };
  return `<article class="item-card scope-card"><div class="item-icon category-${item.category}">${icon(meta.icon, 20)}</div><div class="item-main"><div class="item-title-row"><h3>${escapeHTML(title)}</h3><span class="status status-${badge.tone}">${badge.label}</span></div><p class="scope-line"><span>${COUNTRY_META[item.country]?.flag || "🌐"} ${escapeHTML(countryName(item.country))}</span><span>${escapeHTML(subject)}</span>${responsible ? `<span>${tx("Responsible", "Ответственный", "Mas’ul")}: ${escapeHTML(responsible)}</span>` : ""}</p><p class="item-meta">${escapeHTML(scheduleDescription(item))}</p><p class="next-action">${icon("arrow-bend", 15)} ${escapeHTML(nextActionLabel(item))}</p></div><div class="item-actions">${calendar && parseISODate(item.schedule?.date) ? `<button class="icon-button" data-action="calendar-menu" data-id="${item.id}" aria-label="${tx("Calendar options for", "Параметры календаря для", "Kalendar parametrlari")}: ${escapeHTML(title)}">${icon("calendar", 18)}</button>` : ""}<button class="icon-button" data-action="edit-item" data-id="${item.id}" aria-label="${tx("Edit", "Изменить", "Tahrirlash")}: ${escapeHTML(title)}">${icon("edit", 18)}</button></div></article>`;
}

function candidateCard(candidate) {
  const title = itemTitle(candidate);
  const subject = candidate.subjectType === "asset" ? assetName(candidate.assetId) : candidate.subjectType === "person" ? personName(candidate.personId) : tx("Household", "Семья", "Oila");
  return `<article class="item-card scope-card candidate-card"><div class="item-icon category-${candidate.category}">${icon("info", 20)}</div><div class="item-main"><div class="item-title-row"><h3>${escapeHTML(title)}</h3><span class="status status-warning">${tx("Candidate", "Кандидат", "Nomzod")}</span></div><p class="scope-line"><span>${flagForCountry(candidate.country)} ${escapeHTML(countryName(candidate.country))}</span><span>${escapeHTML(subject)}</span></p><p class="item-meta">${escapeHTML(candidate.reason || tx("Matched from a reviewed rule.", "Подобрано по проверенному правилу.", "Tekshirilgan qoida asosida topildi."))}</p></div><div class="candidate-actions"><button class="secondary-button compact" data-action="dismiss-candidate" data-id="${candidate.id}">${tx("Not applicable", "Не применимо", "Tegishli emas")}</button><button class="primary-button compact" data-action="accept-candidate" data-id="${candidate.id}">${tx("Applies", "Применимо", "Tegishli")}</button></div></article>`;
}

function renderGroup(title, subtitle, items) { if (!items.length) return ""; return `<section class="item-group"><div class="section-heading"><div><h2>${title}</h2><p>${subtitle}</p></div><span class="count">${items.length}</span></div><div class="item-list">${items.map((item) => itemCard(item)).join("")}</div></section>`; }

function renderPlan() {
  const filtered = state.items.filter((item) => {
    if (planFilters.country !== "all" && item.country !== planFilters.country) return false;
    if (planFilters.personId !== "all" && item.personId !== planFilters.personId && item.responsiblePersonId !== planFilters.personId) return false;
    const linkedAsset = itemAssetId(item) ? state.assets.find((asset) => asset.id === itemAssetId(item)) : null;
    if (planFilters.assetType !== "all" && linkedAsset?.type !== planFilters.assetType) return false;
    if (planFilters.assetId !== "all" && itemAssetId(item) !== planFilters.assetId) return false;
    const status = getItemStatus(item);
    if (planFilters.status === "confirm") return false;
    if (planFilters.status === "needs" && (item.status !== "active" || parseISODate(item.schedule?.date))) return false;
    if (planFilters.status === "now" && (item.status !== "active" || !["overdue", "now"].includes(status.key))) return false;
    if (planFilters.status === "completed" && item.status !== "completed") return false;
    return true;
  });
  const candidateFiltered = (state.ruleCandidates || []).filter((candidate) => {
    if (candidate.candidateStatus !== "pending") return false;
    if (planFilters.status !== "all" && planFilters.status !== "confirm") return false;
    if (planFilters.country !== "all" && candidate.country !== planFilters.country) return false;
    if (planFilters.personId !== "all" && candidate.personId !== planFilters.personId && candidate.responsiblePersonId !== planFilters.personId) return false;
    const linkedAsset = candidate.assetId ? state.assets.find((asset) => asset.id === candidate.assetId) : null;
    if (planFilters.assetType !== "all" && linkedAsset?.type !== planFilters.assetType) return false;
    if (planFilters.assetId !== "all" && candidate.assetId !== planFilters.assetId) return false;
    return true;
  });
  const dated = sortItems(filtered.filter((item) => parseISODate(item.schedule?.date) && item.status === "active")); const toConfirm = candidateFiltered; const missing = filtered.filter((item) => !parseISODate(item.schedule?.date) && item.status === "active"); const groups = new Map();
  dated.forEach((item) => { const key = getNextOccurrence(item).slice(0, 7); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); });
  const allActive = state.items.filter((item) => item.status === "active");
  const confirmCount = (state.ruleCandidates || []).filter((candidate) => candidate.candidateStatus === "pending").length;
  const needsCount = allActive.filter((item) => !parseISODate(item.schedule?.date)).length;
  const urgency = groupItemsForToday(allActive); const attention = urgency.now.length;
  const title = attention ? tx(`${attention} item${attention === 1 ? "" : "s"} need attention`, `${attention} ${attention === 1 ? "задача требует" : "задачи требуют"} внимания`, `${attention} ta vazifa e’tibor talab qiladi`) : confirmCount ? tx(`${confirmCount} rule${confirmCount === 1 ? "" : "s"} need confirmation`, `${confirmCount} правил нужно уточнить`, `${confirmCount} ta qoidani tasdiqlash kerak`) : needsCount ? tx(`${needsCount} dates need confirmation`, `${needsCount} дат нужно подтвердить`, `${needsCount} ta sanani tasdiqlash kerak`) : tx("Everything is on track", "Всё под контролем", "Hammasi nazoratda");
  const filterCount = [planFilters.country, planFilters.personId, planFilters.assetType, planFilters.assetId].filter((value) => value !== "all").length;
  const completed = filtered.filter((item) => item.status === "completed");
  const visibleGroups = groupItemsForToday(filtered);
  const activeChips = [
    planFilters.country !== "all" ? `<button data-action="clear-plan-filter" data-filter="country">${flagForCountry(planFilters.country)} ${countryName(planFilters.country)} ×</button>` : "",
    planFilters.personId !== "all" ? `<button data-action="clear-plan-filter" data-filter="personId">${escapeHTML(personName(planFilters.personId))} ×</button>` : "",
    planFilters.assetType !== "all" ? `<button data-action="clear-plan-filter" data-filter="assetType">${escapeHTML(assetTypeLabel(planFilters.assetType))} ×</button>` : "",
    planFilters.assetId !== "all" ? `<button data-action="clear-plan-filter" data-filter="assetId">${escapeHTML(assetName(planFilters.assetId))} ×</button>` : "",
  ].filter(Boolean).join("");
  const candidateGroup = toConfirm.length ? `<section class="item-group"><div class="section-heading"><div><h2>${tx("Confirm applicability", "Уточнить применимость", "Tegishliligini tasdiqlash")}</h2><p>${tx("Accepting creates an obligation; dismissing keeps an audit record.", "Подтверждение создаёт обязанность; отклонение сохраняется в истории.", "Qabul qilish majburiyat yaratadi; rad etish tarixda saqlanadi.")}</p></div><span class="count">${toConfirm.length}</span></div><div class="item-list">${toConfirm.map(candidateCard).join("")}</div></section>` : "";
  const checklist = `${renderGroup(t(state.locale, "actNow"), tx("Inside the action window.", "Уже в окне действий.", "Harakat oynasida."), visibleGroups.now)}${candidateGroup}${renderGroup(t(state.locale, "addDates"), tx("Add an exact date to schedule reminders.", "Добавьте точную дату для напоминаний.", "Eslatmalar uchun aniq sanani kiriting."), visibleGroups.missing)}${renderGroup(t(state.locale, "comingUp"), tx("Plan these next.", "Следующие в плане.", "Keyingi reja."), visibleGroups.upcoming)}${renderGroup(t(state.locale, "covered"), tx("Nothing needed now.", "Сейчас ничего не требуется.", "Hozir hech narsa talab qilinmaydi."), visibleGroups.covered)}${renderGroup(tx("Completed", "Завершено", "Bajarildi"), "", completed)}`;
  const timeline = `<div class="timeline">${[...groups.entries()].map(([month, items]) => `<section class="timeline-month"><div class="month-label"><span>${new Intl.DateTimeFormat(state.locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(parseISODate(`${month}-01`))}</span><i></i></div><div class="timeline-items">${items.map((item) => itemCard(item)).join("")}</div></section>`).join("")}</div>${dated.length ? "" : `<div class="mini-empty"><p>${tx("Confirmed dates will appear here.", "Здесь появятся подтверждённые даты.", "Tasdiqlangan sanalar shu yerda ko‘rinadi.")}</p></div>`}${renderGroup(tx("Completed", "Завершено", "Bajarildi"), "", completed.filter((item) => parseISODate(item.schedule?.date)))}`;
  const assetTypes = Object.keys(ASSET_TYPES).filter((type) => state.assets.some((asset) => asset.type === type));
  const eligibleAssets = state.assets.filter((asset) => (planFilters.country === "all" || assetCountry(asset) === planFilters.country) && (planFilters.assetType === "all" || asset.type === planFilters.assetType));
  const countryStrip = `<section class="country-strip">${(state.profile.activeCountries || []).map((country) => `<button data-action="open-catalog-country" data-country="${country}"><span>${flagForCountry(country)}</span><strong>${countryName(country)}</strong><small>${state.items.filter((item) => item.country === country).length} ${tx("tracked", "в плане", "rejada")}</small></button>`).join("")}<button class="add-country" data-action="change-view" data-view="registry">${icon("plus", 18)}<strong>${tx("People & countries", "Люди и страны", "Odamlar va mamlakatlar")}</strong></button></section>`;
  const filterPanel = planFilters.open ? `<aside class="plan-filter-panel"><div class="filter-panel-head"><strong>${tx("Filter the plan", "Фильтры плана", "Reja filtrlari")}</strong><button class="icon-button" data-action="toggle-plan-filters">${icon("close", 17)}</button></div><label><span>${tx("Country", "Страна", "Mamlakat")}</span><select data-plan-filter="country"><option value="all">${tx("All countries", "Все страны", "Barcha mamlakatlar")}</option>${(state.profile.activeCountries || []).map((country) => `<option value="${country}" ${planFilters.country === country ? "selected" : ""}>${flagForCountry(country)} ${countryName(country)}</option>`).join("")}</select></label>${state.people.length > 1 ? `<label><span>${tx("Person", "Человек", "Shaxs")}</span><select data-plan-filter="personId"><option value="all">${tx("Everyone", "Все", "Barchasi")}</option>${state.people.map((person) => `<option value="${person.id}" ${planFilters.personId === person.id ? "selected" : ""}>${escapeHTML(personName(person.id))}</option>`).join("")}</select></label>` : ""}${assetTypes.length ? `<label><span>${tx("Possession type", "Тип имущества", "Mulk turi")}</span><select data-plan-filter="assetType"><option value="all">${tx("All types", "Все типы", "Barcha turlar")}</option>${assetTypes.map((type) => `<option value="${type}" ${planFilters.assetType === type ? "selected" : ""}>${escapeHTML(assetTypeLabel(type))}</option>`).join("")}</select></label><label><span>${tx("Exact possession", "Конкретный объект", "Aniq mulk")}</span><select data-plan-filter="assetId"><option value="all">${tx("All possessions", "Все объекты", "Barcha mulklar")}</option>${eligibleAssets.map((asset) => `<option value="${asset.id}" ${planFilters.assetId === asset.id ? "selected" : ""}>${escapeHTML(displayAssetLabel(asset))} · ${flagForCountry(assetCountry(asset))} ${countryName(assetCountry(asset))}</option>`).join("")}</select></label>` : ""}<button class="secondary-button full" data-action="clear-plan-filters">${tx("Clear filters", "Сбросить фильтры", "Filtrlarni tozalash")}</button></aside>` : "";
  return `${viewHeader(tx("Prioritized across your household", "Приоритеты всей семьи", "Oila bo‘yicha ustuvorliklar"), title, tx("Urgent, unconfirmed, undated, and upcoming obligations in one plan.", "Срочные, неподтверждённые, без даты и предстоящие обязанности — в одном плане.", "Shoshilinch, tasdiqlanmagan, sanasiz va yaqin majburiyatlar bitta rejada."), "plan")}${countryStrip}<div class="plan-toolbar"><div class="segmented"><button class="${planFilters.view === "checklist" ? "active" : ""}" data-action="set-plan-view" data-value="checklist">${tx("Checklist", "Чек-лист", "Ro‘yxat")}</button><button class="${planFilters.view === "timeline" ? "active" : ""}" data-action="set-plan-view" data-value="timeline">${tx("Timeline", "Таймлайн", "Vaqt jadvali")}</button></div><button class="secondary-button compact" data-action="toggle-plan-filters">${icon("sliders", 16)} ${tx("Filters", "Фильтры", "Filtrlar")}${filterCount ? ` (${filterCount})` : ""}</button></div><div class="plan-status-tabs">${[["all", tx("All", "Все", "Barchasi")], ["now", t(state.locale, "actNow")], ["confirm", tx("Confirm", "Уточнить", "Tasdiqlash")], ["needs", t(state.locale, "addDates")], ["completed", tx("Completed", "Завершено", "Bajarildi")]].map(([value, label]) => `<button class="${planFilters.status === value ? "active" : ""}" data-action="set-plan-status" data-value="${value}">${label}</button>`).join("")}</div>${activeChips ? `<div class="active-filter-chips">${activeChips}<button data-action="clear-plan-filters">${tx("Clear all", "Сбросить", "Tozalash")}</button></div>` : ""}${filterPanel}<div class="plan-content">${planFilters.view === "timeline" ? timeline : checklist}</div>${!filtered.length && !candidateFiltered.length ? `<div class="mini-empty"><p>${tx("No obligations match these filters.", "По этим фильтрам ничего не найдено.", "Bu filtrlarga mos majburiyat yo‘q.")}</p><button class="secondary-button compact" data-action="clear-plan-filters">${tx("Clear filters", "Сбросить фильтры", "Filtrlarni tozalash")}</button></div>` : ""}`;
}

function renderRegistry() {
  const documents = state.issuedDocuments || [];
  return `${viewHeader(tx("People, possessions & documents", "Люди, имущество и документы", "Odamlar, mulk va hujjatlar"), t(state.locale, "registry"), tx("Citizenship, current residence, possessions, and issued documents stay separate and directly manageable.", "Гражданство, проживание, имущество и выданные документы хранятся отдельно и редактируются напрямую.", "Fuqarolik, yashash, mulk va berilgan hujjatlar alohida boshqariladi."), "asset")}<div class="registry-grid"><section class="registry-column"><div class="section-heading"><div><h2>${tx("People", "Люди", "Odamlar")}</h2><p>${tx("Citizenship and where each person lives.", "Гражданство и место проживания каждого человека.", "Har bir shaxsning fuqaroligi va yashash joyi.")}</p></div></div>${state.people.map(personCard).join("")}</section><section class="registry-column"><div class="section-heading"><div><h2>${tx("Exact possessions", "Конкретное имущество", "Aniq mulklar")}</h2><p>${tx("Each car, home, land plot, or business gets its own checklist.", "У каждой машины, жилья, участка или бизнеса — свой чек-лист.", "Har bir avtomobil, uy, yer yoki biznesning o‘z ro‘yxati bor.")}</p></div></div>${state.assets.length ? state.assets.map(assetCard).join("") : `<div class="mini-empty"><p>${tx("No possessions yet.", "Имущество пока не добавлено.", "Hali mulk yo‘q.")}</p><button class="secondary-button compact" data-action="add-asset">${t(state.locale, "addAsset")}</button></div>`}</section></div><section class="document-registry"><div class="section-heading"><div><h2>${tx("Issued documents", "Выданные документы", "Berilgan hujjatlar")}</h2><p>${tx("Passports, permits, insurance, registration, and other papers with their printed dates.", "Паспорта, разрешения, страховки, регистрации и другие документы с указанными в них датами.", "Pasportlar, ruxsatnomalar, sug‘urta, ro‘yxat va bosma sanali boshqa hujjatlar.")}</p></div><button class="secondary-button compact" data-action="add-document">${icon("plus", 16)} ${tx("Add document", "Добавить документ", "Hujjat qo‘shish")}</button></div><div class="document-grid">${documents.length ? documents.map(documentCard).join("") : `<div class="mini-empty"><p>${tx("No issued documents yet.", "Выданные документы пока не добавлены.", "Hali berilgan hujjatlar yo‘q.")}</p></div>`}</div></section>`;
}

function documentCard(documentRecord) {
  const subject = documentRecord.subjectType === "asset" ? assetName(documentRecord.assetId) : personName(documentRecord.personId);
  const linked = state.items.find((item) => item.issuedDocumentId === documentRecord.id);
  return `<article class="registry-card document-card"><span class="item-icon category-identity">${icon("bookmark", 19)}</span><div><h3>${escapeHTML(documentRecord.title)}</h3><p>${flagForCountry(documentRecord.country)} ${escapeHTML(countryName(documentRecord.country))} · ${escapeHTML(subject)}</p><small>${documentRecord.validUntil ? `${tx("Valid until", "Действует до", "Amal qiladi")}: ${formatDate(documentRecord.validUntil)}` : tx("No expiry date", "Без даты окончания", "Tugash sanasi yo‘q")}${linked ? ` · ${tx("reminders linked", "напоминания связаны", "eslatmalar bog‘langan")}` : ""}</small></div><button class="icon-button" data-action="edit-document" data-id="${documentRecord.id}" aria-label="${tx("Edit document", "Изменить документ", "Hujjatni tahrirlash")}: ${escapeHTML(documentRecord.title)}">${icon("edit", 18)}</button></article>`;
}

function personCard(person) {
  const name = personName(person.id);
  const citizenships = personCitizenships(person.id).map((country) => `<button class="relation-chip citizenship-chip" data-action="edit-country" data-person-id="${person.id}" data-citizenship-country="${country}"><span>${COUNTRY_META[country]?.flag || "🌐"} ${countryName(country)}</span><small>${tx("Citizen", "Гражданство", "Fuqarolik")}</small></button>`).join("");
  const relations = personContexts(person.id).map((relation) => {
    const route = routeForContext(state, relation.id);
    const period = [relation.startsOn ? formatDate(relation.startsOn, true) : "", relation.endsOn ? formatDate(relation.endsOn, true) : ""].filter(Boolean).join("–");
    const permitExpiry = state.issuedDocuments.find((document) => document.legalRouteId === route?.id && document.validUntil)?.validUntil;
    return `<button class="relation-chip" data-action="edit-country" data-person-id="${person.id}" data-relation-id="${relation.id}"><span>${flagForCountry(relation.country)} ${countryName(relation.country)}</span><small>${relation.contextType === "lives_now" ? tx("Lives here", "Живёт здесь", "Shu yerda yashaydi") : tx("Country context", "Контекст страны", "Mamlakat konteksti")} · ${purposeLabel(relation.purpose)} · ${routeLabel(route?.routeCode || "not_sure")}${period ? ` · ${period}` : ""}${permitExpiry ? ` · ${tx("document until", "документ до", "hujjat tugaydi")} ${formatDate(permitExpiry, true)}` : ""}</small></button>`;
  }).join("");
  return `<article class="person-registry-card"><div class="person-card-head"><span class="avatar">${escapeHTML(name.slice(0, 1).toUpperCase())}</span><div><h3>${escapeHTML(name)}</h3><small>${state.items.filter((item) => item.personId === person.id || item.responsiblePersonId === person.id).length} ${tx("obligations", "обязанностей", "majburiyat")}</small></div><button class="icon-button" data-action="edit-person" data-id="${person.id}" aria-label="${tx("Edit person", "Изменить человека", "Shaxsni tahrirlash")}: ${escapeHTML(name)}">${icon("edit", 18)}</button></div><div class="relation-list">${citizenships}${relations}<button class="relation-chip add-relation" data-action="add-country" data-person-id="${person.id}">${icon("plus", 14)} <span>${tx("Add citizenship or country context", "Добавить гражданство или контекст страны", "Fuqarolik yoki mamlakat kontekstini qo‘shish")}</span></button></div></article>`;
}

function assetCard(asset) {
  const meta = ASSET_TYPES[asset.type] || ASSET_TYPES.other; const country = assetCountry(asset);
  const roles = assetRolesFor(state, asset.id).map((record) => `${personName(record.personId)} · ${assetRoleLabel(record.role)}`).join("; ");
  return `<article class="registry-card"><span class="item-icon category-${asset.type === "vehicle" ? "transport" : asset.type === "business" ? "tax" : asset.type}">${icon(meta.icon, 19)}</span><div><h3>${escapeHTML(displayAssetLabel(asset))}</h3><p>${assetTypeLabel(asset.type)} · ${COUNTRY_META[country]?.flag || "🌐"} ${countryName(country)}</p>${roles ? `<p>${escapeHTML(roles)}</p>` : `<p>${tx("No person role assigned", "Роль человека не назначена", "Shaxs roli belgilanmagan")}</p>`}<small>${state.items.filter((item) => item.assetId === asset.id).length} ${tx("linked obligations", "связанных обязанностей", "bog‘langan majburiyat")}</small></div><button class="icon-button" data-action="edit-asset" data-id="${asset.id}" aria-label="${tx("Edit", "Изменить", "Tahrirlash")}: ${escapeHTML(displayAssetLabel(asset))}">${icon("edit", 18)}</button></article>`;
}

function renderCatalog() {
  const trackedKeys = new Set([
    ...state.items.filter((item) => item.catalogId).map((item) => catalogItemKey(item.catalogId, itemPersonId(item), itemAssetId(item))),
    ...(state.ruleCandidates || []).filter((candidate) => candidate.candidateStatus !== "dismissed").map((candidate) => catalogItemKey(candidate.catalogId, itemPersonId(candidate), itemAssetId(candidate))),
  ]);
  const matched = matchCatalog(catalogGraph(state));
  const related = [...new Set([...(state.citizenships || []).map((record) => record.country), ...(state.countryContexts || []).map((record) => record.country), ...(state.assetJurisdictions || []).map((record) => record.country)])];
  const normalizedQuery = ruleFilters.query.trim().toLocaleLowerCase(state.locale);
  const filtered = REGISTRY_RULES.filter((rule) => {
    if (ruleFilters.country !== "all" && rule.destination_country !== ruleFilters.country) return false;
    if (ruleFilters.tier !== "all" && rule.runtime_tier !== ruleFilters.tier) return false;
    if (!normalizedQuery) return true;
    return [rule.requirement_name, rule.notes, rule.route_code, rule.requirement_type].filter(Boolean).join(" ").toLocaleLowerCase(state.locale).includes(normalizedQuery);
  }).sort((a, b) => {
    const relatedOrder = Number(related.includes(b.destination_country)) - Number(related.includes(a.destination_country));
    if (relatedOrder) return relatedOrder;
    const tierOrder = { ready: 0, confirm: 1, research: 2 };
    return tierOrder[a.runtime_tier] - tierOrder[b.runtime_tier]
      || countryName(a.destination_country).localeCompare(countryName(b.destination_country), state.locale)
      || a.requirement_name.localeCompare(b.requirement_name, state.locale);
  });
  const visible = filtered.slice(0, ruleFilters.limit);
  const countryOptions = REGISTRY_COUNTRIES.slice().sort((a, b) => countryName(a.code).localeCompare(countryName(b.code), state.locale)).map((country) => `<option value="${country.code}" ${ruleFilters.country === country.code ? "selected" : ""}>${country.flag} ${escapeHTML(countryName(country.code))} · ${REGISTRY_RULES.filter((rule) => rule.destination_country === country.code).length}</option>`).join("");
  const relatedButtons = related.map((country) => `<button class="${ruleFilters.country === country ? "active" : ""}" data-country-filter="${country}">${flagForCountry(country)} ${countryName(country)}</button>`).join("");
  const more = visible.length < filtered.length ? `<button class="secondary-button full catalog-load-more" data-action="show-more-rules">${tx(`Show ${Math.min(60, filtered.length - visible.length)} more`, `Показать ещё ${Math.min(60, filtered.length - visible.length)}`, `Yana ${Math.min(60, filtered.length - visible.length)} ta ko‘rsatish`)}</button>` : "";
  return `${viewHeader(tx("42-country registry", "Реестр по 42 странам", "42 mamlakat reyestri"), tx("Rules library", "Библиотека правил", "Qoidalar kutubxonasi"), tx("Verified rules, route mappings, and research guidance are shown separately. Related countries come first.", "Проверенные правила, карты оснований и исследовательские ориентиры разделены. Связанные страны идут первыми.", "Tekshirilgan qoidalar, yo‘nalish xaritalari va tadqiqot ko‘rsatmalari alohida. Tegishli mamlakatlar birinchi."), "none")}<aside class="catalog-scope-note">${icon("info", 18)}<p>${tx("Only verified exact rules can create a trackable candidate automatically. Partial mappings request confirmation; research guidance never creates a deadline.", "Автоматически отслеживаемый кандидат создаётся только из проверенного точного правила. Частичные карты требуют подтверждения; исследовательские ориентиры не создают сроки.", "Faqat tekshirilgan aniq qoida avtomatik kuzatiladigan nomzod yaratadi. Qisman xaritalar tasdiq talab qiladi; tadqiqot ko‘rsatmasi muddat yaratmaydi.")}</p></aside><div class="catalog-summary"><strong>${visible.length} ${tx("of", "из", "dan")} ${filtered.length} ${tx("matching records", "подходящих записей", "mos yozuv")}</strong><span>${REGISTRY_COUNTS.rules} ${tx("registry records", "записей реестра", "reyestr yozuvi")} · ${REGISTRY_COUNTS.sources} ${tx("official sources", "официальных источников", "rasmiy manba")}</span></div><div class="rules-tier-tabs">${[["all", tx("All", "Все", "Barchasi"), REGISTRY_COUNTS.rules], ["ready", tx("Ready to track", "Готово к отслеживанию", "Kuzatishga tayyor"), REGISTRY_COUNTS.ready], ["confirm", tx("Needs confirmation", "Нужно уточнение", "Tasdiq kerak"), REGISTRY_COUNTS.confirm], ["research", tx("Research guidance", "Ориентиры", "Tadqiqot yo‘riqnomasi"), REGISTRY_COUNTS.research]].map(([tier, label, count]) => `<button class="${ruleFilters.tier === tier ? "active" : ""}" data-rule-tier="${tier}">${label} · ${count}</button>`).join("")}</div><div class="rules-filter-bar"><label><span>${tx("Search", "Поиск", "Qidirish")}</span><input type="search" id="rule-search" value="${escapeHTML(ruleFilters.query)}" placeholder="${tx("Document, route, tax, vehicle…", "Документ, основание, налог, транспорт…", "Hujjat, asos, soliq, transport…")}"></label><label><span>${tx("Country", "Страна", "Mamlakat")}</span><select id="rule-country"><option value="all">${tx("All 42 countries", "Все 42 страны", "Barcha 42 mamlakat")}</option>${countryOptions}</select></label></div>${relatedButtons ? `<div class="related-country-buttons"><span>${tx("Related", "Связанные", "Tegishli")}</span><button class="${ruleFilters.country === "all" ? "active" : ""}" data-country-filter="all">${tx("All", "Все", "Barchasi")}</button>${relatedButtons}</div>` : ""}<div class="catalog-grid">${visible.map((rule) => registryRuleCard(rule, trackedKeys, matched)).join("")}</div>${more}${!filtered.length ? `<div class="mini-empty"><p>${tx("No registry records match these filters.", "По этим фильтрам записей нет.", "Bu filtrlarga mos yozuv yo‘q.")}</p></div>` : ""}`;
}

function catalogTargetValue(target) { return `${target.subjectId || ""}|${target.assetId || ""}`; }
function catalogTargetLabel(target) {
  if (target.assetId) return `${assetName(target.assetId)} · ${personName(target.subjectId)}`;
  return personName(target.subjectId);
}

function registryRuleCard(rule, trackedKeys, matchedCatalog) {
  const catalogEntry = CATALOG_BY_REGISTRY_ID.get(rule.rule_id);
  const catalogMatches = catalogEntry ? matchedCatalog.filter((match) => match.entry.id === catalogEntry.id) : [];
  const targets = catalogEntry?.match?.kind === "manual" && catalogEntry.subjectType === "person"
    ? state.people.map((person) => ({ entry: catalogEntry, subjectId: person.id, assetId: null }))
    : catalogMatches;
  const availableTargets = catalogEntry ? targets.filter((target) => !trackedKeys.has(catalogItemKey(catalogEntry.id, target.subjectId, target.assetId))) : [];
  const matched = catalogMatches.length > 0;
  const tracked = targets.length > 0 && availableTargets.length === 0;
  const eligible = availableTargets.length > 0;
  const title = catalogEntry ? localized(catalogEntry.title, state.locale) : rule.requirement_name;
  const summary = catalogEntry ? localized(catalogEntry.summary, state.locale) : rule.notes || rule.exceptions?.[0] || tx("Open the official sources and confirm the exact applicability facts.", "Откройте официальные источники и подтвердите точные условия применимости.", "Rasmiy manbalarni ochib aniq shartlarni tasdiqlang.");
  const tierLabel = rule.runtime_tier === "ready" ? tx("Ready to track", "Готово к отслеживанию", "Kuzatishga tayyor") : rule.runtime_tier === "confirm" ? tx("Needs confirmation", "Нужно уточнение", "Tasdiq kerak") : tx("Research guidance", "Ориентир для исследования", "Tadqiqot yo‘riqnomasi");
  const sources = (rule.source_ids || []).map((sourceId) => REGISTRY_SOURCE_BY_ID.get(sourceId)).filter(Boolean);
  const exceptions = (rule.exceptions || []).filter(Boolean);
  const evidence = (rule.required_evidence || []).filter(Boolean);
  const buttonLabel = tracked ? tx("Tracked", "В плане", "Rejada") : eligible ? tx("Add to plan", "Добавить в план", "Rejaga qo‘shish") : rule.runtime_tier === "ready" ? tx("Add matching facts first", "Сначала добавьте подходящие факты", "Avval mos ma’lumotlarni qo‘shing") : tierLabel;
  const targetControl = availableTargets.length > 1 ? `<label class="catalog-target"><span>${tx("Add for", "Добавить для", "Kim uchun")}</span><select data-catalog-target="${catalogEntry.id}">${availableTargets.map((target) => `<option value="${escapeHTML(catalogTargetValue(target))}">${escapeHTML(catalogTargetLabel(target))}</option>`).join("")}</select></label>` : "";
  const targetValue = availableTargets.length === 1 ? catalogTargetValue(availableTargets[0]) : "";
  const facts = [
    [tx("Type", "Тип", "Turi"), rule.rule_specificity],
    [tx("Requirement", "Требование", "Talab"), rule.requirement_type],
    [tx("Cadence", "Периодичность", "Davriylik"), rule.recurrence],
    [t(state.locale, "lastReviewed"), rule.last_verified],
  ].filter(([, value]) => value);
  const detailList = (titleText, values) => values.length ? `<section class="catalog-detail-section"><h3>${titleText}</h3><ul>${values.map((value) => `<li>${escapeHTML(String(value).replaceAll("_", " "))}</li>`).join("")}</ul></section>` : "";
  const action = catalogEntry ? `<button class="${eligible && !tracked ? "primary-button" : "secondary-button"} compact" data-action="add-catalog" data-id="${catalogEntry.id}" data-target="${escapeHTML(targetValue)}" ${tracked || !eligible ? "disabled" : ""}>${buttonLabel}</button>` : `<span class="rule-permission">${buttonLabel}</span>`;
  return `<article class="catalog-card rule-tier-${rule.runtime_tier} ${matched ? "matched" : ""}" data-catalog-country="${rule.destination_country}"><div class="catalog-card-top"><span class="country-badge">${flagForCountry(rule.destination_country)} ${countryName(rule.destination_country)}</span><div class="catalog-card-state">${matched ? `<span class="match-badge">${icon("check", 13)} ${tx("For you", "Для вас", "Siz uchun")}</span>` : ""}<span class="confidence tier-${rule.runtime_tier}">${tierLabel}</span></div></div><h2>${escapeHTML(title)}</h2><div class="catalog-card-command">${targetControl}${action}</div><details class="catalog-card-details"><summary>${tx("Details", "Подробнее", "Tafsilotlar")}</summary><div class="catalog-card-detail-body"><section class="catalog-detail-section"><h3>${tx("Description", "Описание", "Tavsif")}</h3><p>${escapeHTML(summary)}</p></section><dl>${facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHTML(String(value).replaceAll("_", " "))}</dd></div>`).join("")}</dl>${sources.length ? `<section class="catalog-detail-section"><h3>${tx("Official sources", "Официальные источники", "Rasmiy manbalar")}</h3><div class="source-links">${sources.map((source) => `<a href="${escapeHTML(source.url)}" target="_blank" rel="noopener">${icon("external", 15)} ${escapeHTML(source.authority)}</a>`).join("")}</div></section>` : ""}${detailList(tx("Check applicability", "Проверить применимость", "Tegishliligini tekshiring"), exceptions)}${detailList(tx("Facts to confirm", "Что подтвердить", "Tasdiqlanadigan ma’lumotlar"), evidence)}</div></details></article>`;
}

function renderSettings() {
  const cloudSettings = SAAS_MODE ? `<section class="settings-card"><div class="settings-title"><span class="settings-icon">${icon("cloud", 20)}</span><div><h2>${tx("Private calendar feed", "Личная календарная подписка", "Shaxsiy kalendar obunasi")}</h2><p>${tx("Create a revocable subscription URL for Apple, Google, or Outlook.", "Создайте отзывную ссылку подписки для Apple, Google или Outlook.", "Apple, Google yoki Outlook uchun bekor qilinadigan obuna havolasini yarating.")}</p></div></div><div class="data-actions"><button class="primary-button full" data-action="create-calendar-feed">${icon("calendar", 16)} ${tx("Create feed", "Создать подписку", "Obuna yaratish")}</button><button class="secondary-button full" data-action="revoke-calendar-feeds">${tx("Revoke feeds", "Отозвать ссылки", "Havolalarni bekor qilish")}</button></div></section><section class="settings-card danger-zone"><div class="settings-title"><span class="settings-icon">${icon("shield-check", 20)}</span><div><h2>${tx("Security & account", "Безопасность и аккаунт", "Xavfsizlik va akkaunt")}</h2><p>${tx("Revoke other sessions, export your data, or permanently delete the account.", "Завершите другие сессии, экспортируйте данные или удалите аккаунт.", "Boshqa seanslarni tugating, ma’lumotlarni eksport qiling yoki akkauntni o‘chiring.")}</p></div></div><div class="data-actions"><button class="secondary-button full" data-action="revoke-sessions">${tx("Sign out other sessions", "Завершить другие сессии", "Boshqa seanslardan chiqish")}</button><button class="danger-link full" data-action="delete-cloud-account">${icon("trash", 16)} ${tx("Delete account and data", "Удалить аккаунт и данные", "Akkaunt va ma’lumotlarni o‘chirish")}</button></div></section>` : "";
  return `${viewHeader(tx("Your preferences", "Ваши настройки", "Sozlamalaringiz"), t(state.locale, "settings"), tx("Language, calendar privacy, and portable backups.", "Язык, приватность календаря и переносимые резервные копии.", "Til, kalendar maxfiyligi va ko‘chma zaxira nusxalari."), "none")}<div class="settings-grid"><section class="settings-card"><div class="settings-title"><span class="settings-icon">${icon("globe", 20)}</span><div><h2>${t(state.locale, "interfaceLanguage")}</h2><p>English · Русский · O‘zbekcha</p></div></div><select id="language-select">${SUPPORTED_LOCALES.map((locale) => `<option value="${locale.code}" ${state.locale === locale.code ? "selected" : ""}>${locale.label}</option>`).join("")}</select></section><section class="settings-card"><div class="settings-title"><span class="settings-icon">${icon("calendar", 20)}</span><div><h2>${t(state.locale, "exportCalendar")}</h2><p>${getCalendarEventCount(state.items, state.settings)} ${tx("events over 24 months", "событий на 24 месяца", "24 oylik tadbirlar")}</p></div></div><label class="toggle-row"><span><strong>${tx("Privacy-safe titles", "Безопасные названия", "Maxfiy nomlar")}</strong><small>${tx("Use generic event names in exported calendars.", "Использовать общие названия в экспортированном календаре.", "Eksport qilingan kalendarda umumiy nomlardan foydalanish.")}</small></span><input type="checkbox" data-setting="privacySafeTitles" ${state.settings.privacySafeTitles ? "checked" : ""}><i></i></label><button class="primary-button full" data-action="export-calendar">${icon("download", 16)} ${t(state.locale, "exportCalendar")}</button></section><section class="settings-card"><div class="settings-title"><span class="settings-icon">${icon("database", 20)}</span><div><h2>${tx("Portable backup", "Переносимая копия", "Ko‘chma zaxira")}</h2><p>${tx("Export or restore your household graph as JSON.", "Экспортируйте или восстановите граф семьи в JSON.", "Uy xo‘jaligi grafigini JSON sifatida eksport yoki tiklang.")}</p></div></div><div class="data-actions"><button class="secondary-button full" data-action="backup-data">${icon("download", 16)} ${tx("Export JSON", "Экспорт JSON", "JSON eksport")}</button><button class="secondary-button full" data-action="restore-data">${icon("upload", 16)} ${tx("Import / restore", "Импорт / восстановление", "Import / tiklash")}</button></div></section>${cloudSettings}</div>`;
}

async function createCalendarFeed() {
  const response = await fetch("/api/calendar-feeds", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: "{}" });
  if (!response.ok) { announce(tx("Could not create the feed.", "Не удалось создать подписку.", "Obunani yaratib bo‘lmadi.")); return; }
  const { url } = await response.json();
  try { await navigator.clipboard.writeText(url); announce(tx("Private feed URL copied. Treat it like a password.", "Ссылка подписки скопирована. Храните её как пароль.", "Shaxsiy obuna havolasi nusxalandi. Uni parol kabi saqlang.")); }
  catch { window.prompt(tx("Copy this private feed URL", "Скопируйте личную ссылку подписки", "Shaxsiy obuna havolasini nusxalang"), url); }
}

async function revokeCalendarFeeds() {
  if (!window.confirm(tx("Revoke every active calendar feed URL?", "Отозвать все активные ссылки календаря?", "Barcha faol kalendar havolalari bekor qilinsinmi?"))) return;
  const response = await fetch("/api/calendar-feeds", { method: "DELETE", credentials: "same-origin" });
  announce(response.ok ? tx("Calendar feeds revoked.", "Ссылки календаря отозваны.", "Kalendar havolalari bekor qilindi.") : tx("Could not revoke feeds.", "Не удалось отозвать ссылки.", "Havolalarni bekor qilib bo‘lmadi."));
}

async function revokeOtherSessions() {
  const response = await fetch("/api/account/sessions", { method: "DELETE", credentials: "same-origin" });
  announce(response.ok ? tx("Other sessions signed out.", "Другие сессии завершены.", "Boshqa seanslar tugatildi.") : tx("Could not update sessions.", "Не удалось обновить сессии.", "Seanslarni yangilab bo‘lmadi."));
}

async function deleteCloudAccount() {
  const confirmation = window.prompt(tx("Type DELETE to permanently remove this account and all household data.", "Введите DELETE, чтобы навсегда удалить аккаунт и все данные семьи.", "Akkaunt va barcha ma’lumotlarni butunlay o‘chirish uchun DELETE yozing."));
  if (confirmation !== "DELETE") return;
  const response = await fetch("/api/account", { method: "DELETE", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmation }) });
  if (!response.ok) { announce(tx("Account deletion failed.", "Не удалось удалить аккаунт.", "Akkauntni o‘chirib bo‘lmadi.")); return; }
  window.top.location.href = "/api/auth/signout";
}

function openItemDialog(item = null) {
  const dialog = document.querySelector("#item-dialog"); const form = document.querySelector("#item-form"); form.reset(); clearFormErrors(form);
  form.elements.id.value = item?.id || ""; form.elements.title.value = item?.title || ""; form.elements.category.value = item?.category || "identity";
  form.elements.kind.value = item?.schedule?.kind || "expiry"; form.elements.date.value = item?.schedule?.date || ""; form.elements.frequency.value = item?.schedule?.frequency || "yearly";
  form.elements.reminderInput.value = item?.reminderInput || "";
  form.elements.country.innerHTML = countryOptions(item?.country || state.profile.activeCountries?.[0] || "RU", false);
  form.elements.subjectType.value = item?.subjectType || (state.people.length ? "person" : "household");
  form.elements.personId.innerHTML = state.people.map((person) => `<option value="${person.id}" ${item?.personId === person.id ? "selected" : ""}>${escapeHTML(personName(person.id))}</option>`).join("");
  form.elements.assetId.innerHTML = state.assets.map((asset) => `<option value="${asset.id}" ${item?.assetId === asset.id ? "selected" : ""}>${escapeHTML(displayAssetLabel(asset))} · ${countryName(assetCountry(asset))}</option>`).join("");
  form.elements.responsiblePersonId.innerHTML = `<option value="">${tx("Not assigned", "Не назначен", "Belgilanmagan")}</option>${state.people.map((person) => `<option value="${person.id}" ${item?.responsiblePersonId === person.id ? "selected" : ""}>${escapeHTML(personName(person.id))}</option>`).join("")}`;
  form.elements.notes.value = item?.notes || "";
  const locked = item?.provenance === "catalog";
  document.querySelector("#item-provenance").hidden = !locked;
  document.querySelector("#item-applicability-field").hidden = true;
  form.elements.applicability.disabled = true;
  form.elements.applicability.value = "confirmed";
  for (const name of ["title", "category", "country", "subjectType", "personId", "assetId"]) form.elements[name].disabled = locked;
  dialog.querySelector("#item-dialog-title").textContent = item ? tx("Edit obligation", "Изменить обязанность", "Majburiyatni o‘zgartirish") : t(state.locale, "addDeadline");
  dialog.querySelector("#delete-item").hidden = !item; updateItemSubjectFields(); updateScheduleFields(); updateReminderPreview(); dialog.showModal();
}

function updateDocumentSubjectFields() {
  const form = document.querySelector("#document-form");
  const isAsset = form.elements.subjectType.value === "asset";
  document.querySelector("#document-person-field").hidden = isAsset;
  document.querySelector("#document-asset-field").hidden = !isAsset;
  form.elements.personId.disabled = isAsset;
  form.elements.assetId.disabled = !isAsset;
  document.querySelector("#document-reminder-field").hidden = !form.elements.validUntil.value;
}

function openDocumentDialog(documentRecord = null) {
  const form = document.querySelector("#document-form");
  form.reset(); clearFormErrors(form);
  form.elements.id.value = documentRecord?.id || "";
  form.elements.title.value = documentRecord?.title || "";
  form.elements.documentType.value = documentRecord?.documentType || "identity";
  form.elements.country.innerHTML = countryOptions(documentRecord?.country || state.profile.activeCountries?.[0] || "RU", false);
  form.elements.subjectType.value = documentRecord?.subjectType || "person";
  form.elements.personId.innerHTML = state.people.map((person) => `<option value="${person.id}" ${documentRecord?.personId === person.id ? "selected" : ""}>${escapeHTML(personName(person.id))}</option>`).join("");
  form.elements.assetId.innerHTML = state.assets.map((asset) => `<option value="${asset.id}" ${documentRecord?.assetId === asset.id ? "selected" : ""}>${escapeHTML(displayAssetLabel(asset))} · ${escapeHTML(countryName(assetCountry(asset)))}</option>`).join("");
  form.elements.issuedOn.value = documentRecord?.issuedOn || "";
  form.elements.validUntil.value = documentRecord?.validUntil || "";
  const linked = documentRecord ? state.items.find((item) => item.issuedDocumentId === documentRecord.id) : null;
  form.elements.reminderInput.value = linked?.reminderInput || "180/60/14/1";
  document.querySelector("#document-dialog-title").textContent = documentRecord ? tx("Edit issued document", "Изменить документ", "Berilgan hujjatni tahrirlash") : tx("Add issued document", "Добавить документ", "Berilgan hujjatni qo‘shish");
  document.querySelector("#delete-document").hidden = !documentRecord;
  updateDocumentSubjectFields();
  document.querySelector("#document-dialog").showModal();
}

async function saveDocument() {
  const form = document.querySelector("#document-form"); const data = new FormData(form); clearFormErrors(form);
  const title = String(data.get("title") || "").trim(); const validUntil = String(data.get("validUntil") || ""); const issuedOn = String(data.get("issuedOn") || "");
  const errors = [];
  if (!title) errors.push({ name: "title", message: tx("Add a document name.", "Добавьте название документа.", "Hujjat nomini kiriting.") });
  if (issuedOn && validUntil && validUntil < issuedOn) errors.push({ name: "validUntil", message: tx("Expiry must be after the issue date.", "Дата окончания должна быть позже даты выдачи.", "Tugash sanasi berilgan sanadan keyin bo‘lishi kerak.") });
  const subjectType = data.get("subjectType");
  if (subjectType === "person" && !data.get("personId")) errors.push({ name: "personId", message: tx("Choose a person.", "Выберите человека.", "Shaxsni tanlang.") });
  if (subjectType === "asset" && !data.get("assetId")) errors.push({ name: "assetId", message: tx("Choose a possession.", "Выберите имущество.", "Mulkni tanlang.") });
  let reminderOffsets = [];
  if (validUntil) {
    try { reminderOffsets = parseReminderSequence(String(data.get("reminderInput") || "")); }
    catch (error) { errors.push({ name: "reminderInput", message: validationMessage(error.message) }); }
  }
  if (showFormErrors(form, errors)) return;
  const existing = state.issuedDocuments.find((documentRecord) => documentRecord.id === data.get("id"));
  const documentId = existing?.id || createId("document");
  const record = { ...(existing || {}), id: documentId, subjectType, personId: subjectType === "person" ? data.get("personId") : null, assetId: subjectType === "asset" ? data.get("assetId") : null, country: data.get("country"), documentType: data.get("documentType"), title, status: validUntil && validUntil < toISODate(new Date()) ? "expired" : "active", issuedOn, validUntil, confirmation: "user_confirmed" };
  state.issuedDocuments = existing ? state.issuedDocuments.map((entry) => entry.id === documentId ? record : entry) : [...state.issuedDocuments, record];
  const linked = state.items.find((item) => item.issuedDocumentId === documentId);
  if (validUntil) {
    const timestamp = new Date().toISOString();
    const obligation = { ...(linked || {}), id: linked?.id || createId("document-expiry"), title: `${title} · ${tx("expiry", "окончание", "tugash")}`, category: ["registration", "insurance", "inspection"].includes(record.documentType) ? "transport" : record.documentType === "tax" ? "tax" : record.documentType === "immigration_status" ? "residence" : "identity", country: record.country, jurisdiction: record.country, subjectType: record.subjectType, personId: record.personId, assetId: record.assetId, responsiblePersonId: record.personId || primaryAssetPerson(state, record.assetId)?.personId || null, issuedDocumentId: documentId, provenance: "document", confirmation: "confirmed", applicability: "confirmed", schedule: { kind: "expiry", date: validUntil, frequency: "yearly", interval: 1 }, reminderInput: formatReminderSequence(reminderOffsets), reminderOffsets, status: "active", notes: "", createdAt: linked?.createdAt || timestamp, updatedAt: timestamp };
    state.items = linked ? state.items.map((item) => item.id === linked.id ? obligation : item) : [...state.items, obligation];
  } else if (linked) {
    state.items = state.items.filter((item) => item.id !== linked.id);
  }
  syncActiveCountries();
  await persistState(); document.querySelector("#document-dialog").close(); render(); announce(tx("Document saved.", "Документ сохранён.", "Hujjat saqlandi."));
}

async function deleteDocument() {
  const id = document.querySelector("#document-form").elements.id.value; if (!id) return;
  if (!window.confirm(tx("Remove this document and its linked expiry reminder?", "Удалить документ и связанное напоминание об окончании?", "Hujjat va bog‘langan tugash eslatmasi o‘chirilsinmi?"))) return;
  state.issuedDocuments = state.issuedDocuments.filter((documentRecord) => documentRecord.id !== id);
  state.items = state.items.filter((item) => item.issuedDocumentId !== id);
  await persistState(); document.querySelector("#document-dialog").close(); render(); announce(tx("Document removed.", "Документ удалён.", "Hujjat olib tashlandi."));
}

function updateItemSubjectFields() {
  const form = document.querySelector("#item-form"); const subjectType = form.elements.subjectType.value;
  document.querySelector("#item-person-field").hidden = subjectType !== "person";
  document.querySelector("#item-asset-field").hidden = subjectType !== "asset";
  document.querySelector("#item-responsible-field").hidden = state.people.length < 2;
}
function updateScheduleFields() {
  const form = document.querySelector("#item-form");
  form.querySelector("#frequency-field").hidden = form.elements.kind.value !== "recurring";
  document.querySelector("#item-reminder-fields").hidden = !parseISODate(form.elements.date.value);
}
function updateReminderPreview() {
  const form = document.querySelector("#item-form"); const output = document.querySelector("#reminder-preview");
  try {
    const offsets = parseReminderSequence(form.elements.reminderInput.value); const date = form.elements.date.value;
    output.className = "reminder-preview valid";
    output.textContent = date ? offsets.map((offset) => `${offset} → ${formatDate(toISODate(addDays(date, -offset)), true)}`).join(" · ") : offsets.map((offset) => `${offset}d`).join(" · ");
  } catch (error) { output.className = "reminder-preview invalid"; output.textContent = validationMessage(error.message); }
}

function assetJurisdictionRoleForType(type) { return type === "vehicle" ? "registration" : type === "business" ? "incorporation" : "location"; }

function updateAssetTypeFields() {
  const form = document.querySelector("#asset-form"); const type = form.elements.type.value;
  for (const field of document.querySelectorAll("#asset-type-fields [data-asset-types]")) field.hidden = !field.dataset.assetTypes.split(" ").includes(type);
  document.querySelector("#asset-country-label").textContent = type === "vehicle" ? tx("Registered in", "Зарегистрировано в", "Ro‘yxatdan o‘tgan") : type === "business" ? tx("Established in", "Зарегистрирован в", "Tashkil etilgan") : tx("Located in", "Находится в", "Joylashgan");
}

function addAssetRoleRow(record = {}) {
  const list = document.querySelector("#asset-role-list");
  const row = document.createElement("div"); row.className = "form-grid role-row";
  row.innerHTML = `<label><span>${tx("Person", "Человек", "Shaxs")}</span><select name="rolePersonId">${state.people.map((person) => `<option value="${person.id}" ${record.personId === person.id ? "selected" : ""}>${escapeHTML(personName(person.id))}</option>`).join("")}</select></label><label><span>${tx("Role", "Роль", "Rol")}</span><select name="roleType">${ASSET_PERSON_ROLES.map((role) => `<option value="${role}" ${record.role === role ? "selected" : ""}>${assetRoleLabel(role)}</option>`).join("")}</select></label><label class="asset-share-field"><span>${tx("Share %", "Доля %", "Ulush %")}</span><input type="number" name="roleShare" min="0.01" max="100" step="0.01" value="${escapeHTML(record.sharePercent || "")}"></label><button type="button" class="icon-button row-remove" data-action="remove-dynamic-row" aria-label="${tx("Remove role", "Удалить роль", "Rolni olib tashlash")}">${icon("close", 16)}</button>`;
  list.append(row);
  updateAssetRoleRow(row);
}

function updateAssetRoleRow(row) {
  const role = row.querySelector('[name="roleType"]')?.value;
  const shareField = row.querySelector(".asset-share-field");
  if (shareField) shareField.hidden = !["owner", "co_owner"].includes(role);
}

function addAssetJurisdictionRow(record = {}) {
  const list = document.querySelector("#asset-jurisdiction-list");
  const row = document.createElement("div"); row.className = "form-grid role-row";
  row.innerHTML = `<label><span>${tx("Country", "Страна", "Mamlakat")}</span><select name="jurisdictionCountry">${countryOptions(record.country || "", false)}</select></label><label><span>${tx("Connection", "Связь", "Bog‘lanish")}</span><select name="jurisdictionRole">${[["location", tx("Location", "Местонахождение", "Joylashuv")], ["registration", tx("Registration", "Регистрация", "Ro‘yxat")], ["tax", tx("Tax", "Налог", "Soliq")], ["use", tx("Use", "Использование", "Foydalanish")], ["ownership", tx("Ownership", "Собственность", "Egalik")], ["incorporation", tx("Incorporation", "Регистрация бизнеса", "Biznes ro‘yxati")], ["other", tx("Other", "Другое", "Boshqa")]].map(([role, label]) => `<option value="${role}" ${record.role === role ? "selected" : ""}>${label}</option>`).join("")}</select></label><button type="button" class="icon-button row-remove" data-action="remove-dynamic-row" aria-label="${tx("Remove country", "Удалить страну", "Mamlakatni olib tashlash")}">${icon("close", 16)}</button>`;
  list.append(row);
}

function personFormCitizenships() {
  return [...document.querySelectorAll('#person-citizenship-list [name="citizenshipCountry"]')].map((input) => input.value).filter(Boolean);
}

function renderPersonCitizenshipRows(countries = personFormCitizenships()) {
  const list = document.querySelector("#person-citizenship-list"); if (!list) return;
  const uniqueCountries = [...new Set(countries.filter(Boolean))];
  list.innerHTML = uniqueCountries.length ? uniqueCountries.map((country, index) => `<div class="country-chip-edit"><input type="hidden" name="citizenshipCountry" value="${escapeHTML(country)}">${countryPickerButton(country, `person-citizenship-${index}`, { exclude: uniqueCountries.filter((_, itemIndex) => itemIndex !== index) })}<button type="button" class="icon-button" data-action="remove-person-citizenship" data-index="${index}" aria-label="${tx("Remove citizenship", "Удалить гражданство", "Fuqarolikni olib tashlash")}">${icon("close", 16)}</button></div>`).join("") : `<p class="form-note">${tx("No citizenship added yet.", "Гражданство пока не добавлено.", "Hali fuqarolik qo‘shilmagan.")}</p>`;
}

function openAssetDialog(asset = null) {
  const form = document.querySelector("#asset-form"); form.reset(); clearFormErrors(form); form.elements.id.value = asset?.id || ""; form.elements.type.value = asset?.type || ""; form.elements.label.value = asset?.label || "";
  form.elements.vehicleIdentifierSuffix.value = asset?.facts?.vehicleIdentifierSuffix || "";
  form.elements.vehicleClass.value = asset?.facts?.vehicleClass || "";
  form.elements.vehicleUse.value = asset?.facts?.vehicleUse || "";
  form.elements.vehicleFirstRegisteredOn.value = asset?.facts?.vehicleFirstRegisteredOn || "";
  form.elements.vehiclePlateStatus.value = asset?.facts?.vehiclePlateStatus || "";
  form.elements.vehicleImportStatus.value = asset?.facts?.vehicleImportStatus || "";
  form.elements.propertyUse.value = asset?.facts?.propertyUse || "";
  form.elements.businessForm.value = asset?.facts?.businessForm || "";
  form.elements.country.value = asset ? assetCountry(asset) : state.profile.activeCountries?.[0] || "";
  updateCountryPickerButton(document.querySelector("#asset-country-picker"), form.elements.country.value);
  const roleList = document.querySelector("#asset-role-list"); roleList.innerHTML = "";
  const roles = asset ? assetRolesFor(state, asset.id) : state.people[0] ? [{ personId: state.people[0].id, role: "owner" }] : [];
  roles.forEach(addAssetRoleRow);
  const jurisdictionList = document.querySelector("#asset-jurisdiction-list"); jurisdictionList.innerHTML = "";
  if (asset) (state.assetJurisdictions || []).filter((record) => record.assetId === asset.id && !record.isPrimary).forEach(addAssetJurisdictionRow);
  updateAssetTypeFields();
  document.querySelector("#asset-dialog-title").textContent = asset ? tx("Edit possession", "Изменить имущество", "Mulkni o‘zgartirish") : t(state.locale, "addAsset"); document.querySelector("#delete-asset").hidden = !asset; document.querySelector("#asset-dialog").showModal();
}

function openPersonDialog(person = null) {
  const form = document.querySelector("#person-form"); const primaryRelation = person ? personContexts(person.id).find((item) => item.contextType === "lives_now") || personContexts(person.id)[0] : null; form.reset(); clearFormErrors(form); form.elements.id.value = person?.id || ""; form.elements.name.value = person?.name || "";
  const citizenships = person ? personCitizenships(person.id) : [];
  renderPersonCitizenshipRows(citizenships);
  form.elements.residence.value = primaryRelation?.country || "";
  const residencePicker = document.querySelector("#person-residence-picker"); residencePicker.dataset.countryExclude = ""; updateCountryPickerButton(residencePicker, form.elements.residence.value);
  document.querySelector("#person-dialog-title").textContent = person ? tx("Edit person", "Изменить человека", "Shaxsni o‘zgartirish") : t(state.locale, "addPerson"); document.querySelector("#person-dialog").showModal();
}

function updateCountryRelationFields() {
  const form = document.querySelector("#country-form");
  const isCitizenship = form.elements.recordKind.value === "citizenship";
  document.querySelector("#country-relation-fields").hidden = isCitizenship;
  for (const input of document.querySelectorAll("#country-relation-fields input, #country-relation-fields select, #country-relation-fields textarea")) input.disabled = isCitizenship;
  updateCountryContextFields();
}

function updateCountryContextFields() {
  const form = document.querySelector("#country-form"); if (!form) return;
  const isCitizenship = form.elements.recordKind.value === "citizenship";
  const purposeRelevant = ["lives_now", "physical_stay", "planned_trip", "planned_move"].includes(form.elements.contextType.value);
  const hasCountry = Boolean(form.elements.country.value);
  document.querySelector("#context-purpose-field").hidden = isCitizenship || !purposeRelevant || !hasCountry;
  form.elements.purpose.disabled = isCitizenship || !purposeRelevant || !hasCountry;
  if (!purposeRelevant) form.elements.purpose.value = "unknown";
  updateCountryRecordRouteOptions();
}

function updateCountryPurposeOptions() {
  const form = document.querySelector("#country-form"); if (!form?.elements?.purpose) return;
  const person = state.people.find((entry) => entry.id === form.elements.personId.value);
  const citizenships = person ? personCitizenships(person.id) : [];
  const current = form.elements.purpose.value || "unknown";
  const selected = current !== "unknown" && routeChoices(form.elements.country.value, current, citizenships).every((route) => route === "not_sure") ? "unknown" : current;
  form.elements.purpose.innerHTML = purposeOptions(selected, true, form.elements.country.value, citizenships);
  form.elements.purpose.value = [...form.elements.purpose.options].some((option) => option.value === selected) ? selected : "unknown";
  updateCountryContextFields();
}

function updateIssuedStatusFields() {
  const form = document.querySelector("#country-form");
  const fields = document.querySelector("#issued-status-fields");
  const availability = document.querySelector("#has-issued-document-field");
  fields.hidden = availability.hidden || !form.elements.hasDocument.checked;
  for (const input of fields.querySelectorAll("input")) input.disabled = fields.hidden;
}

function updateCountryRecordRouteOptions() {
  const form = document.querySelector("#country-form"); if (!form?.elements?.route) return;
  const person = state.people.find((entry) => entry.id === form.elements.personId.value);
  const citizenships = person ? personCitizenships(person.id) : [];
  const choices = routeChoices(form.elements.country.value, form.elements.purpose.value, citizenships);
  const selected = choices.includes(form.elements.route.value) ? form.elements.route.value : "not_sure";
  form.elements.route.innerHTML = routeOptions(form.elements.country.value, form.elements.purpose.value, citizenships, selected);
  const isCitizen = citizenships.includes(form.elements.country.value);
  const purposeRelevant = ["lives_now", "physical_stay", "planned_trip", "planned_move"].includes(form.elements.contextType.value);
  document.querySelector("#route-field").hidden = isCitizen || !purposeRelevant || form.elements.purpose.value === "unknown";
  form.elements.route.disabled = document.querySelector("#route-field").hidden;
  if (isCitizen) form.elements.route.innerHTML = `<option value="citizen" selected>${escapeHTML(routeLabel("citizen"))}</option>`;
  updateRoutePartyFields();
}

function updateRoutePartyFields() {
  const form = document.querySelector("#country-form"); const purpose = form.elements.purpose.value; const route = form.elements.route.value;
  const routeHidden = document.querySelector("#route-field").hidden;
  document.querySelector("#route-stage-field").hidden = routeHidden || !route || route === "not_sure" || route === "citizen";
  form.elements.routeStage.disabled = document.querySelector("#route-stage-field").hidden;
  for (const field of document.querySelectorAll("#route-party-fields [data-route-party]")) {
    const party = field.dataset.routeParty;
    field.hidden = routeHidden || route === "not_sure" || !((party === "employer" && purpose === "work") || (party === "institution" && purpose === "study") || (party === "sponsor" && purpose === "family") || (party === "principal" && purpose === "family" && state.people.length > 1));
    for (const input of field.querySelectorAll("input, select")) input.disabled = field.hidden;
  }
  const relationshipField = document.querySelector("#principal-relationship-field");
  const principalField = document.querySelector('[data-route-party="principal"]');
  relationshipField.hidden = principalField.hidden || !form.elements.principalPersonId.value;
  form.elements.relationshipType.disabled = relationshipField.hidden;
  const documentField = document.querySelector("#has-issued-document-field");
  documentField.hidden = routeHidden || !route || route === "not_sure" || route === "citizen";
  form.elements.hasDocument.disabled = documentField.hidden;
  if (documentField.hidden) form.elements.hasDocument.checked = false;
  updateIssuedStatusFields();
}

function openCountryDialog(personId, relationId = "", citizenshipCountry = "") {
  const person = state.people.find((entry) => entry.id === personId); if (!person) return;
  const relation = relationId ? state.countryContexts.find((entry) => entry.id === relationId) : null;
  const route = relation ? routeForContext(state, relation.id) : null;
  const form = document.querySelector("#country-form"); form.reset(); clearFormErrors(form);
  form.elements.personId.value = personId; form.elements.relationId.value = relation?.id || ""; form.elements.originalCountry.value = citizenshipCountry || "";
  form.elements.recordKind.value = citizenshipCountry ? "citizenship" : "relationship";
  form.elements.country.value = citizenshipCountry || relation?.country || "";
  form.elements.contextType.value = relation?.contextType || "planned_move";
  form.elements.purpose.innerHTML = purposeOptions(relation?.purpose || "unknown", true, form.elements.country.value, personCitizenships(person.id)); form.elements.purpose.value = relation?.purpose || "unknown";
  form.elements.route.innerHTML = routeOptions(form.elements.country.value, form.elements.purpose.value, personCitizenships(person.id), route?.routeCode || "not_sure");
  form.elements.routeStage.value = route?.stage || "exploring";
  form.elements.principalPersonId.innerHTML = `<option value="">${tx("Not selected", "Не выбран", "Tanlanmagan")}</option>${state.people.filter((entry) => entry.id !== personId).map((entry) => `<option value="${entry.id}">${escapeHTML(personName(entry.id))}</option>`).join("")}`;
  form.elements.principalPersonId.value = route?.principalPersonId || "";
  const familyRelationship = state.personRelationships.find((record) => record.fromPersonId === personId && record.toPersonId === route?.principalPersonId && !record.endsOn);
  form.elements.relationshipType.value = familyRelationship?.relationshipType || "other";
  form.elements.startsOn.value = relation?.startsOn || ""; form.elements.endsOn.value = relation?.endsOn || "";
  const statusDocument = route ? state.issuedDocuments.find((document) => document.legalRouteId === route.id) : null; form.elements.hasDocument.checked = Boolean(statusDocument);
  form.elements.statusLabel.value = statusDocument?.title || ""; form.elements.documentValidFrom.value = statusDocument?.validFrom || ""; form.elements.printedExpiry.value = statusDocument?.validUntil || ""; form.elements.note.value = relation?.note || "";
  for (const party of state.routeParties.filter((record) => record.legalRouteId === route?.id)) {
    if (party.partyType === "employer") form.elements.employerLabel.value = party.label;
    if (party.partyType === "institution") form.elements.institutionLabel.value = party.label;
    if (party.partyType === "sponsor") form.elements.sponsorLabel.value = party.label;
  }
  const picker = document.querySelector("#country-record-picker"); picker.dataset.countryExclude = personCitizenships(person.id).filter((country) => country !== citizenshipCountry).join(","); updateCountryPickerButton(picker, form.elements.country.value);
  const editing = Boolean(relation || citizenshipCountry); document.querySelector("#country-dialog-title").textContent = citizenshipCountry ? tx("Edit citizenship", "Изменить гражданство", "Fuqarolikni tahrirlash") : relation ? tx("Edit country context", "Изменить контекст страны", "Mamlakat kontekstini tahrirlash") : tx("Add another country context", "Добавить ещё один контекст страны", "Yana mamlakat kontekstini qo‘shish");
  document.querySelector("#delete-country-relation").hidden = !editing; updateCountryRelationFields(); updateIssuedStatusFields(); document.querySelector("#country-dialog").showModal();
}

async function saveItem() {
  const form = document.querySelector("#item-form"); const data = new FormData(form); let offsets;
  clearFormErrors(form);
  const reminderInput = String(data.get("reminderInput") || "").trim();
  const confirmedDate = String(data.get("date") || "");
  try { offsets = confirmedDate ? parseReminderSequence(reminderInput) : []; } catch (error) { showFormErrors(form, [{ name: "reminderInput", message: validationMessage(error.message) }]); return; }
  const id = data.get("id"); const existing = state.items.find((item) => item.id === id); const title = existing?.provenance === "catalog" ? existing.title : String(data.get("title") || "").trim();
  if (!title) { showFormErrors(form, [{ name: "title", message: tx("Add a name.", "Добавьте название.", "Nom kiriting.") }]); return; }
  const timestamp = new Date().toISOString();
  const subjectType = existing?.provenance === "catalog" ? existing.subjectType : data.get("subjectType");
  const applicability = "confirmed";
  const item = { ...(existing || {}), id: existing?.id || createId("custom"), title, category: existing?.provenance === "catalog" ? existing.category : data.get("category"), country: existing?.provenance === "catalog" ? existing.country : data.get("country"), jurisdiction: existing?.provenance === "catalog" ? existing.country : data.get("country"), subjectType, personId: subjectType === "person" ? (existing?.provenance === "catalog" ? existing.personId : data.get("personId")) : null, assetId: subjectType === "asset" ? (existing?.provenance === "catalog" ? existing.assetId : data.get("assetId")) : null, responsiblePersonId: data.get("responsiblePersonId") || (subjectType === "person" ? (existing?.personId || data.get("personId")) : null), provenance: existing?.provenance || "user", confirmation: "confirmed", applicability, schedule: { kind: data.get("kind"), date: confirmedDate, frequency: data.get("frequency") || "yearly", interval: 1 }, reminderInput, reminderOffsets: offsets, status: applicability === "not_applicable" ? "paused" : existing?.status === "paused" ? "active" : existing?.status || "active", notes: String(data.get("notes") || "").trim().slice(0, 500), createdAt: existing?.createdAt || timestamp, updatedAt: timestamp };
  if (!validateSubject(item)) { showFormErrors(form, [{ name: "subjectType", message: tx("Choose exactly one subject.", "Выберите ровно один предмет обязанности.", "Faqat bitta majburiyat obyektini tanlang.") }]); return; }
  state.items = existing ? state.items.map((entry) => entry.id === existing.id ? item : entry) : [...state.items, item];
  await persistState(); document.querySelector("#item-dialog").close(); render(); announce(tx("Saved.", "Сохранено.", "Saqlandi."));
}

async function acceptCandidate(candidateId) {
  const candidate = (state.ruleCandidates || []).find((entry) => entry.id === candidateId && entry.candidateStatus === "pending");
  if (!candidate) return;
  const timestamp = new Date().toISOString();
  const { candidateStatus, decidedAt, applicability: ignoredApplicability, ...base } = candidate;
  const obligation = {
    ...base,
    id: createId("obligation"),
    sourceCandidateId: candidate.id,
    applicability: "confirmed",
    status: "active",
    updatedAt: timestamp,
  };
  candidate.candidateStatus = "accepted";
  candidate.decidedAt = timestamp;
  candidate.obligationId = obligation.id;
  state.items.push(obligation);
  await persistState();
  render();
  openItemDialog(obligation);
}

async function dismissCandidate(candidateId) {
  const candidate = (state.ruleCandidates || []).find((entry) => entry.id === candidateId && entry.candidateStatus === "pending");
  if (!candidate) return;
  candidate.candidateStatus = "dismissed";
  candidate.decidedAt = new Date().toISOString();
  await persistState();
  render();
  announce(tx("Candidate dismissed and kept in the audit history.", "Кандидат отклонён и сохранён в истории.", "Nomzod rad etildi va tarixda saqlandi."));
}

async function saveAsset() {
  const form = document.querySelector("#asset-form"); const data = new FormData(form); const id = data.get("id"); const existing = state.assets.find((asset) => asset.id === id);
  clearFormErrors(form);
  const errors = [];
  if (!data.get("type")) errors.push({ name: "type", message: tx("Choose a possession type.", "Выберите тип имущества.", "Mulk turini tanlang.") });
  if (!data.get("country")) errors.push({ name: "country", message: tx("Choose the possession’s country.", "Выберите страну имущества.", "Mulk mamlakatini tanlang.") });
  if (showFormErrors(form, errors)) return;
  const assetId = existing?.id || createId("asset");
  const facts = {};
  if (data.get("vehicleIdentifierSuffix")) facts.vehicleIdentifierSuffix = String(data.get("vehicleIdentifierSuffix")).trim();
  for (const field of ["vehicleClass", "vehicleUse", "vehicleFirstRegisteredOn", "vehiclePlateStatus", "vehicleImportStatus"]) {
    if (data.get(field)) facts[field] = String(data.get(field));
  }
  if (data.get("propertyUse")) facts.propertyUse = data.get("propertyUse");
  if (data.get("businessForm")) facts.businessForm = String(data.get("businessForm")).trim();
  const asset = { id: assetId, type: data.get("type"), subtype: existing?.subtype || "", label: String(data.get("label") || "").trim() || assetTypeLabel(data.get("type")), status: existing?.status || "active", facts };
  state.assets = existing ? state.assets.map((entry) => entry.id === existing.id ? asset : entry) : [...state.assets, asset];
  const existingPrimary = primaryAssetJurisdiction(state, assetId);
  const primary = { id: existingPrimary?.id || createId("asset-jurisdiction"), assetId, country: data.get("country"), role: assetJurisdictionRoleForType(asset.type), isPrimary: true };
  const jurisdictionMap = new Map();
  for (const row of form.querySelectorAll("#asset-jurisdiction-list .role-row")) {
    const country = row.querySelector('[name="jurisdictionCountry"]').value; const role = row.querySelector('[name="jurisdictionRole"]').value;
    if (country && !(country === primary.country && role === primary.role)) jurisdictionMap.set(`${country}|${role}`, { id: createId("asset-jurisdiction"), assetId, country, role, isPrimary: false });
  }
  const additional = [...jurisdictionMap.values()];
  state.assetJurisdictions = [...state.assetJurisdictions.filter((record) => record.assetId !== assetId), primary, ...additional];
  const roleMap = new Map();
  for (const row of form.querySelectorAll("#asset-role-list .role-row")) {
    const personId = row.querySelector('[name="rolePersonId"]').value; const role = row.querySelector('[name="roleType"]').value;
    const shareValue = row.querySelector('[name="roleShare"]')?.value; const sharePercent = ["owner", "co_owner"].includes(role) && shareValue ? Number(shareValue) : null;
    if (personId) roleMap.set(`${personId}|${role}`, { id: createId("asset-role"), assetId, personId, role, sharePercent });
  }
  const roles = [...roleMap.values()];
  state.assetPersonRoles = [...state.assetPersonRoles.filter((record) => record.assetId !== assetId), ...roles];
  syncActiveCountries();
  reconcileCatalogItems();
  await persistState(); document.querySelector("#asset-dialog").close(); render(); announce(tx("Possession saved.", "Имущество сохранено.", "Mulk saqlandi."));
}

async function deleteAsset() {
  const id = document.querySelector("#asset-form").elements.id.value; if (!id) return;
  state = removeAssetAndLinkedItems(state, id); syncActiveCountries();
  await persistState(); document.querySelector("#asset-dialog").close(); render(); announce(tx("Possession removed. Custom obligations were kept without the possession link.", "Имущество удалено. Пользовательские обязанности сохранены без привязки к объекту.", "Mulk olib tashlandi. Maxsus majburiyatlar mulk bog‘lanishisiz saqlandi."));
}

async function savePerson() {
  const form = document.querySelector("#person-form"); const data = new FormData(form); const id = data.get("id"); const existing = state.people.find((person) => person.id === id);
  const person = { id: existing?.id || createId("person"), name: String(data.get("name") || "").trim() || tx("Person", "Человек", "Shaxs"), relationship: existing?.relationship || "dependant", birthDate: existing?.birthDate || "" };
  state.people = existing ? state.people.map((entry) => entry.id === existing.id ? person : entry) : [...state.people, person];
  const citizenships = [...new Set(data.getAll("citizenshipCountry").filter(Boolean))];
  const previousCitizenships = new Map(state.citizenships.filter((record) => record.personId === person.id).map((record) => [record.country, record]));
  state.citizenships = state.citizenships.filter((record) => record.personId !== person.id);
  for (const country of citizenships) state.citizenships.push(previousCitizenships.get(country) || { id: createId("citizenship"), personId: person.id, country, confirmation: "user_confirmed" });
  const residence = data.get("residence");
  if (residence) {
    let context = state.countryContexts.find((record) => record.personId === person.id && record.contextType === "lives_now");
    if (!context) { context = { id: createId("context"), personId: person.id, contextType: "lives_now", startsOn: "", endsOn: "", confirmation: "user_confirmed" }; state.countryContexts.push(context); }
    context.country = residence; context.purpose = personCitizenships(person.id).includes(residence) ? "long_term" : "unknown";
    let route = routeForContext(state, context.id);
    if (!route) { route = { id: createId("route"), countryContextId: context.id }; state.legalRoutes.push(route); }
    route.routeCode = personCitizenships(person.id).includes(residence) ? "citizen" : "not_sure"; route.routeFamily = route.routeCode === "citizen" ? "citizen" : "unknown"; route.stage = route.routeCode === "citizen" ? "active" : "exploring"; route.confirmation = route.routeCode === "citizen" ? "user_confirmed" : "unconfirmed";
  }
  syncActiveCountries(); reconcileCatalogItems();
  await persistState(); document.querySelector("#person-dialog").close(); render(); announce(tx("Person saved.", "Человек сохранён.", "Shaxs saqlandi."));
}

async function saveCountryRelation() {
  const form = document.querySelector("#country-form"); const data = new FormData(form); const person = state.people.find((entry) => entry.id === data.get("personId")); const country = data.get("country");
  clearFormErrors(form);
  if (!person || !country) { showFormErrors(form, [{ name: "country", message: tx("Choose a country.", "Выберите страну.", "Mamlakatni tanlang.") }]); return; }
  const relationId = data.get("relationId"); const originalCountry = data.get("originalCountry");
  if (data.get("recordKind") === "citizenship") {
    if (relationId) removeCountryContext(relationId);
    state.citizenships = state.citizenships.filter((record) => !(record.personId === person.id && record.country === originalCountry));
    if (!state.citizenships.some((record) => record.personId === person.id && record.country === country)) state.citizenships.push({ id: createId("citizenship"), personId: person.id, country, confirmation: "user_confirmed" });
    for (const context of personContexts(person.id).filter((record) => record.country === country)) {
      let route = routeForContext(state, context.id); if (!route) { route = { id: createId("route"), countryContextId: context.id }; state.legalRoutes.push(route); }
      route.routeCode = "citizen"; route.routeFamily = "citizen"; route.stage = "active"; route.confirmation = "user_confirmed";
    }
  } else {
    const isCitizen = personCitizenships(person.id).includes(country);
    if (originalCountry) state.citizenships = state.citizenships.filter((record) => !(record.personId === person.id && record.country === originalCountry));
    const existingRelation = state.countryContexts.find((entry) => entry.id === relationId); const purpose = data.get("purpose") || "unknown"; const routeCode = isCitizen ? "citizen" : purpose === "unknown" ? "not_sure" : data.get("route") || "not_sure";
    if (!isCitizen && !routeChoices(country, purpose, personCitizenships(person.id)).includes(routeCode)) { showFormErrors(form, [{ name: "route", message: tx("Choose a route that matches this country, citizenship, and purpose.", "Выберите основание, совместимое со страной, гражданством и целью.", "Mamlakat, fuqarolik va maqsadga mos asosni tanlang.") }]); return; }
    const startsOn = data.get("startsOn") || ""; const endsOn = data.get("endsOn") || "";
    if (startsOn && endsOn && endsOn < startsOn) { showFormErrors(form, [{ name: "endsOn", message: tx("The end date must be after the start date.", "Дата окончания должна быть позже даты начала.", "Tugash sanasi boshlanish sanasidan keyin bo‘lishi kerak.") }]); return; }
    const relation = { id: relationId || createId("context"), personId: person.id, country, contextType: data.get("contextType") || existingRelation?.contextType || "planned_move", purpose, startsOn, endsOn, confirmation: "user_confirmed", note: String(data.get("note") || "").trim() };
    state.countryContexts = existingRelation ? state.countryContexts.map((entry) => entry.id === existingRelation.id ? relation : entry) : [...state.countryContexts, relation];
    let route = routeForContext(state, relation.id); if (!route) { route = { id: createId("route"), countryContextId: relation.id }; state.legalRoutes.push(route); }
    route.routeCode = routeCode; route.routeFamily = routeCode === "citizen" ? "citizen" : routeCode === "not_sure" ? "unknown" : "other"; route.stage = routeCode === "citizen" ? "active" : routeCode === "not_sure" ? "exploring" : data.get("routeStage") || "exploring"; route.confirmation = routeCode === "not_sure" ? "unconfirmed" : "user_confirmed"; route.principalPersonId = data.get("principalPersonId") || null;
    if (purpose === "family" && route.principalPersonId) {
      const existingRelationship = state.personRelationships.find((record) => record.fromPersonId === person.id && record.toPersonId === route.principalPersonId && !record.endsOn);
      const relationship = { id: existingRelationship?.id || createId("person-relationship"), fromPersonId: person.id, toPersonId: route.principalPersonId, relationshipType: data.get("relationshipType") || "other", startsOn: existingRelationship?.startsOn || "", endsOn: "", confirmation: "user_confirmed" };
      state.personRelationships = existingRelationship ? state.personRelationships.map((record) => record.id === existingRelationship.id ? relationship : record) : [...state.personRelationships, relationship];
    }
    state.routeParties = state.routeParties.filter((record) => record.legalRouteId !== route.id);
    for (const [partyType, field] of [["employer", "employerLabel"], ["institution", "institutionLabel"], ["sponsor", "sponsorLabel"]]) {
      const label = String(data.get(field) || "").trim(); if (label) state.routeParties.push({ id: createId("route-party"), legalRouteId: route.id, partyType, label });
    }
    state.issuedDocuments = state.issuedDocuments.filter((document) => document.legalRouteId !== route.id);
    if (data.get("hasDocument")) state.issuedDocuments.push({ id: createId("document"), subjectType: "person", personId: person.id, assetId: null, legalRouteId: route.id, country, documentType: "immigration_status", title: String(data.get("statusLabel") || "").trim() || routeLabel(routeCode), status: "active", validFrom: data.get("documentValidFrom") || "", validUntil: data.get("printedExpiry") || "", confirmation: "user_confirmed" });
  }
  syncActiveCountries(); reconcileCatalogItems(); await persistState(); document.querySelector("#country-dialog").close(); render(); announce(tx("Country context saved and the plan was updated.", "Контекст страны сохранён, план обновлён.", "Mamlakat konteksti saqlandi va reja yangilandi."));
}

function removeCountryContext(contextId) {
  const routeIds = state.legalRoutes.filter((route) => route.countryContextId === contextId).map((route) => route.id);
  state.countryContexts = state.countryContexts.filter((context) => context.id !== contextId);
  state.legalRoutes = state.legalRoutes.filter((route) => route.countryContextId !== contextId);
  state.routeParties = state.routeParties.filter((party) => !routeIds.includes(party.legalRouteId));
  state.issuedDocuments = state.issuedDocuments.filter((document) => !routeIds.includes(document.legalRouteId));
}

async function deleteCountryRelation() {
  const form = document.querySelector("#country-form"); const person = state.people.find((entry) => entry.id === form.elements.personId.value); if (!person) return;
  const relationId = form.elements.relationId.value; const originalCountry = form.elements.originalCountry.value;
  if (relationId) removeCountryContext(relationId);
  if (originalCountry) state.citizenships = state.citizenships.filter((record) => !(record.personId === person.id && record.country === originalCountry));
  syncActiveCountries(); reconcileCatalogItems(); await persistState(); document.querySelector("#country-dialog").close(); render(); announce(tx("Country details removed.", "Данные о стране удалены.", "Mamlakat ma’lumotlari olib tashlandi."));
}

function downloadText(filename, text, type) { const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
function exportCalendar() { const valid = state.items.filter((item) => parseISODate(item.schedule?.date) && item.status === "active").map((item) => ({ ...item, title: itemTitle(item) })); if (!valid.length) { announce(tx("Add at least one date first.", "Сначала добавьте хотя бы одну дату.", "Avval kamida bitta sana kiriting.")); return; } downloadText("nextdue-calendar.ics", generateICS(valid, state.settings), "text/calendar;charset=utf-8"); }

async function addCatalogItem(id, targetValue = "") {
  const entry = CATALOG.find((item) => item.id === id); if (!entry) return;
  const matches = entry.match?.kind === "manual" && entry.subjectType === "person"
    ? state.people.map((person) => ({ entry, subjectId: person.id, assetId: null }))
    : matchCatalog(catalogGraph(state)).filter((match) => match.entry.id === id);
  const [targetPersonId = "", targetAssetId = ""] = targetValue.split("|");
  const match = matches.find((candidate) => candidate.subjectId === targetPersonId && (candidate.assetId || "") === targetAssetId) || (matches.length === 1 ? matches[0] : null);
  if (!match) { announce(tx("Choose the person or possession to track.", "Выберите человека или объект для отслеживания.", "Kuzatish uchun shaxs yoki mulkni tanlang.")); return; }
  const key = catalogItemKey(id, match.subjectId, match.assetId);
  if (state.items.some((item) => catalogItemKey(item.catalogId, itemPersonId(item), itemAssetId(item)) === key) || (state.ruleCandidates || []).some((candidate) => candidate.candidateStatus !== "dismissed" && catalogItemKey(candidate.catalogId, itemPersonId(candidate), itemAssetId(candidate)) === key)) return;
  const candidate = normalizeCatalogObligation(makeItemFromCatalog(match, { title: localized(entry.title, state.locale), reason: localized(entry.summary, state.locale), catalogVersion: CATALOG_VERSION, person: personName(match.subjectId) }), match.subjectId, "candidate");
  delete candidate.applicability;
  candidate.candidateStatus = "pending";
  candidate.decidedAt = null;
  state.ruleCandidates.push(candidate);
  state.profile.activeCountries = [...new Set([...(state.profile.activeCountries || []), entry.country])];
  await persistState(); render(); announce(tx("Added for applicability confirmation.", "Добавлено для проверки применимости.", "Tegishliligini tasdiqlash uchun qo‘shildi."));
}

function filterCatalog(country) {
  ruleFilters.country = country;
  ruleFilters.limit = 60;
  render();
}

function renderCountryPickerList(query = "") {
  const list = document.querySelector("#country-picker-list"); if (!list || !countryPickerTarget) return;
  const normalized = query.trim().toLocaleLowerCase(state.locale); const excluded = new Set(countryPickerTarget.exclude || []);
  const related = new Set([...(state.profile?.activeCountries || []), ...(setupDraft.citizenships || []), setupDraft.residenceCountry, ...(setupDraft.plans || []).map((plan) => plan.country), ...(setupDraft.assets || []).map((asset) => asset.country)].filter(Boolean));
  const options = COUNTRIES.filter(([code]) => code && !excluded.has(code)).filter(([code]) => {
    if (!normalized) return true; const names = [countryName(code), COUNTRIES.find(([value]) => value === code)?.[1] || "", code].join(" ").toLocaleLowerCase(state.locale); return names.includes(normalized);
  }).sort(([a], [b]) => Number(related.has(b)) - Number(related.has(a)) || countryName(a).localeCompare(countryName(b), state.locale));
  list.innerHTML = options.length ? options.map(([code]) => `<button type="button" role="option" aria-selected="${countryPickerTarget.value === code}" tabindex="-1" class="country-option ${countryPickerTarget.value === code ? "selected" : ""}" data-action="choose-country" data-country="${code}"><span class="country-option-flag">${flagForCountry(code)}</span><span><strong>${escapeHTML(countryName(code))}</strong><small>${code}${related.has(code) ? ` · ${tx("Your country", "Ваша страна", "Sizning mamlakatingiz")}` : ""}</small></span>${countryPickerTarget.value === code ? icon("check", 17) : ""}</button>`).join("") : `<p class="mini-empty">${tx("No countries found.", "Страны не найдены.", "Mamlakat topilmadi.")}</p>`;
}

function openCountryPicker(target, value = "", exclude = []) {
  countryPickerTarget = { target, value, exclude };
  const dialog = document.querySelector("#country-picker-dialog"); const search = document.querySelector("#country-search"); search.value = ""; renderCountryPickerList(); dialog.showModal(); window.setTimeout(() => search.focus(), 0);
}

function applyCountryPick(country) {
  const target = countryPickerTarget?.target || "";
  if (target === "setup-citizenship-new") setupDraft.citizenships.push(country);
  else if (target.startsWith("setup-citizenship-")) setupDraft.citizenships[Number(target.split("-").pop())] = country;
  else if (target === "setup-residence") { setupDraft.residenceCountry = country; setupDraft.residencePurpose = ""; setupDraft.residenceRoute = ""; }
  else if (target === "setup-plan-new") setupDraft.plans.push({ id: createId("draft-plan"), country, purpose: "", route: "" });
  else if (target.startsWith("setup-plan-")) { const plan = setupDraft.plans[Number(target.split("-").pop())]; if (plan) { plan.country = country; plan.route = ""; } }
  else if (target.startsWith("setup-asset-")) { const asset = setupDraft.assets[Number(target.split("-").pop())]; if (asset) asset.country = country; }
  else if (target === "person-citizenship-new") renderPersonCitizenshipRows([...personFormCitizenships(), country]);
  else if (target.startsWith("person-citizenship-")) {
    const citizenships = personFormCitizenships(); citizenships[Number(target.split("-").pop())] = country; renderPersonCitizenshipRows(citizenships);
  } else {
    const mapping = { "person-residence": ["#person-form", "residence", "#person-residence-picker"], "asset-country": ["#asset-form", "country", "#asset-country-picker"], "country-record": ["#country-form", "country", "#country-record-picker"] };
    const config = mapping[target]; if (config) { const form = document.querySelector(config[0]); form.elements[config[1]].value = country; updateCountryPickerButton(document.querySelector(config[2]), country); if (target === "country-record") { updateCountryPurposeOptions(); updateCountryRecordRouteOptions(); } }
  }
  document.querySelector("#country-picker-dialog").close(); countryPickerTarget = null; if (target.startsWith("setup-")) render();
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]"); if (!target) return; const action = target.dataset.action;
  if (action === "setup-home") { event.preventDefault(); setupStep = 1; render(); }
  if (action === "choose-goal") { setupDraft.goal = target.dataset.value; render(); }
  if (action === "setup-next") {
    const domesticResidence = setupDraft.citizenships.includes(setupDraft.residenceCountry);
    const incompleteResidence = setupDraft.residenceCountry && !domesticResidence && (!setupDraft.residencePurpose || (setupDraft.residencePurpose !== "unknown" && !setupDraft.residenceRoute));
    const incompletePlan = setupDraft.plans.some((plan) => !plan.country || !plan.purpose || (plan.purpose !== "unknown" && !plan.route));
    if (setupStep === 2 && (!setupDraft.citizenships.length || !setupDraft.residenceCountry)) announce(tx("Add citizenship and current residence first.", "Сначала добавьте гражданство и текущее место проживания.", "Avval fuqarolik va hozirgi yashash joyini qo‘shing."));
    else if (setupStep === 2 && incompleteResidence) announce(tx("Choose your purpose and legal route, or explicitly select ‘Not sure yet’.", "Выберите цель и правовое основание либо явно укажите «Пока не знаю».", "Maqsad va huquqiy asosni tanlang yoki «Hozircha bilmayman»ni aniq belgilang."));
    else if (setupStep === 2 && incompletePlan) announce(tx("Complete or remove every added trip or move.", "Заполните или удалите каждую добавленную поездку или переезд.", "Har bir qo‘shilgan safar yoki ko‘chishni to‘ldiring yoki olib tashlang."));
    else if (setupStep === 3 && setupDraft.assets.some((asset) => !asset.type || !asset.country)) announce(tx("Choose a type and country for every possession.", "Выберите тип и страну для каждого объекта.", "Har bir mulk uchun tur va mamlakatni tanlang."));
    else { setupStep = Math.min(4, setupStep + 1); render(); }
  }
  if (action === "setup-back") { setupStep = Math.max(1, setupStep - 1); render(); }
  if (action === "setup-add-citizenship") openCountryPicker("setup-citizenship-new", "", setupDraft.citizenships);
  if (action === "setup-remove-citizenship") { setupDraft.citizenships.splice(Number(target.dataset.index), 1); render(); }
  if (action === "setup-same-residence") { setupDraft.residenceCountry = target.dataset.country; setupDraft.residencePurpose = "long_term"; setupDraft.residenceRoute = "citizen"; render(); }
  if (action === "setup-add-plan") openCountryPicker("setup-plan-new", "", setupDraft.citizenships);
  if (action === "setup-remove-plan") { setupDraft.plans.splice(Number(target.dataset.index), 1); render(); }
  if (action === "setup-add-asset") { setupDraft.assets.push({ id: createId("draft-asset"), type: "", label: "", country: setupDraft.residenceCountry || setupDraft.citizenships[0] || "", role: "owner" }); render(); }
  if (action === "setup-remove-asset") { setupDraft.assets.splice(Number(target.dataset.index), 1); render(); }
  if (action === "finish-setup") await finishSetup();
  if (action === "change-view") { activeView = target.dataset.view; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  if (action === "open-catalog-country") { activeView = "catalog"; ruleFilters.country = target.dataset.country; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  if (action === "add-item") openItemDialog();
  if (action === "edit-item") openItemDialog(state.items.find((item) => item.id === target.dataset.id));
  if (action === "save-item") await saveItem();
  if (action === "accept-candidate") await acceptCandidate(target.dataset.id);
  if (action === "dismiss-candidate") await dismissCandidate(target.dataset.id);
  if (action === "add-asset") openAssetDialog();
  if (action === "edit-asset") openAssetDialog(state.assets.find((asset) => asset.id === target.dataset.id));
  if (action === "save-asset") await saveAsset();
  if (action === "add-document") openDocumentDialog();
  if (action === "edit-document") openDocumentDialog(state.issuedDocuments.find((documentRecord) => documentRecord.id === target.dataset.id));
  if (action === "save-document") await saveDocument();
  if (action === "add-asset-role") addAssetRoleRow({ personId: state.people[0]?.id || "", role: "owner" });
  if (action === "add-asset-jurisdiction") addAssetJurisdictionRow({ role: "tax" });
  if (action === "remove-dynamic-row") target.closest(".role-row")?.remove();
  if (action === "add-person") openPersonDialog();
  if (action === "edit-person") openPersonDialog(state.people.find((person) => person.id === target.dataset.id));
  if (action === "save-person") await savePerson();
  if (action === "add-person-citizenship") openCountryPicker("person-citizenship-new", "", personFormCitizenships());
  if (action === "remove-person-citizenship") { const citizenships = personFormCitizenships(); citizenships.splice(Number(target.dataset.index), 1); renderPersonCitizenshipRows(citizenships); }
  if (action === "use-citizenship-residence") { const form = document.querySelector("#person-form"); const citizenships = personFormCitizenships(); if (!citizenships.length) announce(tx("Add a citizenship first.", "Сначала добавьте гражданство.", "Avval fuqarolik qo‘shing.")); else if (citizenships.length > 1) openCountryPicker("person-residence", form.elements.residence.value || "", COUNTRIES.map(([code]) => code).filter((code) => code && !citizenships.includes(code))); else { form.elements.residence.value = citizenships[0]; updateCountryPickerButton(document.querySelector("#person-residence-picker"), citizenships[0]); } }
  if (action === "add-country") openCountryDialog(target.dataset.personId);
  if (action === "edit-country") openCountryDialog(target.dataset.personId, target.dataset.relationId, target.dataset.citizenshipCountry);
  if (action === "save-country-relation") await saveCountryRelation();
  if (action === "add-catalog") {
    const selectedTarget = target.closest(".catalog-card")?.querySelector(`[data-catalog-target="${CSS.escape(target.dataset.id)}"]`)?.value || target.dataset.target || "";
    await addCatalogItem(target.dataset.id, selectedTarget);
  }
  if (action === "export-calendar") exportCalendar();
  if (action === "backup-data") downloadText(`nextdue-backup-${toISODate(new Date())}.json`, JSON.stringify(state, null, 2), "application/json");
  if (action === "restore-data") document.querySelector("#restore-input").click();
  if (action === "calendar-menu") { const item = state.items.find((entry) => entry.id === target.dataset.id); const localizedItem = { ...item, title: itemTitle(item) }; const links = calendarLinks(localizedItem); if (!links) return; const dialog = document.querySelector("#calendar-dialog"); dialog.querySelector("#calendar-item-name").textContent = localizedItem.title; dialog.querySelector("#google-link").href = links.google; dialog.querySelector("#outlook-link").href = links.outlook; dialog.showModal(); }
  if (action === "close-dialog") target.closest("dialog").close();
  if (action === "open-country-picker") openCountryPicker(target.dataset.countryTarget, target.dataset.countryValue || "", (target.dataset.countryExclude || "").split(",").filter(Boolean));
  if (action === "choose-country") applyCountryPick(target.dataset.country);
  if (action === "set-plan-view") { planFilters.view = target.dataset.value; render(); }
  if (action === "set-plan-status") { planFilters.status = target.dataset.value; render(); }
  if (action === "set-rule-tier") { ruleFilters.tier = target.dataset.value; ruleFilters.limit = 60; render(); }
  if (action === "show-more-rules") { ruleFilters.limit += 60; render(); }
  if (action === "toggle-plan-filters") { planFilters.open = !planFilters.open; render(); }
  if (action === "clear-plan-filter") { planFilters[target.dataset.filter] = "all"; render(); }
  if (action === "clear-plan-filters") { planFilters = { ...planFilters, status: "all", country: "all", personId: "all", assetType: "all", assetId: "all", open: false }; render(); }
  if (action === "create-calendar-feed") await createCalendarFeed();
  if (action === "revoke-calendar-feeds") await revokeCalendarFeeds();
  if (action === "delete-cloud-account") await deleteCloudAccount();
  if (action === "revoke-sessions") await revokeOtherSessions();
});

document.addEventListener("change", async (event) => {
  if (event.target.id === "setup-locale") { setupDraft.locale = event.target.value; render(); }
  if (event.target.dataset.setupCitizenshipIndex !== undefined) setupDraft.citizenships[Number(event.target.dataset.setupCitizenshipIndex)] = event.target.value;
  if (event.target.dataset.setupResidencePurpose !== undefined) { setupDraft.residencePurpose = event.target.value; setupDraft.residenceRoute = ""; render(); }
  if (event.target.dataset.setupResidenceRoute !== undefined) setupDraft.residenceRoute = event.target.value;
  if (event.target.dataset.setupPlanIndex !== undefined) { const plan = setupDraft.plans[Number(event.target.dataset.setupPlanIndex)]; if (plan) { plan[event.target.dataset.field] = event.target.value; if (event.target.dataset.field === "purpose") { plan.route = ""; render(); } } }
  if (event.target.dataset.setupAssetIndex !== undefined) { const asset = setupDraft.assets[Number(event.target.dataset.setupAssetIndex)]; if (asset) { asset[event.target.dataset.field] = event.target.value; if (event.target.dataset.field === "type") render(); } }
  if (event.target.dataset.planFilter) { const filter = event.target.dataset.planFilter; planFilters[filter] = event.target.value; if (["country", "assetType"].includes(filter) && planFilters.assetId !== "all") { const selectedAsset = state.assets.find((asset) => asset.id === planFilters.assetId); if ((planFilters.country !== "all" && assetCountry(selectedAsset) !== planFilters.country) || (planFilters.assetType !== "all" && selectedAsset?.type !== planFilters.assetType)) planFilters.assetId = "all"; } if (filter === "assetId" && event.target.value !== "all") { const selectedAsset = state.assets.find((asset) => asset.id === event.target.value); planFilters.country = assetCountry(selectedAsset) || planFilters.country; planFilters.assetType = selectedAsset?.type || planFilters.assetType; } render(); }
  if (event.target.closest("#country-form") && event.target.name === "recordKind") updateCountryRelationFields();
  if (event.target.closest("#country-form") && event.target.name === "contextType") updateCountryContextFields();
  if (event.target.closest("#country-form") && event.target.name === "purpose") updateCountryRecordRouteOptions();
  if (event.target.closest("#country-form") && event.target.name === "route") updateRoutePartyFields();
  if (event.target.closest("#country-form") && event.target.name === "principalPersonId") updateRoutePartyFields();
  if (event.target.closest("#country-form") && event.target.name === "hasDocument") updateIssuedStatusFields();
  if (event.target.id === "language-select") { setLanguage(event.target.value); await persistState(); render(); }
  if (event.target.id === "rule-country") { ruleFilters.country = event.target.value; ruleFilters.limit = 60; render(); }
  if (event.target.closest("#item-form") && event.target.name === "subjectType") updateItemSubjectFields();
  if (event.target.closest("#document-form") && ["subjectType", "validUntil"].includes(event.target.name)) updateDocumentSubjectFields();
  if (event.target.closest("#asset-form") && event.target.name === "type") updateAssetTypeFields();
  if (event.target.closest("#asset-role-list") && event.target.name === "roleType") updateAssetRoleRow(event.target.closest(".role-row"));
  if (event.target.name === "kind") updateScheduleFields();
  if (event.target.name === "date") { updateScheduleFields(); updateReminderPreview(); }
  if (event.target.name === "reminderInput") updateReminderPreview();
  if (event.target.dataset.setting) { state.settings[event.target.dataset.setting] = event.target.checked; await persistState(); render(); }
});

document.addEventListener("input", (event) => {
  if (event.target.name === "reminderInput" || event.target.name === "date") updateReminderPreview();
  if (event.target.dataset.setupAssetIndex !== undefined) { const asset = setupDraft.assets[Number(event.target.dataset.setupAssetIndex)]; if (asset) asset[event.target.dataset.field] = event.target.value; }
  if (event.target.id === "country-search") renderCountryPickerList(event.target.value);
  if (event.target.id === "rule-search") { ruleFilters.query = event.target.value; ruleFilters.limit = 60; render(); document.querySelector("#rule-search")?.focus(); }
});
document.addEventListener("keydown", (event) => {
  const dialog = document.querySelector("#country-picker-dialog");
  if (!dialog.open || (event.target.id !== "country-search" && !event.target.matches("#country-picker-list [role='option']"))) return;
  const options = [...document.querySelectorAll("#country-picker-list [role='option']")]; if (!options.length) return;
  const current = options.indexOf(event.target);
  let next = null;
  if (event.key === "ArrowDown") next = options[Math.min(current + 1, options.length - 1)];
  if (event.key === "ArrowUp") next = options[Math.max(current <= 0 ? 0 : current - 1, 0)];
  if (event.key === "Home") next = options[0];
  if (event.key === "End") next = options.at(-1);
  if (next) { event.preventDefault(); next.focus(); }
});
document.addEventListener("click", (event) => {
  const filter = event.target.closest("[data-country-filter]"); if (filter) filterCatalog(filter.dataset.countryFilter);
  const tier = event.target.closest("[data-rule-tier]"); if (tier) { ruleFilters.tier = tier.dataset.ruleTier; ruleFilters.limit = 60; render(); }
});

document.querySelector("#delete-item").addEventListener("click", async () => {
  const id = document.querySelector("#item-form").elements.id.value;
  if (id && window.confirm(tx("Remove this obligation?", "Удалить эту обязанность?", "Bu majburiyat o‘chirilsinmi?"))) { state.items = state.items.filter((item) => item.id !== id); await persistState(); document.querySelector("#item-dialog").close(); render(); }
});

document.querySelector("#delete-asset").addEventListener("click", async () => {
  if (window.confirm(tx("Remove this possession and its generated checklist? Custom obligations will be kept without the possession link.", "Удалить это имущество и созданный для него чек-лист? Пользовательские обязанности сохранятся без привязки.", "Bu mulk va uning yaratilgan ro‘yxati o‘chirilsinmi? Maxsus majburiyatlar bog‘lanishsiz saqlanadi."))) await deleteAsset();
});

document.querySelector("#delete-document").addEventListener("click", deleteDocument);

document.querySelector("#delete-country-relation").addEventListener("click", async () => {
  if (window.confirm(tx("Remove these country details?", "Удалить эти данные о стране?", "Bu mamlakat ma’lumotlari olib tashlansinmi?"))) await deleteCountryRelation();
});

document.querySelector("#restore-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0]; if (!file || file.size > 1_000_000) return;
  try { state = validateBackup(migrateState(JSON.parse(await file.text()))); await persistState(); activeView = "plan"; render(); announce(tx("Backup restored for this test session.", "Резервная копия восстановлена для текущей тестовой сессии.", "Nusxa joriy test seansi uchun tiklandi.")); } catch (error) { announce(error.message); }
  event.target.value = "";
});

document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));

if (TEST_MODE_RESET_ON_LOAD && !SAAS_MODE) await resetStoredStateForTestMode();
try { state = await loadState(); }
catch (error) {
  state = defaultState();
  console.error(error);
  window.setTimeout(() => announce(tx("Could not load cloud data. Refresh or sign in again.", "Не удалось загрузить данные из облака. Обновите страницу или войдите снова.", "Bulut ma’lumotlarini yuklab bo‘lmadi. Sahifani yangilang yoki qayta kiring.")), 0);
}
setLanguage(state.locale || "en");
render();
