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
