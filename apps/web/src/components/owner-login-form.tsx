"use client";

import { useActionState } from "react";

import type { OwnerLoginState } from "@/lib/owner-auth";

const initialState: OwnerLoginState = {};

export function OwnerLoginForm({
  action
}: {
  action: (state: OwnerLoginState, formData: FormData) => Promise<OwnerLoginState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="stack-lg">
      <div className="stack-sm">
        <label className="field">
          <span>Email titolare</span>
          <input name="email" type="email" placeholder="marco@barberiarossi.it" required />
        </label>

        <label className="field">
          <span>Password locale</span>
          <input name="password" type="password" placeholder="owner12345" required />
        </label>
      </div>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <button className="button button--primary" disabled={pending} type="submit">
        {pending ? "Accesso in corso..." : "Entra nel pannello salone"}
      </button>
    </form>
  );
}
