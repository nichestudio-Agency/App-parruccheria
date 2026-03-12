# Fase 5: Pannello Titolare

## Obiettivo

Questa fase aggiunge il pannello web del singolo salone.

Il titolare puo:

- fare login nel proprio spazio
- vedere dashboard e agenda
- gestire servizi
- gestire operatori
- vedere clienti
- creare promozioni
- aggiornare portfolio
- modificare solo i contenuti base del profilo salone

Il titolare non puo:

- cambiare branding avanzato app
- cambiare asset di build
- accedere ad altri saloni
- accedere se il salone non e `active`

## Percorsi disponibili

- `/salon/login`
- `/salon`
- `/salon/agenda`
- `/salon/services`
- `/salon/operators`
- `/salon/customers`
- `/salon/promotions`
- `/salon/portfolio`
- `/salon/settings`

## Login locale

Per questa fase il login titolare e locale e semplificato.

Regole:

- email: deve esistere in `public.salon_owners`
- password demo locale: `owner12345`
- il salone deve essere in stato `active`

Se il salone e `suspended` o `expired`, il login viene bloccato.

## File principali

- `/Users/fabio_pace/Documents/Playground/apps/web/src/lib/owner-auth.ts`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/lib/salon-data.ts`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/components/salon-shell.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/components/owner-login-form.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/salon/login/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/salon/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/salon/agenda/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/salon/services/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/salon/operators/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/salon/customers/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/salon/promotions/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/salon/portfolio/page.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/web/src/app/salon/settings/page.tsx`

## Cosa mostra il pannello

### Dashboard

- operatori attivi
- servizi attivi
- clienti
- appuntamenti futuri
- agenda imminente

### Agenda

- prossimi appuntamenti
- blocchi agenda
- orari business del salone
- inserimento blocchi manuali

### Servizi

- lista servizi
- categoria
- durata
- prezzo
- operatori abilitati
- creazione nuovo servizio

### Operatori

- lista operatori
- bio
- colore agenda
- stato attivo
- creazione operatore

### Clienti

- elenco clienti
- email
- telefono
- totale appuntamenti
- ultima visita

### Promozioni

- promozioni attive e storiche
- coupon esistenti
- creazione promozione

### Portfolio

- elementi portfolio esistenti
- aggiunta nuovo contenuto base

### Impostazioni

- nome commerciale
- email contatto
- telefono
- citta
- provincia

Nota:

- `app_display_name` viene mostrato ma non e modificabile dal titolare

## Comandi da eseguire

Avvio database locale:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase start
```

Avvio pannello web:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/web dev
```

Controllo typecheck:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/web typecheck
```

Controllo build:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/web build
```

## URL locali

- login super admin: `http://localhost:3000/login`
- login titolare: `http://localhost:3000/salon/login`
- Supabase Studio: `http://127.0.0.1:54323`

## Credenziali demo utili

Super admin:

- email: `admin@platforma.it`
- password: `admin12345`

Titolare:

- usa una email presente in `public.salon_owners`
- password: `owner12345`

## Query utile per vedere le email titolari seed

Se vuoi vedere quali email titolari puoi usare:

```bash
docker exec supabase_db_Playground psql -U postgres -d postgres -c "select salon_id, email, first_name, last_name from public.salon_owners order by created_at;"
```

## Limiti attuali della Fase 5

- il login titolare non usa ancora Supabase Auth reale
- non esistono ancora login separati per operatori
- il cliente finale non e ancora parte dell'interfaccia web
- le create action sono MVP e non coprono ancora tutti i casi avanzati
- branding avanzato e build app restano gestiti dal super admin

## Stato della fase

Validato localmente:

- `pnpm --filter @apps/web typecheck`
- `pnpm --filter @apps/web build`

Questa fase e pronta come base reale per procedere alla Fase 6.
