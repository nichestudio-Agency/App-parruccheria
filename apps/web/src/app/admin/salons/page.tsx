import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { getSalons } from "@/lib/admin-data";

export default async function SalonsPage() {
  const salons = await getSalons();

  return (
    <section className="panel stack-md">
      <div className="page-header">
        <div className="stack-xs">
          <p className="eyebrow">Gestione saloni</p>
          <h2>Tutti i tenant</h2>
          <p className="muted">
            Da qui controlli stato commerciale, proprietario, demo e dettaglio build di ogni
            salone.
          </p>
        </div>

        <Link className="button button--primary" href="/admin/salons/new">
          Crea nuovo salone
        </Link>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Salone</th>
              <th>Titolare</th>
              <th>Stato</th>
              <th>Modalita</th>
              <th>Clienti</th>
              <th>Appuntamenti</th>
              <th>Azione</th>
            </tr>
          </thead>
          <tbody>
            {salons.map((salon) => (
              <tr key={salon.id}>
                <td>
                  <strong>{salon.name}</strong>
                  <br />
                  <span className="muted">{salon.tenantKey}</span>
                </td>
                <td>
                  {salon.ownerName ?? "Da assegnare"}
                  <br />
                  <span className="muted">{salon.ownerEmail ?? "n/d"}</span>
                </td>
                <td>
                  <StatusBadge label={salon.status} tone={salon.status} />
                </td>
                <td>
                  <StatusBadge
                    label={salon.environmentMode}
                    tone={salon.environmentMode === "demo" ? "demo" : "production"}
                  />
                </td>
                <td>{salon.customersCount}</td>
                <td>{salon.appointmentsCount}</td>
                <td>
                  <Link className="button" href={`/admin/salons/${salon.id}`}>
                    Apri dettaglio
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
