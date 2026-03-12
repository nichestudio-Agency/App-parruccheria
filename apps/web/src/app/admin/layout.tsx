import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";

import { logoutAdminAction } from "./actions";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminSession();

  return (
    <div className="page">
      <AdminShell>
        <header className="page-header">
          <div className="stack-xs">
            <p className="eyebrow">Console centrale</p>
            <p className="muted">
              Controllo commerciale e operativo dei tenant prima del pannello titolare.
            </p>
          </div>

          <form action={logoutAdminAction}>
            <button className="button" type="submit">
              Logout
            </button>
          </form>
        </header>

        {children}
      </AdminShell>
    </div>
  );
}
