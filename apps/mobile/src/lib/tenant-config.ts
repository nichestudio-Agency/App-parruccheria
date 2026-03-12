import type { EnvironmentMode, WhiteLabelAppConfig } from "@repo/types";

const tenantAppConfigs: Record<string, WhiteLabelAppConfig & { environmentMode: EnvironmentMode }> = {
  "barberia-rossi": {
    tenantKey: "barberia-rossi",
    appName: "Barberia Rossi",
    iosBundleId: "it.platforma.barberiarossi",
    androidPackageName: "it.platforma.barberiarossi",
    primaryColor: "#99692d",
    secondaryColor: "#15242a",
    environmentMode: "production"
  },
  "atelier-uomo-firenze": {
    tenantKey: "atelier-uomo-firenze",
    appName: "Atelier Uomo Firenze",
    iosBundleId: "it.platforma.atelieruomofirenze",
    androidPackageName: "it.platforma.atelieruomofirenze",
    primaryColor: "#7f5a2f",
    secondaryColor: "#1d2d33",
    environmentMode: "demo"
  }
};

export function getTenantAppConfig(tenantKey = "atelier-uomo-firenze") {
  return tenantAppConfigs[tenantKey] ?? tenantAppConfigs["atelier-uomo-firenze"];
}
