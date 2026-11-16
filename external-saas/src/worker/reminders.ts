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

export async function queueDueReminderDeliveries(database: Database): Promise<number> {
  const queued = await database<{ id: string }[]>`
    insert into app.reminder_deliveries (
      household_id, obligation_id, occurrence_date, offset_days, channel, status, next_attempt_at
    )
    select obligation.household_id, obligation.id, obligation.due_on, offset_days, 'email', 'pending', now()
    from app.obligations obligation
    cross join lateral unnest(obligation.reminder_offsets) as offset_days
    where obligation.status = 'active'
      and obligation.applicability = 'confirmed'
      and obligation.due_on is not null
      and obligation.due_on - offset_days <= current_date
      and obligation.due_on >= current_date
    on conflict (household_id, obligation_id, occurrence_date, offset_days, channel) do nothing
    returning id
  `;
  return queued.length;
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
        from (
          select mapping.user_id, 0 as priority
          from app.person_notification_recipients mapping
          where mapping.household_id = delivery.household_id
            and mapping.person_id = obligation.responsible_person_id
            and mapping.channel = 'email'
            and mapping.enabled
          union all
          select membership.user_id, case membership.role when 'owner' then 10 else 11 end
          from app.memberships membership
          where membership.household_id = delivery.household_id
            and membership.role in ('owner', 'admin')
        ) choice
        join app.users user_account on user_account.id = choice.user_id
        left join app.notification_preferences preference
          on preference.household_id = delivery.household_id and preference.user_id = choice.user_id
        where coalesce(preference.email_enabled, true)
        order by choice.priority
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
