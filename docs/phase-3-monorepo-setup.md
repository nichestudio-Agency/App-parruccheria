# Fase 3 - Setup Monorepo

## Obiettivo

Questa fase prepara la base tecnica del monorepo.

Include:

- struttura `apps/`
- struttura `packages/`
- config root
- env example
- package condivisi
- placeholder per web e mobile

## Struttura creata

```text
/
  apps/
    web/
    mobile/
  packages/
    auth/
    booking/
    config/
    database/
    notifications/
    types/
    ui/
    validation/
  docs/
  supabase/
  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
  .env.example
```

## File root principali

- `/Users/fabio_pace/Documents/Playground/package.json`
- `/Users/fabio_pace/Documents/Playground/pnpm-workspace.yaml`
- `/Users/fabio_pace/Documents/Playground/turbo.json`
- `/Users/fabio_pace/Documents/Playground/tsconfig.base.json`
- `/Users/fabio_pace/Documents/Playground/.env.example`

## Cosa manca ancora

In questa fase non sono stati ancora installati:

- Next.js
- React
- Expo
- librerie Supabase client
- librerie UI reali

Queste arriveranno nella prosecuzione della Fase 3 o all'inizio della Fase 4/6, a seconda del flusso che scegliamo.

## Comandi da eseguire

Per installare `pnpm`:

```bash
npm install -g pnpm
```

Per installare le dipendenze root:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm install
```

Per controllare che Turbo veda il workspace:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm turbo run typecheck
```

## Nota pratica

Le cartelle `apps/web` e `apps/mobile` sono ancora placeholder intenzionali.

Motivo:

- evitiamo di generare boilerplate pesante troppo presto
- manteniamo la struttura ordinata
- il database e gia pronto e validato
- la fase successiva puo creare i progetti reali sopra una base pulita
