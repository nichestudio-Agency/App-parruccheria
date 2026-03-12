import type { ExpoConfig } from "expo/config";
const tenantKey = process.env.EXPO_PUBLIC_TENANT_KEY ?? "atelier-uomo-firenze";
const tenantAppConfigs = {
  "barberia-rossi": {
    tenantKey: "barberia-rossi",
    appName: "Barberia Rossi",
    iosBundleId: "it.platforma.barberiarossi",
    androidPackageName: "it.platforma.barberiarossi",
    environmentMode: "production"
  },
  "atelier-uomo-firenze": {
    tenantKey: "atelier-uomo-firenze",
    appName: "Atelier Uomo Firenze",
    iosBundleId: "it.platforma.atelieruomofirenze",
    androidPackageName: "it.platforma.atelieruomofirenze",
    environmentMode: "demo"
  }
} as const;

const tenantConfig = tenantAppConfigs[tenantKey as keyof typeof tenantAppConfigs] ?? tenantAppConfigs["atelier-uomo-firenze"];

const config: ExpoConfig = {
  name: tenantConfig.appName,
  slug: "salon-white-label-mobile",
  version: "1.0.0",
  scheme: "salonwl",
  orientation: "portrait",
  userInterfaceStyle: "light",
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: tenantConfig.iosBundleId,
    usesAppleSignIn: true
  },
  android: {
    package: tenantConfig.androidPackageName
  },
  plugins: ["expo-apple-authentication", "expo-notifications"],
  extra: {
    tenantKey: tenantConfig.tenantKey,
    environmentMode: tenantConfig.environmentMode,
    easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? null
  }
};

export default config;
