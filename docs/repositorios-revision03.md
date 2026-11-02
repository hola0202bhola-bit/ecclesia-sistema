# Repositorios y límites de Fase 0

## Estado vigente — correcciones R1/R2/R3

1 de noviembre de 2026, America/Mexico_City. Fase 0 abierta; no se inició Fase 1. El alumno autorizó corregir R1/R2/R3, crear commits nuevos e intentar publicarlos sin forzar historia. Esta autorización no es aceptación detallada del módulo ni aprobación del profesor.

| Repositorio publicado / rama main | Commit base comprobado por clonación Git |
| --- | --- |
| [ecclesia-sistema](https://github.com/hola0202bhola-bit/ecclesia-sistema) | `fb3ffc78affdad76ae61b1d5eda7a6694dc5d0b3` |
| [ecclesia-arnes-codex](https://github.com/hola0202bhola-bit/ecclesia-arnes-codex) | `3d107dab51140b23c594d7da73e5ba9ca82bef7f` |

Estos SHA identifican la publicación inicial real, no el resultado de subir las correcciones. El registro de esta ejecución y sus límites está en [evidencias de revisión 04](evidencias-revision04/README.md). Los commits nuevos deben contrastarse con GitHub mediante `git ls-remote origin refs/heads/main`; un commit local o un bundle no acredita publicación.

| Hallazgo | Estado vigente y límite |
| --- | --- |
| H01 | Abierto: faltan respuestas reales del cliente y validación de requisitos. El cuestionario reducido conserva G1–G8 y PC; no hay aprobación docente. |
| H02 | Núcleo técnico de referencia demostrado; aceptación pendiente del perfil PC02, límites PC04/19, revisión humana/comprensión del alumno y suficiencia académica P154. Herramientas en verde no lo cierran. |
| H08 | Parcial: DTO/FK/CHECK reales en Iglesias; nulabilidad, eliminación de opcionales, fechas/contacto y semántica de futuros dominios siguen pendientes. R1 corrige la semántica literal del filtro, sin resolver esas políticas. |
| H09 publicación | Cerrado para los dos commits base: repositorios reales clonados desde GitHub. Los registros antiguos de “no publicado” describen su momento. |
| H09 historial | Residual pendiente: los commits de importación del 1 de noviembre no acreditan historia desde semana 1 (P056). No se inventan retrofechas ni se presume dispensa docente. |

El alcance continúa siendo Iglesias mínimo. RF02 integrado, cierre/reapertura, identidad completa, patrimonio, agenda, finanzas y solicitudes no se declaran terminados. Las [decisiones PC](decisiones-pc-revision03.md) y [consultas docentes](consultas-docente-revision03.md) conservan sus pendientes.

## Reproducir desde GitHub en Windows

Clonar en una carpeta nueva, sin repositorios previos con esos nombres. Los nombres locales son necesarios para los scripts hermanos; los nombres publicados son distintos.

```powershell
git -c core.autocrlf=true clone https://github.com/hola0202bhola-bit/ecclesia-sistema.git proyecto-ecclesia
git -c core.autocrlf=true clone https://github.com/hola0202bhola-bit/ecclesia-arnes-codex.git arnes-codex
cd proyecto-ecclesia
npm ci
npm run generate
cd ../arnes-codex
npm ci
npm run check -- ../proyecto-ecclesia
node scripts/install-hook.mjs ../proyecto-ecclesia
cd ../proyecto-ecclesia
git hook run pre-commit
```

`.gitattributes` fija LF para texto nuevo/actualizado y preserva binarios aun con `core.autocrlf=true`. Comprobar `git ls-files --eol`: fuentes, scripts y documentación vigente deben mostrar `i/lf w/lf`; los PNG no son texto. Existen documentos/logs históricos con CRLF o mezcla ya almacenados en la base: Git conserva esos blobs y su checkout; no son conversiones nuevas del clon. No ejecutar normalización masiva para ocultar cambios. La prueba Windows enumera estas excepciones históricas y coteja sus bytes.

En clones anteriores, guardar primero trabajo propio y revisar `git status`. La opción más segura es clonar en otra carpeta y trasladar cambios revisados. No usar `reset --hard` ni restaurar todos los archivos sobre trabajo pendiente. Antes de normalizar un índice existente, revisar archivo por archivo cualquier diff: esta corrección solo añade atributos y conserva los blobs previos.

El hook es local y Git no lo instala al clonar. Cambiar el arnés exige revisar el diff, repetir el gate y refrescar explícitamente con `node scripts/install-hook.mjs ../proyecto-ecclesia --refresh`. No sobrescribir hooks ajenos ni omitir el gate. Los commits asistidos incluyen `Asistido-por: Codex`.

## Registro histórico íntegro — preparación de revisión 03

El texto siguiente describe la preparación anterior a la publicación. Se conserva por trazabilidad y queda superado únicamente en el estado de publicación por la tabla vigente.

# H09 — dos repositorios preparados, sin crear/publicar

1 de noviembre de 2026, America/Mexico_City. Esta revisión NO crea repositorios locales de entrega ni remotos, NO publica, NO hace commits ni simula semanas previas. Solo los tests crean Git temporales desechables, sin commits; no cuentan para H09.

Estructura preparada: proyecto-ecclesia y arnes-codex, cada uno con README, .gitignore y lock. El arnés se clona como hermano; su ruta queda fijada al instalar hook mediante fingerprint. Al modificarlo legítimamente revisar check y reinstalar explícitamente el hook. Referencias a fuentes/evidencias de entrega no se confunden con archivos necesarios de runtime.

Requisitos antes de crear: autorización expresa del alumno para crear/publicar, cuenta/organización, nombres, visibilidad, licencia si aplica, conexión GitHub con capacidad de creación o Git/gh autenticados, exclusión de .env/dependencias/coverage/dist/evidence y revisión humana del código/evidencias. Nunca pedir contraseñas/tokens en chat.

Pasos cuando se autorice, sin ejecutar ahora:

1. Extraer proyecto-ecclesia y arnes-codex a carpetas hermanas fuera de otro repositorio. Revisar git status y confirmar que cada raíz sea independiente.
2. Instalar ambos locks, generar cliente y ejecutar check. Registrar resultado y revisar diff/lista de archivos sin secretos.
3. Inicializar cada Git por separado con rama main. En proyecto instalar el hook: node ../arnes-codex/scripts/install-hook.mjs .; preparar cambios y ejecutar git hook run pre-commit. No omitir el gate por falta de caché.
4. Revisión humana y primer commit con fecha actual y descripción real, terminando Asistido-por: Codex si incluye asistencia. No retrofechar ni fraccionar artificialmente historial ya hecho.
5. Crear dos remotos con visibilidad acordada usando herramienta disponible/autorizada; agregar origin y publicar main. Registrar URLs reales y SHA de commits revisados en este documento, todavía vacíos.
6. Clonar ambos en directorio nuevo y repetir instalación/check/hook. Medir tiempo/prerrequisitos solo si se ejecuta. Esto tampoco sustituye la portabilidad académica a otro dominio/video.

Registro actual: URL proyecto pendiente; URL arnés pendiente; historial real no acreditado; autorización de publicación no recibida. Si las herramientas no permiten crear repositorios, preparar ambos localmente tras autorización y dejar publicación manual documentada. No confundir plan con ejecución.

Capacidad observada en esta sesión: Git local disponible; gh no aparece como comando instalado. Las herramientas GitHub visibles permiten archivos/PR/lectura de repositorios pero no muestran una operación de creación de repositorio. No se probó publicar ni se inspeccionaron credenciales. Tras autorización, confirmar herramienta/conexión o crear los remotos desde la interfaz de GitHub; no prometer una publicación automática con la capacidad actual.
