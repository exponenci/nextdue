export const SCHEMA_VERSION = 2;

export const CATEGORY_META = {
  identity: { label: "Identity & travel", icon: "passport", safeTitle: "Renew identity document" },
  residence: { label: "Residence", icon: "home", safeTitle: "Review residence document" },
  tax: { label: "Tax & money", icon: "receipt", safeTitle: "Review financial obligation" },
  transport: { label: "Transport", icon: "car", safeTitle: "Renew transport document" },
  property: { label: "Property", icon: "building", safeTitle: "Review property obligation" },
  family: { label: "Family", icon: "users", safeTitle: "Review family document" },
  health: { label: "Health", icon: "heart", safeTitle: "Renew health document" },
  custom: { label: "Custom", icon: "bookmark", safeTitle: "Personal deadline" },
};

export const REMINDER_PLANS = {
  early: { label: "Plan well ahead", offsets: [180, 120, 90, 30], summary: "6 months, 4 months, 3 months, 1 month" },
  standard: { label: "Standard", offsets: [60, 30, 7], summary: "2 months, 1 month, 1 week" },
  compact: { label: "Closer to due", offsets: [30, 7, 1], summary: "1 month, 1 week, 1 day" },
  monthly: { label: "Monthly routine", offsets: [7, 1, 0], summary: "1 week, 1 day, due date" },
};

export function parseReminderSequence(input) {
  const raw = String(input || "").trim();
  if (!raw) throw new Error("Enter at least one reminder day.");
  const parts = raw.split("/").map((part) => part.trim());
  if (parts.some((part) => part === "")) throw new Error("Use / between reminder days without empty values.");
  const offsets = parts.map((part) => {
    if (!/^\d+$/.test(part)) throw new Error(`“${part}” is not a whole number of days.`);
    const value = Number(part);
    if (!Number.isSafeInteger(value) || value < 0 || value > 3650) throw new Error("Reminder days must be between 0 and 3650.");
    return value;
  });
  if (new Set(offsets).size !== offsets.length) throw new Error("Remove duplicate reminder days.");
  return offsets.sort((a, b) => b - a);
}

export function formatReminderSequence(offsets) {
  return [...(offsets || [])].sort((a, b) => b - a).join("/");
}

export const TEMPLATES = [
  {
    id: "passport",
    title: "Passport or travel document",
    category: "identity",
    defaultKind: "expiry",
    reminderPlan: "early",
    reason: "Commonly needed for travel and identity checks.",
    goals: ["organize", "travel", "move"],
  },
  {
    id: "residence-permit",
    title: "Residence permit or visa",
    category: "residence",
    defaultKind: "expiry",
    reminderPlan: "early",
    reason: "Often relevant when living in or moving to another country.",
    goals: ["move"],
  },
  {
    id: "travel-readiness",
    title: "Destination entry requirements",
    category: "identity",
    defaultKind: "due",
    reminderPlan: "standard",
    reason: "A planning checkpoint before an international trip.",
    goals: ["travel", "move"],
  },
  {
    id: "annual-tax-review",
    title: "Annual tax filing review",
    category: "tax",
    defaultKind: "recurring",
    defaultFrequency: "yearly",
    reminderPlan: "standard",
    reason: "A neutral annual check; the exact requirement depends on your situation.",
    goals: ["organize", "move"],
  },
  {
    id: "vehicle-renewal",
    title: "Vehicle registration or inspection",
    category: "transport",
    defaultKind: "recurring",
    defaultFrequency: "yearly",
    reminderPlan: "standard",
    reason: "Suggested because you selected a vehicle.",
    possession: "vehicle",
  },
  {
    id: "property-obligation",
    title: "Property tax or registration review",
    category: "property",
    defaultKind: "recurring",
    defaultFrequency: "yearly",
    reminderPlan: "standard",
    reason: "Suggested because you selected property.",
    possession: "property",
  },
  {
    id: "business-obligation",
    title: "Business filing review",
    category: "tax",
    defaultKind: "recurring",
    defaultFrequency: "monthly",
    reminderPlan: "monthly",
    reason: "Suggested because you selected a business.",
    possession: "business",
  },
  {
    id: "pet-travel",
    title: "Pet travel documents",
    category: "family",
    defaultKind: "expiry",
    reminderPlan: "standard",
    reason: "Suggested for travel or a move with a pet.",
    possession: "pet",
    goals: ["travel", "move"],
  },
];

