# Fase 1 - Architettura

## 1. Obiettivo

Costruire una piattaforma SaaS white-label con:

- backend unico condiviso
- database unico multi-tenant con isolamento rigoroso
- pannello web unico con area `super_admin` e area `salon`
- app mobile white-label con build separate per ogni salone
- gestione commerciale del tenant con stati `active`, `suspended`, `expired`
- modalita `demo` e `production`

## 2. Architettura completa del sistema

### 2.1 Vista logica

Componenti principali:

1. `apps/web`
   - Next.js
   - ospita area super admin e area salone
   - usa route groups separate e middleware di controllo accesso

2. `apps/mobile`
   - Expo React Native
   - unica codebase white-label
   - build distinte iOS/Android per ogni salone

3. `Supabase`
   - PostgreSQL
   - Auth
   - Storage
   - Edge Functions per task server-side
   - RLS per isolamento tenant

4. `packages/*`
   - tipi condivisi
   - schema validazione
   - config white-label
   - UI/design tokens
   - client SDK interni

### 2.2 Flusso accessi

1. Super admin accede al pannello web.
2. Crea un salone.
3. Il sistema genera:
   - record tenant
   - owner account
   - branding iniziale
   - feature flags
   - configurazione demo/build
4. Il titolare accede solo al proprio tenant.
5. Il cliente finale usa solo l'app mobile del tenant assegnato.

### 2.3 Separazione delle aree

- `super_admin area`
  - gestione globale tenant
  - overview business
  - branding iniziale
  - attivazione demo
  - export/log

- `salon area`
  - agenda
  - clienti
  - servizi
  - operatori
  - portfolio
  - promozioni
  - impostazioni base

- `customer mobile area`
  - autenticazione
  - portfolio
  - booking
  - coupon
  - recensioni
  - profilo

## 3. Struttura monorepo

Struttura consigliata:

```text
/
  apps/
    web/                        # Next.js panel
    mobile/                     # Expo app white-label
  packages/
    ui/                         # componenti condivisi e design tokens
    config/                     # env parsing, app config, tenant config
    types/                      # tipi dominio condivisi
    validation/                 # zod schemas e DTO
    database/                   # tipi DB generati e helper query
    auth/                       # helper auth/roles/access guards
    booking/                    # logica booking condivisa
    notifications/              # templates ed event contracts
  supabase/
    migrations/                 # SQL versionato
    seeds/                      # seed demo e test
    functions/                  # Edge Functions
  docs/
    phase-1-architecture.md
  tooling/
    scripts/                    # script build tenant, export, setup
```

Tooling monorepo consigliato:

- package manager: `pnpm`
- workspace orchestration: `Turborepo`
- lint/format: `ESLint + Prettier`
- git hooks: `Husky + lint-staged`

## 4. Strategia multi-tenant

### 4.1 Modello tenant

Tenant principale = `salon`.

Ogni tabella tenant-aware contiene:

- `salon_id uuid not null`
- eventuale `created_by`
- eventuale `updated_by`

Eccezioni:

- tabelle globali di piattaforma: `super_admins`, alcune lookup globali, audit globale

### 4.2 Isolamento dati

Scelta: `single database, shared schema, strict tenant scoping`.

Perche:

- piu semplice da gestire rispetto a database per tenant
- piu economico e veloce per MVP e crescita iniziale
- compatibile con Supabase e RLS

Misure di isolamento:

1. RLS attiva su tutte le tabelle tenant-aware.
2. Policy basate su:
   - `auth.uid()`
   - mapping utente -> tenant
   - ruolo applicativo
3. Nessuna query client-side senza filtro tenant.
4. Access layer condiviso in `packages/database` per evitare errori.
5. Controllo stato tenant lato middleware e lato database/app service.

### 4.3 Ruoli applicativi

Ruoli minimi:

- `super_admin`
- `salon_owner`
- `customer`

Nota:

- Gli operatori non hanno login personale.
- Il loro record esiste solo come entita operativa del salone.

### 4.4 Blocco tenant per stato commerciale

Campo principale in `salons.status`:

- `active`
- `suspended`
- `expired`

Regole:

- se `active`: accesso normale
- se `suspended` o `expired`: blocco pannello salone e app cliente

Il blocco va applicato in 3 livelli:

1. middleware web/mobile api gateway
2. guard server-side su azioni sensibili
3. policy/query helper che rifiutano operazioni write

## 5. Strategia white-label

### 5.1 Base unica, build separate

Approccio:

- una sola codebase Expo
- una configurazione tenant per brand
- pipeline build per generare app per singolo salone

