# Web Legal

Frontend Next.js de ATRIA.

## Incluye

- landing institucional
- acceso privado al CRM
- rutas internas que proxyfican la sesion hacia la API

## Scripts

```bash
npm run dev --workspace web
npm run build --workspace web
npm run start --workspace web
npm run lint --workspace web
```

## Variables de entorno relevantes

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `API_BASE_URL`

`API_BASE_URL` es la variable recomendada para produccion y debe incluir el sufijo `/api`.
