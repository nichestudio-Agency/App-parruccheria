# Fase 4 - Pannello Super Admin

## Cosa include

Questa fase introduce il primo pannello web reale del progetto.

Funzioni incluse:

- login super admin locale
- dashboard overview
- lista saloni
- dettaglio singolo salone
- creazione nuovo salone
- aggiornamento stato tenant
- attivazione demo o produzione
- visualizzazione log recenti
- generazione credenziali temporanee titolare

## Credenziali locali iniziali

Default:

- email: `admin@platforma.it`
- password: `admin12345`

Puoi cambiarle con variabili ambiente:

- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`

## File principali

- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/login/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/admin/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/admin/salons/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/admin/salons/new/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/admin/salons/[salonId]/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/lib/admin-data.ts`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/lib/admin-auth.ts`

## Comandi

Installa tutto:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm install
```

Avvia Supabase locale:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase start
```

Avvia il pannello web:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/web dev
```

Typecheck:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/web typecheck
```

Build:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/web build
```

## Nota importante

La generazione credenziali titolare in questa fase e ancora locale:

- genera una password temporanea
- registra un audit log
- non sincronizza ancora Supabase Auth

L'integrazione completa con auth reale del titolare verra completata nella fase successiva dedicata al pannello salone.
