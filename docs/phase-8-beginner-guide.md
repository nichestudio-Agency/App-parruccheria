# Fase 8: Guida Semplice per Principianti

## A cosa serve questa guida

Questa guida ti spiega come usare il progetto in locale, come gestire un nuovo salone e come prepararti alle build white-label.

E scritta per una persona non tecnica.

## Stato reale del progetto oggi

Funziona gia:

- database locale Supabase
- pannello super admin web
- pannello titolare web
- app mobile Expo white-label base
- script rapidi di avvio e spegnimento

Gia predisposto ma non ancora integrato fino in fondo:

- login cliente reale con Supabase Auth nella app mobile
- login Google e Apple reali nella app mobile
- invio notifiche reali via provider esterno
- build store definitive iOS e Android

## 1. Prerequisiti

Prima di iniziare devi avere:

- Mac
- Homebrew
- Node.js
- pnpm
- Docker Desktop
- Supabase CLI
- Xcode per iOS
- Android Studio per Android
- un account Apple Developer
- un account Google Play Console

## 2. Installazione iniziale

Apri il terminale nella cartella del progetto:

```bash
cd /Users/fabio_pace/Documents/Playground
```

Installa le dipendenze del progetto:

```bash
PATH=/opt/homebrew/bin:$PATH pnpm install --store-dir /Users/fabio_pace/Library/pnpm/store/v3
```

## 3. File ambiente

Usa questo file come base:

- `/Users/fabio_pace/Documents/Playground/.env.example`

Crea il file `.env.local` oppure `.env` partendo da quel contenuto.

Valori minimi da impostare:

- `SUPABASE_DB_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`
- `EXPO_PUBLIC_TENANT_KEY`

## 4. Avvio locale rapido

Per avviare tutto insieme:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm dev:up
```

Per controllare lo stato:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm dev:status
```

Per spegnere tutto:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm dev:down
```

## 5. URL locali

- pannello super admin: `http://localhost:3000/login`
- pannello titolare: `http://localhost:3000/salon/login`
- Supabase Studio: `http://127.0.0.1:54323`
- API Supabase locale: `http://127.0.0.1:54321`

## 6. Credenziali locali

Super admin locali:

- email: `admin@platforma.it`
- password: `admin12345`

Titolare demo locale:

- usa una email presente in `public.salon_owners`
- password locale: `owner12345`

## 7. Configurazione Supabase

La configurazione locale vive qui:

- `/Users/fabio_pace/Documents/Playground/supabase/config.toml`

Comandi utili:

Avvio:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase start
```

Reset database:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase db reset
```

Stato:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase status
```

## 8. Database, migration e seed

I file principali sono:

- `/Users/fabio_pace/Documents/Playground/supabase/migrations/202603120001_initial_schema.sql`
- `/Users/fabio_pace/Documents/Playground/supabase/migrations/202603120002_rls_policies.sql`
- `/Users/fabio_pace/Documents/Playground/supabase/seed.sql`

Ordine corretto:

1. schema
2. RLS
3. seed

Con la CLI locale non devi farlo a mano ogni volta.

Ti basta:

```bash
PATH=/opt/homebrew/bin:$PATH supabase db reset
```

## 9. Avvio pannello web

Se vuoi avviare solo il web:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/web dev
```

Controlli tecnici:

```bash
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/web typecheck
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/web build
```

## 10. Avvio app mobile

Se vuoi avviare solo l'app mobile:

```bash
cd /Users/fabio_pace/Documents/Playground
HOME=/Users/fabio_pace/Documents/Playground PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/mobile dev
```

Per cambiare tenant in locale:

```bash
cd /Users/fabio_pace/Documents/Playground
EXPO_PUBLIC_TENANT_KEY=barberia-rossi HOME=/Users/fabio_pace/Documents/Playground PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/mobile dev
```

Controllo tecnico:

```bash
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/mobile typecheck
```

## 11. Dove si configura il white-label mobile

File principali:

- `/Users/fabio_pace/Documents/Playground/apps/mobile/app.config.ts`
- `/Users/fabio_pace/Documents/Playground/apps/mobile/src/lib/tenant-config.ts`

Per ogni salone devi definire almeno:

- `tenantKey`
- `appName`
- `iosBundleId`
- `androidPackageName`
- `primaryColor`
- `secondaryColor`
- `environmentMode`

## 12. Come creare un nuovo salone

Percorso:

1. apri il pannello super admin
2. vai su lista saloni
3. entra in creazione nuovo salone
4. inserisci dati base
5. salva

Risultato:

- viene creato il tenant
- viene creato il titolare
- viene creata la configurazione base
- viene creato branding iniziale
- viene attivata la struttura demo/produzione

## 13. Come gestire un tenant

Dal pannello super admin puoi:

