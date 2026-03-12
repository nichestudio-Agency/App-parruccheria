# Fase 2 - Operazioni Database

## Obiettivo

Questo file serve per gestire il database locale Supabase del progetto.

Include:

- avvio locale
- reset database
- verifica migration
- verifica seed
- controlli rapidi
- troubleshooting base

## Dove si trovano i file

File principali:

- `/Users/fabio_pace/Documents/Playground/supabase/config.toml`
- `/Users/fabio_pace/Documents/Playground/supabase/migrations/202603120001_initial_schema.sql`
- `/Users/fabio_pace/Documents/Playground/supabase/migrations/202603120002_rls_policies.sql`
- `/Users/fabio_pace/Documents/Playground/supabase/seed.sql`

## Prerequisiti

Devi avere installato:

- Docker Desktop
- Supabase CLI

Verifica:

```bash
/opt/homebrew/bin/supabase --version
docker version
docker ps
```

Se `docker ps` fallisce, apri Docker Desktop e aspetta che sia pronto.

## Avvio locale

Per avviare Supabase in locale:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase start
```

Quando parte correttamente, vedrai:

- Studio
- API URL
- Database URL
- chiavi locali di auth

## Reset completo database

Questo comando:

- ricrea il database locale
- applica tutte le migration
- applica il file `seed.sql`

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase db reset
```

Usalo quando:

- modifichi lo schema SQL
- modifichi le policy RLS
- modifichi il seed

## Stato locale Supabase

Per vedere se Supabase locale e attivo:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase status
```

## Arresto dei servizi

Per fermare Supabase locale:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase stop
```

## URL locali utili

Quando il sistema e attivo:

- Studio: `http://127.0.0.1:54323`
- API: `http://127.0.0.1:54321`
- REST: `http://127.0.0.1:54321/rest/v1`
- DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

## Controlli rapidi consigliati

### 1. Verifica saloni seed

```bash
docker exec supabase_db_Playground psql -U postgres -d postgres -c "select tenant_key, status, environment_mode, demo_enabled from public.salons order by tenant_key;"
```

Risultato atteso:

- `atelier-uomo-firenze` -> `active`, `demo`
- `barberia-rossi` -> `active`, `production`
- `salone-verdi-roma` -> `suspended`, `production`
- `barber-club-napoli` -> `expired`, `production`

### 2. Verifica RLS attiva

```bash
docker exec supabase_db_Playground psql -U postgres -d postgres -c "select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('salons','salon_accounts','customers','appointments','reviews') order by tablename;"
```

Risultato atteso:

- tutte le righe con `rowsecurity = t`

### 3. Verifica conteggi seed

```bash
docker exec supabase_db_Playground psql -U postgres -d postgres -c "select (select count(*) from public.appointments) as appointments_count, (select count(*) from public.reviews) as reviews_count, (select count(*) from pg_policies where schemaname='public') as policies_count;"
```

Risultato atteso iniziale:

- `appointments_count = 3`
- `reviews_count = 1`
- `policies_count = 105`

## Flusso corretto quando modifichi il database

Ordine consigliato:

1. modifichi una migration SQL
2. salvi il file
3. esegui `supabase db reset`
4. controlli che non ci siano errori
5. verifichi seed e RLS

## Errori comuni

### Errore: `supabase: command not found`

Cause:

- Supabase CLI non e nel `PATH`

Soluzione:

```bash
PATH=/opt/homebrew/bin:$PATH supabase --version
```

### Errore: `Cannot connect to the Docker daemon`

Cause:

- Docker Desktop non e avviato

Soluzione:

1. apri Docker Desktop
2. aspetta che sia pronto
3. esegui:

```bash
docker ps
```

### Errore in migration SQL

Cause tipiche:

- vincolo non valido
- trigger non coerente
- espressione non accettata da PostgreSQL

Soluzione:

1. correggi il file SQL
2. riesegui:

```bash
PATH=/opt/homebrew/bin:$PATH supabase db reset
```

## Note importanti del progetto

In questo progetto:

- il database e multi-tenant
- ogni tabella tenant-aware ha `salon_id`
- l'isolamento e gestito con FK composte + RLS
- gli stati commerciali salone sono solo:
  - `active`
  - `suspended`
  - `expired`
- se il tenant non e `active`, le policy bloccano i dati operativi

## Comandi essenziali

Avvio:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase start
```

Reset:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase db reset
```

Stato:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase status
```

Stop:

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH supabase stop
```
