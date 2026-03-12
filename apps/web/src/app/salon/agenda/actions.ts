"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerSession } from "@/lib/owner-auth";
import { addBlockedSlot, upsertBusinessHours } from "@/lib/salon-data";

export async function createBlockedSlotAction(formData: FormData) {
  const session = await requireOwnerSession();

  await addBlockedSlot(session.salonId, {
    startsAt: String(formData.get("startsAt")),
    endsAt: String(formData.get("endsAt")),
    reason: String(formData.get("reason") ?? "")
  });

  revalidatePath("/salon/agenda");
}

export async function upsertBusinessHoursAction(formData: FormData) {
  const session = await requireOwnerSession();

  await upsertBusinessHours(session.salonId, {
    dayOfWeek: Number(formData.get("dayOfWeek")),
    opensAt: String(formData.get("opensAt") ?? ""),
    closesAt: String(formData.get("closesAt") ?? ""),
    breakStartAt: String(formData.get("breakStartAt") ?? ""),
    breakEndAt: String(formData.get("breakEndAt") ?? ""),
    isClosed: String(formData.get("isClosed") ?? "") === "on"
  });

  revalidatePath("/salon/agenda");
}
