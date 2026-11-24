## Estado de revisión escolar — 23/11/2026

Los PR #1 y #2 de aplicación y arnés ya están integrados. Bases verificadas: producto `84e3a1b8d514d8a52162d6244d9149905872058d`, arnés `54a50eb55295f724675363812e0ad5a1f594f5eb`. La demo aplica **catorce migraciones**. Los PR [#3](https://github.com/hola0202bhola-bit/ecclesia-sistema/pull/3) y [#4](https://github.com/hola0202bhola-bit/ecclesia-sistema/pull/4) siguen abiertos en borrador, independientes y compatibles; orden preparado: #3 → #4 → correcciones adicionales. No se fusionan ni despliegan en esta revisión.

Esta corrección separa importe y detalle en la ficha, actualiza el estado documental y estabiliza la preparación de un fixture de prueba sin cambiar reglas financieras. [Alcance y validación](docs/revision-escolar-final-20261123.md). Las cifras y estados de las secciones fechadas siguientes son registros históricos de cada ejecución, no una afirmación sobre el estado remoto actual. Aceptación docente y PC previas siguen pendientes.

## 22/11/2026 — revisión PC-10 de los PR #2 (registro histórico)

Se conserva el bloqueo contando vínculos activos e históricos; una iglesia única activa no adquiere autoridad para renombrar referencias históricas ajenas. PC-10 sigue abierta. Se añade una regresión sin modificar la consulta. Ambos PR #2 existen, abiertos y en borrador; las notas anteriores sin commits/publicación son históricas. Gate conjunto aprobado: 521/521 producto, 110/110 arnés y 67 escenarios del índice, sin omisiones (12:43:57–13:33:36 -06:00; 49.65 minutos). Los 332 archivos congelados permanecieron idénticos; después solo se actualizó documentación/evidencia. [Contraste y decisión](docs/revision-pc10-pr2-20261122.md).

## 22/11/2026 — Indicaciones recientes del profesor

**Gate final del 22/11 aprobado: 520/520 producto y 110/110 arnés**, sin omisiones; cobertura de líneas 97.57%, catorce migraciones, 67 escenarios del índice y demo/reinicio verificados. [Informe](docs/informe-cumplimiento-profesor-20261122.md).

Desvinculación conservadora de sacerdotes e información funeraria pública opcional autorizada. Se conserva la identidad e historia y se bloquean vínculos en uso. Referencia pública y cotización individual privada quedan separadas. [Alcance y decisiones](docs/indicaciones-profesor-20261122.md).

## 22/11/2026 — corrección de compatibilidad de contratos

Los seis esquemas de Iglesia en ambos contratos ahora expresan las restricciones verificables de fotografía HTTPS y descripción no blanca, conservando `null` y campos opcionales. Zod permanece intacto. Gate integral del 22/11 aprobado: **504/504 producto y 108/108 arnés**, sin omisiones; Prisma, compilación y pruebas compiladas correctas. [Alcance y límites de normalización](docs/revision-compatibilidad-contratos-20261122.md).

## Ajustes escolares de ficha y criptas — rama de demostración

Descripción opcional y fotografía remota HTTPS de iglesia, con vista en directorio y ficha. Criptas explica que la administración emite cotización individual en MXN; el sistema no procesa pagos. Ver [guía escolar](docs/ajustes-demostracion-escolar.md). **No se despliega automáticamente**.

Validación del 21/11/2026: **500/500 pruebas del producto y 106/106 del arnés**, sin omitidas; cobertura de líneas **97.59%**. Gate integral con salida 0, PostgreSQL efímero y revisión de interfaz CT20 completados. [Resultados y límites](docs/estado-producto.md), [resumen verificable](docs/evidencias-escolares-20261121.json).

Con las carpetas actuales `ecclesia-sistema` y `ecclesia-arnes-codex`, instalar con `npm ci` en cada una. Desde el producto: `npm run generate`, `npm run build`, `npm test` (pipeline completo del producto) y `npm run db:demo`. Desde el arnés: `npm run check -- ../ecclesia-sistema` (gate de ambos). `npm run check` en el producto también localiza el arnés hermano; conserva compatibilidad con el nombre anterior `arnes-codex`. La demo aplica ahora catorce migraciones, con credenciales solo en `.demo`, excluida de Git. Este incremento supera la exclusión histórica de foto/descripción que aparece más abajo; las demás restricciones de Ecclesia 1.1 siguen vigentes.

## Ecclesia 1.1 — visitantes y perfiles de cuentas (rama de trabajo)

