import { getCustomers } from "@/lib/salon-data";
import { requireOwnerSession } from "@/lib/owner-auth";

export default async function CustomersPage() {
  const session = await requireOwnerSession();
  const customers = await getCustomers(session.salonId);

  return (
    <section className="panel stack-md">
      <div className="stack-xs">
        <p className="eyebrow">Clienti</p>
        <h2>Anagrafica e storico base</h2>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contatti</th>
              <th>Appuntamenti</th>
              <th>Ultima visita</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.full_name}</td>
                <td>
                  {customer.email}
                  <br />
                  <span className="muted">{customer.phone ?? "Telefono non inserito"}</span>
                </td>
                <td>{customer.total_appointments ?? 0}</td>
                <td>
                  {customer.last_visit_at
                    ? new Date(customer.last_visit_at).toLocaleString("it-IT")
                    : "Nessuna visita"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
