import {
  CATEGORY_META,
  REMINDER_PLANS,
  SCHEMA_VERSION,
  TEMPLATES,
  calendarLinks,
  createId,
  generateICS,
  getCalendarEventCount,
  getItemStatus,
  getNextAction,
  getNextOccurrence,
  getSuggestions,
  groupItemsForToday,
  makeItemFromTemplate,
  parseISODate,
  sortItems,
  toISODate,
  addDays,
  validateBackup,
} from "./logic.mjs";

const DB_NAME = "nextdue-local";
const DB_VERSION = 1;
const STORE_NAME = "state";
const STATE_KEY = "app";

const COUNTRIES = [
  ["", "Select country"],
  ["AU", "Australia"], ["BR", "Brazil"], ["CA", "Canada"], ["CN", "China"],
  ["FR", "France"], ["DE", "Germany"], ["IN", "India"], ["IT", "Italy"],
  ["JP", "Japan"], ["NL", "Netherlands"], ["PL", "Poland"], ["PT", "Portugal"],
  ["SG", "Singapore"], ["ES", "Spain"], ["AE", "United Arab Emirates"],
  ["GB", "United Kingdom"], ["US", "United States"], ["OTHER", "Other / not listed"],
];

const GOALS = {
  organize: { title: "Stay organized", description: "Keep everyday renewals and obligations in one calm plan.", icon: "check-circle" },
  travel: { title: "Plan a trip", description: "Prepare travel documents early and avoid last-minute surprises.", icon: "plane" },
  move: { title: "Move country", description: "Map the documents and recurring checks around a relocation.", icon: "compass" },
};

