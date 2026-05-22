<<<<<<< HEAD
# Mossi Shop

Aplicacion de inventario y pagos para Mossi Shop.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

El sitio de produccion se genera en `dist`.

## Vercel

El proyecto incluye `vercel.json` con:

- build command: `npm run build`
- output directory: `dist`
- SPA rewrite: `/(.*)` hacia `/index.html`

## Supabase

Configura estas variables en Vercel:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Ejecuta `supabase/schema.sql` en Supabase para crear la tabla de sincronizacion.
=======
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
>>>>>>> 99593e9197dbd8527070c5583bf14afb9f75995f
