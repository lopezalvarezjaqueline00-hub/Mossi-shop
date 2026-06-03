# Publicar Mossi Shop

La app esta preparada para Vercel + Supabase.

## Vercel

Usa esta configuracion:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

El archivo `vercel.json` deja esa configuracion fija y agrega el rewrite
necesario para que el dashboard no devuelva `404 NOT_FOUND` al abrir rutas de
la app directamente.

## Supabase

1. Crear un proyecto en Supabase.
2. Ejecutar `supabase/schema.sql` en el SQL Editor.
3. Activar Realtime para la tabla `mossi_state` si quieres ver cambios entre
   celulares sin recargar.
4. Agregar estas variables en Vercel:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

Con Supabase configurado, productos, pagos y configuracion se sincronizan entre
celulares. Los recibos se regeneran desde los pagos guardados, que incluyen
`receiptNumber` y `receiptGeneratedAt`. Sin Supabase, la app guarda solo en el
navegador de cada dispositivo.
