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
  ["", "—"], ["RU", "Russia"], ["UZ", "Uzbekistan"], ["KZ", "Kazakhstan"], ["AM", "Armenia"],
  ["GE", "Georgia"], ["AE", "United Arab Emirates"], ["DE", "Germany"], ["ES", "Spain"], ["FR", "France"],
  ["GB", "United Kingdom"], ["PT", "Portugal"], ["US", "United States"], ["OTHER", "Other"],
];

const UZ_COUNTRY_NAMES = {
  KZ: "Qozog‘iston", AM: "Armaniston", GE: "Gruziya", AE: "Birlashgan Arab Amirliklari",
  DE: "Germaniya", ES: "Ispaniya", FR: "Fransiya", GB: "Buyuk Britaniya",
  PT: "Portugaliya", US: "Amerika Qo‘shma Shtatlari",
};

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
    profile: { goal: "move", activeCountries: ["RU", "UZ"] },
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
    ...defaultState(), onboarded: Boolean(value.onboarded),
    profile: { goal: value.profile?.goal || "organize", activeCountries: [...new Set([person.citizenships[0], defaultCountry].filter(Boolean))] },
    people: [person], assets,
    items: (value.items || []).map((item) => {
      const offsets = item.reminderOffsets || ({ early: [180, 120, 90, 30], standard: [60, 30, 7], compact: [30, 7, 1], monthly: [7, 1, 0] }[item.reminderPlan] || [60, 30, 7]);
      return { ...item, country: item.jurisdiction || defaultCountry, subjectId: person.id, assetId: null, reminderInput: formatReminderSequence(offsets), reminderOffsets: offsets };
    }), settings: value.settings || defaultState().settings,
  };
}

let state = defaultState();
let setupStep = 1;
let setupDraft = { locale: "en", goal: "move", citizenship: "RU", residence: "RU", extraCountry: "UZ", assets: [] };
let activeView = "today";
let dbMode = "indexeddb";

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
    return value ? validateBackup(migrateV1(value)) : defaultState();
  } catch {
    dbMode = "localstorage";
    try { const value = localStorage.getItem("nextdue-state"); return value ? validateBackup(migrateV1(JSON.parse(value))) : defaultState(); } catch { return defaultState(); }
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
function countryName(code, locale = state.locale) {
  if (!code) return tx("Not set", "Не указано", "Ko‘rsatilmagan");
  if (code === "OTHER") return locale === "ru" ? "Другая" : locale === "uz-Latn" ? "Boshqa" : "Other";
  if (COUNTRY_META[code]) return catalogCountryName(code, locale);
  if (locale === "uz-Latn" && UZ_COUNTRY_NAMES[code]) return UZ_COUNTRY_NAMES[code];
  try { return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code; } catch { return COUNTRIES.find(([value]) => value === code)?.[1] || code; }
}
function countryOptions(selected, includeBlank = true) { return COUNTRIES.filter(([code]) => includeBlank || code).map(([code, fallback]) => `<option value="${code}" ${selected === code ? "selected" : ""}>${escapeHTML(code ? countryName(code) : fallback)}</option>`).join(""); }
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
  setFormLabel("#asset-form", "label", tx("Name", "Название", "Nomi"));
  setFormLabel("#asset-form", "country", t(state.locale, "country"));
  setFormLabel("#asset-form", "ownerId", t(state.locale, "owner"));
  setPlaceholder('#asset-form [name="label"]', tx("e.g. Tashkent apartment", "например, квартира в Ташкенте", "masalan, Toshkentdagi kvartira"));
  replaceOptions(document.querySelector('#asset-form [name="type"]'), Object.keys(ASSET_TYPES).map((value) => [value, assetTypeLabel(value)]));
  setText('#asset-form [data-action="close-dialog"].secondary-button', t(state.locale, "cancel"));
  setText('#asset-form [data-action="save-asset"]', tx("Save possession", "Сохранить имущество", "Mulkni saqlash"));

  setText("#person-dialog .eyebrow", tx("Household", "Семья", "Oila"));
  setFormLabel("#person-form", "name", tx("Name or private label", "Имя или приватная метка", "Ism yoki maxfiy belgi"));
  setFormLabel("#person-form", "citizenship", tx("Citizenship", "Гражданство", "Fuqarolik"));
  setFormLabel("#person-form", "residence", tx("Residence", "Проживание", "Yashash joyi"));
  setPlaceholder('#person-form [name="name"]', tx("e.g. Child 1", "например, Ребёнок 1", "masalan, Bola 1"));
  setText('#person-form [data-action="close-dialog"].secondary-button', t(state.locale, "cancel"));
  setText('#person-form [data-action="save-person"]', tx("Save person", "Сохранить человека", "Shaxsni saqlash"));
}

