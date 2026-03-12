import { Pool, type QueryResultRow } from "pg";

import { getDatabaseUrl } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __webPool__: Pool | undefined;
}

export function getPool() {
  if (!global.__webPool__) {
    global.__webPool__ = new Pool({
      connectionString: getDatabaseUrl()
    });
  }

  return global.__webPool__;
}

export async function sql<T extends QueryResultRow>(query: string, values: unknown[] = []) {
  return getPool().query<T>(query, values);
}