Rama `feat/ecclesia-1-1-cuentas`: autorregistro exclusivo de VISITANTE, login obligatorio al consultar directorio/API y perfil propio editable (nombre visible, presentación y avatar local). El personal conserva roles/ámbito y ve su iglesia asignada por nombre. [Recorrido y API](docs/cuentas-1-1.md), [decisiones y límites](docs/adr/011.md).

Validación completada: **491 pruebas del producto y 106 del arnés**, sin omitidas; cobertura de líneas **97.58%**. Migración nueva y repetición completa comprobadas sobre PostgreSQL efímero. [Evidencia y límites](docs/estado-producto.md).

El usuario reporta su instalación Render operativa. Esta rama no la modifica, no usa su base y no se integra en main ni se despliega. Los apartados anteriores de consulta anónima y preparación de despliegue quedan como antecedentes. Foto/descripción de iglesias, recuperación de acceso y cambio de asignaciones quedan fuera de esta etapa.

# Ecclesia — preparación Render, 19 de noviembre de 2026

Nueva etapa real: `render.yaml` prepara **API, front y admin** como tres servicios del mismo monolito modular. `scripts/render-start.mjs api|front|admin` delimita rutas; solo API aplica migraciones al arrancar, sin seed automático. Render recibe conexiones en 0.0.0.0 y usa su URL HTTPS como origen. Configuración inválida impide el arranque. Directorio público, permisos por iglesia, UI y demo CT20 conservados.

**No está desplegado.** Faltan cuenta/destino Render, base PostgreSQL vacía elegida por el usuario y orígenes reales. No se crearon recursos ni archivos en Drive. [Pasos concretos, variables, pruebas y límites](docs/despliegue-render.md). La separación es por procesos y rutas; EJS sigue usando los casos de uso del monolito, no se afirma un front independiente que consuma la API. Las instrucciones locales siguientes siguen vigentes.

## Entrega funcional anterior: 4 de noviembre de 2026

Aplicación Express/TypeScript/PostgreSQL/Prisma/EJS. La interfaz aprobada se conserva. RF04 cierre/reapertura y RF11 criterios versionados/auditados siguen disponibles; el criterio original reproduce **35.5**. Teams RF01–10 adicional continúa excluido. Las decisiones de negocio PC pendientes y la aceptación docente no se presentan como resueltas.

**RF05 geográfico tiene un avance verificable, no cobertura nacional completa:** Coordinación puede consultar/importar localidades de un municipio del snapshot cargado, revisar diferencias, confirmar y revertir con controles. Se conservan 32 estados/2478 municipios y sus fuentes originales. Seed mínimo: una localidad; demo CT20: ocho. La copia oficial nueva de Puebla contiene 144 localidades y se aplica **solo después de confirmarla**. Otros municipios requieren conexión a INEGI y padres ya cargados; no se afirma que su catálogo nacional esté actualizado.

## Instalar y demostrar sin usar una base propia

Requisitos: Node 24/npm, red para la primera instalación de paquetes/motores. Clonar como carpetas hermanas:

```powershell
git clone https://github.com/hola0202bhola-bit/ecclesia-sistema.git proyecto-ecclesia
git clone https://github.com/hola0202bhola-bit/ecclesia-arnes-codex.git arnes-codex
cd proyecto-ecclesia
npm ci
cd ../arnes-codex
npm ci
cd ../proyecto-ecclesia
npm run db:demo
```

Abrir el enlace que imprime la terminal. El comando genera Prisma, aplica once migraciones, carga CT20 y compila. **Ignora DATABASE_URL/.env del usuario** y utiliza exclusivamente su propio PostgreSQL local en .demo. No ejecutar db:seed sobre la demo. Accesos y comprobantes aleatorios: solo .demo/accesos-locales.json, excluido de Git. Detener con salir + Enter o Ctrl+C. Repetir conserva datos, credenciales y ediciones. Una demo existente aplica la migración nueva sin reemplazar sus ocho localidades ni sus 40 iglesias. [Datos y límites CT20](docs/demo-ct20.md).

Para actualizar un clon: git pull --ff-only, npm ci y npm run db:demo. Actualizar también el arnés antes de validar.

## Comprobar ambos repositorios

Desde arnes-codex:

```powershell
npm run check -- ../proyecto-ecclesia
```

El gate fija compilación estricta, arquitectura, formato/lint, contratos, pruebas con PostgreSQL efímero, cobertura, regresiones del índice Git y smoke HTTP compilado. Nunca utiliza una base ajena. [Resultado realmente ejecutado y límites](docs/estado-producto.md). No desactivar TLS ni omitir checks para publicar.

## RF05: recorrido seguro para Coordinación