function renderSetup() {
  state.locale = setupDraft.locale;
  document.querySelector("#setup-root").innerHTML = `
    <header class="setup-header"><a class="brand" href="#" data-action="setup-home"><span class="brand-mark">${icon("layers", 18)}</span><span>NextDue</span></a><span class="catalog-version">${t(state.locale, "sourceBacked")} · ${CATALOG_VERSION}</span></header>
    <main class="setup-main setup-v2"><section class="setup-intro"><span class="eyebrow">${tx("Life admin across borders", "Документы и обязанности между странами", "Mamlakatlararo hujjatlar va majburiyatlar")}</span><h1>${tx("One household. Many countries. No blind spots.", "Одна семья. Несколько стран. Всё под контролем.", "Bitta oila. Bir nechta mamlakat. Hammasi nazoratda.")}</h1><p>${tx("Map people, countries, and possessions. Then review maintained starter packs with sources—never an AI guess.", "Добавьте людей, страны и имущество. Затем проверьте поддерживаемые пакеты с источниками — без AI-догадок.", "Odamlar, mamlakatlar va mulkni kiriting. Keyin manbali paketlarni tekshiring.")}</p><div class="scenario-card"><strong>${tx("Example", "Пример", "Misol")}</strong><p>${tx("I live in Russia, own a flat in Uzbekistan, and manage two children’s documents.", "Я живу в России, владею квартирой в Узбекистане и слежу за документами двух детей.", "Men Rossiyada yashayman, O‘zbekistonda uyim bor va ikki bolaning hujjatlarini boshqaraman.")}</p></div></section>
    <section class="setup-card"><div class="setup-progress-row"><span>${tx("Build your registry", "Создайте реестр", "Reyestr yarating")}</span><span>${setupStep}/4</span></div><div class="progress-track"><span style="width:${setupStep * 25}%"></span></div>${renderSetupStep()}</section></main>`;
}

