"use server";

import { redirect } from "next/navigation";

import { clearAdminSession, requireAdminSession } from "@/lib/admin-auth";

export async function logoutAdminAction() {
  await requireAdminSession();
  await clearAdminSession();
  redirect("/login");
}
