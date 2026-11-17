# Bitácora de uso de IA

### Entrada #1

- Fecha: 2026-11-15
- Integrante: Santiago Muñoz
- Herramienta: Copilot SDK en VS Code
- Objetivo: Analizar y completar los componentes centrales del taller de la versión conductor.
- Prompt: "necesito que me ayudes a terminar el taller con los componentes central del taller"
- Resumen de la respuesta: Se revisaron los requisitos del taller y la implementación existente. Se añadieron cálculo de tarifas, sincronización de viajes y disponibilidad con Firestore, ubicación con Expo Location y un backend de pagos con Mercado Pago mediante Firebase Functions.
- Qué se usó / modificó / descartó: Se usó la estructura propuesta y se adaptó al código existente. No se incluyeron credenciales reales ni se simuló un despliegue.
- Archivos y commit: Pendiente de commit por parte del equipo.
- Verificación: `npx expo lint`, compilación web con `npx expo export --platform web` y lint de `functions`.
- Aprendizaje: Las llaves privadas deben permanecer en Firebase Functions y el conductor debe escuchar el documento del viaje para reflejar el resultado del webhook.

### Nota de trazabilidad de la entrada #1

- La fecha, el prompt y la descripción de uso de Copilot anteriores se conservan como información declarada en el registro original. No hay exportación de la conversación, enlace ni otro artefacto en el repositorio que permita corroborarlos de forma independiente.
- El registro original denomina la herramienta «Copilot SDK en VS Code». Santiago debe confirmar que esa denominación corresponde a GitHub Copilot, como pide el cierre académico, y no a otro producto de Copilot.
- El texto original indicaba que el commit estaba pendiente. El historial actual sí contiene el commit `96d5792` (`Implementa seguridad y flujos de viajes y pagos`, 2026-11-16), cuyo autor Git es Santiago Muñoz y que incluye cambios, entre otros, en `src/config/pricing.js`, `src/context/DriverTripContext.js`, `src/context/DriverAvailabilityContext.js`, `src/hooks/useDriverLocation.js`, `src/services/tripService.js`, `src/services/paymentService.js`, `functions/index.js` y `firestore.rules`. Esto verifica que esos archivos están en el commit, pero no identifica cuáles sugerencias concretas provinieron de Copilot ni quién revisó cada cambio.
- `npx expo lint`, `npx expo export --platform web` y `npx eslint .` dentro de `functions` aparecen como verificaciones declaradas en la entrada original. No se encontraron resultados o registros que permitan confirmarlas en esta revisión.
- El aprendizaje de la entrada #1 permanece como declaración del registro original; Santiago debe confirmar que refleja su aprendizaje personal.

### Entrada #2

- Fecha: 2026-11-16
- Integrante: Santiago Muñoz (integrante indicado por la sesión de trabajo; confirmar nombre completo para la entrega)
- Herramienta: OpenAI Codex en el entorno de desarrollo
- Objetivo: Contrastar los requisitos académicos de la bitácora de IA contra el repositorio y registrar de forma trazable la revisión documental.
- Prompt completo:

```text
Vamos a trabajar en el cierre de los requisitos académicos del proyecto UberClone.

**Primera tarea: revisar y completar el registro de uso de inteligencia artificial (`docs/AI_LOG.md`).**

**Antes de modificar cualquier archivo, realiza lo siguiente:**

1. Revisa el documento de requisitos académicos del proyecto, si está disponible en el repositorio.
2. Inspecciona el archivo `docs/AI_LOG.md` y cualquier otro registro de IA existente.
3. Revisa el README y el historial de Git para identificar actividades y archivos relacionados con el desarrollo.
4. Identifica qué información exige exactamente la entrega académica para el registro de IA.

**Criterios para elaborar el registro:**

- Documentar de manera transparente el uso de GitHub Copilot durante el desarrollo previo.
- Documentar Codex como herramienta utilizada en las actividades que realicemos a partir de ahora.
- Describir las actividades de apoyo de IA: generación de sugerencias, análisis de código, depuración y revisión, únicamente cuando exista evidencia.
- Diferenciar claramente las sugerencias de IA del trabajo de revisión, adaptación, integración y pruebas realizado por el estudiante.
- Incluir los archivos afectados y las verificaciones realizadas cuando puedan comprobarse.
- No inventar prompts exactos, respuestas, fechas, pruebas, resultados ni intervenciones del estudiante.
- Si el requisito exige información que no se puede recuperar, señalarla claramente para que podamos completarla.

**Restricciones importantes:**

- No modifiques código fuente.
- No cambies dependencias ni configuraciones.
- No ejecutes despliegues ni operaciones sobre Firebase.
- No hagas commits ni pushes.
- No elimines información existente.
- Conserva el formato del proyecto siempre que sea posible.

**Resultado esperado:**

Primero presenta un diagnóstico de los requisitos y del estado actual del AI_LOG.md. Después, si tienes información suficiente, completa el archivo `docs/AI_LOG.md` de forma honesta y coherente con el proyecto.

Al finalizar, indícame:

1. Qué modificaste.
2. Qué información quedó pendiente.
3. Si el registro cumple los requisitos identificados.
4. Qué debo revisar personalmente antes de darlo por terminado.

No avances a ninguna otra tarea académica todavía.
```

