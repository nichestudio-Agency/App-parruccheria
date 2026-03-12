import { getUpcomingAppointments, getSalonOverview } from "@/lib/salon-data";
import { requireOwnerSession } from "@/lib/owner-auth";

export default async function SalonDashboardPage() {
  const session = await requireOwnerSession();
  const [overview, upcomingAppointments] = await Promise.all([
    getSalonOverview(session.salonId),
    getUpcomingAppointments(session.salonId)
  ]);

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div className="stack-xs">
          <p className="eyebrow">Dashboard salone</p>
          <h2>Controllo operativo quotidiano</h2>
          <p className="muted">
            Vista rapida su agenda imminente, clienti, servizi e recensioni del tuo salone.
          </p>
        </div>
      </div>

      <div className="grid-metrics">
        <article className="metric-card stack-xs">
          <span className="muted">Operatori attivi</span>
          <strong>{overview.operators}</strong>
        </article>
        <article className="metric-card stack-xs">
          <span className="muted">Servizi attivi</span>
          <strong>{overview.services}</strong>
        </article>
        <article className="metric-card stack-xs">
          <span className="muted">Clienti</span>
          <strong>{overview.customers}</strong>
        </article>
        <article className="metric-card stack-xs">
          <span className="muted">Appuntamenti futuri</span>
          <strong>{overview.upcomingAppointments}</strong>
        </article>
      </div>

      <section className="panel stack-md">
        <div className="stack-xs">
          <p className="eyebrow">Agenda imminente</p>
          <h3>Prossimi appuntamenti</h3>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Operatore</th>
                <th>Servizi</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {upcomingAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{new Date(appointment.start_at).toLocaleString("it-IT")}</td>
                  <td>{appointment.customer_name}</td>
                  <td>{appointment.operator_name}</td>
                  <td>{appointment.services_label}</td>
                  <td>{appointment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
