import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminCredentials } from "./env";

const ADMIN_SESSION_COOKIE = "super-admin-session";

export interface AdminSessionState {
  error?: string;
}

export async function createAdminSession(email: string, password: string) {
  const expected = getAdminCredentials();

  if (email !== expected.email || password !== expected.password) {
    return {
      error: "Credenziali non valide. Controlla email e password."
    } satisfies AdminSessionState;
  }

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/"
  });

  return {};
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

export async function requireAdminSession() {
  const store = await cookies();
  const expected = getAdminCredentials();
  const session = store.get(ADMIN_SESSION_COOKIE);

  if (!session || session.value !== expected.email) {
    redirect("/login");
  }

  return session.value;
}
