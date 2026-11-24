## 23/11/2026 — tarjeta de iglesia asignada

Panel y perfil muestran etiqueta, nombre y enlace en una columna compacta y adaptable. Solo vistas/CSS; condición, escape, permisos y destino conservados. Verificación visual local en cinco anchos aprobada; gate integral aprobado: 521/521 producto, 110/110 arnés y 67 escenarios del índice, sin omisiones. Ejecución final con salida 0 (60.97 minutos); intento anterior de permisos Git separado. [Causa, alcance y evidencia](docs/correccion-tarjeta-asignada-20261122.md). Sin despliegue ni cambios en bases existentes.

## 22/11/2026 — revisión PC-10 de los PR #2

Se conserva el bloqueo contando vínculos activos e históricos; una iglesia única activa no adquiere autoridad para renombrar referencias históricas ajenas. PC-10 sigue abierta. Se añade una regresión sin modificar la consulta. Ambos PR #2 existen, abiertos y en borrador; las notas anteriores sin commits/publicación son históricas. Gate conjunto aprobado: 521/521 producto, 110/110 arnés y 67 escenarios del índice, sin omisiones (12:43:57–13:33:36 -06:00; 49.65 minutos). Los 332 archivos congelados permanecieron idénticos; después solo se actualizó documentación/evidencia. [Contraste y decisión](docs/revision-pc10-pr2-20261122.md).

## 23/11/2026 — ficha e información funeraria para revisión escolar

Ficha y página de espacios comparten responsable institucional y referencia opcional por tipo, conservando la cotización privada. Descripción/foto ya existentes se agrupan con ayuda accesible; diseño responsive y saltos de línea de la descripción. Se retira del formulario el aviso obsoleto de cierre/reapertura no implementados, sin cambiar esa función ni cerrar PC04. Cuatro regresiones nuevas y privacidad de ficha reforzada. Sin migraciones ni cambios del arnés. Gate íntegro aprobado: 525/525 producto y 110/110 arnés, índice y arquitectura correctos, 25 combinaciones responsive; [alcance y resultados](docs/ficha-tramites-escolares-20261123.md).

## 22/11/2026 — Indicaciones recientes del profesor

**Gate final del 22/11 aprobado: 520/520 producto y 110/110 arnés**, sin omisiones; cobertura de líneas 97.57%, catorce migraciones, 67 escenarios del índice y demo/reinicio verificados. [Informe](docs/informe-cumplimiento-profesor-20261122.md).

Retirada lógica/versionada de asignaciones con motivo/auditoría y mutex, API/EJS y bloqueo de programación/hechos. Responsable institucional y costo público de referencia opcionales por oferta; centavos exactos, cotización privada intacta. Migración 14 aditiva y nuevas regresiones sin quitar pruebas. [Alcance y decisiones](docs/indicaciones-profesor-20261122.md).

## 22 de noviembre de 2026 — corrección R-01 de contratos

Seis esquemas de Iglesia en OpenAPI y subconjunto de referencia validan HTTPS, sintaxis DNS/puerto, ausencia de userinfo y fragmentos, sufijos locales y descripción con al menos un carácter no blanco. Se conserva `null`, omisión y validación Zod sin cambios. Cuatro casos de correspondencia Ajv/Zod en el producto y dos del arnés, sin quitar pruebas. Límites de WHATWG/IDNA, trim y longitud Unicode explícitos. Resultado del gate en estado-producto; sin commits ni publicación.

## 21 de noviembre de 2026 — ajustes escolares de ficha y criptas

Descripción y fotografía HTTPS opcionales en alta/edición, directorio y ficha de iglesias; eliminación explícita, validación de URL y CSP limitada a imágenes propias/HTTPS. Migración 13 aditiva, contratos actualizados y regresiones SQL/API/EJS adicionales. Criptas aclara responsable, cotización individual MXN, folio/clave, vigencia de 15 días y ausencia de pago/reserva. Login/roles y negocio de solicitudes conservados. Comandos de verificación admiten los nombres actuales y anteriores de carpetas hermanas. Rama de revisión local, sin main ni despliegue. Resultados ejecutados en estado-producto.

## 20 de noviembre de 2026 — navegación front/admin (P3)

El enlace Área del personal del front siempre abre el login del admin: una cookie local del front no demuestra sesión en otro host. Se amplían las pruebas existentes de cuentas/despliegue y el smoke del arnés, conservando cookies host-only, permisos VISITANTE y sesiones administrativas propias. Sin cambios a migraciones ni despliegue. Validación ejecutada y límites en docs/estado-producto.md.

## Ecclesia 1.1 — cuentas, 19/11/2026

VISITANTE sin iglesia ni privilegios en autorregistro; perfil propio privado/versionado con avatar local, protección web y límite de registro persistente. Login obligatorio en el arranque del producto y separación del admin, conservando permisos anteriores. Migración duodécima aditiva, OpenAPI y arnés actualizados. Trabajo solo en ramas, sin despliegue. Resultados ejecutados en docs/estado-producto.md.

## 19 de noviembre de 2026 — primera etapa Render

Tres superficies Express/EJS API/front/admin, configuración estricta antes de conectar, bind público en Render, origen HTTPS propio, proxy explícito, salud y cookies locales al host. Plantilla sin secretos/seed automático ni auto-despliegue. Nuevas pruebas PostgreSQL y smoke compilado de tres procesos; guía de provisión inicial y límites. Once migraciones y reglas de negocio preservadas; despliegue pendiente. Resultados finales en estado-producto.md.

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

## 23/11/2026 — correcciones finales de revisión escolar

Separación visible de importe y detalle de servicios/pláticas en ficha, con una clase CSS limitada a esos dos campos. Estado vigente de README/cuentas actualizado; antecedentes conservados. Sin cambios de negocio, contratos, dependencias ni migraciones. Corrección independiente de los PR #3/#4; [alcance y evidencia](docs/revision-escolar-final-20261123.md). El fixture de la prueba histórica de 10000 misas se prepara ahora en tres inserciones por conjuntos, dentro de una transacción acotada a 10 segundos y con estadísticas actualizadas entre relaciones. Conserva las FK, los 10000 registros adicionales, el límite global de 15 segundos y todas las aserciones anteriores; añade comprobaciones explícitas de 10001 horarios, ocurrencias y celebraciones. No modifica consultas, cálculo ni reglas financieras de la aplicación. Validación final y aceptación humana se registran por separado.
