"use server";

import { redirect } from "next/navigation";

import type { AdminSessionState } from "@/lib/admin-auth";
import { createAdminSession } from "@/lib/admin-auth";

export async function loginAdminAction(
  _state: AdminSessionState,
  formData: FormData
): Promise<AdminSessionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const result = await createAdminSession(email, password);

  if (result.error) {
    return result;
  }

  redirect("/admin");
}
