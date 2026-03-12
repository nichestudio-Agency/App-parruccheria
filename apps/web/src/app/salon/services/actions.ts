"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerSession } from "@/lib/owner-auth";
import { addService } from "@/lib/salon-data";

export async function createServiceAction(formData: FormData) {
  const session = await requireOwnerSession();

  await addService(session.salonId, {
    name: String(formData.get("name")),
    description: String(formData.get("description") ?? ""),
    durationMinutes: Number(formData.get("durationMinutes")),
    priceCents: Number(formData.get("priceEuros")) * 100,
    categoryName: String(formData.get("categoryName") ?? ""),
    operatorId: String(formData.get("operatorId") ?? "") || undefined
  });

  revalidatePath("/salon/services");
}