export function getSuggestions(profile) {
  const possessions = new Set(profile.possessions || []);
  return TEMPLATES.filter((template) => {
    const goalMatch = !template.goals || template.goals.includes(profile.goal);
    const possessionMatch = !template.possession || possessions.has(template.possession);
    return goalMatch && possessionMatch;
  }).slice(0, 7);
}

export function makeItemFromTemplate(template, profile, now = new Date()) {
  const timestamp = now.toISOString();
  return {
    id: createId(template.id),
    templateId: template.id,
    title: template.title,
    category: template.category,
    jurisdiction: profile.destination || profile.residence || "",
    person: "Me",
    provenance: "suggested",
    confirmation: "confirmed",
    reason: template.reason,
    schedule: {
      kind: template.defaultKind,
      date: "",
      frequency: template.defaultFrequency || "yearly",
      interval: 1,
    },
    reminderPlan: template.reminderPlan,
    status: "active",
    notes: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function makeItemFromCatalog(match, options = {}, now = new Date()) {
  const { entry, subjectId = null, assetId = null } = match;
  const timestamp = now.toISOString();
  const reminderInput = options.reminderInput || entry.defaultReminders || "60/30/7/1/0";
  return {
    id: createId(entry.id),
    catalogId: entry.id,
    catalogVersion: options.catalogVersion || "2026.11",
    title: options.title || entry.title?.en || entry.id,
    category: entry.category,
    country: entry.country,
    jurisdiction: entry.country,
    subjectId,
    assetId,
    person: options.person || "Me",
    provenance: "catalog",
    confirmation: "confirmed",
    reason: options.reason || entry.summary?.en || "Matched from a reviewed country pack.",
    schedule: {
      kind: options.kind || (entry.timing?.kind === "monthly" ? "recurring" : entry.timing?.kind?.startsWith("annual") ? "recurring" : "expiry"),
      date: options.date || "",
      frequency: entry.timing?.kind === "monthly" ? "monthly" : "yearly",
      interval: 1,
    },
    reminderInput,
    reminderOffsets: parseReminderSequence(reminderInput),
    status: "active",
    notes: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createId(prefix = "item") {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

export function parseISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateValue, days) {
  const date = typeof dateValue === "string" ? parseISODate(dateValue) : new Date(dateValue.getTime());
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

export function addMonthsClamped(dateValue, months) {
  const date = typeof dateValue === "string" ? parseISODate(dateValue) : new Date(dateValue.getTime());
  if (!date) return null;
  const originalDay = date.getUTCDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(originalDay, lastDay));
  return target;
}

export function daysBetween(from, to) {
  const a = typeof from === "string" ? parseISODate(from) : new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  const b = typeof to === "string" ? parseISODate(to) : new Date(Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()));
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function expandOccurrences(item, options = {}) {
  const now = options.now || new Date();
  const horizonMonths = Math.min(Math.max(Number(options.horizonMonths) || 24, 1), 60);
  const date = item.schedule?.date;
  if (!parseISODate(date) || item.status !== "active") return [];

  if (item.schedule.kind !== "recurring") return [{ date, itemId: item.id }];

  const interval = Math.min(Math.max(Number(item.schedule.interval) || 1, 1), 24);
  const horizon = addMonthsClamped(toISODate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))), horizonMonths);
  const occurrences = [];
  let cursor = parseISODate(date);
  let guard = 0;
  while (cursor && cursor <= horizon && guard < 1000) {
    if (daysBetween(now, cursor) >= -1) occurrences.push({ date: toISODate(cursor), itemId: item.id });
    cursor = item.schedule.frequency === "monthly"
      ? addMonthsClamped(cursor, interval)
      : addMonthsClamped(cursor, interval * 12);
    guard += 1;
  }
  return occurrences;
}

export function getNextOccurrence(item, now = new Date()) {
  const occurrences = expandOccurrences(item, { now, horizonMonths: 60 });
  if (item.schedule?.kind !== "recurring" && occurrences.length) return occurrences[0].date;
  return occurrences[0]?.date || item.schedule?.date || "";
}

export function getItemStatus(item, now = new Date()) {
  if (item.status === "completed") return { key: "completed", label: "Completed", tone: "neutral", days: null };
  if (!parseISODate(item.schedule?.date)) return { key: "missing", label: "Date missing", tone: "muted", days: null };
  const dueDate = getNextOccurrence(item, now);
  const days = daysBetween(now, dueDate);
  if (days < 0) return { key: "overdue", label: item.schedule.kind === "expiry" ? "Expired" : "Past due", tone: "danger", days };
  if (days <= 30) return { key: "now", label: "Action needed", tone: "danger", days };
  if (days <= 120) return { key: "soon", label: "Plan soon", tone: "warning", days };
  return { key: "covered", label: "On track", tone: "success", days };
}

export function getNextAction(item, now = new Date()) {
  if (!parseISODate(item.schedule?.date)) return "Add the date to schedule reminders";
  const dueDate = getNextOccurrence(item, now);
  const days = daysBetween(now, dueDate);
  const offsets = item.reminderOffsets?.length ? item.reminderOffsets : (REMINDER_PLANS[item.reminderPlan]?.offsets || REMINDER_PLANS.standard.offsets);
  const firstOffset = Math.max(...offsets);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} past due`;
  if (days === 0) return "Due today";
  if (days <= firstOffset) return days === 1 ? "Due tomorrow · start now" : `Due in ${days} days · start now`;
  const untilStart = days - firstOffset;
  return untilStart === 1 ? "Start tomorrow" : `Start in ${untilStart} days`;
}

export function sortItems(items, now = new Date()) {
  return [...items].sort((a, b) => {
    const statusOrder = { overdue: 0, now: 1, missing: 2, soon: 3, covered: 4, completed: 5 };
    const aStatus = getItemStatus(a, now);
    const bStatus = getItemStatus(b, now);
    const statusDiff = statusOrder[aStatus.key] - statusOrder[bStatus.key];
    if (statusDiff) return statusDiff;
    return (getNextOccurrence(a, now) || "9999").localeCompare(getNextOccurrence(b, now) || "9999");
  });
}

export function groupItemsForToday(items, now = new Date()) {
  const groups = { now: [], upcoming: [], missing: [], covered: [] };
  sortItems(items.filter((item) => item.status !== "completed"), now).forEach((item) => {
    const key = getItemStatus(item, now).key;
    if (["overdue", "now"].includes(key)) groups.now.push(item);
    else if (key === "soon") groups.upcoming.push(item);
    else if (key === "missing") groups.missing.push(item);
    else groups.covered.push(item);
  });
  return groups;
}

export function validateBackup(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Backup must be a JSON object.");
  if (value.version !== SCHEMA_VERSION) throw new Error("This backup version is not supported.");
  if (!value.profile || !Array.isArray(value.items) || !value.settings) throw new Error("Backup is missing required data.");
  if (!Array.isArray(value.people) || !Array.isArray(value.assets)) throw new Error("Backup is missing people or possessions.");
  if (value.items.length > 1000) throw new Error("Backup contains too many items.");
  for (const item of value.items) {
    if (!item || typeof item.title !== "string" || item.title.length > 160) throw new Error("Backup contains an invalid item.");
    if (!CATEGORY_META[item.category]) item.category = "custom";
    if (item.schedule?.date && !parseISODate(item.schedule.date)) throw new Error(`Invalid date for “${item.title.slice(0, 40)}”.`);
    if (item.reminderInput) item.reminderOffsets = parseReminderSequence(item.reminderInput);
  }
  return value;
}

function escapeICS(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatICSDate(value) {
  return value.replaceAll("-", "");
}

function formatUTCStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function foldICSLine(line) {
  const chunks = [];
  let remaining = line;
  while (remaining.length > 73) {
    chunks.push(remaining.slice(0, 73));
    remaining = remaining.slice(73);
  }
  chunks.push(remaining);
  return chunks.join("\r\n ");
}

function eventLines({ uid, title, date, description, stamp, alarms = [] }) {
  const end = toISODate(addDays(date, 1));
  const lines = [
    "BEGIN:VEVENT",
    `UID:${escapeICS(uid)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${formatICSDate(date)}`,
    `DTEND;VALUE=DATE:${formatICSDate(end)}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    "TRANSP:TRANSPARENT",
    "SEQUENCE:0",
  ];
  alarms.forEach((offset) => {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `TRIGGER:${offset === 0 ? "PT0M" : `-P${offset}D`}`,
      `DESCRIPTION:${escapeICS(title)}`,
      "END:VALARM",
    );
  });
  lines.push("END:VEVENT");
  return lines;
}