Ogni tenant ha configurazione in `salon_app_configs` e `salon_branding`.

Campi principali:

- `app_name`
- `ios_bundle_id`
- `android_package_name`
- `slug`
- `primary_color`
- `secondary_color`
- `logo_url`
- `icon_url`
- `splash_url`
- `theme_json`
- `build_profile`
- `release_channel`
- `tenant_key`

### 5.2 Due livelli di branding

1. Branding gestibile dal super admin
   - nome app
   - logo
   - icona
   - splash
   - colori
   - asset store

2. Contenuti gestibili dal titolare
   - descrizione salone
   - contatti
   - gallery
   - promo

### 5.3 Strategia build concreta

Processo:

1. Super admin crea il salone.
2. Salva branding e identificativi app.
3. Il sistema genera record `salon_app_configs`.
4. Uno script legge la config tenant e produce:
   - `app.config.ts` dinamico Expo
   - asset mapping
   - env tenant build
5. Build iOS e Android con EAS per tenant specifico.

Convenzione:

- un `tenant_key` univoco e stabile, es. `barberia-rossi`
- un file build derivato, non manuale

## 6. Strategia demo vs produzione

### 6.1 Principio

La demo non e un tenant separato. E una modalita del tenant.

Vantaggi:

- meno duplicazioni
- branding unico
- passaggio demo -> produzione piu semplice

### 6.2 Configurazione

Tabelle:

- `salon_demo_configs`
- `salons.environment_mode`

Valori:

- `demo`
- `production`

Regole demo:

- dati dimostrativi precaricati
- booking reale opzionalmente disabilitato o marcato demo
- notifiche push/email disattivate o reindirizzate
- watermark o banner demo nelle interfacce
- ambiente logicamente separato da produzione tramite flag

Transizione demo -> produzione:

1. conferma commerciale
2. validazione branding finale
3. pulizia dati demo opzionale
4. switch `environment_mode=production`
5. attivazione notifiche reali
6. build store finale

## 7. Schema database iniziale

### 7.1 Enum principali

```text
salon_status: active | suspended | expired
environment_mode: demo | production
subscription_status: trial | active | suspended | expired | cancelled
app_build_status: draft | ready | building | published | archived
user_role: super_admin | salon_owner | customer
appointment_status: pending | confirmed | completed | cancelled_by_customer | cancelled_by_salon | no_show
review_status: published
notification_channel: email | push
notification_status: queued | sent | failed
consent_type: privacy | marketing
audit_actor_type: super_admin | salon_owner | customer | system
```

### 7.2 Tabelle core

#### Globali piattaforma

- `super_admins`
- `audit_logs`
- `access_logs`
- `notification_logs`

#### Tenant e commerciale

- `salons`
- `salon_accounts`
- `salon_subscriptions`
- `salon_status_history`
- `salon_branding`
- `salon_app_configs`
- `salon_demo_configs`
- `salon_feature_flags`
- `salon_owners`

#### Operativita salone

- `operators`
- `service_categories`
- `services`
- `business_hours`
- `blocked_slots`

#### Clienti

- `customers`
- `customer_profiles`
- `consent_records`

#### Booking

- `appointments`
- `appointment_services`
- `waiting_list`
- `recurring_bookings`

#### Marketing

- `portfolios`
- `portfolio_images`
- `promotions`
- `coupons`
- `reviews`

#### Supporto

- `export_jobs`
- `build_jobs`
- `file_assets`

### 7.3 Relazioni principali

- `salons` 1:1 `salon_branding`
- `salons` 1:1 `salon_app_configs`
- `salons` 1:1 `salon_demo_configs`
- `salons` 1:N `salon_feature_flags`
- `salons` 1:N `salon_subscriptions`
- `salons` 1:N `salon_status_history`
- `salons` 1:N `operators`
- `salons` 1:N `services`
- `salons` 1:N `customers`
- `salons` 1:N `appointments`
- `appointments` 1:N `appointment_services`
- `services` N:M `appointments` tramite `appointment_services`
- `operators` 1:N `appointments`
- `customers` 1:N `appointments`
- `customers` 1:1 `customer_profiles`
- `salons` 1:N `reviews`
- `salons` 1:N `promotions`
- `salons` 1:N `coupons`

### 7.4 Campi chiave per alcune tabelle

`salons`

- `id`
- `name`
- `tenant_key`
- `status`
- `environment_mode`
- `demo_enabled`
- `commercial_name`
- `vat_number`
- `billing_email`
- `created_at`
- `updated_at`

`salon_owners`

- `id`
- `salon_id`
- `auth_user_id`
- `first_name`
- `last_name`
- `email`
- `phone`
- `is_primary`

