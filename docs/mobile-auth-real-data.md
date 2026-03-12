# Mobile: Auth e Dati Reali

## Cosa e stato integrato

- login cliente reale con Supabase Auth
- registrazione cliente reale
- Google OAuth reale via browser auth session e deep link
- Apple Sign In reale via identity token su iOS
- sessione persistente in React Native
- bootstrap tenant reale via RPC
- lettura dati reale per:
  - portfolio
  - servizi
  - operatori
  - promozioni
  - coupon
  - appuntamenti
  - recensioni
  - profilo cliente
- creazione prenotazione reale via RPC
- spostamento prenotazione reale via RPC
- annullamento prenotazione reale via RPC
- pubblicazione recensione reale

## File principali

- `/Users/fabio_pace/Documents/Playground/apps/mobile/App.tsx`
- `/Users/fabio_pace/Documents/Playground/apps/mobile/src/lib/supabase.ts`
- `/Users/fabio_pace/Documents/Playground/apps/mobile/src/lib/mobile-api.ts`
- `/Users/fabio_pace/Documents/Playground/supabase/migrations/202603120003_mobile_app_rpc.sql`

## Comandi di verifica

```bash
cd /Users/fabio_pace/Documents/Playground
PATH=/opt/homebrew/bin:$PATH pnpm --filter @apps/mobile typecheck
PATH=/opt/homebrew/bin:$PATH pnpm --filter @repo/types typecheck
PATH=/opt/homebrew/bin:$PATH supabase db reset
```

## Variabili ambiente importanti

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_TENANT_KEY`

## Redirect e scheme

L'app usa questo scheme locale:

- `salonwl://auth/callback`

File aggiornati:

- `/Users/fabio_pace/Documents/Playground/apps/mobile/app.config.ts`
- `/Users/fabio_pace/Documents/Playground/supabase/config.toml`

## Setup provider

### Google

In Supabase Auth devi configurare:

- provider Google attivo
- Client ID Google
- Client Secret Google
- redirect autorizzato verso Supabase

Nel progetto mobile il callback finale torna a:

- `salonwl://auth/callback`

### Apple

In Supabase Auth devi configurare:

- provider Apple attivo
- Services ID
- Key ID
- Team ID
- client secret Apple

In iOS l'app e ora predisposta con:

- `usesAppleSignIn: true`
- plugin `expo-apple-authentication`

## Limiti attuali

- lo slot booking viene ancora scelto da una lista base lato app
- la conferma finale di disponibilita e comunque reale, lato database
