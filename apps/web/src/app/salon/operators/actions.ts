"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerSession } from "@/lib/owner-auth";
import { addOperator } from "@/lib/salon-data";

export async function createOperatorAction(formData: FormData) {
  const session = await requireOwnerSession();

  await addOperator(session.salonId, {
    displayName: String(formData.get("displayName")),
    bio: String(formData.get("bio") ?? ""),
    colorHex: String(formData.get("colorHex") ?? "")
  });

  revalidatePath("/salon/operators");
}
