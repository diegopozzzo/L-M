# Despliegue de la API en Railway

## Arquitectura recomendada

- `apps/web` en Vercel
- `apps/api` en Railway
- PostgreSQL en Railway o externo

## Antes de empezar

La API ya incluye configuracion para Railway en:

- [apps/api/railway.json](C:\POZO\LEGAL\apps\api\railway.json)

## Crear el servicio

1. Entra a Railway
2. `New Project`
3. `Deploy from GitHub repo`
4. Elige este repositorio
5. En el servicio, configura:
   - `Root Directory`: `apps/api`
   - `Config as Code file path`: `/apps/api/railway.json`

## Variables de entorno

Configura estas variables en Railway:

```env
APP_NAME=legal-api
NODE_ENV=production
APP_ORIGINS=https://l-m-web-five.vercel.app
DATABASE_URL=postgresql://usuario:password@host:5432/base
JWT_SECRET=un_secreto_muy_largo
JWT_REFRESH_SECRET=otro_secreto_muy_largo
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
SEED_ADMIN_EMAIL=admin@estudiolegal.local
SEED_ADMIN_PASSWORD=Admin123!
SEED_TEAM_DATA=false
SEED_DEMO_DATA=false
```

No configures `PORT` manualmente en Railway. La plataforma lo inyecta automaticamente.

## Base de datos

Tienes dos opciones:

1. Crear PostgreSQL dentro de Railway y copiar su `DATABASE_URL`
2. Usar una base externa como Neon o Supabase

## Build y deploy

Con `railway.json`:

- build: `npm run build`
- start: `npm run start:railway`

`start:railway` ejecuta primero `prisma migrate deploy` y luego levanta la API.
Esto evita problemas cuando la base de datos solo es accesible por red privada en runtime.

## Crear el administrador inicial

Despues del primer deploy, abre la consola del servicio y ejecuta:

```bash
npm run seed
```

Eso creara:

- roles
- permisos
- catalogos base
- usuario administrador

Con `SEED_TEAM_DATA=false` no se crearan usuarios demo adicionales.

## Validacion

Cuando termine el deploy, valida:

```text
GET https://tu-api.railway.app/api/health
```

Debe responder `200`.

## Conectar Vercel con Railway

En el proyecto web de Vercel agrega:

```env
API_BASE_URL=https://tu-api.railway.app/api
NEXT_PUBLIC_APP_URL=https://l-m-web-five.vercel.app
```

Luego redeploy de la web.

## Checklist final

1. `api/health` responde `200`
2. `npm run seed` ya corrio en Railway
3. `API_BASE_URL` en Vercel apunta a Railway
4. el login en `/acceso` deja de devolver `fetch failed`
