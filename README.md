# SaaS White-Label per Saloni

Piattaforma SaaS multi-tenant white-label per parrucchieri e barbieri in Italia.

Stack target:

- Web panel: Next.js
- Mobile app white-label: React Native con Expo
- Backend/Auth/DB/Storage: Supabase
- Database: PostgreSQL
- Linguaggio: TypeScript

Documentazione iniziale:

- [Fase 1 - Architettura](/Users/fabio_pace/Documents/Playground/docs/phase-1-architecture.md)
- [Fase 8 - Guida Principianti](/Users/fabio_pace/Documents/Playground/docs/phase-8-beginner-guide.md)

Ordine di lavoro:

1. Fase 1: architettura e piano tecnico
2. Fase 2: database, SQL, RLS e seed
3. Fase 3: setup monorepo e shared packages
4. Fase 4+: sviluppo progressivo di admin, pannello salone e app mobile
## Avvio rapido locale

Prima del primo avvio crea il file ambiente locale:

```bash
cp .env.example .env
```

Poi compila almeno le variabili che ti servono per Supabase/Auth.

Per alzare tutto insieme:

```bash
pnpm dev:up
```

Per controllare lo stato:

```bash
pnpm dev:status
```

Per spegnere tutto:

```bash
pnpm dev:down
```

Guida pratica completa:

- [Guida Principianti](/Users/fabio_pace/Documents/Playground/docs/phase-8-beginner-guide.md)
