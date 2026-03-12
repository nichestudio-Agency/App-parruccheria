import type { ReactNode } from "react";

import { SalonShell } from "@/components/salon-shell";
import { requireOwnerSession } from "@/lib/owner-auth";

import { logoutOwnerAction } from "./actions";

export default async function SalonLayout({ children }: { children: ReactNode }) {
  const session = await requireOwnerSession();

  return (
    <div className="page">
      <SalonShell salonName={session.salonName}>
        <header className="page-header">
          <div className="stack-xs">
            <p className="eyebrow">Area titolare</p>
            <p className="muted">
              Accesso tenant attivo per {session.ownerName}. Se lo stato salone cambia, questa area
              viene bloccata automaticamente.
            </p>
          </div>

          <form action={logoutOwnerAction}>
            <button className="button" type="submit">
              Logout
            </button>
          </form>
        </header>

        {children}
      </SalonShell>
    </div>
  );
}
