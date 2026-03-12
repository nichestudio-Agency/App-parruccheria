"use client";

import { useActionState } from "react";

import type { AdminSessionState } from "@/lib/admin-auth";

interface LoginFormProps {
  action: (state: AdminSessionState, formData: FormData) => Promise<AdminSessionState>;
}

const initialState: AdminSessionState = {};

export function LoginForm({ action }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="stack-lg">
      <div className="stack-sm">
        <label className="field">
          <span>Email admin</span>
          <input name="email" type="email" placeholder="admin@platforma.it" required />
        </label>

        <label className="field">
          <span>Password</span>
          <input name="password" type="password" placeholder="Password" required />
        </label>
      </div>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <button className="button button--primary" disabled={pending} type="submit">
        {pending ? "Accesso in corso..." : "Entra nel pannello"}
      </button>
    </form>
  );
}
