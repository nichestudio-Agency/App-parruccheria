"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerSession } from "@/lib/owner-auth";
import { addCoupon, addPromotion } from "@/lib/salon-data";

export async function createPromotionAction(formData: FormData) {
  const session = await requireOwnerSession();

  await addPromotion(session.salonId, {
    title: String(formData.get("title")),
    discountType: String(formData.get("discountType")) as "percentage" | "fixed_amount",
    discountValue: Number(formData.get("discountValue")),
    startsAt: String(formData.get("startsAt")),
    endsAt: String(formData.get("endsAt"))
  });

  revalidatePath("/salon/promotions");
}

export async function createCouponAction(formData: FormData) {
  const session = await requireOwnerSession();

  await addCoupon(session.salonId, {
    code: String(formData.get("code")),
    title: String(formData.get("title")),
    discountType: String(formData.get("discountType")) as "percentage" | "fixed_amount",
    discountValue: Number(formData.get("discountValue")),
    startsAt: String(formData.get("startsAt")),
    endsAt: String(formData.get("endsAt"))
  });

  revalidatePath("/salon/promotions");
}