function renderSetupStep() {
  if (setupStep === 1) return `<div class="setup-copy"><p class="step-kicker">${tx("Language & focus", "Язык и цель", "Til va maqsad")}</p><h2>${tx("How should NextDue work for you?", "Как NextDue должен работать для вас?", "NextDue siz uchun qanday ishlashi kerak?")}</h2></div><label><span>${t(state.locale, "interfaceLanguage")}</span><select id="setup-locale">${SUPPORTED_LOCALES.map((locale) => `<option value="${locale.code}" ${setupDraft.locale === locale.code ? "selected" : ""}>${locale.label}</option>`).join("")}</select></label><div class="choice-stack compact-choices">${Object.entries(GOALS).map(([value, labels]) => `<button class="choice-card ${setupDraft.goal === value ? "selected" : ""}" data-action="choose-goal" data-value="${value}"><span class="choice-icon">${icon(value === "move" ? "globe" : value === "travel" ? "plane" : "check-circle")}</span><span><strong>${state.locale === "ru" ? labels[1] : state.locale === "uz-Latn" ? labels[2] : labels[0]}</strong></span><span class="radio-dot"></span></button>`).join("")}</div>${setupActions(false)}`;
  if (setupStep === 2) return `<div class="setup-copy"><p class="step-kicker">${tx("People & jurisdictions", "Люди и юрисдикции", "Odamlar va yurisdiksiyalar")}</p><h2>${tx("Where does your life happen?", "С какими странами вы связаны?", "Hayotingiz qaysi mamlakatlar bilan bog‘liq?")}</h2><p>${tx("A person can have one citizenship and live elsewhere. You can add more people later.", "Гражданство и страна проживания могут различаться. Других людей можно добавить позже.", "Fuqarolik va yashash mamlakati farq qilishi mumkin.")}</p></div><form id="setup-country-form" class="context-form"><div class="form-grid two"><label><span>${tx("My citizenship", "Моё гражданство", "Fuqaroligim")}</span><select name="citizenship">${countryOptions(setupDraft.citizenship)}</select></label><label><span>${tx("I currently live in", "Сейчас я живу в", "Hozir yashayman")}</span><select name="residence">${countryOptions(setupDraft.residence)}</select></label></div><label><span>${tx("Another relevant country", "Ещё одна важная страна", "Yana bir muhim mamlakat")}</span><select name="extraCountry">${countryOptions(setupDraft.extraCountry)}</select></label></form>${setupActions(true)}`;
  if (setupStep === 3) return `<div class="setup-copy"><p class="step-kicker">${tx("Possessions by country", "Имущество по странам", "Mulk mamlakatlar bo‘yicha")}</p><h2>${tx("What do you manage, and where?", "Чем вы управляете и в какой стране?", "Nimani va qayerda boshqarasiz?")}</h2><p>${tx("Each possession gets its own country. Add several later if needed.", "У каждого объекта своя страна. Позже можно добавить несколько объектов одного типа.", "Har bir mulkning o‘z mamlakati bor.")}</p></div><div class="asset-setup-list">${Object.entries(ASSET_TYPES).filter(([type]) => type !== "other").map(([type, meta]) => { const selected = setupDraft.assets.find((asset) => asset.type === type); return `<div class="asset-setup-row ${selected ? "selected" : ""}"><label class="asset-toggle"><input type="checkbox" data-setup-asset="${type}" ${selected ? "checked" : ""}><span class="suggestion-check">${icon("check", 15)}</span><span class="item-icon category-${type === "vehicle" ? "transport" : type === "business" ? "tax" : type}">${icon(meta.icon, 18)}</span><strong>${assetTypeLabel(type)}</strong></label><select data-setup-asset-country="${type}" ${selected ? "" : "disabled"}>${countryOptions(selected?.country || setupDraft.extraCountry || setupDraft.residence, false)}</select></div>`; }).join("")}</div>${setupActions(true)}`;
  const graph = graphFromDraft(); const matches = matchCatalog(graph);
  return `<div class="setup-copy"><p class="step-kicker">${t(state.locale, "sourceBacked")}</p><h2>${t(state.locale, "starterPack")}</h2><p>${t(state.locale, "notGenerated")}</p></div><div class="pack-summary">${[...new Set(matches.map((match) => match.entry.country))].map((country) => `<span>${COUNTRY_META[country]?.flag || ""} ${countryName(country)} · ${matches.filter((m) => m.entry.country === country).length}</span>`).join("")}</div><div class="suggestion-list catalog-suggestions">${matches.slice(0, 9).map((match) => catalogSuggestion(match)).join("")}</div><p class="legal-note">${t(state.locale, "catalogDisclaimer")}</p>${setupActions(true, true)}`;
}

function setupActions(back, finish = false) { return `<div class="setup-actions">${back ? `<button class="secondary-button" data-action="setup-back">${tx("Back", "Назад", "Orqaga")}</button>` : "<span></span>"}<button class="primary-button" data-action="${finish ? "finish-setup" : "setup-next"}">${finish ? tx("Create my registry", "Создать мой реестр", "Reyestrimni yaratish") : tx("Continue", "Продолжить", "Davom etish")} ${icon("arrow-right", 17)}</button></div>`; }
function catalogSuggestion(match) { const entry = match.entry; return `<label class="suggestion-row rich"><input type="checkbox" name="catalog-suggestion" value="${entry.id}|${match.subjectId || ""}|${match.assetId || ""}" checked><span class="suggestion-check">${icon("check", 15)}</span><span><strong>${escapeHTML(localized(entry.title, state.locale))}</strong><small>${COUNTRY_META[entry.country]?.flag || ""} ${escapeHTML(countryName(entry.country))} · ${escapeHTML(localized(entry.audience, state.locale))}</small></span><span class="source-tag">${CATALOG_REVIEWED_AT}</span></label>`; }
function graphFromDraft() {
  const person = { id: "person-me", name: tx("Me", "Я", "Men"), relationship: "self", citizenships: setupDraft.citizenship ? [setupDraft.citizenship] : [], jurisdictions: [setupDraft.residence, setupDraft.extraCountry].filter(Boolean).map((country, index) => ({ country, type: index === 0 ? "residence" : "relevant" })) };
  const assets = setupDraft.assets.map((asset, index) => ({ id: `asset-${asset.type}-${index}`, type: asset.type, label: assetTypeLabel(asset.type), country: asset.country, ownerId: person.id }));
  return { people: [person], assets };
}

