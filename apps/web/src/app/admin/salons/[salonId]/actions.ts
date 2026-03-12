"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin-auth";
import {
  generateOwnerCredentialPack,
  toggleFeatureFlag,
  updateSalonEnvironmentMode,
  updateSalonStatus
} from "@/lib/admin-data";

interface CredentialState {
  ownerEmail?: string;
  temporaryPassword?: string;
  issuedAt?: string;
  error?: string;
}

export async function updateSalonStatusAction(formData: FormData) {
  await requireAdminSession();

  const salonId = String(formData.get("salonId"));
  const status = String(formData.get("status")) as "active" | "suspended" | "expired";

  await updateSalonStatus(salonId, status);
  revalidatePath("/admin");
  revalidatePath(`/admin/salons/${salonId}`);
}

export async function updateSalonModeAction(formData: FormData) {
  await requireAdminSession();

  const salonId = String(formData.get("salonId"));
  const environmentMode = String(formData.get("environmentMode")) as "demo" | "production";

  await updateSalonEnvironmentMode(salonId, environmentMode);
  revalidatePath("/admin");
  revalidatePath(`/admin/salons/${salonId}`);
}

export async function toggleFeatureFlagAction(formData: FormData) {
  await requireAdminSession();

  const salonId = String(formData.get("salonId"));
  const featureFlagId = String(formData.get("featureFlagId"));

  await toggleFeatureFlag(salonId, featureFlagId);
  revalidatePath(`/admin/salons/${salonId}`);
}

export async function generateOwnerCredentialsAction(
  _state: CredentialState,
  formData: FormData
): Promise<CredentialState> {
  await requireAdminSession();

  const salonId = String(formData.get("salonId"));

  try {
    return await generateOwnerCredentialPack(salonId);
  } catch {
    return {
      error: "Impossibile generare il pack credenziali."
    };
  }
}
