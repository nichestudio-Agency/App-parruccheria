import type { TenantContext } from "@repo/types";

export interface TenantScopedQuery {
  table: string;
  salonId: string;
}

export function createTenantScopedQuery(
  table: string,
  tenant: TenantContext
): TenantScopedQuery {
  return {
    table,
    salonId: tenant.salonId
  };
}
