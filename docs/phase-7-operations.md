# Fase 7: Operazioni, Log e Blocchi

## Obiettivo

Questa fase aggiunge:

- waiting list
- prenotazioni ricorrenti
- coda notifiche base
- export jobs
- audit log
- access log
- blocco operativo automatico se il salone non e `active`

## File principali

- `/Users/fabio_pace/Documents/Playground/apps/web/src/lib/salon-data.ts`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/lib/owner-auth.ts`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/salon/operations/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/salon/operations/actions.ts`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/salon/logs/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/components/salon-shell.tsx`
- `/Users/fabio_pace/Documents/Playground/packages/notifications/src/index.ts`

## Pagine nuove

- `/salon/operations`
- `/salon/logs`

## Blocco automatico

Le mutation del pannello salone passano ora da un controllo centrale sullo stato del tenant.

Se il salone non e `active`:

- login titolare bloccato
- action operative bloccate
- pagine tenant bloccate tramite session check

## Comandi utili

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/web typecheck
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/web build
```
