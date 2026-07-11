# ADR 0002 — ORM: Drizzle

- **Status:** Accepted
- **Context:** The backend uses clean/hexagonal architecture; the domain must stay free of ORM
  concerns. Options considered: Drizzle, Prisma, TypeORM, MikroORM.
- **Decision:** **Drizzle.** Its plain-object schema keeps domain entities POJOs (no decorators
  bleeding in), it is fast and SQL-first, and has excellent TS types.
- **Consequences:** ORM is hidden behind repository **ports** + mappers, so the choice is
  reversible. Only `infrastructure/` imports Drizzle. Migrations via `drizzle-kit` in `apps/api/drizzle/`.