`operators`

- `id`
- `salon_id`
- `display_name`
- `color_hex`
- `is_active`

`services`

- `id`
- `salon_id`
- `category_id`
- `name`
- `description`
- `duration_minutes`
- `price_cents`
- `is_active`

`appointments`

- `id`
- `salon_id`
- `customer_id`
- `operator_id`
- `status`
- `scheduled_date`
- `start_at`
- `end_at`
- `buffer_minutes`
- `total_duration_minutes`
- `notes`
- `created_via`

## 8. Librerie da installare

### 8.1 Root

- `typescript`
- `turbo`
- `pnpm`
- `eslint`
- `prettier`
- `husky`
- `lint-staged`
- `dotenv`
- `zod`

### 8.2 Web - Next.js

- `next`
- `react`
- `react-dom`
- `@supabase/supabase-js`
- `@supabase/ssr`
- `@tanstack/react-query`
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `date-fns`
- `clsx`
- `tailwindcss`
- `class-variance-authority`
- `lucide-react`
- `recharts`

### 8.3 Mobile - Expo

- `expo`
- `react-native`
- `expo-router`
- `expo-notifications`
- `expo-secure-store`
- `expo-constants`
- `expo-font`
- `expo-linking`
- `expo-splash-screen`
- `expo-image`
- `@supabase/supabase-js`
- `@tanstack/react-query`
- `react-hook-form`
- `zod`
- `nativewind` oppure `tamagui`

Scelta consigliata per MVP: `nativewind`, piu semplice.

### 8.4 Supabase / backend

- `supabase`
- `@supabase/supabase-js`
- `pg`
- `drizzle-kit` opzionale solo per tipi/client helper

Nota:

Poiche il database source of truth sara SQL + migrations Supabase, per l'MVP conviene:

- schema in SQL puro
- tipi TS generati da Supabase CLI
- validazione input con Zod

### 8.5 Email

Provider modulare consigliato:

- `Resend`

Motivo:

- semplice integrazione
- buona DX
- adatto a notifiche transazionali MVP

Fallback possibile:

- `Postmark`

## 9. Roadmap corretta di sviluppo

### Fase A - Fondamenta

1. Setup monorepo
2. Setup Supabase locale/progetto
3. Schema database core
4. RLS e seed demo
5. Shared packages base

### Fase B - Pannello super admin

1. Login super admin
2. Dashboard overview
3. CRUD saloni
4. Stato tenant
5. Credenziali owner
6. Branding iniziale
7. Demo mode

### Fase C - Pannello salone

1. Login owner
2. Dashboard salone
3. Servizi
4. Operatori
5. Agenda e business hours
6. Clienti
7. Portfolio

### Fase D - Booking engine

1. Regole disponibilita
2. Multi-servizio
3. Buffer 5 minuti
4. Blocchi manuali
5. Modifica/annullamento
6. Waiting list
7. Ricorrenze

### Fase E - App mobile white-label

1. Auth cliente
2. Home/portfolio
3. Prenotazione
4. Appuntamenti
5. Profilo
6. Recensioni/coupon
7. Branding runtime + build config

### Fase F - Operazioni e distribuzione

1. Notifiche email/push
2. Export dati
3. Audit/access log
4. Build automation tenant
5. Documentazione operativa
6. Prima pubblicazione store

## 10. Decisioni chiave per MVP reale

Per il primo cliente reale, il perimetro minimo deve includere:

- un solo owner per salone nella prima release
- operatori senza login
- pagamenti solo in salone
- recensioni pubblicate subito
- booking via app soltanto
- white-label con branding controllato da super admin
- demo tenant con dati seed e banner visibile

## 11. Comandi previsti per la Fase 3

Quando passeremo al setup reale, i primi comandi saranno:

```bash
pnpm init
pnpm add -D turbo typescript eslint prettier husky lint-staged
pnpm dlx create-next-app@latest apps/web
pnpm dlx create-expo-app@latest apps/mobile
pnpm add -w zod dotenv
```

Per Supabase:

```bash
pnpm add -D supabase
pnpm supabase init
pnpm supabase start
```

## 12. File di questa fase

File creati in Fase 1:

- `/Users/fabio_pace/Documents/Playground/README.md`
- `/Users/fabio_pace/Documents/Playground/docs/phase-1-architecture.md`

## 13. Prossimo passo

La Fase 2 dovra trasformare questo documento in:

- SQL completo
- enum PostgreSQL
- foreign keys
- indici
- constraint
- trigger utili
- policy RLS
- seed demo realistici