Personal → **Administrar localidades INEGI**. Cargar el estado, elegir municipio y fuente: servicio oficial en línea o copia verificada Puebla 21114 del 4 de noviembre. Preparar vista previa no modifica localidades. Revisar URL, consulta, SHA-256, metadatos/periodos, original conservado, altas, cambios de nombre y ausencias conservadas; indicar motivo y confirmar. Las nuevas localidades aparecen en el selector de registro de iglesias.

El servidor construye una URL fija de gaia.inegi.org.mx; no recibe URLs ni filas editables del navegador. Rechaza redirecciones, errores remotos, duplicados, conteos/jerarquías incompatibles, estatus no activo y respuestas excesivas. Límites por consulta: 5000 registros, 8 MiB y 15 segundos. Fecha de consulta **no es fecha de corte**: esta respuesta informa Censo 2020 y periodos 2015-06-01/2017-02-28. [Documentación oficial INEGI](https://www.inegi.org.mx/servicios/catalogounico.html); original/manifest/hash en prisma/fuentes/rf05. No se descarga al arrancar.

Si la red utiliza certificados confiables de Windows que Node no carga por defecto, iniciar en una terminal con `NODE_USE_SYSTEM_CA=1` (PowerShell: `$env:NODE_USE_SYSTEM_CA='1'`, después `npm run db:demo`). La consulta compilada se comprobó con el almacén del sistema; no desactivar TLS ni aceptar certificados desconocidos. La copia Puebla funciona sin conexión al proveedor.

La confirmación compara el catálogo con la vista previa bajo bloqueo/transacción. Si cambió responde 409 y exige consultar de nuevo. Repetir una confirmación aplicada no duplica. Conserva claves, iglesias y localidades ausentes; no transforma equivalencias/bajas ni inventa municipios. Cambios de nombre conservan valores previos y originales. Revertir exige orden inverso y catálogo intacto: restaura nombres/procedencia y retira altas sin uso. **Si una localidad nueva tiene iglesias, incluso cerradas, bloquea toda la reversión**, sin borrar historia ni reasignar iglesias. UI y API exigen COORDINACION; cookies con Origin/CSRF, EJS escapado y CSP local existentes.

El historial lista las últimas 20 consultas; los detalles/originales anteriores siguen accesibles por su id. PC01 (versión/acuerdo de actualización), PC22 (otros catálogos), equivalencias/bajas y cobertura nacional quedan abiertos. La migración añade FK Localidad→Municipio: si una instalación anterior contiene huérfanos, falla sin inventar padres; revisar sus claves contra fuentes oficiales antes de reintentar. Las diez migraciones anteriores permanecen intactas.

| API /api/v1/catalogos/importaciones-localidades | Uso (solo Coordinación)                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| GET /                                           | Últimas 20 consultas, sin original                                              |
| POST /                                          | JSON estadoClave, municipioClave, origen INEGI o SNAPSHOT; prepara vista previa |
| GET /:id y GET /:id/original                    | Procedencia/diferencias e historial; JSON original separado                     |
| POST /:id/aplicar y POST /:id/revertir          | JSON motivo de 5–500 caracteres; sesión/bearer real                             |

Contrato completo y resto de API: [OpenAPI](openapi.yaml) y [subconjunto implementado](docs/api-referencia-revision03.json). [Brechas vigentes](docs/brechas-obligatorias.md).

## Guion breve para la demostración

1. Mostrar directorio Puebla/Tlaxcala/Veracruz y ficha: ubicación, patrimonio, servicios/pláticas, próximas misas y espacios. Los datos son ficticios.
2. Abrir patrimonio y ranking; explicar que caso-v1 conserva la fórmula exacta 35.5 y que se excluyen iglesias cerradas.
3. Entrar como Coordinación de la demo → localidades → Puebla 21114 → copia verificada → revisar 143 altas/1 sin cambio → confirmar con motivo → comprobar selector. Revertir antes de registrar iglesias en esas altas si se desea regresar al fixture original.
4. Gestión de iglesias → estado e historial: cerrar/reabrir con motivo y versión, comprobar exclusión pública y conservación privada. Criterios: revisar versiones sin cambiar el criterio si no hace falta.
5. Con administrador/tesorero de la iglesia indicada en accesos-locales.json, revisar agenda, diezmos y reportes del periodo de referencia. Usar un comprobante sintético para seguimiento privado de solicitud.
6. Mostrar el gate y explicar honestamente localidades nacionales/PC y límites de despliegue pendientes. Detener la demo con salir.

## Instalación con PostgreSQL propio (alternativa explícita)

Para una base vacía propia: npm ci, npm run generate, copiar .env.example a .env y configurar DATABASE_URL/JWT_SECRET aleatorio de al menos 32 bytes/APP_ORIGIN. Ejecutar npm run db:migrate, npm run db:seed, npm run build, npm run db:coordinacion (solo primera cuenta, sin claves por defecto), npm start. No usar estos comandos sobre la demo. El servidor enlaza 127.0.0.1; HTTPS, carga nacional y móvil físico no se acreditan. [Identidad y permisos](docs/adr/006.md).

Los apartados históricos siguientes describen revisiones anteriores; para el estado actual prevalecen este inicio, estado-producto y brechas-obligatorias.

## Antecedente íntegro: README de R1/R2/R3

El texto siguiente describe aquella revisión. Sus restricciones de alcance y ausencia de login fueron superadas por el incremento actual; se conserva para trazabilidad.

# Proyecto Ecclesia — Fase 0, correcciones R1/R2/R3

Fase 0 abierta. Único incremento de producto: Iglesias mínimo de referencia. Revisión 02 preservada como antecedente; no iniciar Fase 1. El alumno confirmó Express + TypeScript + PostgreSQL + Prisma, EJS, Vitest/Supertest y Codex como IA principal en esta revisión. No hay respuestas nuevas ni validación docente.

Estado publicado, SHA base y límites H01/H02/H08/H09: [repositorios](docs/repositorios-revision03.md). Correcciones y resultados ejecutados: [revisión 04](docs/correcciones-r1-r3.md).

Leer docs/decisiones-pc-revision03.md, docs/consultas-docente-revision03.md y docs/referencia-iglesias-revision03.md. Documentos revisión01/02 conservados son historial; las vistas revision03 prevalecen cuando difieran. RF/RN originales y fuentes no se reescriben como aprobados.

## Instalar y comprobar

Requiere Node 24 y npm. Clonar como directorios hermanos `proyecto-ecclesia` y `arnes-codex`, con esos nombres locales, siguiendo los [comandos Windows](docs/repositorios-revision03.md). `.gitattributes` conserva LF en texto incluso con `core.autocrlf=true` y preserva binarios. Los locks fijan dependencias exactas. PostgreSQL de prueba se descarga como dependencia de desarrollo de plataforma; primera instalación necesita red y espacio, y la primera verificación puede necesitar descarga del motor Prisma. No desactivar validación TLS. En redes con CA corporativa usar la CA del sistema solo si corresponde.

Desde proyecto-ecclesia:

```text
npm ci
npm run generate
npm run build
```

Desde arnes-codex:

```text
npm ci
npm run check -- ../proyecto-ecclesia
```

El check ejecuta arnés, contrato, inventario completo de fuentes/arquitectura y pipeline real de producto con BD aislada. npm test en proyecto ejecuta las pruebas/BD desde el arnés hermano, tras generar el cliente. No requiere configurar DATABASE_URL para pruebas. Los secretos efímeros no se imprimen ni se guardan en evidencias. Los logs de pruebas contienen solo datos ficticios y puertos locales.

## Ejecutar la referencia local

Crear una BD vacía propia para la referencia en PostgreSQL. Copiar .env.example a .env y completar allí credenciales y secreto JWT aleatorio de al menos 32 bytes. No compartirlos ni versionarlos. DATABASE_URL del ejemplo es un marcador, no una credencial útil.

```text
npm run generate
npm run db:migrate
npm run db:seed
npm run build
npm start
```

Abrir http://127.0.0.1:3000/iglesias y consultar estado 21. API: /api/v1/iglesias?estadoClave=21. Datos ficticios: una iglesia, una localidad oficial y seis tipos. No es el seed final de 40 iglesias/catálogos nacionales. No hay login ni cuentas iniciales; escrituras requieren principal firmado de emisor externo confiable. Para demostrar permisos usar pruebas, no inventar usuarios de producción.

Reapertura/cierre y gestión de cerradas devuelven bloqueo explícito hasta aclaración PC-04. RF-02 integrado con patrimonio/servicios/agenda sigue pendiente; no se devuelve colección vacía como si esos módulos existieran. El contrato general openapi.yaml conserva diseño de otros dominios y marca disponibilidad por operación. docs/api-referencia-revision03.json es el subconjunto ejecutable.

## Revisión y repositorios

H09 publicación: dos repositorios reales verificados en los SHA base enlazados arriba. H09 historial desde semana 1: residual académico pendiente; los commits de importación no lo prueban. Las notas antiguas se conservan como antecedentes. Revisión humana del código, validación del cliente, respuestas a ocho grupos, aceptación del perfil PC-02 y requisitos académicos adicionales siguen pendientes. Consultar [evidencias disponibles y procedencia](docs/evidencias-revision04/README.md). Los archivos externos del antiguo paquete no son dependencias de estos repositorios.
