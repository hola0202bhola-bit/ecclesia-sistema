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
