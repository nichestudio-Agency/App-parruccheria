"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin-auth";
import { createSalon } from "@/lib/admin-data";

export async function createSalonAction(formData: FormData) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const tenantKey = String(formData.get("tenantKey") ?? "").trim();
  const ownerFirstName = String(formData.get("ownerFirstName") ?? "").trim();
  const ownerLastName = String(formData.get("ownerLastName") ?? "").trim();
  const ownerEmail = String(formData.get("ownerEmail") ?? "").trim();
  const status = String(formData.get("status") ?? "active") as "active" | "suspended" | "expired";
  const environmentMode = String(formData.get("environmentMode") ?? "production") as
    | "demo"
    | "production";

  await createSalon({
    name,
    tenantKey,
    ownerFirstName,
    ownerLastName,
    ownerEmail,
    status,
    environmentMode
  });

  revalidatePath("/admin");
  revalidatePath("/admin/salons");
  redirect("/admin/salons");
}
