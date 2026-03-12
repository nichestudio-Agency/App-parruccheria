import { getPortfolios } from "@/lib/salon-data";
import { requireOwnerSession } from "@/lib/owner-auth";

import { createPortfolioAction } from "./actions";

export default async function PortfolioPage() {
  const session = await requireOwnerSession();
  const portfolios = await getPortfolios(session.salonId);

  return (
    <div className="stack-lg">
      <section className="panel stack-md">
        <div className="stack-xs">
          <p className="eyebrow">Portfolio</p>
          <h2>Galleria contenuti</h2>
        </div>

        <div className="stack-sm">
          {portfolios.map((portfolio) => (
            <div className="detail-item" key={portfolio.id}>
              <strong>{portfolio.title}</strong>
              <span className="muted">{portfolio.description ?? "Nessuna descrizione"}</span>
              <span className="muted">{portfolio.is_published ? "Pubblicato" : "Bozza"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="stack-xs">
          <p className="eyebrow">Nuovo portfolio</p>
          <h3>Aggiungi voce portfolio</h3>
        </div>

        <form action={createPortfolioAction} className="stack-sm">
          <label className="field">
            <span>Titolo</span>
            <input name="title" required />
          </label>
          <label className="field">
            <span>Descrizione</span>
            <input name="description" />
          </label>
          <button className="button button--primary" type="submit">
            Crea portfolio
          </button>
        </form>
      </section>
    </div>
  );
}
