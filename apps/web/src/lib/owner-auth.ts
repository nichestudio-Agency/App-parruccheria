import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { sql } from "./db";

const OWNER_SESSION_COOKIE = "salon-owner-session";
const defaultOwnerPassword = "owner12345";

export interface OwnerLoginState {
  error?: string;
}

interface OwnerRecord {
  salon_id: string;
  email: string;
  owner_name: string;
  salon_name: string;
  status: "active" | "suspended" | "expired";
}

export interface OwnerSession {
  salonId: string;
  email: string;
  ownerName: string;
  salonName: string;
}

export async function createOwnerSession(email: string, password: string) {
  if (password !== (process.env.OWNER_PORTAL_PASSWORD ?? defaultOwnerPassword)) {
    await logOwnerAccessAttempt({ email, success: false, failureReason: "invalid_password" });
    return {
      error: "Password non valida per il pannello titolare."
    } satisfies OwnerLoginState;
  }

  const result = await sql<OwnerRecord>(
    `
      select
        so.salon_id,
        so.email,
        concat_ws(' ', so.first_name, so.last_name) as owner_name,
        s.name as salon_name,
        s.status
      from public.salon_owners so
      join public.salons s on s.id = so.salon_id
      where lower(so.email) = lower($1)
      order by so.is_primary desc, so.created_at asc
      limit 1
    `,
    [email]
  );

  const owner = result.rows[0];

  if (!owner) {
    await logOwnerAccessAttempt({ email, success: false, failureReason: "owner_not_found" });
    return {
      error: "Titolare non trovato."
    } satisfies OwnerLoginState;
  }

  if (owner.status !== "active") {
    await logOwnerAccessAttempt({
      email,
      salonId: owner.salon_id,
      success: false,
      failureReason: `salon_${owner.status}`
    });
    return {
      error: `Il salone ${owner.salon_name} non e attivo. Stato attuale: ${owner.status}.`
    } satisfies OwnerLoginState;
  }

  const store = await cookies();
  store.set(
    OWNER_SESSION_COOKIE,
    JSON.stringify({
      salonId: owner.salon_id,
      email: owner.email
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/"
    }
  );

  await logOwnerAccessAttempt({
    email: owner.email,
    salonId: owner.salon_id,
    success: true
  });

  return {};
}

export async function clearOwnerSession() {
  const store = await cookies();
  store.delete(OWNER_SESSION_COOKIE);
}

export async function requireOwnerSession(): Promise<OwnerSession> {
  const store = await cookies();
  const raw = store.get(OWNER_SESSION_COOKIE)?.value;

  if (!raw) {
    redirect("/salon/login");
  }

  let parsed: { salonId: string; email: string };

  try {
    parsed = JSON.parse(raw);
  } catch {
    redirect("/salon/login");
  }

  const result = await sql<OwnerRecord>(
    `
      select
        so.salon_id,
        so.email,
        concat_ws(' ', so.first_name, so.last_name) as owner_name,
        s.name as salon_name,
        s.status
      from public.salon_owners so
      join public.salons s on s.id = so.salon_id
      where so.salon_id = $1 and lower(so.email) = lower($2)
      order by so.is_primary desc, so.created_at asc
      limit 1
    `,
    [parsed.salonId, parsed.email]
  );

  const owner = result.rows[0];

  if (!owner || owner.status !== "active") {
    await clearOwnerSession();
    redirect("/salon/login");
  }

  return {
    salonId: owner.salon_id,
    email: owner.email,
    ownerName: owner.owner_name,
    salonName: owner.salon_name
  };
}

async function logOwnerAccessAttempt(input: {
  email: string;
  salonId?: string;
  success: boolean;
  failureReason?: string;
}) {
  await sql(
    `
      insert into public.access_logs (
        id,
        salon_id,
        actor_role,
        access_channel,
        email,
        success,
        failure_reason
      ) values (gen_random_uuid(), $1, 'salon_owner', 'web', $2, $3, $4)
    `,
    [input.salonId ?? null, input.email, input.success, input.failureReason ?? null]
  );
}
