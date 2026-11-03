Incremento RF22–24: `src/modules/diezmos/{domain,application,presentation,infrastructure}`, composición y EJS. Dominio bigint puro; infraestructura PostgreSQL/Prisma, FK compuestas, bloqueo de Iglesia y auditoría con versión en una transacción. Lectura consistente RepeatableRead del reporte/ficha, sin dependencia hacia módulos vecinos. [ADR009](adr/009.md) documenta el subalcance y supersede únicamente los antecedentes de diezmos como diseño futuro.

Agenda RF16–21: src/modules/agenda por cuatro capas y composición, sin imports entre módulos. Horarios locales con vigencia materializada como instantes, reservas y hechos separados, FK/CHECK y auditoría transaccional. [ADR 008](adr/008.md) define subalcance y PC pendientes; las ausencias históricas de agenda siguientes no describen este incremento.

Incremento servicios/pláticas: módulo por capas en `src/modules/servicios`; horarios y auditoría transaccionales, consultas paginadas y EJS con las sesiones existentes. [ADR 007](adr/007.md) y [guía](incremento-servicios.md). Las ausencias de este módulo mencionadas en antecedentes quedan superadas para RF13–15 informativos.

# Arquitectura vigente — revisión 03

Incremento patrimonio: `src/modules/patrimonio/{domain,application,presentation,infrastructure}` y composición. Dominio contiene cálculo puro/reglas; repositorio Prisma obtiene criterios/objetos en snapshot y escribe cambios+auditoría atómicamente. Router valida DTO Zod y renderiza EJS con sesiones/CSRF existentes. Sin imports entre módulos. [Reglas y límites](incremento-patrimonio.md). Los párrafos históricos de “patrimonio no implementado” que siguen quedan sustituidos para este alcance.

Incremento Iglesias web/catálogos: puerto y servicio de consulta en Iglesias, adaptador Prisma y router público paginado; gestión EJS usa el mismo servicio autorizado de la API. Infraestructura valida fuentes INEGI locales antes de importar estados/municipios/localidad y manifest en una transacción. Tablas Estado, Municipio y CatalogoVersion en migración aditiva. Presentación no importa ORM ni infraestructura. [Alcance vigente](estado-producto.md).

Actualización del incremento Identidad: [ADR 006](adr/006.md). `src/modules/identidad` tiene dominio/puertos, servicio, DTO/router y adaptadores bcrypt/JWT/Prisma. Un `Principal` compartido en `shared/domain` evita cruces entre módulos; composition conecta el middleware de sesiones con Iglesias. Nuevas tablas Usuario/Sesion en migración aditiva. Login/API y vistas EJS pasan por el servicio; autorización por rol/ámbito se obtiene desde BD, sesiones expiran y logout las revoca. La descripción revisión03 que sigue es antecedente y no describe la ausencia actual de login.

1 de noviembre de 2026, America/Mexico_City. Selección de stack/IA confirmada por el alumno; no validación del cliente. Monolito modular por capas. Solo Iglesias implementado; demás dominios permanecen diseño. Express/TypeScript + PostgreSQL/Prisma + EJS, Zod, Vitest/Supertest. Versiones exactas y Node 24 en package-lock.json/package.json; Prisma 7.10.1 estable fijado frente a latest 8 RC observado, sin adoptar RC de ORM. El paquete de PostgreSQL embebido de pruebas tiene etiqueta beta; el servidor que ejecuta informa PostgreSQL 18.6, no emulación.

~~~mermaid
flowchart LR
  HTTP[Express / DTO Zod / EJS] --> APP[Servicio Iglesias]
  APP --> D[Dominio y puerto]
  INF[Adaptador Prisma] --> D
  INF --> PG[(PostgreSQL)]
  C[Composición] --> HTTP
  C --> APP
  C --> INF
~~~

domain solo depende de domain; application de domain/application; presentation de application/domain/presentation, nunca ORM; infrastructure de domain/infrastructure, nunca controlador/aplicación; composition construye todo y no recibe imports desde capas inferiores. shared no depende de módulos. Cruces entre módulos prohibidos salvo contrato y excepción revisados. dependency-cruiser inventaría independientemente todas las fuentes TS y comprueba resolución, tipos, ciclos y reglas.

Estructura real: src/modules/iglesias/{domain,application,presentation,infrastructure}; src/composition/{app,server}.ts; src/shared/infrastructure/personal-jwt.ts; prisma/schema.prisma y migrations; tests/iglesias.test.ts; views EJS. Catálogos mínimos son tablas auxiliares de persistencia del módulo, no un módulo Catálogos completo. Las vistas usan casos de uso, nunca Prisma. El controlador no contiene reglas de permisos/publicación/concurrencia.

JWT HS256 verificado para un emisor externo de confianza, con exp/issuer/audience; no hay identidad/login/bootstrap. Roles/ámbito mínimo P092/P093; PC-19 sigue para ampliaciones. Cierre/reapertura/gestión de cerradas bloqueados PC-04. Perfil mínimo de campos PC-02 es supuesto explícito de referencia. FK y CHECK en BD; edición con comparación de versión/incremento atómicos. Consulta paginada lee filas/total en snapshot repetible.

Pipeline del arnés fija comandos de compilación, lint/formato, pruebas con PostgreSQL aislado y reporte/umbrales. No toma un script test de package.json como evidencia. Materialización del índice mantiene blobs exactos y lock propio sin enlazar node_modules de copia de trabajo; npm ci offline --ignore-scripts prepara dependencias, fallando si falta caché. Generación Prisma y rehidratación del paquete PostgreSQL ocurren en snapshot, no cambian archivos del alumno. Mantener separados artefactos generados y fuentes.

Patrimonio puro/decimal/referencia temporal, agenda por instantes/zona y solicitudes con hash/15 días siguen decisiones de diseño en ADR 004–005 y documentos históricos. No están implementados. No se presume que aprobar stack apruebe autenticación completa, perfil de datos o políticas de negocio. Cobertura medida solo del mínimo de Iglesias; server.ts fuera de instrumentación, arranque verificado aparte. No hay medición de carga, aceptación móvil o portabilidad académica.
