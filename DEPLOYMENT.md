# Publicar Mossi Shop

La app ya esta preparada para Firebase Hosting + Firestore.

## 1. Crear Firebase

1. Crear un proyecto en Firebase.
2. Activar Authentication con Email/Password.
3. Crear estas usuarias:
   - `lopezalvarezjaqueline00@gmail.com`
   - el correo de tu hermana
4. Activar Firestore Database.

## 2. Configurar variables

Crear un archivo `.env` con los valores de Firebase:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## 3. Seguridad de Firestore

Las reglas estan en `firestore.rules`. Agrega el correo de tu hermana a la lista
de administradoras antes de publicar. Tambien agregalo en `src/data/admins.js`.

## 4. Publicar

```bash
npm run build
firebase deploy
```

Firebase entregara una URL publica parecida a:

```txt
https://mossi-shop.web.app
```

Con Firebase configurado, productos, pagos y configuracion se sincronizan entre
celulares. Sin Firebase, la app guarda solo en el navegador de cada dispositivo.
