# UberClone

Aplicación Expo/React Native para el flujo del conductor: registro, aprobación,
disponibilidad, solicitudes, viajes, pagos y ganancias. Firestore conserva los
viajes y sincroniza los cambios en tiempo real; Cloudinary conserva las fotos
del registro.

## Arquitectura

- `src/app`: rutas Expo Router y flujo Stack del conductor.
- `src/context`: autenticación, disponibilidad y estado del viaje.
- `src/hooks`: ubicación, solicitudes, ganancias y notificaciones.
- `src/services`: Firebase, Firestore, Cloudinary, rutas y pagos.
- `functions`: preferencia y webhook de Mercado Pago, además de notificaciones
  FCM para nuevas solicitudes.

## Instalación

```bash
npm install
npx expo start
```

Configura las variables de Cloudinary copiando [.env.example](./.env.example).
Las llaves privadas de Mercado Pago solo se configuran en Firebase Functions.

Para probar notificaciones remotas se necesita un Development Build; Expo Go
no permite probar push remotas en Android desde SDK 53. También se requiere
configurar las credenciales FCM/APNs en EAS o en la configuración nativa
correspondiente.

## Notificaciones push FCM en Android

Descarga desde Firebase Console > Project settings > Your apps > Android el
archivo `google-services.json` y colócalo en la raíz del proyecto. Debe
corresponder al paquete `com.santiagomunoz.uberclone`; no contiene secretos de
servidor, pero no se deben subir credenciales privadas de Firebase ni claves
de cuentas de servicio al repositorio.

Configura FCM v1 en EAS y crea una Development Build:

```bash
npx eas-cli@latest login
npx eas-cli@latest project:init
npx eas-cli@latest credentials
npx eas-cli@latest build --platform android --profile development
```

Instala el APK generado en un dispositivo Android físico o emulador con
Google Play Services. Después inicia el servidor y ejecuta la prueba con un
conductor autenticado:

```bash
npx expo start
npx firebase-tools deploy --only functions,firestore
```

Activa la disponibilidad, crea una solicitud Firestore con `status:
"requested"` y el `driverId` del conductor, minimiza la app y pulsa la
notificación. Debe abrir `/incoming-request`. El backend solo envía si
`drivers/{uid}.isAvailable` es `true` y registra cada entrega para evitar
duplicados.

## Firebase y pagos

Instala las dependencias del backend y configura los secretos:

```bash
cd functions
npm install
npx firebase-tools functions:secrets:set MERCADO_PAGO_ACCESS_TOKEN
npx firebase-tools functions:secrets:set MERCADO_PAGO_WEBHOOK_SECRET
npx firebase-tools deploy --only functions,firestore
```

Configura `MERCADO_PAGO_WEBHOOK_URL` en `functions/.env.uberclone-b49dc` con la
URL pública de `mercadoPagoWebhook` y vuelve a desplegar. Ese archivo no debe
subirse al repositorio. La aplicación móvil llama a
`createMercadoPagoPreference`; nunca contiene el access token.

Para la prueba actual, el conductor autenticado puede abrir el checkout de
Mercado Pago desde el resumen del viaje. La Function valida la firma
`x-signature`, consulta el pago directamente en Mercado Pago y solo entonces
actualiza `paymentStatus` y `status: 'paid'`. Los escenarios visuales locales
fueron retirados del flujo de conductor.

## Mapas y rutas

El mapa se renderiza con `react-native-maps`. La ruta de navegación actual usa
OSRM como servicio público de rutas; no debe presentarse como una integración
de Google Directions o Distance Matrix. Si el taller exige esas APIs
específicas, deben configurarse y validarse por separado con sus claves
restringidas.

La clave de Google Maps para Android se configura mediante el plugin
`react-native-maps` en `app.json`. Después de cambiar esta configuración, crea
una nueva Development Build; reiniciar Expo Go no modifica el
`AndroidManifest.xml` ya compilado.

La API key se lee desde `GOOGLE_MAPS_API_KEY` en `app.config.js`. Para desarrollo
local, define la variable en `.env` sin subir ese archivo. Para EAS, asígnala al
entorno `development`:

```bash
npx eas-cli@latest env:set --name GOOGLE_MAPS_API_KEY --value "<TU_API_KEY>" --environment development --visibility sensitive
npx eas-cli@latest build --platform android --profile development
```

## Validación

```bash
npx expo lint
cd functions
npx eslint .
```

Las pruebas manuales mínimas son: registro con campos inválidos, aprobación
del conductor, solicitud con vencimiento, aceptación, recorrido, finalización,
viaje en efectivo, viaje simulado persistido, recuperación del historial tras
reiniciar y recepción de una notificación en Development Build. No se debe
marcar el pago real como aprobado sin completar el checkout y webhook de
Mercado Pago.

La lógica de tarifa está centralizada en
[src/config/pricing.js](./src/config/pricing.js), y los viajes se sincronizan
mediante [src/services/tripService.js](./src/services/tripService.js).

## Uso de IA

Consulta [docs/AI_LOG.md](./docs/AI_LOG.md).
