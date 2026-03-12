# Fase 6: App Mobile Cliente White-Label

## Obiettivo

Questa fase aggiunge la prima app mobile cliente basata su Expo e React Native.

La base e unica, ma e predisposta per build white-label separate per salone.

## Cosa include

- login cliente con email/password
- accessi rapidi Google e Apple a livello UI
- home con portfolio, servizi, promozioni e coupon
- prenotazione con scelta operatore, servizi, giorno e orario
- riepilogo durata e totale
- lista appuntamenti con modifica e annullamento
- recensioni base
- profilo cliente con consensi privacy e marketing separati
- configurazione white-label per tenant

## File principali

- `/Users/fabio_pace/Documents/Playground/apps/mobile/App.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/mobile/app.config.ts`
- `/Users/fabio_pace/Documents/Playground/apps/mobile/src/lib/tenant-config.ts`
- `/Users/fabio_pace/Documents/Playground/apps/mobile/src/lib/mock-data.ts`
- `/Users/fabio_pace/Documents/Playground/packages/types/src/index.ts`

## White-label attuale

La configurazione build e runtime supporta gia tenant diversi.

Tenant demo presenti:

- `atelier-uomo-firenze`
- `barberia-rossi`

Campi configurati:

- `appName`
- `iosBundleId`
- `androidPackageName`
- colori principali
- `tenantKey`
- `environmentMode`

## Avvio locale

Installa le dipendenze se non lo hai gia fatto:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm install
```

Avvia l'app mobile:

```bash
cd /Users/fabio_pace/Documents/Playground
HOME=/Users/fabio_pace/Documents/Playground PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/mobile dev
```

Oppure avvia tutto insieme dal root:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm dev:up
```

Per cambiare tenant in locale:

```bash
cd /Users/fabio_pace/Documents/Playground
EXPO_PUBLIC_TENANT_KEY=barberia-rossi HOME=/Users/fabio_pace/Documents/Playground PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/mobile dev
```

## Controlli eseguiti

Typecheck tipi condivisi:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm --filter @repo/types typecheck
```

Typecheck app mobile:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/mobile typecheck
```

## Flussi disponibili

### Auth

- login email/password
- registrazione UI
- accesso rapido Google
- accesso rapido Apple

Nota:

- in questa fase il login e simulato lato client
- la UI e pronta per il collegamento a Supabase Auth

### Home

- portfolio
- servizi
- promozioni
- coupon

### Prenotazione

- scelta operatore
- multi-servizio
- durata totale
- totale prezzo
- scelta giorno
- scelta orario
- conferma appuntamento

### Appuntamenti

- lista appuntamenti
- sposta appuntamento
- annulla appuntamento
- lascia recensione su appuntamenti completati

### Profilo

- dati cliente
- preferenze
- provider login
- consensi privacy
- consensi marketing
- coupon salvati

## Limiti attuali della Fase 6

- dati ancora mock locali
- nessuna chiamata reale a Supabase
- notifiche push non ancora integrate
- login Google/Apple ancora simulato a livello UI
- build store non ancora avviata

Questi punti saranno completati nelle fasi successive, senza dover rifare la base app.
