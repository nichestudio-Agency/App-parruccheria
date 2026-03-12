import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import pgPackage from "../apps/web/node_modules/pg/lib/index.js";

const { Pool } = pgPackage;

function loadEnvFile(filename) {
  const fullPath = resolve(process.cwd(), filename);
  if (!existsSync(fullPath)) {
    return;
  }

  const content = readFileSync(fullPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const databaseUrl =
  process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const expoAccessToken = process.env.EXPO_ACCESS_TOKEN;

const pool = new Pool({
  connectionString: databaseUrl
});

async function enqueueDueReminders() {
  const result = await pool.query(
    `
      select public.enqueue_due_push_reminders(null) as queued_count
    `
  );

  return Number(result.rows[0]?.queued_count ?? 0);
}

async function getQueuedPushLogs() {
  const result = await pool.query(
    `
      select
        id,
        recipient,
        payload
      from public.notification_logs
      where channel = 'push'
        and status = 'queued'
      order by created_at asc
      limit 100
    `
  );

  return result.rows;
}

async function markSent(id) {
  await pool.query(
    `
      update public.notification_logs
      set
        status = 'sent',
        provider_name = 'expo',
        sent_at = timezone('utc', now()),
        error_message = null
      where id = $1
    `,
    [id]
  );
}

async function markFailed(id, message) {
  await pool.query(
    `
      update public.notification_logs
      set
        status = 'failed',
        provider_name = 'expo',
        failed_at = timezone('utc', now()),
        error_message = $2
      where id = $1
    `,
    [id, message]
  );
}

async function dispatchQueuedPush() {
  const rows = await getQueuedPushLogs();
  if (rows.length === 0) {
    return { queued: 0, sent: 0, failed: 0 };
  }

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(expoAccessToken ? { Authorization: `Bearer ${expoAccessToken}` } : {})
    },
    body: JSON.stringify(
      rows.map((row) => ({
        to: row.recipient,
        sound: "default",
        title: row.payload?.title ?? "Reminder appuntamento",
        body: row.payload?.body ?? "Apri l'app per vedere il dettaglio.",
        data: row.payload?.data ?? {}
      }))
    )
  });

  if (!response.ok) {
    throw new Error(`Expo push request failed with status ${response.status}.`);
  }

  const json = await response.json();
  let sent = 0;
  let failed = 0;

  for (const [index, ticket] of json.data.entries()) {
    const row = rows[index];
    if (!row) {
      continue;
    }

    if (ticket.status === "ok") {
      sent += 1;
      await markSent(row.id);
    } else {
      failed += 1;
      await markFailed(row.id, ticket.message ?? ticket.details?.error ?? "expo_push_failed");
    }
  }

  return {
    queued: rows.length,
    sent,
    failed
  };
}

async function main() {
  const enqueued = await enqueueDueReminders();
  const dispatch = await dispatchQueuedPush();

  console.log(
    JSON.stringify(
      {
        enqueued,
        dispatched: dispatch
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
