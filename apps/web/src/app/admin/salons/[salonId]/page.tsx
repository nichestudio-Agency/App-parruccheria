import Link from "next/link";
import { notFound } from "next/navigation";

import { OwnerCredentialCard } from "@/components/owner-credential-card";
import { StatusBadge } from "@/components/status-badge";
import { getSalonDetail } from "@/lib/admin-data";

import {
  generateOwnerCredentialsAction,
  toggleFeatureFlagAction,
  updateSalonModeAction,
  updateSalonStatusAction
} from "./actions";

export default async function SalonDetailPage({
  params
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const salon = await getSalonDetail(salonId);

  if (!salon) {
    notFound();
  }

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div className="stack-xs">
          <Link className="muted" href="/admin/salons">
            ← Torna ai saloni
          </Link>
          <p className="eyebrow">Dettaglio tenant</p>
          <h2>{salon.name}</h2>
          <p className="muted">
            {salon.tenantKey} • creato il {new Date(salon.createdAt).toLocaleDateString("it-IT")}
          </p>
        </div>

        <div className="actions-inline">
          <StatusBadge label={salon.status} tone={salon.status} />
          <StatusBadge
            label={salon.environmentMode}
            tone={salon.environmentMode === "demo" ? "demo" : "production"}
          />
        </div>
      </div>

      <section className="detail-grid">
        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Stato commerciale</p>
            <h3>Controllo accessi tenant</h3>
          </div>

          <form action={updateSalonStatusAction} className="actions-inline">
            <input name="salonId" type="hidden" value={salon.id} />
            <button className="button" name="status" type="submit" value="active">
              Imposta active
            </button>
            <button className="button" name="status" type="submit" value="suspended">
              Imposta suspended
            </button>
            <button className="button button--danger" name="status" type="submit" value="expired">
              Imposta expired
            </button>
          </form>

          <p className="muted">
            Se il tenant e `suspended` o `expired`, pannello salone e app cliente vengono bloccati
            dalle policy operative.
          </p>
        </article>

        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Demo</p>
            <h3>Modalita tenant</h3>
          </div>

          <form action={updateSalonModeAction} className="actions-inline">
            <input name="salonId" type="hidden" value={salon.id} />
            <button className="button" name="environmentMode" type="submit" value="demo">
              Attiva demo
            </button>
            <button className="button" name="environmentMode" type="submit" value="production">
              Passa a production
            </button>
          </form>

          <div className="detail-item">
            <span className="muted">Banner demo</span>
            <strong>{salon.demoConfig?.demoBannerText ?? "Nessun banner attivo"}</strong>
          </div>
        </article>
      </section>

      <section className="detail-grid">
        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Profilo salone</p>
            <h3>Dati base</h3>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <span className="muted">Nome commerciale</span>
              <strong>{salon.commercialName}</strong>
            </div>
            <div className="detail-item">
              <span className="muted">Contatto</span>
              <strong>{salon.billingEmail ?? "n/d"}</strong>
            </div>
            <div className="detail-item">
              <span className="muted">Telefono</span>
              <strong>{salon.phone ?? "n/d"}</strong>
            </div>
            <div className="detail-item">
              <span className="muted">Localita</span>
              <strong>
                {salon.city ?? "n/d"} {salon.province ? `(${salon.province})` : ""}
              </strong>
            </div>
          </div>
        </article>

        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Branding iniziale</p>
            <h3>Configurazione app</h3>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <span className="muted">App name</span>
              <strong>{salon.appConfig?.appName ?? "n/d"}</strong>
            </div>
            <div className="detail-item">
              <span className="muted">App slug</span>
              <strong>{salon.appConfig?.appSlug ?? "n/d"}</strong>
            </div>
            <div className="detail-item">
              <span className="muted">iOS bundle id</span>
              <strong>{salon.appConfig?.iosBundleId ?? "n/d"}</strong>
            </div>
            <div className="detail-item">
              <span className="muted">Android package</span>
              <strong>{salon.appConfig?.androidPackageName ?? "n/d"}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="detail-grid">
        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Feature flags</p>
            <h3>Abilitazioni tenant</h3>
          </div>

          {salon.featureFlags.length ? (
            <div className="stack-sm">
              {salon.featureFlags.map((flag) => (
                <form action={toggleFeatureFlagAction} className="detail-item" key={flag.id}>
                  <input name="salonId" type="hidden" value={salon.id} />
                  <input name="featureFlagId" type="hidden" value={flag.id} />
                  <strong>{flag.flagKey}</strong>
                  <StatusBadge
                    label={flag.isEnabled ? "enabled" : "disabled"}
                    tone={flag.isEnabled ? "active" : "neutral"}
                  />
                  <button className="button" type="submit">
                    Inverti stato
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="muted">Nessuna feature flag configurata per questo tenant.</p>
            </div>
          )}
        </article>

        <OwnerCredentialCard action={generateOwnerCredentialsAction} salonId={salon.id} />
      </section>

      <section className="detail-grid">
        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Titolari</p>
            <h3>Account owner</h3>
          </div>

          <div className="stack-sm">
            {salon.owners.map((owner) => (
              <div className="detail-item" key={owner.id}>
                <strong>{owner.fullName}</strong>
                <span className="muted">{owner.email}</span>
                <span className="muted">{owner.phone ?? "Telefono non inserito"}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel stack-md">
          <div className="stack-xs">
            <p className="eyebrow">Log recenti</p>
            <h3>Audit e accessi del salone</h3>
          </div>

          <div className="stack-sm">
            {salon.recentAuditLogs.map((log) => (
              <div className="detail-item" key={log.id}>
                <strong>{log.action}</strong>
                <span className="muted">
                  {log.actorRole} • {log.entityType}
                </span>
                <span className="muted">{new Date(log.createdAt).toLocaleString("it-IT")}</span>
              </div>
            ))}

            {salon.recentAccessLogs.map((log) => (
              <div className="detail-item" key={log.id}>
                <strong>
                  {log.accessChannel} • {log.success ? "accesso riuscito" : "accesso fallito"}
                </strong>
                <span className="muted">
                  {log.actorRole ?? "n/d"} • {log.email ?? "n/d"}
                </span>
                <span className="muted">
                  {log.failureReason ?? "nessun errore"} •{" "}
                  {new Date(log.createdAt).toLocaleString("it-IT")}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
