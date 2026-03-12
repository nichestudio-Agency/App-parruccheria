import Link from "next/link";
import { PropsWithChildren } from "react";

export function SalonShell({
  salonName,
  children
}: PropsWithChildren<{ salonName: string }>) {
  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar">
        <div>
          <p className="eyebrow">Salon Panel</p>
          <h1>{salonName}</h1>
        </div>

        <nav className="admin-shell__nav">
          <Link href="/salon">Dashboard</Link>
          <Link href="/salon/agenda">Agenda</Link>
          <Link href="/salon/services">Servizi</Link>
          <Link href="/salon/operators">Operatori</Link>
          <Link href="/salon/customers">Clienti</Link>
          <Link href="/salon/promotions">Promozioni</Link>
          <Link href="/salon/portfolio">Portfolio</Link>
          <Link href="/salon/operations">Operazioni</Link>
          <Link href="/salon/logs">Log</Link>
          <Link href="/salon/settings">Impostazioni</Link>
        </nav>
      </aside>

      <div className="admin-shell__content">{children}</div>
    </div>
  );
}
