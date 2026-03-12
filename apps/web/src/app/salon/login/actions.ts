"use server";

import { redirect } from "next/navigation";

import { createOwnerSession, type OwnerLoginState } from "@/lib/owner-auth";

export async function loginOwnerAction(
  _state: OwnerLoginState,
  formData: FormData
): Promise<OwnerLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const result = await createOwnerSession(email, password);

  if (result.error) {
    return result;
  }

  redirect("/salon");
}