- Resumen de la respuesta: Se revisaron las nueve páginas del PDF de requisitos, el `README.md`, el registro existente y el historial de Git. Se identificaron los campos y entregables exigidos y se añadió esta entrada junto con notas que separan lo declarado de lo que puede verificarse en el repositorio.
- Qué se usó / modificó / descartó: Se usaron el PDF provisto, el contenido existente y evidencia de Git. Se modificó únicamente `docs/AI_LOG.md`; no se cambió código, configuración ni dependencias. No se atribuyeron sugerencias o pruebas a Codex cuando no ocurrieron.
- Archivos y commit: `docs/AI_LOG.md` — cambio pendiente de commit; no se creó ningún commit.
- Verificación ejecutada: Lectura del PDF (9 páginas), del README, de los registros de IA encontrados y del historial/archivos del commit `96d5792`; búsqueda de referencias `AI-assisted` en fuentes y de archivos PDF en el repositorio; `npx expo lint` y `git diff --check` pasaron. No se ejecutaron pruebas ni despliegues. `npx tsc --noEmit` no pudo ejecutarse como comprobación porque el proyecto no tiene `tsconfig.json`.
- Aprendizaje: Pendiente de reflexión personal de Santiago; no se completa en nombre del estudiante.
- Enlace a la conversación: No disponible en el entorno de desarrollo.

## Requisitos de la bitácora y elementos pendientes

El documento académico exige registrar cada uso de IA en el momento de ocurrir y conservar el prompt literal, un resumen de 2–3 líneas, qué se usó/modificó/descartó, archivos y hash del commit, verificación y aprendizaje. También solicita, si la herramienta lo permite, un enlace a la conversación, comentarios `AI-assisted: see docs/AI_LOG.md #N` en los bloques de código asistidos, el archivo en la rama `main` y una exportación PDF para la entrega.

En la revisión inicial no se encontró un PDF de la bitácora ni comentarios `AI-assisted` en `src` o `functions`. Posteriormente se generó el PDF en `docs/AI_LOG.pdf`; el README enlaza ambas versiones. No se añadieron comentarios al código porque aquella tarea prohibía modificarlo, así que ese requisito sigue pendiente. La bitácora no queda lista para entrega hasta resolver los pendientes enumerados aquí y en las plantillas siguientes.

## Entradas pendientes de completar

La información siguiente no se puede reconstruir de forma fiable desde el
repositorio. Cada integrante debe completar su entrada con el prompt exacto,
la fecha real, los archivos y el hash del commit correspondiente. No se deben
inventar prompts, aprobaciones, hashes ni resultados de pruebas.

La entrada #1 ya conserva el uso de Copilot declarado para Santiago y la
entrada #2 documenta esta actividad con Codex. Usa las plantillas solo para
otras sesiones de IA que aún no estén registradas o para completar datos
faltantes; no dupliques estas dos actividades.

### Entrada pendiente — Santiago Muñoz Zapata

- Fecha:
- Herramienta:
- Objetivo:
- Prompt completo:
- Resumen de la respuesta:
- Qué se usó / modificó / descartó:
- Archivos y commit:
- Verificación ejecutada:
- Aprendizaje:

### Entrada pendiente — Juan Diego Osorio Araque

- Fecha:
- Herramienta:
- Objetivo:
- Prompt completo:
- Resumen de la respuesta:
- Qué se usó / modificó / descartó:
- Archivos y commit:
- Verificación ejecutada:
- Aprendizaje:

### Aprendizaje personal

Durante el desarrollo de UberClone fortalecí mis conocimientos en React Native, Expo y Firebase, especialmente en la integración de servicios y la gestión de información en tiempo real mediante Firestore. También aprendí sobre la importancia de implementar controles de seguridad para proteger los datos de los usuarios y validar las operaciones relacionadas con los viajes y los pagos.

Comprendí que desarrollar una aplicación de este tipo requiere conectar diferentes componentes y servicios, controlar los estados de los viajes y realizar pruebas para identificar y corregir errores. La inteligencia artificial fue una herramienta de apoyo para analizar problemas, proponer soluciones y comprender mejor algunos fragmentos de código, pero también fue necesario revisar y adaptar las propuestas a la estructura del proyecto.
