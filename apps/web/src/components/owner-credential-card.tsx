"use client";

import { useActionState } from "react";

interface CredentialState {
  ownerEmail?: string;
  temporaryPassword?: string;
  issuedAt?: string;
  error?: string;
}

interface OwnerCredentialCardProps {
  action: (state: CredentialState, formData: FormData) => Promise<CredentialState>;
  salonId: string;
}

const initialState: CredentialState = {};

export function OwnerCredentialCard({ action, salonId }: OwnerCredentialCardProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section className="panel stack-md">
      <div className="stack-xs">
        <p className="eyebrow">Credenziali</p>
        <h3>Genera pack titolare</h3>
        <p className="muted">
          Questa azione genera una password temporanea da comunicare al titolare. In questa fase la
          password non viene ancora sincronizzata con Supabase Auth.
        </p>
      </div>

      <form action={formAction} className="stack-sm">
        <input name="salonId" type="hidden" value={salonId} />
        <button className="button" disabled={pending} type="submit">
          {pending ? "Generazione..." : "Genera credenziali temporanee"}
        </button>
      </form>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      {state.ownerEmail && state.temporaryPassword ? (
        <div className="credential-pack">
          <div>
            <span className="muted">Email</span>
            <strong>{state.ownerEmail}</strong>
          </div>
          <div>
            <span className="muted">Password temporanea</span>
            <strong>{state.temporaryPassword}</strong>
          </div>
          <div>
            <span className="muted">Generata il</span>
            <strong>{new Date(state.issuedAt ?? "").toLocaleString("it-IT")}</strong>
          </div>
        </div>
      ) : null}
    </section>
  );
}