export function generateICS(items, settings = {}, now = new Date()) {
  const horizonMonths = settings.horizonMonths || 24;
  const privacySafe = settings.privacySafeTitles !== false;
  const includeMilestones = settings.preparationMilestones !== false;
  const stamp = formatUTCStamp(now);
  const events = [];

  items.filter((item) => item.status === "active").forEach((item) => {
    const occurrences = expandOccurrences(item, { now, horizonMonths });
    const plan = { offsets: item.reminderOffsets?.length ? item.reminderOffsets : (REMINDER_PLANS[item.reminderPlan]?.offsets || REMINDER_PLANS.standard.offsets) };
    const title = privacySafe ? (CATEGORY_META[item.category]?.safeTitle || CATEGORY_META.custom.safeTitle) : item.title;
    const description = "Created by NextDue. Verify requirements with the relevant authority. This calendar is a snapshot, not live sync.";

    occurrences.forEach((occurrence) => {
      events.push(...eventLines({
        uid: `${item.id}-${occurrence.date}@nextdue.local`,
        title,
        date: occurrence.date,
        description,
        stamp,
        alarms: plan.offsets,
      }));

      if (includeMilestones) {
        const lead = Math.max(...plan.offsets);
        const milestoneDate = toISODate(addDays(occurrence.date, -lead));
        if (daysBetween(now, milestoneDate) >= -1) {
          events.push(...eventLines({
            uid: `${item.id}-${occurrence.date}-prepare@nextdue.local`,
            title: `Start: ${title}`,
            date: milestoneDate,
            description: `Preparation milestone for the deadline on ${occurrence.date}. ${description}`,
            stamp,
          }));
        }
      }
    });
  });

  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//NextDue//Life Admin Planner//EN",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:NextDue",
    ...events,
    "END:VCALENDAR",
  ];
  return lines.map(foldICSLine).join("\r\n") + "\r\n";
}

export function getCalendarEventCount(items, settings = {}, now = new Date()) {
  let count = 0;
  items.filter((item) => item.status === "active").forEach((item) => {
    const occurrences = expandOccurrences(item, { now, horizonMonths: settings.horizonMonths || 24 });
    count += occurrences.length * (settings.preparationMilestones === false ? 1 : 2);
  });
  return count;
}

export function calendarLinks(item, now = new Date()) {
  const date = getNextOccurrence(item, now);
  if (!parseISODate(date)) return null;
  const title = encodeURIComponent(item.title);
  const details = encodeURIComponent("Planned in NextDue. Verify details with the relevant authority.");
  const start = formatICSDate(date);
  const end = formatICSDate(toISODate(addDays(date, 1)));
  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${date}&enddt=${toISODate(addDays(date, 1))}&body=${details}&allday=true`,
  };
}
