# UberClone — aplicación del conductor

UberClone es una aplicación móvil académica para el flujo del conductor de una
plataforma de transporte. Está construida con Expo y React Native para Android
y iOS, y conecta autenticación, datos de conductores y viajes con Firebase.

El repositorio contiene el cliente del conductor y Firebase Functions. No
incluye una aplicación de pasajero. La recepción de carreras reales depende de
que otro cliente o servicio de confianza cree en Firestore una solicitud con
el conductor asignado.

## Funcionalidades en el código

- Registro e inicio de sesión del conductor con Firebase Authentication;
  el registro queda pendiente hasta que un administrador lo apruebe.
- Carga a Cloudinary de la foto de perfil, vehículo y documentos.
- Disponibilidad del conductor y actualización de ubicación mientras está
  disponible.
- Escucha en tiempo real de solicitudes de viaje asignadas al conductor,
  temporizador para aceptar o rechazar y función de Firebase para notificaciones
  push FCM.
- Mapa y ubicación del dispositivo, navegación hacia recogida y destino, cálculo
  de tarifa, comisión de plataforma del 20 % y ganancias.
- Historial y detalle de viajes con datos sincronizados desde Firestore.
- Firebase Functions para completar viajes, confirmar efectivo, crear el
  checkout de Mercado Pago, validar su webhook y actualizar el estado del pago.
- Solicitud y viaje simulados disponibles durante el desarrollo para probar la
  interfaz sin una aplicación de pasajero.

La presencia del código no significa que los servicios estén configurados o
desplegados. Las funciones de Firebase, las credenciales, las reglas y las
cuentas externas deben prepararse para cada entorno antes de probar el flujo
integrado.

## Pendientes y límites conocidos

- El proyecto no crea solicitudes desde una aplicación de pasajero. Para probar
  solicitudes reales se necesita el cliente o backend que cree el documento de
  viaje con `status: "requested"` y el `driverId` correspondiente.
- La ruta se consulta al servicio público OSRM; no se implementan Google
  Directions API ni Distance Matrix API.
- Las rutas Expo de viaje activo y resumen de pago redirigen al inicio cuando
  la app no está en modo de desarrollo (`__DEV__`). El acceso de producción a
  esas pantallas debe habilitarse y validarse antes de publicar.
- El flujo usa Expo Router Stack y pestañas para los pasos del registro. No se
  encontró un Drawer configurado para perfil, historial y ajustes, como propone
  el documento académico.
- Las notificaciones remotas requieren el proyecto FCM, las credenciales
  nativas y un Development Build. El registro del token se omite en Expo Go.
- El checkout real de Mercado Pago depende de desplegar las Functions, guardar
  los secretos y configurar la URL pública del webhook. El pago no se considera
  aprobado hasta que el backend recibe y verifica la notificación.
- Este README no certifica despliegues, credenciales externas ni pruebas
  funcionales; consulta la lista de validación al final.

## Tecnologías

Versiones principales declaradas en `package.json`:

- Expo SDK `~58.0.21`, Expo Router `~58.0.28`, React Native `0.88.1` y React
  `19.3.0`.
- Firebase JavaScript SDK `^13.2.0` para Authentication, Firestore y llamadas a
  Firebase Functions.
- `expo-location`, `expo-notifications`, `expo-dev-client`, `react-native-maps`,
  Cloudinary y OSRM.
- Backend: Firebase Functions v2, Firebase Admin y Node.js 20, según
  `functions/package.json` y `firebase.json`.

