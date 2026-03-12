import { createSalonAction } from "../actions";

export default function NewSalonPage() {
  return (
    <section className="panel stack-lg">
      <div className="stack-xs">
        <p className="eyebrow">Provisioning tenant</p>
        <h2>Crea un nuovo salone</h2>
        <p className="muted">
          Questa schermata crea il tenant, il record titolare, il branding iniziale e la
          configurazione app/demo di base.
        </p>
      </div>

      <form action={createSalonAction} className="detail-grid">
        <label className="field">
          <span>Nome salone</span>
          <input name="name" placeholder="Barberia Centrale Torino" required />
        </label>

        <label className="field">
          <span>Tenant key</span>
          <input name="tenantKey" placeholder="barberia-centrale-torino" required />
        </label>

        <label className="field">
          <span>Nome titolare</span>
          <input name="ownerFirstName" placeholder="Luca" required />
        </label>

        <label className="field">
          <span>Cognome titolare</span>
          <input name="ownerLastName" placeholder="Rossi" required />
        </label>

        <label className="field">
          <span>Email titolare</span>
          <input name="ownerEmail" type="email" placeholder="luca@salone.it" required />
        </label>

        <label className="field">
          <span>Stato iniziale</span>
          <select defaultValue="active" name="status">
            <option value="active">active</option>
            <option value="suspended">suspended</option>
            <option value="expired">expired</option>
          </select>
        </label>

        <label className="field">
          <span>Modalita tenant</span>
          <select defaultValue="demo" name="environmentMode">
            <option value="demo">demo</option>
            <option value="production">production</option>
          </select>
        </label>

        <div className="actions-inline">
          <button className="button button--primary" type="submit">
            Crea salone
          </button>
        </div>
      </form>
    </section>
  );
}
