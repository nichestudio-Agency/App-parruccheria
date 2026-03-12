"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerSession } from "@/lib/owner-auth";
import { updateSalonSettings } from "@/lib/salon-data";

export async function updateSettingsAction(formData: FormData) {
  const session = await requireOwnerSession();

  await updateSalonSettings(session.salonId, {
    commercialName: String(formData.get("commercialName")),
    billingEmail: String(formData.get("billingEmail") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    city: String(formData.get("city") ?? ""),
    province: String(formData.get("province") ?? "")
  });

  revalidatePath("/salon/settings");
}
