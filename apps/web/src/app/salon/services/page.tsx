import { getOperators, getServices } from "@/lib/salon-data";
import { requireOwnerSession } from "@/lib/owner-auth";

import { createServiceAction } from "./actions";

export default async function ServicesPage() {
  const session = await requireOwnerSession();
  const [services, operators] = await Promise.all([
    getServices(session.salonId),
    getOperators(session.salonId)
  ]);

  return (
    <div className="stack-lg">
      <section className="panel stack-md">
        <div className="stack-xs">
          <p className="eyebrow">Servizi</p>
          <h2>Catalogo del salone</h2>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Durata</th>
                <th>Prezzo</th>
                <th>Operatori</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>
                    <strong>{service.name}</strong>
                    <br />
                    <span className="muted">{service.description ?? "Nessuna descrizione"}</span>
                  </td>
                  <td>{service.category_name ?? "Senza categoria"}</td>
                  <td>{service.duration_minutes} min</td>
                  <td>€ {(service.price_cents / 100).toFixed(2)}</td>
                  <td>{service.operator_names ?? "Da assegnare"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack-md">
        <div className="stack-xs">
          <p className="eyebrow">Nuovo servizio</p>
          <h3>Aggiungi servizio</h3>
        </div>

        <form action={createServiceAction} className="detail-grid">
          <label className="field">
            <span>Nome</span>
            <input name="name" required />
          </label>
          <label className="field">
            <span>Categoria</span>
            <input name="categoryName" placeholder="Taglio, barba, styling" />
          </label>
          <label className="field">
            <span>Durata minuti</span>
            <input min="5" name="durationMinutes" type="number" required />
          </label>
          <label className="field">
            <span>Prezzo euro</span>
            <input min="0" name="priceEuros" step="1" type="number" required />
          </label>
          <label className="field">
            <span>Operatore iniziale</span>
            <select name="operatorId">
              <option value="">Nessuno</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Descrizione</span>
            <input name="description" />
          </label>
          <div className="actions-inline">
            <button className="button button--primary" type="submit">
              Crea servizio
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
