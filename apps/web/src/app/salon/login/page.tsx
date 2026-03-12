import { OwnerLoginForm } from "@/components/owner-login-form";

import { loginOwnerAction } from "./actions";

export default function SalonLoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card stack-lg">
        <div className="stack-sm">
          <p className="eyebrow">Fase 5</p>
          <h1>Pannello titolare</h1>
          <p className="muted">
            Accesso riservato al singolo salone per agenda, servizi, operatori, clienti,
            promozioni e contenuti base.
          </p>
        </div>

        <OwnerLoginForm action={loginOwnerAction} />

        <div className="empty-state">
          <p className="muted">
            Password locale demo titolari: <strong>owner12345</strong>
          </p>
        </div>
      </section>
    </main>
  );
}
