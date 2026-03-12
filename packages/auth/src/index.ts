import type { AppRole } from "@repo/types";

export function canManageSalon(role: AppRole): boolean {
  return role === "super_admin" || role === "salon_owner";
}

export function isCustomer(role: AppRole): boolean {
  return role === "customer";
}