- vedere tutti i saloni
- cambiare stato commerciale
- attivare demo o produzione
- generare credenziali titolare
- entrare nel dettaglio tenant
- gestire feature flag

Stati tenant supportati:

- `active`
- `suspended`
- `expired`

## 14. Come attivare la demo di un salone

La demo e gestita come modalita del tenant, non come progetto separato.

In pratica:

1. crei il salone
2. imposti `environmentMode = demo`
3. tieni il tenant in `active`
4. usi un branding base per mostrare l'app al cliente

Questo ti permette di:

- far vedere il prodotto prima della pubblicazione
- non duplicare backend e database
- riusare la stessa codebase

## 15. Come predisporre una build per un nuovo salone

Passi pratici:

1. crea il salone dal pannello super admin
2. definisci `tenantKey`
3. definisci nome app
4. definisci bundle id iOS
5. definisci package name Android
6. definisci colori base
7. prepara logo, icona e splash
8. aggiungi il tenant in `apps/mobile/src/lib/tenant-config.ts`
9. aggiorna `apps/mobile/app.config.ts` se servono valori specifici
10. avvia in locale con `EXPO_PUBLIC_TENANT_KEY`

## 16. Google Auth e Apple Auth

Stato attuale del progetto:

- la UI mobile e pronta
- l'integrazione reale Supabase Auth mobile non e ancora stata completata

Quando farai il collegamento reale, il flusso corretto e:

1. creare provider Google e Apple nei rispettivi portali developer
2. inserire Client ID e Secret in Supabase Auth
3. impostare correttamente redirect URL e callback
4. collegare il login nella app mobile Expo
5. testare login e logout su device reale

Perche questa parte va fatta con attenzione:

- Apple richiede configurazione precisa di Services ID, Key ID, Team ID e redirect
- Google richiede Client ID corretti per ambiente e piattaforma

Riferimenti ufficiali usati per questa guida:

- [Supabase Auth Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Auth Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)

## 17. Come pubblicare iOS e Android

Questa parte non e ancora automatizzata nel progetto, ma la struttura e pronta.

Flusso consigliato:

1. definisci il tenant da pubblicare
2. blocca il branding definitivo
3. aggiorna config white-label
4. genera build iOS
5. genera build Android
6. testa su device reale
7. pubblica dagli account store di tua proprieta

Importante:

- tutte le app clienti vengono pubblicate con i tuoi account developer
- ogni salone ha la sua app separata
- la base di codice resta unica

## 18. Cosa deve fare il titolare del salone

Dal pannello salone puo:

- vedere agenda
- gestire servizi
- gestire operatori
- vedere clienti
- gestire promozioni
- gestire portfolio
- usare waiting list
- creare ricorrenze
- richiedere export
- vedere log attività

Non puo:

- cambiare branding avanzato
- cambiare icona, splash, bundle id, package name

## 19. Troubleshooting base

### `pnpm dev:up` non parte

Controlla:

- Docker Desktop aperto
- Supabase CLI installata
- `pnpm` disponibile

Poi riprova:

```bash
PATH=/opt/homebrew/bin:$PATH pnpm dev:up
```

### Supabase non parte

Controlla:

```bash
PATH=/opt/homebrew/bin:$PATH supabase status
docker ps
```

Se serve:

```bash
PATH=/opt/homebrew/bin:$PATH supabase stop
PATH=/opt/homebrew/bin:$PATH supabase start
```

### Il pannello web non si apre

Controlla:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Se non c'e niente in ascolto:

```bash
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/web dev
```

### L'app mobile non parte

Controlla:

```bash
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/mobile typecheck
```

Poi riavvia:

```bash
HOME=/Users/fabio_pace/Documents/Playground PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/mobile dev
```

### Vuoi ripulire e ricreare il database locale

Usa:

```bash
PATH=/opt/homebrew/bin:$PATH supabase db reset
```

## 20. Ordine pratico consigliato per lavorare da ora

1. avvia tutto con `pnpm dev:up`
2. controlla Studio e pannello web
3. lavora sul tenant demo
4. testa il pannello titolare
5. testa la app mobile col tenant giusto
6. prepara branding definitivo
7. collega auth mobile reale
8. prepara build store

## 21. Documenti utili gia presenti

- `/Users/fabio_pace/Documents/Playground/docs/phase-1-architecture.md`
- `/Users/fabio_pace/Documents/Playground/docs/phase-2-database-operations.md`
- `/Users/fabio_pace/Documents/Playground/docs/phase-3-monorepo-setup.md`
- `/Users/fabio_pace/Documents/Playground/docs/phase-4-super-admin.md`
- `/Users/fabio_pace/Documents/Playground/docs/phase-5-salon-panel.md`
- `/Users/fabio_pace/Documents/Playground/docs/phase-6-mobile-app.md`
- `/Users/fabio_pace/Documents/Playground/docs/phase-7-operations.md`
