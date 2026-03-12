const defaultDatabaseUrl = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const defaultAdminEmail = "admin@platforma.it";
const defaultAdminPassword = "admin12345";

export function getDatabaseUrl(): string {
  return process.env.SUPABASE_DB_URL ?? defaultDatabaseUrl;
}

export function getAdminCredentials() {
  return {
    email: process.env.SUPER_ADMIN_EMAIL ?? defaultAdminEmail,
    password: process.env.SUPER_ADMIN_PASSWORD ?? defaultAdminPassword
  };
}
