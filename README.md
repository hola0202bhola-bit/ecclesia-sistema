# Proyecto Ecclesia — Fase 0, correcciones R1/R2/R3

Fase 0 abierta. Único incremento de producto: Iglesias mínimo de referencia. Revisión 02 preservada como antecedente; no iniciar Fase 1. El alumno confirmó Express + TypeScript + PostgreSQL + Prisma, EJS, Vitest/Supertest y Codex como IA principal en esta revisión. No hay respuestas nuevas ni validación docente.

Estado publicado, SHA base y límites H01/H02/H08/H09: [repositorios](docs/repositorios-revision03.md). Correcciones y resultados ejecutados: [revisión 04](docs/correcciones-r1-r3.md).

Leer docs/decisiones-pc-revision03.md, docs/consultas-docente-revision03.md y docs/referencia-iglesias-revision03.md. Documentos revisión01/02 conservados son historial; las vistas revision03 prevalecen cuando difieran. RF/RN originales y fuentes no se reescriben como aprobados.

## Instalar y comprobar

Requiere Node 24 y npm. Clonar como directorios hermanos `proyecto-ecclesia` y `arnes-codex`, con esos nombres locales, siguiendo los [comandos Windows](docs/repositorios-revision03.md). `.gitattributes` conserva LF en texto incluso con `core.autocrlf=true` y preserva binarios. Los locks fijan dependencias exactas. PostgreSQL de prueba se descarga como dependencia de desarrollo de plataforma; primera instalación necesita red y espacio, y la primera verificación puede necesitar descarga del motor Prisma. No desactivar validación TLS. En redes con CA corporativa usar la CA del sistema solo si corresponde.

Desde proyecto-ecclesia:

~~~text
npm ci
npm run generate
npm run build
~~~

Desde arnes-codex:

~~~text
npm ci
npm run check -- ../proyecto-ecclesia
~~~

El check ejecuta arnés, contrato, inventario completo de fuentes/arquitectura y pipeline real de producto con BD aislada. npm test en proyecto ejecuta las pruebas/BD desde el arnés hermano, tras generar el cliente. No requiere configurar DATABASE_URL para pruebas. Los secretos efímeros no se imprimen ni se guardan en evidencias. Los logs de pruebas contienen solo datos ficticios y puertos locales.

## Ejecutar la referencia local

Crear una BD vacía propia para la referencia en PostgreSQL. Copiar .env.example a .env y completar allí credenciales y secreto JWT aleatorio de al menos 32 bytes. No compartirlos ni versionarlos. DATABASE_URL del ejemplo es un marcador, no una credencial útil.

~~~text
npm run generate
npm run db:migrate
npm run db:seed
npm run build
npm start
~~~

Abrir http://127.0.0.1:3000/iglesias y consultar estado 21. API: /api/v1/iglesias?estadoClave=21. Datos ficticios: una iglesia, una localidad oficial y seis tipos. No es el seed final de 40 iglesias/catálogos nacionales. No hay login ni cuentas iniciales; escrituras requieren principal firmado de emisor externo confiable. Para demostrar permisos usar pruebas, no inventar usuarios de producción.

Reapertura/cierre y gestión de cerradas devuelven bloqueo explícito hasta aclaración PC-04. RF-02 integrado con patrimonio/servicios/agenda sigue pendiente; no se devuelve colección vacía como si esos módulos existieran. El contrato general openapi.yaml conserva diseño de otros dominios y marca disponibilidad por operación. docs/api-referencia-revision03.json es el subconjunto ejecutable.

## Revisión y repositorios

H09 publicación: dos repositorios reales verificados en los SHA base enlazados arriba. H09 historial desde semana 1: residual académico pendiente; los commits de importación no lo prueban. Las notas antiguas se conservan como antecedentes. Revisión humana del código, validación del cliente, respuestas a ocho grupos, aceptación del perfil PC-02 y requisitos académicos adicionales siguen pendientes. Consultar [evidencias disponibles y procedencia](docs/evidencias-revision04/README.md). Los archivos externos del antiguo paquete no son dependencias de estos repositorios.
