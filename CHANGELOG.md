## 4 de noviembre de 2026 — RF05 geográfico seguro

Importación oficial por municipio exclusiva de Coordinación, vista previa de diferencias, confirmación idempotente por huella y auditoría/original SHA-256. Reversión sin referencias destruidas, ausencias conservadas y seed que no deshace versiones ya cargadas. FK Localidad→Municipio en undécima migración aditiva; copia original Puebla 144 localidades, sin afirmar cobertura nacional. API/EJS coherentes con seguridad existente, UI aprobada conservada. README concentra comandos y guion; regresiones producto/arnés ampliadas. Ver estado-producto para resultados finales.

## Incremento final — UI / RF04 / RF11

- Sistema visual local compartido, directorio, navegación, panel y formularios; responsive y tablas desplazables, foco/etiquetas/semántica.
- Cierre/reapertura propios con historial, control de concurrencia y preservación; gestión privada de cerradas.
- Criterios inmutables configurables por Coordinación, activación atómica y lectura por cálculo/ranking. Nueva migración aditiva y suite real; criterios caso-v1 y 35.5 conservados.
- RF05 nacional, validación de PC04/08 y Teams adicional siguen pendientes/excluidos.

## CT20 y ficha integrada — 2026-11-03

Comando db:demo con PostgreSQL local propio, carga sintética reproducible/atómica/idempotente, credenciales generadas y fuentes INEGI verificadas para ocho municipios/tres estados. Mínimos completos del flujo implementado, prueba de relaciones y aislamiento en una segunda base efímera; migración CargaDemo aditiva. Ficha web compone resúmenes públicos de los módulos existentes y conserva enlaces completos. [Uso](docs/demo-ct20.md), [brechas RF pendientes](docs/brechas-obligatorias.md), [validación real](docs/estado-producto.md).

## RF25–31 — 2026-11-03

Oferta funeraria por iglesia sin precios públicos, solicitud sin cuenta con folio/clave hash, seguimiento privado con límites persistentes y CSRF, revisión individual, precio exacto/condiciones y estados con versión/auditoría/vencimiento controlado. Se añade migración aditiva, seis vistas, navegación y octava suite PostgreSQL/HTTP. [Supuestos y pendientes ADR010](docs/adr/010.md).

## 0.8.0 — 2026-11-03

RF22–24: diezmo único por misa celebrada, tesorero propio, correcciones con versión e historial atómico, reportes privados de centavos exactos por periodo/horario/padre real y vistas EJS. Migración aditiva, séptima suite PostgreSQL y controles contables en el arnés. PC-13/19 y límites: ADR009; Teams provisional sin implementar.

## 2026-11-03 — Sacerdotes y agenda RF16–21

Identidad de sacerdote compartida entre iglesias, horarios con vigencia local, validación de traslapes por instantes y concurrencia, agenda semanal interna, consulta pública y hechos con sustitución trazable. Migración aditiva, Zod, EJS, sesiones/CSRF y auditoría. [Subalcance y pendientes PC10–12](docs/adr/008.md). Teams provisional no implementado.

## 0.7.0 — Servicios y pláticas, 2 de noviembre de 2026

- Alta/edición EJS/API, consultas públicas desde ficha y tipos de P078–079.
- Aportación fija/gratuita/donativo, horarios múltiples, sesiones/cupo informativos e importes exactos.
- Migración aditiva, versiones/auditoría transaccionales, aislamiento por iglesia y regresiones HTTP/PostgreSQL.
- Relación preparación–servicio, inscripción/reserva y administración general de tipos siguen pendientes. [Guía](docs/incremento-servicios.md).

# Cambios de Ecclesia

## 0.6.0 — Patrimonio e índice, 2 de noviembre de 2026

- Alta/edición y estados de piezas, UI/API y auditoría transaccional; solo administrador propio.
- Índice puro exacto 35.5, criterios iniciales persistidos, ranking geográfico y filtros AND por pieza vigente.
- Migración aditiva, Zod, sesiones/CSRF, escapes y conflictos de versión; se conservan regresiones anteriores.
- RF11 configuración/activación, reactivación, políticas residuales y datos finales pendientes. Sin nuevas localidades ni dependencias. [Alcance](docs/incremento-patrimonio.md).

## 0.5.0 — Iglesias web y catálogos, 1 de noviembre de 2026

- Listado, alta/edición EJS con roles existentes, CSRF, Zod y conflicto de versión sin sobrescribir ni perder campos.
- Selectores y consulta API paginada: 32 estados, 2,478 municipios del snapshot oficial, una localidad y seis tipos del caso. Fuentes originales con URL/fecha/hash.
- Importación atómica/versionada e idempotente, migración aditiva y regresiones HTTP+PostgreSQL. Sin cambios de dependencias.
- Localidades nacionales, ficha integrada y cierre/reapertura pendientes. [Estado y resultados](docs/estado-producto.md).

## 0.4.0 — Identidad mínima, 1 de noviembre de 2026

- Login/logout, perfil, cuentas y sesiones PostgreSQL; bcrypt 12, JWT 1h revocable y permisos actuales desde BD.
- Alta/listado paginado de usuarios por Coordinación, entrada/panel/formularios web con CSRF y provisión inicial explícita sin credenciales predeterminadas.
- Mantiene Iglesias y agrega pruebas de integración de identidad; contratos, matriz breve, ADR 006 y reglas del arnés actualizados. Los antecedentes de Fase 0 se conservan sin bloquear desarrollo autorizado.
- Dependencia nueva fijada: bcryptjs 3.0.3 para cumplir P130. No se aplica actualización masiva ni audit fix --force.

Resultados y límites: [evidencia de identidad](docs/evidencia-identidad.md).

## R1/R2/R3 — 1 de noviembre de 2026

- Búsqueda parcial literal del nombre: escape de barra, porcentaje y guion bajo en el adaptador Prisma/PostgreSQL; conserva normalización, parámetros, filtros, conteo, orden y páginas. Se incorporan 13 regresiones a las 57 pruebas originales.
- Atributos de Git para LF en texto nuevo/actualizado y conservación binaria; los antecedentes con CRLF almacenados en la base conservan sus bytes para evitar una normalización masiva.
- Estado de los dos repositorios realmente publicados y sus SHA base; README/AGENTS/trazabilidad y evidencias con procedencia explícita. Se mantienen historia, PC y límites de aceptación.

Comandos y resultados ejecutados: [evidencias revisión 04](docs/evidencias-revision04/README.md). Fase 0 abierta, H01 pendiente, H02 aceptación pendiente, H08 parcial, H09 historial residual. No se inicia Fase 1 ni se actualizan dependencias por R4.

## Antecedentes

Los commits base de importación y los registros de revisión 01/02/03 se conservan en Git y en la [bitácora](docs/bitacora-ia.md). Este archivo no reconstruye fechas anteriores ni atribuye aprobaciones humanas.
