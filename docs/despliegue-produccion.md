# Despliegue en produccion

## Resumen

La ruta recomendada para este proyecto es:

1. desplegar `apps/web` en Vercel
2. desplegar `apps/api` como servicio Node separado
3. conectar ambos a una base PostgreSQL administrada

## 1. Base de datos

Necesitas una base PostgreSQL accesible desde internet.

Opciones comunes:

- Neon
- Supabase
- Railway PostgreSQL
- Render PostgreSQL

Configura `DATABASE_URL` en el servicio de API.

## 2. Despliegue de la API

### Root directory

Usa `apps/api` como raiz del servicio.

### Variables necesarias

```env
APP_NAME=legal-api
NODE_ENV=production
PORT=4000
APP_ORIGINS=https://tu-dominio.com,https://tu-proyecto.vercel.app
DATABASE_URL=postgresql://usuario:password@host:5432/base
JWT_SECRET=un_secreto_muy_largo
JWT_REFRESH_SECRET=otro_secreto_muy_largo
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
SEED_DEMO_DATA=false
```

### Build command

```bash
npm install
npm run deploy:prepare
```

### Start command

```bash
npm run start
```

`deploy:prepare` genera Prisma Client, compila TypeScript y aplica migraciones pendientes.

## 3. Despliegue de la web en Vercel

### Root directory

Usa `apps/web` como raiz del proyecto en Vercel.

### Variables necesarias

```env
NEXT_PUBLIC_APP_NAME=ATRIA
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
API_BASE_URL=https://api.tu-dominio.com/api
```

`API_BASE_URL` debe apuntar a la API ya desplegada, incluyendo el prefijo `/api`.

## 4. Orden recomendado de despliegue

1. crear la base PostgreSQL
2. desplegar la API con sus variables
3. confirmar `GET /api/health`
4. desplegar la web en Vercel
5. validar login, dashboard y creacion de registros

## 5. Checklist de validacion

- `GET /api/health` responde `200`
- login del CRM funciona
- la web institucional carga sin errores
- se puede crear un cliente
- se puede crear un expediente
- se puede descargar un PDF de expediente

## 6. Limitaciones actuales a tener presentes

- El borrado completo no esta implementado en todos los modulos.
- La web actua como capa intermedia hacia la API, por lo que cargas grandes de archivos pueden verse afectadas por limites de plataformas serverless.
- Si vas a trabajar con documentos pesados o mucho volumen, conviene mover la subida fuera de Vercel o volver a evaluar almacenamiento externo.
