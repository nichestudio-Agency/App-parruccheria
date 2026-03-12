import Link from "next/link";
import { PropsWithChildren } from "react";

export function AdminShell({ children }: PropsWithChildren) {
  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar">
        <div>
          <p className="eyebrow">Platform Console</p>
          <h1>Super Admin</h1>
        </div>

        <nav className="admin-shell__nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/salons">Saloni</Link>
          <Link href="/admin/salons/new">Nuovo salone</Link>
        </nav>
      </aside>

      <div className="admin-shell__content">{children}</div>
    </div>
  );
}