async function finishSetup() {
  const graph = graphFromDraft(); const selected = new Set([...document.querySelectorAll('input[name="catalog-suggestion"]:checked')].map((input) => input.value));
  const matches = matchCatalog(graph).filter((match) => selected.has(`${match.entry.id}|${match.subjectId || ""}|${match.assetId || ""}`));
  state = defaultState(); state.onboarded = true; state.locale = setupDraft.locale;
  state.profile = { goal: setupDraft.goal, activeCountries: [...new Set([setupDraft.citizenship, setupDraft.residence, setupDraft.extraCountry, ...graph.assets.map((asset) => asset.country)].filter(Boolean))] };
  state.people = graph.people; state.assets = graph.assets;
  state.items = matches.map((match) => makeItemFromCatalog(match, { title: localized(match.entry.title, state.locale), reason: localized(match.entry.summary, state.locale), catalogVersion: CATALOG_VERSION, person: graph.people.find((person) => person.id === match.subjectId)?.name || "" }));
  await persistState(); activeView = "today"; render(); announce(tx("Registry created from reviewed country packs.", "Реестр создан из проверенных пакетов стран.", "Reyestr tekshirilgan mamlakat paketlaridan yaratildi."));
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
  return `<article class="item-card scope-card"><div class="item-icon category-${item.category}">${icon(meta.icon, 20)}</div><div class="item-main"><div class="item-title-row"><h3>${escapeHTML(title)}</h3><span class="status status-${status.tone}">${statusLabel(status)}</span></div><p class="scope-line"><span>${COUNTRY_META[item.country]?.flag || "🌐"} ${escapeHTML(countryName(item.country))}</span><span>${escapeHTML(personName(item.subjectId))}</span>${item.assetId ? `<span>${escapeHTML(assetName(item.assetId))}</span>` : ""}</p><p class="item-meta">${escapeHTML(scheduleDescription(item))} · ${escapeHTML(item.reminderInput || formatReminderSequence(item.reminderOffsets || []))}</p><p class="next-action">${icon("arrow-bend", 15)} ${escapeHTML(nextActionLabel(item))}</p></div><div class="item-actions">${calendar && parseISODate(item.schedule?.date) ? `<button class="icon-button" data-action="calendar-menu" data-id="${item.id}" aria-label="${tx("Calendar options for", "Параметры календаря для", "Kalendar parametrlari")}: ${escapeHTML(title)}">${icon("calendar", 18)}</button>` : ""}<button class="icon-button" data-action="edit-item" data-id="${item.id}" aria-label="${tx("Edit", "Изменить", "Tahrirlash")}: ${escapeHTML(title)}">${icon("edit", 18)}</button></div></article>`;
}

function renderGroup(title, subtitle, items) { if (!items.length) return ""; return `<section class="item-group"><div class="section-heading"><div><h2>${title}</h2><p>${subtitle}</p></div><span class="count">${items.length}</span></div><div class="item-list">${items.map((item) => itemCard(item)).join("")}</div></section>`; }

function renderToday() {
  const groups = groupItemsForToday(state.items); const activeCountries = state.profile.activeCountries || []; const attention = groups.now.length;
  const title = attention ? tx(`${attention} item${attention === 1 ? "" : "s"} need attention`, `${attention} ${attention === 1 ? "задача требует" : "задачи требуют"} внимания`, `${attention} ta vazifa e’tibor talab qiladi`) : groups.missing.length ? tx(`${groups.missing.length} dates need confirmation`, `${groups.missing.length} дат нужно подтвердить`, `${groups.missing.length} ta sanani tasdiqlash kerak`) : tx("Everything is on track", "Всё под контролем", "Hammasi nazoratda");
  return `${viewHeader(tx("Household overview", "Обзор семьи", "Oila ko‘rinishi"), title, tx("One calm queue across people, possessions, and countries.", "Одна спокойная очередь для людей, имущества и стран.", "Odamlar, mulk va mamlakatlar uchun bitta navbat."))}<section class="country-strip">${activeCountries.map((country) => `<button data-action="open-catalog-country" data-country="${country}"><span>${COUNTRY_META[country]?.flag || "🌐"}</span><strong>${countryName(country)}</strong><small>${state.items.filter((item) => item.country === country).length} ${tx("tracked", "в плане", "rejada")}</small></button>`).join("")}<button class="add-country" data-action="change-view" data-view="catalog">${icon("plus", 18)}<strong>${t(state.locale, "catalog")}</strong></button></section>${renderGroup(t(state.locale, "actNow"), tx("Inside the action window.", "Уже в окне действий.", "Harakat oynasida."), groups.now)}${renderGroup(t(state.locale, "addDates"), tx("Catalog matches waiting for a confirmed date.", "Совпадения каталога ждут подтверждённой даты.", "Katalog mosliklari sanani kutmoqda."), groups.missing)}${renderGroup(t(state.locale, "comingUp"), tx("Worth planning, not worrying about.", "Пора планировать, но не тревожиться.", "Rejalash vaqti, tashvish emas."), groups.upcoming)}${renderGroup(t(state.locale, "covered"), tx("Nothing needed now.", "Сейчас ничего не требуется.", "Hozir hech narsa talab qilinmaydi."), groups.covered)}<aside class="principle-card">${icon("shield-check", 20)}<div><strong>${t(state.locale, "notGenerated")}</strong><p>${t(state.locale, "catalogDisclaimer")}</p></div></aside>`;
}

