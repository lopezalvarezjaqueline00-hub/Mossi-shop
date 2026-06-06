# Mossi Shop

Aplicacion web de inventario y pagos para Mossi Shop, construida con React,
Vite, TailwindCSS, Framer Motion, React Icons, Recharts y Supabase.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de produccion

```bash
npm run build
```

El sitio de produccion se genera en `dist`.

## Persistencia con Supabase

La app usa Supabase como fuente compartida para que dos celulares vean la misma
informacion. Cuando `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estan
configuradas:

- `products`: productos, inventario, estados e imagenes guardadas como data URL.
- `payments`: pagos, articulos vendidos, montos y metadatos de recibo.
- `settings`: nombre de tienda, tema y modo oscuro.

Cada dispositivo autorizado lee y escribe esas mismas filas de
`public.mossi_state`, asi que el inventario, pagos y configuracion se mantienen
compartidos entre administradoras. Con Realtime activo, los cambios recibidos
por Supabase se reflejan en la otra sesion sin recargar.

Los comprobantes PDF se generan desde cada pago guardado. El pago conserva
`receiptNumber` y `receiptGeneratedAt`, por eso el recibo puede volver a
descargarse desde otro dispositivo.

Si Supabase no esta configurado, la app cae a `localStorage` solo como modo de
desarrollo local. Para produccion en celular, configura Supabase.

### Crear tabla en Supabase

1. Entra a Supabase.
2. Abre SQL Editor.
3. Ejecuta completo el archivo `supabase/schema.sql`.
4. Verifica que exista la tabla `public.mossi_state`.

El SQL tambien intenta agregar la tabla a la publicacion `supabase_realtime`.
Si Supabase muestra que Realtime no esta activo, activalo manualmente en:

```txt
Database > Replication > supabase_realtime > mossi_state
```

### Variables de entorno

Copia `.env.example` a `.env.local` para desarrollo local:

```bash
cp .env.example .env.local
```

En `.env.local` y en Vercel debes llenar:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

No pegues claves reales en el codigo ni en GitHub. La `anon key` va solo en
variables de entorno.

## Deploy en Vercel

El proyecto ya incluye `vercel.json` con:

```txt
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Tambien incluye el rewrite necesario para que Vercel no devuelva `404` en rutas
internas:

```json
{
  "source": "/(.*)",
  "destination": "/index.html"
}
```

En Vercel, pega estas variables en:

```txt
Project Settings > Environment Variables
```

Variables requeridas:

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Despues haz redeploy de produccion.

## Administradoras

Las administradoras actuales estan definidas en `src/data/admins.js`.
Pueden iniciar sesion desde celulares o computadoras diferentes y ver la misma
informacion compartida en Supabase.
No se guardan contrasenas en la tabla publica de Supabase. Si quieres cuentas
administradas desde Supabase en el futuro, lo correcto es migrar login a
Supabase Auth y proteger la tabla con usuarios autenticados.
