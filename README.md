# Ecosistema LegalTech ATRIA

Monorepo para la web institucional y la intranet juridica de ATRIA.

## Estructura

- `apps/web`: sitio institucional + acceso privado + CRM en Next.js.
- `apps/api`: API en Express + Prisma + PostgreSQL.
- `docs/`: notas funcionales y guias del proyecto.

## Stack

- Next.js App Router
- Tailwind CSS
- Express
- PostgreSQL
- Prisma
- JWT + Bcrypt
- Almacenamiento documental actual en PostgreSQL

## Desarrollo local

```bash
npm install
npm run dev
```

Comandos utiles:

```bash
npm run build
npm run lint
npm run prisma:migrate:dev --workspace api
npm run seed --workspace api
```

## Arquitectura recomendada para produccion

Para despliegue real, la configuracion recomendada es:

1. `apps/web` en Vercel
2. `apps/api` como servicio Node separado
3. PostgreSQL administrado externamente

Esto mantiene la web rapida en Vercel y evita forzar el backend Express a un despliegue unico que no coincide con la arquitectura actual del proyecto.

## Variables de entorno clave

Revisa `.env.example`.

- `NEXT_PUBLIC_APP_URL`: URL publica de la web
- `API_BASE_URL`: URL interna/servidor hacia la API, incluyendo `/api`
- `NEXT_PUBLIC_API_URL`: compatibilidad para entorno local
- `APP_ORIGINS`: lista separada por comas de dominios permitidos para la API
- `DATABASE_URL`: conexion PostgreSQL
- `JWT_SECRET` y `JWT_REFRESH_SECRET`: secretos de autenticacion

## Estado funcional actual

Hoy el sistema soporta:

- web institucional interactiva
- login del CRM
- dashboard y modulos base del CRM
- creacion y edicion de datos operativos
- gestion documental en PostgreSQL
- exportacion PDF de expedientes

Importante:

- el borrado de informacion no esta implementado de forma completa en todos los modulos
- si mantienes documentos grandes a traves de rutas serverless de Vercel, debes considerar sus limites de tamano

## Despliegue

La guia detallada esta en `docs/despliegue-produccion.md`.
Si vas a desplegar la API en Railway, sigue `docs/despliegue-api-railway.md`.