function renderPlan() {
  const dated = sortItems(state.items.filter((item) => parseISODate(item.schedule?.date) && item.status === "active")); const missing = state.items.filter((item) => !parseISODate(item.schedule?.date) && item.status === "active"); const groups = new Map();
  dated.forEach((item) => { const key = getNextOccurrence(item).slice(0, 7); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); });
  return `${viewHeader(tx("Timeline", "Таймлайн", "Vaqt jadvali"), t(state.locale, "plan"), tx("Deadlines and recurring obligations across every jurisdiction.", "Сроки и повторяющиеся обязанности по всем юрисдикциям.", "Barcha yurisdiksiyalardagi muddatlar."))}<div class="toolbar"><span class="catalog-version">${state.items.length} ${tx("obligations", "обязанностей", "majburiyat")}</span><button class="secondary-button compact" data-action="export-calendar">${icon("download", 16)} ${t(state.locale, "exportCalendar")}</button></div><div class="timeline">${[...groups.entries()].map(([month, items]) => `<section class="timeline-month"><div class="month-label"><span>${new Intl.DateTimeFormat(state.locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(parseISODate(`${month}-01`))}</span><i></i></div><div class="timeline-items">${items.map((item) => itemCard(item)).join("")}</div></section>`).join("")}</div>${missing.length ? `<section class="undated-section">${renderGroup(t(state.locale, "addDates"), tx("These items stay outside the timeline until confirmed.", "Эти пункты не попадут в таймлайн до подтверждения даты.", "Sana tasdiqlanmaguncha vaqt jadvaliga kirmaydi."), missing)}</section>` : ""}`;
}

function renderRegistry() {
  return `${viewHeader(tx("Household graph", "Граф семьи", "Oila grafigi"), t(state.locale, "registry"), tx("Every person and possession keeps its own countries and ownership.", "У каждого человека и объекта — свои страны и владелец.", "Har bir shaxs va mulkning o‘z mamlakati va egasi bor."), "asset")}<div class="registry-grid"><section class="registry-column"><div class="section-heading"><div><h2>${tx("People", "Люди", "Odamlar")}</h2><p>${tx("Citizenship and relevant jurisdictions.", "Гражданство и связанные юрисдикции.", "Fuqarolik va yurisdiksiyalar.")}</p></div></div>${state.people.map(personCard).join("")}</section><section class="registry-column"><div class="section-heading"><div><h2>${tx("Possessions", "Имущество", "Mulk")}</h2><p>${tx("Each item can live in a different country.", "Каждый объект может находиться в своей стране.", "Har bir obyekt boshqa mamlakatda bo‘lishi mumkin.")}</p></div></div>${state.assets.length ? state.assets.map(assetCard).join("") : `<div class="mini-empty"><p>${tx("No possessions yet.", "Имущество пока не добавлено.", "Hali mulk yo‘q.")}</p><button class="secondary-button compact" data-action="add-asset">${t(state.locale, "addAsset")}</button></div>`}</section></div>`;
}

