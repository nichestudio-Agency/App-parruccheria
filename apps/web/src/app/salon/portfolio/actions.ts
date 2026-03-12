"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerSession } from "@/lib/owner-auth";
import { addPortfolio } from "@/lib/salon-data";

export async function createPortfolioAction(formData: FormData) {
  const session = await requireOwnerSession();

  await addPortfolio(session.salonId, {
    title: String(formData.get("title")),
    description: String(formData.get("description") ?? "")
  });

  revalidatePath("/salon/portfolio");
}
