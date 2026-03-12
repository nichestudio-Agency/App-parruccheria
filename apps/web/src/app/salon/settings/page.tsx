import { getSalonSettings } from "@/lib/salon-data";
import { requireOwnerSession } from "@/lib/owner-auth";

import { updateSettingsAction } from "./actions";

export default async function SettingsPage() {
  const session = await requireOwnerSession();
  const settings = await getSalonSettings(session.salonId);

  return (
    <section className="panel stack-lg">
      <div className="stack-xs">
        <p className="eyebrow">Impostazioni base</p>
        <h2>Contenuti modificabili dal titolare</h2>
        <p className="muted">
          In questa area puoi aggiornare solo i dati base del salone. Branding avanzato e asset app
          restano sotto controllo super admin.
        </p>
      </div>

      <form action={updateSettingsAction} className="detail-grid">
        <label className="field">
          <span>Nome commerciale</span>
          <input defaultValue={settings?.commercial_name ?? ""} name="commercialName" required />
        </label>
        <label className="field">
          <span>Email contatto</span>
          <input defaultValue={settings?.billing_email ?? ""} name="billingEmail" type="email" />
        </label>
        <label className="field">
          <span>Telefono</span>
          <input defaultValue={settings?.phone ?? ""} name="phone" />
        </label>
        <label className="field">
          <span>Citta</span>
          <input defaultValue={settings?.city ?? ""} name="city" />
        </label>
        <label className="field">
          <span>Provincia</span>
          <input defaultValue={settings?.province ?? ""} name="province" />
        </label>
        <div className="detail-item">
          <span className="muted">App display name</span>
          <strong>{settings?.app_display_name ?? "n/d"}</strong>
          <span className="muted">Gestito dal super admin</span>
        </div>
        <div className="actions-inline">
          <button className="button button--primary" type="submit">
            Salva impostazioni
          </button>
        </div>
      </form>
    </section>
  );
}
