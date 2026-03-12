import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { getDashboardOverview, getRecentLogs, getSalons } from "@/lib/admin-data";

export default async function AdminDashboardPage() {
  const [overview, recentLogs, salons] = await Promise.all([
    getDashboardOverview(),
    getRecentLogs(),
    getSalons()
  ]);

  return (
    <div className="stack-lg">
      <section>
        <div className="page-header">
          <div className="stack-xs">
            <p className="eyebrow">Overview globale</p>
            <h2>Controllo piattaforma</h2>
            <p className="muted">
              Vista rapida su tenant attivi, clienti registrati, appuntamenti e recensioni.
            </p>
          </div>
        </div>

        <div className="grid-metrics">
          <article className="metric-card stack-xs">
            <span className="muted">Saloni attivi</span>
            <strong>{overview.activeSalons}</strong>
          </article>
          <article className="metric-card stack-xs">
            <span className="muted">Saloni sospesi</span>
            <strong>{overview.suspendedSalons}</strong>
          </article>
          <article className="metric-card stack-xs">
            <span className="muted">Saloni scaduti</span>
            <strong>{overview.expiredSalons}</strong>
          </article>
          <article className="metric-card stack-xs">
            <span className="muted">Utenti registrati</span>
            <strong>{overview.customers}</strong>
          </article>
        </div>
      </section>

      <section className="grid-two">
        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Tenant</p>
            <h3>Ultimo stato saloni</h3>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Salone</th>
                  <th>Stato</th>
                  <th>Modalita</th>
                  <th>Appuntamenti</th>
                </tr>
              </thead>
              <tbody>
                {salons.map((salon) => (
                  <tr key={salon.id}>
                    <td>
                      <Link href={`/admin/salons/${salon.id}`}>
                        <strong>{salon.name}</strong>
                        <br />
                        <span className="muted">{salon.tenantKey}</span>
                      </Link>
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
                    <td>{salon.appointmentsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Log recenti</p>
            <h3>Audit e accessi</h3>
          </div>

          <div className="stack-sm">
            {recentLogs.map((log) => (
              <div className="detail-item" key={log.id}>
                <strong>{log.label}</strong>
                <span className="muted">
                  {log.kind.toUpperCase()} • {log.actorRole ?? "n/d"} •{" "}
                  {log.salonName ?? "Piattaforma"}
                </span>
                <span className="muted">{new Date(log.createdAt).toLocaleString("it-IT")}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