function personCard(person) {
  const countries = [...new Set([...(person.citizenships || []), ...(person.jurisdictions || []).map((item) => item.country)])];
  const name = personName(person.id);
  return `<article class="registry-card"><span class="avatar">${escapeHTML(name.slice(0, 1).toUpperCase())}</span><div><h3>${escapeHTML(name)}</h3><p>${countries.map((country) => `${COUNTRY_META[country]?.flag || "🌐"} ${countryName(country)}`).join(" · ") || tx("No countries yet", "Страны не указаны", "Mamlakatlar yo‘q")}</p><small>${state.items.filter((item) => item.subjectId === person.id).length} ${tx("obligations", "обязанностей", "majburiyat")}</small></div><button class="icon-button" data-action="edit-person" data-id="${person.id}" aria-label="${tx("Edit", "Изменить", "Tahrirlash")}: ${escapeHTML(name)}">${icon("edit", 18)}</button></article>`;
}

function assetCard(asset) { const meta = ASSET_TYPES[asset.type] || ASSET_TYPES.other; return `<article class="registry-card"><span class="item-icon category-${asset.type === "vehicle" ? "transport" : asset.type === "business" ? "tax" : asset.type}">${icon(meta.icon, 19)}</span><div><h3>${escapeHTML(displayAssetLabel(asset))}</h3><p>${COUNTRY_META[asset.country]?.flag || "🌐"} ${countryName(asset.country)} · ${personName(asset.ownerId)}</p><small>${state.items.filter((item) => item.assetId === asset.id).length} ${tx("obligations", "обязанностей", "majburiyat")}</small></div><button class="icon-button" data-action="edit-asset" data-id="${asset.id}" aria-label="${tx("Edit", "Изменить", "Tahrirlash")}: ${escapeHTML(displayAssetLabel(asset))}">${icon("edit", 18)}</button></article>`; }

function renderCatalog() {
  const trackedIds = new Set(state.items.map((item) => item.catalogId));
  return `${viewHeader(t(state.locale, "sourceBacked"), t(state.locale, "catalog"), tx("Reviewed starter packs for Russia and Uzbekistan. Add only what applies.", "Проверенные стартовые пакеты для России и Узбекистана. Добавляйте только применимое.", "Rossiya va O‘zbekiston uchun tekshirilgan paketlar."), "none")}<div class="catalog-toolbar"><div class="catalog-tabs"><button class="active" data-country-filter="all">${tx("All", "Все", "Barchasi")} · ${CATALOG.length}</button>${Object.keys(COUNTRY_META).map((country) => `<button data-country-filter="${country}">${COUNTRY_META[country].flag} ${countryName(country)}</button>`).join("")}</div><span>${t(state.locale, "lastReviewed")}: ${CATALOG_REVIEWED_AT}</span></div><div class="catalog-grid">${CATALOG.map((entry) => catalogCard(entry, trackedIds.has(entry.id))).join("")}</div><aside class="principle-card">${icon("info", 20)}<div><strong>${t(state.locale, "catalogDisclaimer")}</strong><p>${tx("High-risk applicability items always require explicit confirmation.", "Пункты с высоким риском применимости всегда требуют явного подтверждения.", "Yuqori xavfli bandlar aniq tasdiqni talab qiladi.")}</p></div></aside>`;
}

function catalogCard(entry, tracked) {
  const confidenceLabel = entry.confidence === "high" ? tx("High confidence", "Высокая уверенность", "Yuqori ishonch") : entry.confidence === "medium-high" ? tx("Medium-high confidence", "Уверенность выше средней", "O‘rtachadan yuqori ishonch") : entry.confidence;
  const riskLabel = entry.risk === "high_applicability" ? tx("Check applicability", "Проверьте применимость", "Mosligini tekshiring") : confidenceLabel;
  return `<article class="catalog-card" data-catalog-country="${entry.country}"><div class="catalog-card-top"><span class="country-badge">${COUNTRY_META[entry.country]?.flag} ${countryName(entry.country)}</span><span class="confidence ${entry.risk === "high_applicability" ? "risk" : ""}">${riskLabel}</span></div><h2>${escapeHTML(localized(entry.title, state.locale))}</h2><p>${escapeHTML(localized(entry.summary, state.locale))}</p><dl><div><dt>${tx("For", "Для кого", "Kim uchun")}</dt><dd>${escapeHTML(localized(entry.audience, state.locale))}</dd></div><div><dt>${t(state.locale, "lastReviewed")}</dt><dd>${CATALOG_REVIEWED_AT}</dd></div></dl><div class="catalog-card-actions"><a href="${entry.source.url}" target="_blank" rel="noopener">${icon("external", 15)} ${t(state.locale, "officialSource")}</a><button class="${tracked ? "secondary-button" : "primary-button"} compact" data-action="add-catalog" data-id="${entry.id}" ${tracked ? "disabled" : ""}>${tracked ? tx("Tracked", "В плане", "Rejada") : tx("Add to plan", "Добавить в план", "Rejaga qo‘shish")}</button></div></article>`;
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
  form.elements.country.innerHTML = countryOptions(asset?.country || state.profile.activeCountries?.[0] || "RU", false);
  form.elements.ownerId.innerHTML = state.people.map((person) => `<option value="${person.id}" ${asset?.ownerId === person.id ? "selected" : ""}>${escapeHTML(personName(person.id))}</option>`).join("");
  document.querySelector("#asset-dialog-title").textContent = asset ? tx("Edit possession", "Изменить имущество", "Mulkni o‘zgartirish") : t(state.locale, "addAsset"); document.querySelector("#asset-dialog").showModal();
}

