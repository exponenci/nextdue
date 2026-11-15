export type ReminderOffset = {
  unit: "day";
  value: number;
};

export type ReminderPlan = {
  input: string;
  normalized: string;
  offsets: ReminderOffset[];
};

const MAX_OFFSET_DAYS = 3650;
const MAX_REMINDERS = 32;

export class ReminderPlanError extends Error {
  constructor(message: string, readonly token?: string) {
    super(message);
    this.name = "ReminderPlanError";
  }
}

export function parseReminderPlan(input: string): ReminderPlan {
  const trimmed = input.trim();
  if (!trimmed) throw new ReminderPlanError("Enter at least one reminder offset.");

  const rawTokens = trimmed.split("/").map((token) => token.trim());
  if (rawTokens.some((token) => token === "")) {
    throw new ReminderPlanError("Use one number between each / delimiter.");
  }
  if (rawTokens.length > MAX_REMINDERS) {
    throw new ReminderPlanError(`A reminder plan can contain at most ${MAX_REMINDERS} offsets.`);
  }

  const values = rawTokens.map((token) => {
    if (!/^\d+$/.test(token)) {
      throw new ReminderPlanError("Offsets must be whole numbers of days.", token);
    }
    const value = Number(token);
    if (!Number.isSafeInteger(value) || value > MAX_OFFSET_DAYS) {
      throw new ReminderPlanError(`Offsets must be between 0 and ${MAX_OFFSET_DAYS} days.`, token);
    }
    return value;
  });

  if (new Set(values).size !== values.length) {
    throw new ReminderPlanError("Remove duplicate reminder offsets.");
  }

  const sorted = values.sort((a, b) => b - a);
  return {
    input,
    normalized: sorted.join("/"),
    offsets: sorted.map((value) => ({ unit: "day", value }))
  };
}

export function reminderDates(deadline: string, plan: ReminderPlan): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) throw new ReminderPlanError("Deadline must use YYYY-MM-DD.");
  const [year, month, day] = deadline.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new ReminderPlanError("Deadline is not a valid calendar date.");
  }
  return plan.offsets.map(({ value }) => {
    const reminder = new Date(date.getTime());
    reminder.setUTCDate(reminder.getUTCDate() - value);
    return reminder.toISOString().slice(0, 10);
  });
}
