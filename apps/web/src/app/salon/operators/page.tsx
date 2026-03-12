import { getOperators } from "@/lib/salon-data";
import { requireOwnerSession } from "@/lib/owner-auth";

import { createOperatorAction } from "./actions";

export default async function OperatorsPage() {
  const session = await requireOwnerSession();
  const operators = await getOperators(session.salonId);

  return (
    <div className="stack-lg">
      <section className="panel stack-md">
        <div className="page-header">
          <div className="stack-xs">
            <p className="eyebrow">Operatori</p>
            <h2>Team del salone</h2>
          </div>
        </div>

        <div className="stack-sm">
          {operators.map((operator) => (
            <div className="detail-item" key={operator.id}>
              <strong>{operator.display_name}</strong>
              <span className="muted">{operator.bio ?? "Nessuna bio inserita"}</span>
              <span className="muted">{operator.color_hex ?? "Colore non impostato"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="stack-xs">
          <p className="eyebrow">Nuovo operatore</p>
          <h3>Aggiungi operatore</h3>
        </div>

        <form action={createOperatorAction} className="detail-grid">
          <label className="field">
            <span>Nome visualizzato</span>
            <input name="displayName" required />
          </label>
          <label className="field">
            <span>Colore</span>
            <input name="colorHex" placeholder="#1F2937" />
          </label>
          <label className="field">
            <span>Bio</span>
            <input name="bio" placeholder="Specialista taglio, colore o barba" />
          </label>
          <div className="actions-inline">
            <button className="button button--primary" type="submit">
              Crea operatore
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