function openPersonDialog(person = null) {
  const form = document.querySelector("#person-form"); form.reset(); form.elements.id.value = person?.id || ""; form.elements.name.value = person?.name || "";
  form.elements.citizenship.innerHTML = countryOptions(person?.citizenships?.[0] || "RU", false);
  form.elements.residence.innerHTML = countryOptions(person?.jurisdictions?.find((item) => item.type === "residence")?.country || "RU", false);
  document.querySelector("#person-dialog-title").textContent = person ? tx("Edit person", "Изменить человека", "Shaxsni o‘zgartirish") : t(state.locale, "addPerson"); document.querySelector("#person-dialog").showModal();
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
  const asset = { id: existing?.id || createId("asset"), type: data.get("type"), label: String(data.get("label") || "").trim() || assetTypeLabel(data.get("type")), country: data.get("country"), ownerId: data.get("ownerId") };
  state.assets = existing ? state.assets.map((entry) => entry.id === existing.id ? asset : entry) : [...state.assets, asset]; state.profile.activeCountries = [...new Set([...(state.profile.activeCountries || []), asset.country])];
  await persistState(); document.querySelector("#asset-dialog").close(); render(); announce(tx("Possession saved.", "Имущество сохранено.", "Mulk saqlandi."));
}

async function savePerson() {
  const form = document.querySelector("#person-form"); const data = new FormData(form); const id = data.get("id"); const existing = state.people.find((person) => person.id === id);
  const person = { id: existing?.id || createId("person"), name: String(data.get("name") || "").trim() || tx("Person", "Человек", "Shaxs"), relationship: existing?.relationship || "dependant", citizenships: [data.get("citizenship")].filter(Boolean), jurisdictions: [{ country: data.get("residence"), type: "residence" }].filter((item) => item.country) };
  state.people = existing ? state.people.map((entry) => entry.id === existing.id ? person : entry) : [...state.people, person]; state.profile.activeCountries = [...new Set([...(state.profile.activeCountries || []), ...person.citizenships, ...person.jurisdictions.map((item) => item.country)])];
  await persistState(); document.querySelector("#person-dialog").close(); render(); announce(tx("Person saved.", "Человек сохранён.", "Shaxs saqlandi."));
}