Referencias oficiales: [configuración y parámetros de entorno de Functions](https://firebase.google.com/docs/functions/config-env) y [runtime Node.js de Functions](https://firebase.google.com/docs/functions/manage-functions#set_nodejs_version).

Las dependencias instaladas se revisaron con `npm ls --depth=0` en la raíz y
`npm --prefix functions ls --depth=0` en el backend. Usa los archivos de lock
para instalar las versiones del equipo.

## Requisitos previos

- Node.js y npm para instalar y ejecutar la aplicación. Firebase Functions está
  configurado para Node.js 20.
- Un proyecto de Firebase con Authentication, Cloud Firestore y Cloud
  Functions habilitados.
- Una cuenta Cloudinary con un preset de carga sin firma (*unsigned*) para las
  imágenes del registro.
- Una clave restringida de Google Maps para Android si se va a compilar la app
  con mapas en Android.
- Para compilar Android localmente, Android Studio y Android SDK. Para compilar
  iOS localmente, macOS y Xcode. Como alternativa se configura EAS Build.
- Para probar push remoto, credenciales FCM/APNs y un Development Build en un
  dispositivo compatible.
- Para probar cobros reales, credenciales de prueba de Mercado Pago y las
  Firebase Functions desplegadas con sus secretos.

## Instalación y ejecución local

Desde la raíz del proyecto:

```bash
npm install
```

Crea el archivo local `.env` a partir de la plantilla. En PowerShell:

```powershell
Copy-Item .env.example .env
```

En macOS o Linux:

```bash
cp .env.example .env
```

Completa solo las variables de app descritas en la sección siguiente y arranca
Expo:

```bash
npm start
```

Para compilar y ejecutar Android con el entorno nativo local:

```bash
npm run android
```

Ese script ejecuta `expo run:android` y requiere Android Studio/SDK. Para push
remoto, instala una Development Build y ejecuta Metro en modo dev client:

```bash
npx expo start --dev-client
```

El script `npm run ios` usa `expo run:ios` y requiere macOS con Xcode. Las
dependencias del backend se instalan aparte cuando se vaya a trabajar en
Functions:

```bash
npm --prefix functions install
```

## Variables de entorno

La app móvil lee estas variables:

| Variable | Uso |
| --- | --- |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Nombre del cloud de Cloudinary; necesario para subir imágenes. |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Preset unsigned de Cloudinary; necesario para subir imágenes. |
| `GOOGLE_MAPS_API_KEY` | Clave de Google Maps usada por el plugin de Android en `app.config.js`. |

Los valores con prefijo `EXPO_PUBLIC_` se incluyen en la app cliente y no deben
contener secretos privados. No pongas el API Secret de Cloudinary ni tokens de
Mercado Pago en el móvil. Restringe la clave de Maps por aplicación y firma de
Android.

`EXPO_PUBLIC_PAYMENT_BACKEND_URL` aparece en `.env.example`, pero no es leída
por el cliente actual: los pagos usan Firebase Functions. La variable
`MERCADO_PAGO_WEBHOOK_URL` también aparece en la plantilla raíz, pero se consume
en Functions, no en la app móvil. No hace falta configurarlas en el `.env` de la
app para los flujos implementados.

`.env`, `functions/.env.*` y `google-services.json` están excluidos de Git por
`.gitignore`. No subas tokens, archivos de cuentas de servicio ni valores
privados al repositorio.

## Configuración de Firebase

1. Crea un proyecto Firebase, registra la app web y configura el objeto de
   Firebase en `src/config/firebase.js`; en este checkout la configuración
   cliente está escrita en ese archivo, no se carga desde variables `.env`.
2. Habilita el proveedor Email/Password en Authentication y crea Firestore.
   Revisa `firestore.rules` antes de desplegar reglas.
3. Para aprobación administrativa, las reglas requieren el custom claim
   `admin: true`. El repositorio no incluye una pantalla para emitir ese claim;
   asígnalo desde un proceso administrativo seguro.
4. Descarga `google-services.json` para el paquete Android
   `com.santiagomunoz.uberclone` y colócalo en la raíz, como indica `app.json`.
   El archivo está ignorado por Git; confirma que esté disponible en el
   contexto de cualquier build remoto.
5. El proyecto fija Functions en Node.js 20. Instala la CLI de Firebase si no
   la tienes, selecciona tu proyecto y, cuando estés listo para desplegar,
   aplica las reglas y Functions:

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore,functions
```

No se ejecutó ningún despliegue como parte de esta auditoría.

### Notificaciones FCM

La Function `notifyDriverOfIncomingTrip` se activa al crear un documento de
viaje y envía una notificación al dispositivo registrado del conductor
disponible. Para probarla, configura FCM y las credenciales nativas/EAS, genera
una Development Build de Android y ejecuta la app con un conductor autenticado.
El paquete Android configurado es `com.santiagomunoz.uberclone`.

El archivo `google-services.json` debe corresponder al mismo proyecto Firebase
y paquete. Expo Go no registra el token remoto para esta app; una recarga de
JavaScript no sustituye la Development Build cuando se cambian configuraciones
nativas.

### Cloudinary y Google Maps

Cloudinary recibe fotos del perfil, vehículo y documentos. Completa las dos
variables Cloudinary de `.env` y habilita el preset unsigned en el dashboard de
Cloudinary. No uses una API Secret en la app.

`app.config.js` agrega el plugin de `react-native-maps` para Android solo si
encuentra `GOOGLE_MAPS_API_KEY`. Para builds EAS, configura esa variable en el
entorno `development` de EAS. Después de cambiar la clave o el plugin, genera
otra Development Build.

```bash
npx eas-cli@latest env:set --name GOOGLE_MAPS_API_KEY --value "<TU_API_KEY>" --environment development --visibility sensitive
npx eas-cli@latest build --platform android --profile development
```

Los mapas muestran ubicaciones con `react-native-maps`; las rutas se consultan
a OSRM y no a Google Directions. La atribución de OpenStreetMap/OSRM se muestra
en la pantalla de navegación.

## Pagos y Firebase Functions

Las Functions crean el checkout de Mercado Pago, verifican la notificación del
webhook y actualizan el viaje. El efectivo se confirma por una callable
Function. Para probar estos flujos:

1. Instala las dependencias de `functions/`.
2. Guarda `MERCADO_PAGO_ACCESS_TOKEN` y `MERCADO_PAGO_WEBHOOK_SECRET` como
   secretos de Firebase, usando credenciales de prueba. La CLI solicita el
   valor de forma interactiva:

```bash
npx firebase-tools functions:secrets:set MERCADO_PAGO_ACCESS_TOKEN
npx firebase-tools functions:secrets:set MERCADO_PAGO_WEBHOOK_SECRET
```

3. Copia `functions/.env.example` a un archivo local `functions/.env.<ID_DEL_PROYECTO>`
   y configura `MERCADO_PAGO_WEBHOOK_URL` con la URL pública de
   `mercadoPagoWebhook`. Firebase Functions carga los parámetros desde archivos
   `.env.<project_ID>`; la plantilla generada está excluida de Git. Consulta la
   [guía oficial de entorno de Functions](https://firebase.google.com/docs/functions/config-env).
4. Despliega las Functions y prueba el checkout y el webhook con las cuentas de
   prueba de Mercado Pago.

La aplicación solo muestra el pago aprobado cuando el backend confirma el
resultado. No se almacenan en la app los tokens de acceso de Mercado Pago.

## Estructura del proyecto

- `src/app/`: rutas Expo Router y Stack del conductor.
- `src/screens/`: registro, acceso, revisión, inicio, solicitudes, viajes,
  ganancias, historial, perfil y configuración.
- `src/components/`: componentes reutilizables de registro, inicio y mapas.
- `src/context/`: autenticación, disponibilidad y estado/sincronización de
  viajes.
- `src/hooks/`: ubicación, solicitudes, notificaciones, rutas y ganancias.
- `src/services/`: Firebase/Firestore, Cloudinary, notificaciones, pagos y OSRM.
- `src/config/`, `src/data/`, `src/utils/`: tarifas, traducciones, datos de
  desarrollo y lógica compartida.
- `functions/`: Firebase Functions para viajes, pagos y notificaciones.
- `docs/`: documentación académica y registro de uso de IA.

## Validación

Comprobaciones estáticas disponibles:

```bash
npm run lint
npm --prefix functions run lint
```

Checklist manual recomendado —no equivale a resultados de pruebas ya
aprobadas—:

- Registro inválido/válido, carga de imágenes, aprobación y acceso del conductor.
- Disponibilidad, ubicación y recepción de una solicitud Firestore asignada.
- Aceptación, ruta a recogida, abordaje, destino y finalización.
- Pago de prueba con Mercado Pago, webhook, confirmación en efectivo e historial.
- Notificación remota en Development Build de Android.

## Registro de uso de IA

La entrega académica requiere el Markdown y su exportación PDF:

- [Bitácora editable](./docs/AI_LOG.md)
- [Bitácora en PDF](./docs/AI_LOG.pdf)

Ambos archivos conservan información pendiente de confirmación por los
integrantes; revisa las notas del registro antes de entregar.
