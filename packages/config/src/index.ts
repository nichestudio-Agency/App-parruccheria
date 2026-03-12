import type { EnvironmentMode } from "@repo/types";

export interface SharedEnv {
  appEnv: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface TenantBuildInput {
  tenantKey: string;
  environmentMode: EnvironmentMode;
}

export function getRequiredEnv(name: string, source = process.env): string {
  const value = source[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSharedEnv(source = process.env): SharedEnv {
  return {
    appEnv: source.APP_ENV ?? "local",
    supabaseUrl: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", source),
    supabaseAnonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", source)
  };
}
