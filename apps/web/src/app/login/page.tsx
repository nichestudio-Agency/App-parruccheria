import { LoginForm } from "@/components/login-form";

import { loginAdminAction } from "./actions";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card stack-lg">
        <div className="stack-sm">
          <p className="eyebrow">Fase 4</p>
          <h1>Pannello super admin</h1>
          <p className="muted">
            Accesso centrale per gestire tenant, demo, stato commerciale, branding iniziale e log
            globali.
          </p>
        </div>

        <LoginForm action={loginAdminAction} />

        <div className="empty-state">
          <p className="muted">
            Credenziali locali default: <strong>admin@platforma.it</strong> /{" "}
            <strong>admin12345</strong>
          </p>
        </div>
      </section>
    </main>
  );
}