function downloadText(filename, text, type) { const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
function exportCalendar() { const valid = state.items.filter((item) => parseISODate(item.schedule?.date) && item.status === "active").map((item) => ({ ...item, title: itemTitle(item) })); if (!valid.length) { announce(tx("Add at least one date first.", "Сначала добавьте хотя бы одну дату.", "Avval kamida bitta sana kiriting.")); return; } downloadText("nextdue-calendar.ics", generateICS(valid, state.settings), "text/calendar;charset=utf-8"); }

async function addCatalogItem(id) {
  const entry = CATALOG.find((item) => item.id === id); if (!entry || state.items.some((item) => item.catalogId === id)) return;
  const possible = matchCatalog(state).find((match) => match.entry.id === id); const match = possible || { entry, subjectId: state.people[0]?.id || null, assetId: null };
  state.items.push(makeItemFromCatalog(match, { title: localized(entry.title, state.locale), reason: localized(entry.summary, state.locale), catalogVersion: CATALOG_VERSION, person: personName(match.subjectId) })); state.profile.activeCountries = [...new Set([...(state.profile.activeCountries || []), entry.country])];
  await persistState(); render(); announce(tx("Added to your plan. Confirm the date next.", "Добавлено в план. Теперь подтвердите дату.", "Rejaga qo‘shildi. Endi sanani tasdiqlang."));
}

function filterCatalog(country) {
  document.querySelectorAll("[data-catalog-country]").forEach((card) => { card.hidden = country !== "all" && card.dataset.catalogCountry !== country; });
  document.querySelectorAll("[data-country-filter]").forEach((button) => button.classList.toggle("active", button.dataset.countryFilter === country));
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]"); if (!target) return; const action = target.dataset.action;
  if (action === "setup-home") { event.preventDefault(); setupStep = 1; render(); }
  if (action === "choose-goal") { setupDraft.goal = target.dataset.value; render(); }
  if (action === "setup-next") {
    if (setupStep === 2) { const data = new FormData(document.querySelector("#setup-country-form")); setupDraft.citizenship = data.get("citizenship"); setupDraft.residence = data.get("residence"); setupDraft.extraCountry = data.get("extraCountry"); }
    setupStep = Math.min(4, setupStep + 1); render();
  }
  if (action === "setup-back") { setupStep = Math.max(1, setupStep - 1); render(); }
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
  if (action === "add-catalog") await addCatalogItem(target.dataset.id);
  if (action === "export-calendar") exportCalendar();
  if (action === "backup-data") downloadText(`nextdue-backup-${toISODate(new Date())}.json`, JSON.stringify(state, null, 2), "application/json");
  if (action === "restore-data") document.querySelector("#restore-input").click();
  if (action === "calendar-menu") { const item = state.items.find((entry) => entry.id === target.dataset.id); const localizedItem = { ...item, title: itemTitle(item) }; const links = calendarLinks(localizedItem); if (!links) return; const dialog = document.querySelector("#calendar-dialog"); dialog.querySelector("#calendar-item-name").textContent = localizedItem.title; dialog.querySelector("#google-link").href = links.google; dialog.querySelector("#outlook-link").href = links.outlook; dialog.showModal(); }
  if (action === "close-dialog") target.closest("dialog").close();
  if (action === "saas-info") document.querySelector("#saas-dialog").showModal();
});

document.addEventListener("change", async (event) => {
  if (event.target.id === "setup-locale") { setupDraft.locale = event.target.value; render(); }
  if (event.target.dataset.setupAsset) { const type = event.target.dataset.setupAsset; const countrySelect = document.querySelector(`[data-setup-asset-country="${type}"]`); countrySelect.disabled = !event.target.checked; setupDraft.assets = setupDraft.assets.filter((asset) => asset.type !== type); if (event.target.checked) setupDraft.assets.push({ type, country: countrySelect.value }); render(); }
  if (event.target.dataset.setupAssetCountry) { const asset = setupDraft.assets.find((item) => item.type === event.target.dataset.setupAssetCountry); if (asset) asset.country = event.target.value; }
  if (event.target.id === "language-select") { setLanguage(event.target.value); await persistState(); render(); }
  if (event.target.name === "kind") updateScheduleFields();
  if (event.target.name === "date" || event.target.name === "reminderInput") updateReminderPreview();
  if (event.target.dataset.setting) { state.settings[event.target.dataset.setting] = event.target.checked; await persistState(); render(); }
});

document.addEventListener("input", (event) => { if (event.target.name === "reminderInput" || event.target.name === "date") updateReminderPreview(); });
document.addEventListener("click", (event) => { const filter = event.target.closest("[data-country-filter]"); if (filter) filterCatalog(filter.dataset.countryFilter); });

document.querySelector("#delete-item").addEventListener("click", async () => {
  const id = document.querySelector("#item-form").elements.id.value;
  if (id && window.confirm(tx("Remove this obligation?", "Удалить эту обязанность?", "Bu majburiyat o‘chirilsinmi?"))) { state.items = state.items.filter((item) => item.id !== id); await persistState(); document.querySelector("#item-dialog").close(); render(); }
});

document.querySelector("#restore-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0]; if (!file || file.size > 1_000_000) return;
  try { state = validateBackup(JSON.parse(await file.text())); await persistState(); activeView = "today"; render(); announce(tx("Backup restored.", "Резервная копия восстановлена.", "Nusxa tiklandi.")); } catch (error) { announce(error.message); }
  event.target.value = "";
});

document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));

state = await loadState();
setLanguage(state.locale || "en");
render();
