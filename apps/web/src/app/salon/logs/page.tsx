import { getAccessTrail, getAuditTrail } from "@/lib/salon-data";
import { requireOwnerSession } from "@/lib/owner-auth";

export default async function SalonLogsPage() {
  const session = await requireOwnerSession();
  const [auditTrail, accessTrail] = await Promise.all([
    getAuditTrail(session.salonId),
    getAccessTrail(session.salonId)
  ]);

  return (
    <div className="stack-lg">
      <section className="panel stack-lg">
        <div className="stack-xs">
          <p className="eyebrow">Log attività</p>
          <h2>Audit e accessi recenti</h2>
          <p className="muted">
            Tracciamento delle azioni del titolare e degli accessi al tenant.
          </p>
        </div>
      </section>

      <section className="panel stack-lg">
        <div className="stack-xs">
          <p className="eyebrow">Audit</p>
          <h3>Azioni recenti</h3>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Ruolo</th>
                <th>Azione</th>
                <th>Entità</th>
              </tr>
            </thead>
            <tbody>
              {auditTrail.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleString("it-IT")}</td>
                  <td>{item.actor_role}</td>
                  <td>{item.action}</td>
                  <td>{item.entity_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack-lg">
        <div className="stack-xs">
          <p className="eyebrow">Accessi</p>
          <h3>Tentativi recenti</h3>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Email</th>
                <th>Canale</th>
                <th>Esito</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {accessTrail.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleString("it-IT")}</td>
                  <td>{item.email ?? "n/d"}</td>
                  <td>{item.access_channel}</td>
                  <td>{item.success ? "ok" : "negato"}</td>
                  <td>{item.failure_reason ?? "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
