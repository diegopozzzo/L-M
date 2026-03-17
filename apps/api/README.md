# API Legal

Backend Express del ecosistema juridico.

## Incluye

- Express con TypeScript
- Prisma + PostgreSQL
- JWT + Bcrypt
- CORS configurado para multiples origenes
- Seed y migraciones listas

## Scripts

```bash
npm run dev --workspace api
npm run build --workspace api
npm run start --workspace api
npm run prisma:generate --workspace api
npm run prisma:migrate:dev --workspace api
npm run prisma:migrate:deploy --workspace api
npm run seed --workspace api
```

## Produccion

- define `APP_ORIGINS` con los dominios permitidos separados por coma
- usa `npm run deploy:prepare --workspace api` antes de arrancar
- luego arranca con `npm run start --workspace api`
