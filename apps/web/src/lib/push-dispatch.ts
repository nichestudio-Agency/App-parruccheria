import { buildExpoPushMessages, sendExpoPushMessages } from "@repo/notifications";

import { sql } from "./db";

interface QueuedPushLogRow {
  id: string;
  recipient: string;
  payload: {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
  } | null;
}

interface ExpoTicket {
  status: "ok" | "error";
  message?: string;
  details?: {
    error?: string;
  };
}

export interface DispatchPushResult {
  queued: number;
  sent: number;
  failed: number;
}

export async function dispatchQueuedPushNotifications(salonId: string, limit = 20): Promise<DispatchPushResult> {
  const queued = await sql<QueuedPushLogRow>(
    `
      select
        id,
        recipient,
        payload
      from public.notification_logs
      where salon_id = $1
        and channel = 'push'
        and status = 'queued'
      order by created_at asc
      limit $2
    `,
    [salonId, limit]
  );

  if (queued.rows.length === 0) {
    return { queued: 0, sent: 0, failed: 0 };
  }

  const messages = buildExpoPushMessages(
    queued.rows.map((item) => ({
      to: item.recipient,
      title: item.payload?.title ?? "Aggiornamento prenotazione",
      body: item.payload?.body ?? "Apri l'app per vedere il dettaglio.",
      data: item.payload?.data ?? {}
    }))
  );

  const response = await sendExpoPushMessages(messages, process.env.EXPO_ACCESS_TOKEN);
  let sent = 0;
  let failed = 0;

  for (const [index, ticket] of (response.data as ExpoTicket[]).entries()) {
    const log = queued.rows[index];

    if (!log) {
      continue;
    }

    if (ticket.status === "ok") {
      sent += 1;
      await sql(
        `
          update public.notification_logs
          set
            status = 'sent',
            provider_name = 'expo',
            sent_at = timezone('utc', now()),
            error_message = null
          where id = $1
        `,
        [log.id]
      );
      continue;
    }

    failed += 1;
    await sql(
      `
        update public.notification_logs
        set
          status = 'failed',
          provider_name = 'expo',
          failed_at = timezone('utc', now()),
          error_message = $2
        where id = $1
      `,
      [log.id, ticket.message ?? ticket.details?.error ?? "expo_push_failed"]
    );
  }

  return {
    queued: queued.rows.length,
    sent,
    failed
  };
}
