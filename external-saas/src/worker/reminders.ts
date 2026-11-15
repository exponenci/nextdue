import type postgres from "postgres";

type Database = ReturnType<typeof postgres>;

export type ClaimedReminder = {
  id: string;
  householdId: string;
  obligationId: string;
  occurrenceDate: string;
  offsetDays: number;
  attempts: number;
  recipient: string;
  title: string;
};

export interface NotificationAdapter {
  deliver(reminder: ClaimedReminder): Promise<void>;
}

export class ResendEmailAdapter implements NotificationAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly appUrl: string
  ) {}

  async deliver(reminder: ClaimedReminder): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
        "idempotency-key": reminder.id
      },
      body: JSON.stringify({
        from: this.from,
        to: [reminder.recipient],
        subject: `${reminder.title} · ${reminder.occurrenceDate}`,
        text: `A NextDue deadline is approaching. Open ${this.appUrl} to review the plan.`,
        headers: { "X-Entity-Ref-ID": reminder.id }
      })
    });
    if (!response.ok) throw new Error(`Notification provider returned ${response.status}`);
  }
}

export async function runReminderSweep(
  database: Database,
  adapter: NotificationAdapter,
  limit = 100
): Promise<{ claimed: number; sent: number; failed: number }> {
  const claimed = await database.begin(async (transaction) => transaction<ClaimedReminder[]>`
    with ready as (
      select delivery.id
      from app.reminder_deliveries delivery
      where delivery.status in ('pending', 'failed')
        and coalesce(delivery.next_attempt_at, now()) <= now()
      order by delivery.next_attempt_at nulls first, delivery.id
      for update skip locked
      limit ${limit}
    )
    update app.reminder_deliveries delivery
    set status = 'claimed', attempts = attempts + 1
    from ready,
      app.obligations obligation,
      lateral (
        select user_account.email
        from app.memberships membership
        join app.users user_account on user_account.id = membership.user_id
        where membership.household_id = delivery.household_id
          and membership.role in ('owner', 'admin')
        order by case membership.role when 'owner' then 0 else 1 end
        limit 1
      ) recipient
    where delivery.id = ready.id
      and obligation.id = delivery.obligation_id
    returning
      delivery.id,
      delivery.household_id as "householdId",
      delivery.obligation_id as "obligationId",
      delivery.occurrence_date::text as "occurrenceDate",
      delivery.offset_days as "offsetDays",
      delivery.attempts,
      recipient.email as recipient,
      obligation.title
  `);

  let sent = 0;
  let failed = 0;
  for (const reminder of claimed) {
    try {
      await adapter.deliver(reminder);
      await database`
        update app.reminder_deliveries
        set status = 'sent', next_attempt_at = null
        where id = ${reminder.id}
      `;
      sent += 1;
    } catch {
      const backoffMinutes = Math.min(2 ** Math.min(reminder.attempts, 8), 360);
      await database`
        update app.reminder_deliveries
        set status = 'failed',
            next_attempt_at = now() + (${backoffMinutes} * interval '1 minute')
        where id = ${reminder.id}
      `;
      failed += 1;
    }
  }

  return { claimed: claimed.length, sent, failed };
}
