# Ecclesia — entrega del 4 de noviembre de 2026

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