function defaultState() {
  return {
    version: SCHEMA_VERSION,
    onboarded: false,
    profile: {
      goal: "organize",
      citizenship: "",
      residence: "",
      destination: "",
      household: ["self"],
      possessions: [],
    },
    items: [],
    settings: {
      privacySafeTitles: true,
      preparationMilestones: true,
      horizonMonths: 24,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

let state = defaultState();
let setupStep = 1;
let setupDraft = structuredClone(state.profile);
let activeView = "today";
let dbMode = "indexeddb";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function loadState() {
  try {
    const db = await openDatabase();
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(STATE_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value ? validateBackup(value) : defaultState();
  } catch (error) {
    dbMode = "localstorage";
    const value = localStorage.getItem("nextdue-state");
    if (!value) return defaultState();
    try { return validateBackup(JSON.parse(value)); } catch { return defaultState(); }
  }
}

async function persistState() {
  state.updatedAt = new Date().toISOString();
  try {
    if (dbMode === "localstorage") throw new Error("fallback");
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(state, STATE_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    dbMode = "localstorage";
    localStorage.setItem("nextdue-state", JSON.stringify(state));
  }
}

function icon(name, size = 20) {
  return `<svg class="icon" width="${size}" height="${size}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;",
  })[char]);
}

function countryName(code) {
  return COUNTRIES.find(([value]) => value === code)?.[1] || code || "Not set";
}

function formatDate(value, options = {}) {
  const parsed = parseISODate(value);
  if (!parsed) return "Date not set";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric", month: "short", year: options.short ? undefined : "numeric", timeZone: "UTC",
  }).format(parsed);
}

function countryOptions(selected, includeEmpty = true) {
  return COUNTRIES.filter(([value]) => includeEmpty || value).map(([value, label]) =>
    `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`
  ).join("");
}

function scheduleDescription(item) {
  if (!parseISODate(item.schedule?.date)) return "Add a date";
  if (item.schedule.kind === "recurring") {
    const frequency = item.schedule.frequency === "monthly" ? "Monthly" : "Yearly";
    return `${frequency} · next ${formatDate(getNextOccurrence(item), { short: true })}`;
  }
  return `${item.schedule.kind === "expiry" ? "Expires" : "Due"} ${formatDate(item.schedule.date)}`;
}

function announce(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function setDocumentTitle() {
  const titles = { today: "Today", plan: "Plan", library: "Library", settings: "Settings" };
  document.title = state.onboarded ? `${titles[activeView]} · NextDue` : "NextDue · Life admin, before it becomes urgent";
}

function render() {
  setDocumentTitle();
  const setup = document.querySelector("#setup-view");
  const app = document.querySelector("#app-shell");
  if (!state.onboarded) {
    setup.hidden = false;
    app.hidden = true;
    renderSetup();
    return;
  }
  setup.hidden = true;
  app.hidden = false;
  document.querySelectorAll("[data-view]").forEach((button) => {
    const selected = button.dataset.view === activeView;
    button.classList.toggle("active", selected);
    if (selected) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  const renderer = { today: renderToday, plan: renderPlan, library: renderLibrary, settings: renderSettings }[activeView];
  document.querySelector("#view-root").innerHTML = renderer();
}

function renderSetup() {
  const root = document.querySelector("#setup-root");
  const progress = `${Math.round((setupStep / 3) * 100)}%`;
  root.innerHTML = `
    <header class="setup-header">
      <a class="brand" href="#" data-action="setup-home" aria-label="NextDue home">
        <span class="brand-mark">${icon("check", 18)}</span><span>NextDue</span>
      </a>
      <button class="text-button" data-action="privacy-info">${icon("lock", 16)} How privacy works</button>
    </header>
    <main class="setup-main">
      <section class="setup-intro">
        <span class="eyebrow">Calm life admin</span>
        <h1>Important dates,<br>handled early.</h1>
        <p>Tell NextDue a little about your situation. It creates a small, editable plan for documents and recurring obligations—then turns it into calendar-ready reminders.</p>
        <ul class="trust-list">
          <li>${icon("check-circle", 19)} No document numbers or scans</li>
          <li>${icon("check-circle", 19)} Your plan stays in this browser</li>
          <li>${icon("check-circle", 19)} You confirm every suggestion</li>
        </ul>
        <button class="sample-link" data-action="sample-plan">Explore a sample plan ${icon("arrow-right", 16)}</button>
      </section>
      <section class="setup-card" aria-labelledby="setup-title">
        <div class="setup-progress-row"><span>Set up your plan</span><span>Step ${setupStep} of 3</span></div>
        <div class="progress-track" aria-hidden="true"><span style="width:${progress}"></span></div>
        ${setupStep === 1 ? setupGoal() : setupStep === 2 ? setupContext() : setupSuggestions()}
      </section>
    </main>`;
}

function setupGoal() {
  return `
    <div class="setup-copy"><p class="step-kicker">First, your focus</p><h2 id="setup-title">What are you planning for?</h2><p>This only changes the starter checklist. You can add anything later.</p></div>
    <div class="choice-stack" role="radiogroup" aria-label="Planning focus">
      ${Object.entries(GOALS).map(([value, goal]) => `
        <button class="choice-card ${setupDraft.goal === value ? "selected" : ""}" role="radio" aria-checked="${setupDraft.goal === value}" data-action="choose-goal" data-value="${value}">
          <span class="choice-icon">${icon(goal.icon, 21)}</span>
          <span><strong>${goal.title}</strong><small>${goal.description}</small></span>
          <span class="radio-dot"></span>
        </button>`).join("")}
    </div>
    <div class="setup-actions"><span></span><button class="primary-button" data-action="setup-next">Continue ${icon("arrow-right", 17)}</button></div>`;
}

function setupContext() {
  const possessionOptions = [["property", "Property", "building"], ["vehicle", "Vehicle", "car"], ["business", "Business", "briefcase"], ["pet", "Pet", "heart"]];
  return `
    <div class="setup-copy"><p class="step-kicker">Your situation</p><h2 id="setup-title">What shapes your plan?</h2><p>Only answer what is useful. You can skip or change this later.</p></div>
    <form id="context-form" class="context-form">
      <div class="form-grid two">
        <label><span>Citizenship</span><select name="citizenship">${countryOptions(setupDraft.citizenship)}</select></label>
        <label><span>Country of residence</span><select name="residence">${countryOptions(setupDraft.residence)}</select></label>
      </div>
      ${setupDraft.goal !== "organize" ? `<label><span>${setupDraft.goal === "move" ? "Moving to" : "Travelling to"} <small>optional</small></span><select name="destination">${countryOptions(setupDraft.destination)}</select></label>` : ""}
      <fieldset class="chip-field"><legend>What do you manage? <small>optional</small></legend><div class="chip-grid">
        ${possessionOptions.map(([value, label, iconName]) => `<label class="select-chip ${setupDraft.possessions.includes(value) ? "checked" : ""}">
          <input type="checkbox" name="possessions" value="${value}" ${setupDraft.possessions.includes(value) ? "checked" : ""}>${icon(iconName, 17)} ${label}
        </label>`).join("")}
      </div></fieldset>
      <fieldset class="chip-field"><legend>Who is this plan for?</legend><div class="chip-grid">
        <label class="select-chip checked"><input type="checkbox" name="household" value="self" checked disabled>${icon("user", 17)} Me</label>
        <label class="select-chip ${setupDraft.household.includes("dependants") ? "checked" : ""}"><input type="checkbox" name="household" value="dependants" ${setupDraft.household.includes("dependants") ? "checked" : ""}>${icon("users", 17)} Family / dependants</label>
      </div></fieldset>
    </form>
    <div class="setup-actions"><button class="secondary-button" data-action="setup-back">Back</button><button class="primary-button" data-action="setup-next">See my checklist ${icon("arrow-right", 17)}</button></div>`;
}

function setupSuggestions() {
  const suggestions = getSuggestions(setupDraft);
  return `
    <div class="setup-copy"><p class="step-kicker">Your starter checklist</p><h2 id="setup-title">Which dates should we track?</h2><p>These are common planning prompts, not legal requirements. Keep only what applies.</p></div>
    <div class="suggestion-list">
      ${suggestions.map((suggestion) => `<label class="suggestion-row">
        <input type="checkbox" name="suggestion" value="${suggestion.id}" checked>
        <span class="suggestion-check">${icon("check", 15)}</span>
        <span><strong>${escapeHTML(suggestion.title)}</strong><small>${escapeHTML(suggestion.reason)}</small></span>
        <span class="source-tag">Commonly needed</span>
      </label>`).join("")}
    </div>
    <p class="legal-note">NextDue organizes dates you confirm. Official authorities remain the source of truth.</p>
    <div class="setup-actions"><button class="secondary-button" data-action="setup-back">Back</button><button class="primary-button" data-action="finish-setup">Create my plan ${icon("sparkles", 17)}</button></div>`;
}

function dashboardHeadline(groups) {
  const attention = groups.now.length;
  const missing = groups.missing.length;
  if (attention) return { eyebrow: "Your next move", title: `${attention} ${attention === 1 ? "item needs" : "items need"} attention`, copy: "The nearest deadlines are already inside their planning window." };
  if (missing) return { eyebrow: "Complete your plan", title: `${missing} ${missing === 1 ? "date is" : "dates are"} still missing`, copy: "Add them when you have the documents nearby. Nothing else is required." };
  const validDays = state.items.map((item) => getItemStatus(item).days).filter((days) => Number.isFinite(days) && days >= 0);
  const days = validDays.length ? Math.min(...validDays) : 0;
  return { eyebrow: "All calm", title: days ? `You’re covered for the next ${days} days` : "Your plan is ready", copy: "We’ll keep the next action visible without filling your day with noise." };
}

function viewHeader({ eyebrow, title, copy, action = true }) {
  return `<div class="view-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${copy}</p></div>${action ? `<button class="primary-button compact" data-action="add-item">${icon("plus", 17)} Add deadline</button>` : ""}</div>`;
}

function itemCard(item, options = {}) {
  const status = getItemStatus(item);
  const category = CATEGORY_META[item.category] || CATEGORY_META.custom;
  const links = calendarLinks(item);
  return `<article class="item-card" data-item-id="${escapeHTML(item.id)}">
    <div class="item-icon category-${escapeHTML(item.category)}">${icon(category.icon, 20)}</div>
    <div class="item-main">
      <div class="item-title-row"><h3>${escapeHTML(item.title)}</h3><span class="status status-${status.tone}">${status.label}</span></div>
      <p class="item-meta">${escapeHTML(scheduleDescription(item))}${item.jurisdiction ? ` · ${escapeHTML(countryName(item.jurisdiction))}` : ""}${item.person && item.person !== "Me" ? ` · ${escapeHTML(item.person)}` : ""}</p>
      <p class="next-action">${icon(status.key === "missing" ? "calendar-plus" : "arrow-bend", 16)} ${escapeHTML(getNextAction(item))}</p>
    </div>
    <div class="item-actions">
      ${links && options.showCalendar ? `<button class="icon-button" data-action="calendar-menu" data-id="${escapeHTML(item.id)}" title="Calendar options" aria-label="Calendar options for ${escapeHTML(item.title)}">${icon("calendar", 18)}</button>` : ""}
      <button class="icon-button" data-action="edit-item" data-id="${escapeHTML(item.id)}" title="Edit" aria-label="Edit ${escapeHTML(item.title)}">${icon("edit", 18)}</button>
    </div>
  </article>`;
}

function renderGroup(title, subtitle, items, className = "") {
  if (!items.length) return "";
  return `<section class="item-group ${className}"><div class="section-heading"><div><h2>${title}</h2><p>${subtitle}</p></div><span class="count">${items.length}</span></div><div class="item-list">${items.map((item) => itemCard(item, { showCalendar: true })).join("")}</div></section>`;
}

function renderToday() {
  const groups = groupItemsForToday(state.items);
  const headline = dashboardHeadline(groups);
  return `
    ${viewHeader({ ...headline })}
    <section class="today-hero ${groups.now.length ? "attention" : "calm"}">
      <div class="hero-symbol">${icon(groups.now.length ? "bell" : "shield-check", 28)}</div>
      <div><span>${groups.now.length ? "Focus" : "Status"}</span><strong>${escapeHTML(headline.title)}</strong><p>${escapeHTML(headline.copy)}</p></div>
      <button class="secondary-button light" data-action="export-calendar">${icon("download", 17)} Export calendar</button>
    </section>
    ${state.items.length === 0 ? emptyPlan() : `
      ${renderGroup("Act now", "Deadlines inside their action window.", groups.now, "priority")}
      ${renderGroup("Add dates", "Useful prompts waiting for one detail.", groups.missing)}
      ${renderGroup("Coming up", "Worth planning, not worrying about.", groups.upcoming)}
      ${renderGroup("Covered", "Nothing needed right now.", groups.covered, "covered-group")}
    `}
    <aside class="principle-card">${icon("info", 20)}<div><strong>Recommendations stay advisory</strong><p>NextDue suggests common planning categories. You decide what applies and verify details with the relevant authority.</p></div></aside>`;
}

function emptyPlan() {
  return `<section class="empty-state"><div class="empty-illustration">${icon("calendar-plus", 31)}</div><h2>Add your first important date</h2><p>Start with one document, permit, tax date, or recurring responsibility. You can always add more later.</p><button class="primary-button" data-action="add-item">${icon("plus", 17)} Add deadline</button></section>`;
}

function renderPlan() {
  const dated = sortItems(state.items.filter((item) => parseISODate(item.schedule?.date) && item.status === "active"));
  const missing = state.items.filter((item) => !parseISODate(item.schedule?.date) && item.status === "active");
  const groups = new Map();
  dated.forEach((item) => {
    const date = getNextOccurrence(item);
    const key = date.slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return `${viewHeader({ eyebrow: "Timeline", title: "Your plan", copy: "A chronological view of deadlines and the actions that come before them." })}
    <div class="toolbar"><div class="segmented" aria-label="Plan view"><button class="active">Timeline</button><button disabled title="Calendar grid is planned for a later release">Calendar</button></div><button class="secondary-button compact" data-action="export-calendar">${icon("download", 16)} Export .ics</button></div>
    ${dated.length ? `<div class="timeline">${[...groups.entries()].map(([month, items]) => {
      const label = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" }).format(parseISODate(`${month}-01`));
      return `<section class="timeline-month"><div class="month-label"><span>${label}</span><i></i></div><div class="timeline-items">${items.map((item) => itemCard(item, { showCalendar: true })).join("")}</div></section>`;
    }).join("")}</div>` : emptyPlan()}
    ${missing.length ? `<section class="undated-section"><div class="section-heading"><div><h2>Waiting for a date</h2><p>These stay outside the timeline until you add one.</p></div><span class="count">${missing.length}</span></div><div class="item-list">${missing.map((item) => itemCard(item)).join("")}</div></section>` : ""}`;
}

function renderLibrary() {
  const categories = Object.entries(CATEGORY_META).map(([key, meta]) => ({ key, meta, items: state.items.filter((item) => item.category === key) })).filter((group) => group.items.length);
  return `${viewHeader({ eyebrow: "Your records", title: "Library", copy: "Documents and obligations, grouped by what they help you manage." })}
    ${categories.length ? `<div class="library-grid">${categories.map(({ key, meta, items }) => `<section class="library-card">
      <div class="library-card-header"><span class="item-icon category-${key}">${icon(meta.icon, 20)}</span><div><h2>${meta.label}</h2><p>${items.length} ${items.length === 1 ? "item" : "items"}</p></div></div>
      <div class="library-rows">${sortItems(items).map((item) => `<button data-action="edit-item" data-id="${escapeHTML(item.id)}"><span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(scheduleDescription(item))}</small></span>${icon("chevron-right", 17)}</button>`).join("")}</div>
    </section>`).join("")}</div>` : emptyPlan()}`;
}

function renderSettings() {
  const eventCount = getCalendarEventCount(state.items, state.settings);
  return `${viewHeader({ eyebrow: "Control centre", title: "Settings", copy: "Manage your profile, calendar export, and browser-local data.", action: false })}
    <div class="settings-grid">
      <section class="settings-card wide"><div class="settings-title"><span class="settings-icon">${icon("user", 20)}</span><div><h2>Your situation</h2><p>Used only to suggest a focused starter list.</p></div></div>
        <form id="profile-form" class="settings-form"><div class="form-grid three">
          <label><span>Focus</span><select name="goal">${Object.entries(GOALS).map(([value, goal]) => `<option value="${value}" ${state.profile.goal === value ? "selected" : ""}>${goal.title}</option>`).join("")}</select></label>
          <label><span>Citizenship</span><select name="citizenship">${countryOptions(state.profile.citizenship)}</select></label>
          <label><span>Residence</span><select name="residence">${countryOptions(state.profile.residence)}</select></label>
        </div><div class="settings-form-footer"><span>Changing this never removes existing items.</span><button class="secondary-button compact" type="submit">Save profile</button></div></form>
      </section>
      <section class="settings-card"><div class="settings-title"><span class="settings-icon">${icon("calendar", 20)}</span><div><h2>Calendar export</h2><p>A private snapshot you import yourself.</p></div></div>
        <div class="calendar-preview"><strong>${eventCount} calendar events</strong><span>Deadlines and preparation milestones · next ${state.settings.horizonMonths} months</span></div>
        <label class="toggle-row"><span><strong>Privacy-safe titles</strong><small>Uses generic event names by default.</small></span><input type="checkbox" data-setting="privacySafeTitles" ${state.settings.privacySafeTitles ? "checked" : ""}><i></i></label>
        <label class="toggle-row"><span><strong>Preparation milestones</strong><small>Adds a visible “start” date before each deadline.</small></span><input type="checkbox" data-setting="preparationMilestones" ${state.settings.preparationMilestones ? "checked" : ""}><i></i></label>
        <button class="primary-button full" data-action="export-calendar">${icon("download", 17)} Export calendar (.ics)</button>
        <p class="microcopy">This is not live sync. Importing again may create duplicates in some calendar apps.</p>
      </section>
      <section class="settings-card"><div class="settings-title"><span class="settings-icon">${icon("database", 20)}</span><div><h2>Your data</h2><p>Stored in this browser, not on our servers.</p></div></div>
        <div class="data-actions"><button class="secondary-button full" data-action="backup-data">${icon("download", 17)} Download backup</button><button class="secondary-button full" data-action="restore-data">${icon("upload", 17)} Restore backup</button></div>
        <button class="danger-link" data-action="reset-data">Clear all local data</button>
      </section>
      <section class="settings-card trust-card"><div class="settings-title"><span class="settings-icon">${icon("shield-check", 20)}</span><div><h2>Privacy boundary</h2><p>What this first release intentionally avoids.</p></div></div>
        <ul><li>No passport or tax ID numbers</li><li>No scans or attachments</li><li>No analytics or third-party trackers</li><li>No legal or tax completeness claims</li></ul>
      </section>
    </div>`;
}

function openItemDialog(item = null) {
  const dialog = document.querySelector("#item-dialog");
  const form = document.querySelector("#item-form");
  const editing = Boolean(item);
  form.reset();
  form.elements.id.value = item?.id || "";
  form.elements.title.value = item?.title || "";
  form.elements.category.value = item?.category || "identity";
  form.elements.kind.value = item?.schedule?.kind || "expiry";
  form.elements.date.value = item?.schedule?.date || "";
  form.elements.frequency.value = item?.schedule?.frequency || "yearly";
  form.elements.reminderPlan.value = item?.reminderPlan || "standard";
  form.elements.person.value = item?.person || "Me";
  form.elements.jurisdiction.value = item?.jurisdiction || state.profile.destination || state.profile.residence || "";
  form.elements.notes.value = item?.notes || "";
  dialog.querySelector("#item-dialog-title").textContent = editing ? "Edit deadline" : "Add a deadline";
  dialog.querySelector("#delete-item").hidden = !editing;
  dialog.querySelector("#complete-item").hidden = !editing || item?.status === "completed";
  updateScheduleFields();
  dialog.showModal();
  window.setTimeout(() => form.elements.title.focus(), 50);
}

function updateScheduleFields() {
  const form = document.querySelector("#item-form");
  const recurring = form.elements.kind.value === "recurring";
  form.querySelector("#frequency-field").hidden = !recurring;
  form.querySelector("#date-label").textContent = recurring ? "First due date" : form.elements.kind.value === "expiry" ? "Expiry date" : "Due date";
}

function openPrivacyDialog() {
  document.querySelector("#privacy-dialog").showModal();
}

function openCalendarMenu(item) {
  const links = calendarLinks(item);
  if (!links) { announce("Add a date before sending this item to a calendar."); return; }
  const dialog = document.querySelector("#calendar-dialog");
  dialog.querySelector("#calendar-item-name").textContent = item.title;
  dialog.querySelector("#google-link").href = links.google;
  dialog.querySelector("#outlook-link").href = links.outlook;
  dialog.showModal();
}

async function finishSetup() {
  const selected = [...document.querySelectorAll('input[name="suggestion"]:checked')].map((input) => input.value);
  const templates = TEMPLATES.filter((template) => selected.includes(template.id));
  state = defaultState();
  state.onboarded = true;
  state.profile = structuredClone(setupDraft);
  state.items = templates.map((template) => makeItemFromTemplate(template, state.profile));
  await persistState();
  activeView = "today";
  render();
  announce("Your private plan is ready. Add dates when you have them.");
}

function dateFromNow(days) {
  const today = new Date();
  const utc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return toISODate(addDays(utc, days));
}

async function createSamplePlan() {
  state = defaultState();
  state.onboarded = true;
  state.profile = { goal: "move", citizenship: "GB", residence: "GB", destination: "PT", household: ["self"], possessions: ["vehicle"] };
  const sampleSpecs = [
    ["passport", 280], ["residence-permit", 96], ["annual-tax-review", 44], ["vehicle-renewal", 19],
  ];
  state.items = sampleSpecs.map(([templateId, days]) => {
    const template = TEMPLATES.find((entry) => entry.id === templateId);
    const item = makeItemFromTemplate(template, state.profile);
    item.schedule.date = dateFromNow(days);
    return item;
  });
  await persistState();
  activeView = "today";
  render();
  announce("Sample plan loaded. Edit or clear it anytime.");
}

async function saveItem(form) {
  const data = new FormData(form);
  const id = data.get("id");
  const existing = state.items.find((item) => item.id === id);
  const timestamp = new Date().toISOString();
  const item = {
    id: existing?.id || createId("custom"),
    templateId: existing?.templateId || null,
    title: String(data.get("title")).trim(),
    category: data.get("category"),
    jurisdiction: data.get("jurisdiction"),
    person: String(data.get("person") || "Me").trim().slice(0, 60),
    provenance: existing?.provenance || "user",
    confirmation: "confirmed",
    reason: existing?.reason || "You added this.",
    schedule: {
      kind: data.get("kind"),
      date: data.get("date"),
      frequency: data.get("frequency") || "yearly",
      interval: 1,
    },
    reminderPlan: data.get("reminderPlan"),
    status: existing?.status || "active",
    notes: String(data.get("notes") || "").trim().slice(0, 500),
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  };
  if (!item.title) { announce("Add a short name for this deadline."); return; }
  if (item.schedule.date && !parseISODate(item.schedule.date)) { announce("Choose a valid date."); return; }
  if (existing) state.items = state.items.map((entry) => entry.id === existing.id ? item : entry);
  else state.items.push(item);
  await persistState();
  document.querySelector("#item-dialog").close();
  render();
  announce(existing ? "Deadline updated." : "Deadline added.");
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCalendar() {
  const validItems = state.items.filter((item) => parseISODate(item.schedule?.date) && item.status === "active");
  if (!validItems.length) { announce("Add at least one date before exporting."); return; }
  downloadText("nextdue-calendar.ics", generateICS(validItems, state.settings), "text/calendar;charset=utf-8");
  announce(`Calendar exported with ${getCalendarEventCount(validItems, state.settings)} events.`);
}

async function handleContextStep() {
  const form = document.querySelector("#context-form");
  const data = new FormData(form);
  setupDraft.citizenship = data.get("citizenship") || "";
  setupDraft.residence = data.get("residence") || "";
  setupDraft.destination = data.get("destination") || "";
  setupDraft.possessions = data.getAll("possessions");
  setupDraft.household = ["self", ...data.getAll("household").filter((item) => item !== "self")];
  setupStep = 3;
  render();
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "setup-home") { event.preventDefault(); setupStep = 1; render(); }
  if (action === "privacy-info") openPrivacyDialog();
  if (action === "sample-plan") await createSamplePlan();
  if (action === "choose-goal") { setupDraft.goal = target.dataset.value; render(); }
  if (action === "setup-next") {
    if (setupStep === 1) { setupStep = 2; render(); }
    else if (setupStep === 2) await handleContextStep();
  }
  if (action === "setup-back") { setupStep = Math.max(1, setupStep - 1); render(); }
  if (action === "finish-setup") await finishSetup();
  if (action === "change-view") { activeView = target.dataset.view; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  if (action === "add-item") openItemDialog();
  if (action === "edit-item") openItemDialog(state.items.find((item) => item.id === target.dataset.id));
  if (action === "save-item") await saveItem(document.querySelector("#item-form"));
  if (action === "calendar-menu") openCalendarMenu(state.items.find((item) => item.id === target.dataset.id));
  if (action === "export-calendar") exportCalendar();
  if (action === "backup-data") {
    downloadText(`nextdue-backup-${toISODate(new Date())}.json`, JSON.stringify(state, null, 2), "application/json");
    announce("Encrypted device storage is not guaranteed; keep the backup somewhere safe.");
  }
  if (action === "restore-data") document.querySelector("#restore-input").click();
  if (action === "reset-data") {
    if (window.confirm("Clear this plan from the current browser? Download a backup first if you may need it.")) {
      state = defaultState();
      setupDraft = structuredClone(state.profile);
      setupStep = 1;
      await persistState();
      render();
      announce("Local plan cleared.");
    }
  }
  if (action === "close-dialog") target.closest("dialog").close();
});

document.addEventListener("change", async (event) => {
  if (event.target.matches('.select-chip input[type="checkbox"]')) event.target.closest(".select-chip").classList.toggle("checked", event.target.checked);
  if (event.target.name === "kind") updateScheduleFields();
  if (event.target.dataset.setting) {
    state.settings[event.target.dataset.setting] = event.target.checked;
    await persistState();
    render();
    announce("Calendar preference saved.");
  }
});

document.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (event.target.id === "item-form") await saveItem(event.target);
  if (event.target.id === "profile-form") {
    const data = new FormData(event.target);
    state.profile.goal = data.get("goal");
    state.profile.citizenship = data.get("citizenship");
    state.profile.residence = data.get("residence");
    await persistState();
    render();
    announce("Profile updated. Existing items were kept.");
  }
});

document.querySelector("#delete-item").addEventListener("click", async () => {
  const id = document.querySelector("#item-form").elements.id.value;
  const item = state.items.find((entry) => entry.id === id);
  if (item && window.confirm(`Remove “${item.title}” from this plan?`)) {
    state.items = state.items.filter((entry) => entry.id !== id);
    await persistState();
    document.querySelector("#item-dialog").close();
    render();
    announce("Deadline removed.");
  }
});

document.querySelector("#complete-item").addEventListener("click", async () => {
  const id = document.querySelector("#item-form").elements.id.value;
  const item = state.items.find((entry) => entry.id === id);
  if (item) {
    item.status = "completed";
    item.updatedAt = new Date().toISOString();
    await persistState();
    document.querySelector("#item-dialog").close();
    render();
    announce("Marked complete.");
  }
});

document.querySelector("#restore-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 1_000_000) { announce("Backup is too large."); return; }
  try {
    const restored = validateBackup(JSON.parse(await file.text()));
    state = restored;
    await persistState();
    activeView = "today";
    render();
    announce("Backup restored.");
  } catch (error) {
    announce(error.message || "That backup could not be restored.");
  } finally {
    event.target.value = "";
  }
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

state = await loadState();
setupDraft = structuredClone(state.profile);
render();
