"use server";

import { redirect } from "next/navigation";

import { clearOwnerSession, requireOwnerSession } from "@/lib/owner-auth";

export async function logoutOwnerAction() {
  await requireOwnerSession();
  await clearOwnerSession();
  redirect("/salon/login");
}
