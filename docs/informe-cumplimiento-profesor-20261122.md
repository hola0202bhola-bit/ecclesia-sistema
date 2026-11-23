# Informe final de cumplimiento — Ecclesia 1.1

22/11/2026, America/Mexico_City. Alcance: indicaciones recientes transmitidas por el usuario, conservando los cambios escolares y la corrección R-01 aprobados. El usuario confirmó expresamente costo público de referencia y responsable institucional visible. Esto amplía P088 solo para esa referencia; las cotizaciones individuales siguen privadas. No acredita aceptación del profesor ni una auditoría humana externa.

## Resultado

**Los requisitos recientes quedan implementados y verificados técnicamente. Ambos repositorios están preparados en sus índices para revisión, sin commits ni publicación.** No se detectaron hallazgos bloqueantes P0/P1/P2 en el cambio revisado. Los límites y preguntas anteriores se conservan.

| Requisito reciente | Implementación | Evidencia ejecutada |
| --- | --- | --- |
| Desvincular sacerdotes conservando identidad, historia y otras iglesias | Retirada lógica de la asignación propia, versión independiente, motivo/auditoría atómicos; reactivación de la misma fila | PostgreSQL real: conservación, historial, vínculo ajeno y horario inactivo; demo real y reinicio conservan identidad, activo=false, versión 2 y dos eventos |
| Impedir retirada con misas o celebraciones | Bloqueo de iglesia y mutex de agenda; 409 por horario activo, ocurrencias o hechos propios como previsto/oficiante | Casos de programación, suplencia, dos retiradas, carrera con horario y con celebración, rollback |
| Responsable y costo claros de criptas/espacios | Cargo/nombre institucional y referencia decimal pública opcionales por tipo; cero distinto de ausencia, omisión conserva y null borra | API/Ajv, PostgreSQL BIGINT, formulario, XSS, versión, concurrencia y demo con 1500.00 MXN, seguida de restauración |
| Conservar cotización y privacidad | Proyección pública explícita; no copia datos del solicitante, folio/clave, precio/condiciones individuales, cuenta o auditoría | Cotización 1234.56 inalterada frente a referencia 20.00; lectura pública sin datos privados; flujo privado anterior intacto desde crear() |
| API, formularios, contratos y permisos | DELETE de asignación con motivo/versión, ampliación compatible de PUT/GET de ofertas, contratos sincronizados, solo ADMIN_IGLESIA propio | 401/403/404/409/422, visitante/tesorero/Coordinación/ajeno sin edición, CSRF/Origin, DTO estricto y escaping |
| Conservar fotografía/descripción y demás cambios aprobados | Código protegido intacto y mismos seis esquemas de Iglesia en ambos contratos | 36 archivos protegidos y trece migraciones anteriores cotejados; regresiones HTTPS/Ajv/Zod existentes pasan en el gate |

## Gate final completo

Desde ecclesia-arnes-codex: `npm run check -- ../ecclesia-sistema`. **gate-02, salida 0, una única ejecución íntegra:** inicio **2026-11-22T11:08:32.6149387-06:00**, fin **2026-11-22T11:51:06.7301649-06:00**, **42.57 minutos**.

- Producto: **520/520**, trece archivos; arnés: **110/110**. Cero fallidas, canceladas u omitidas.
- Conservadas las **504** pruebas previas del producto y **108** del arnés; añadidas **16** y **2**. El código previo de las suites modificadas permanece completo; solo tres recuentos de migraciones pasan de 13 a 14.
- **67 escenarios del índice:** una aceptación y 66 rechazos esperados, conservando índice y directorio en todos. Incluye ausencia de migraciones 13/14, SQL roto, 35.5, modalidades, traslapes, centavos, vigencia, concurrencia, CT20, autorregistro y prueba fallida que package.test no puede ocultar.
- Prisma generado, TypeScript compilado, lint/formato y contratos correctos. Arquitectura **60/60**, cero violaciones.
- Cobertura: líneas **97.57%** (2055/2106), sentencias **97.11%**, funciones **98.92%**, ramas **91.00%**. Exclusión histórica del entrypoint de arranque conservada con smoke compilado separado.
- PostgreSQL **18.6**, catorce migraciones aditivas y doble seed sobre bases efímeras propias. Smokes compilados de HTTP/EJS, solicitudes/cotizaciones, nueva referencia pública y retirada, finanzas, INEGI, RF04/RF11, CT20 y cuentas en tres procesos. Temporales detenidos y eliminados.

Se congelaron **329 archivos versionados** antes de los gates: **cero diferencias durante la ejecución**. Después solo se actualiza documentación y evidencia. [Resumen estructurado y huellas de logs locales](evidencias-profesor-20261122.json).

## Revisión de interfaz y persistencia

Navegador sobre CT20 propia en loopback, con administrador ficticio autenticado mediante formulario normal. Se comprobó bloqueo visible de un sacerdote con misas/hechos; alta y retirada de otro sin programación; guardar responsable y 1500.00 MXN en CRIPTA; mostrar ambos públicamente y señalar cotización privada; otros tipos muestran ausencia de costo. Se borraron esos dos campos restaurando el estado previo, versión de oferta **1→2→3**. La identidad ficticia retirada y su auditoría se conservaron. Capturas inspeccionadas durante la sesión; sin afirmación de móvil físico.

El primer cierre del ejecutor demo informó salida 1 al no disponer de entrada interactiva y cerrar su servidor hijo; se verificó que no quedaran sus procesos. Después se reinició en terminal interactiva, se verificaron identidad, vínculo, dos eventos y campos restaurados mediante lectura local, y se cerró con **salida 0**. No se eliminó historia ni se usaron datos reales.

## Intentos anteriores, separados del resultado final

| Intento | Resultado real y corrección |
| --- | --- |
| producto-01 y producto-02 | Salida 1 antes de PostgreSQL/pruebas por una declaración duplicada en el smoke nuevo. Se corrigió y se verificó la sintaxis. |
| producto-03 | 233 pruebas correctas y una fallida: fixture de actualización copiaba enums de otro esquema sin convertirlos. Se corrigió el fixture, conservando todas sus aserciones; la migración no cambió. |
| producto-04 | Pipeline íntegro, salida 0, 520/520 y smokes correctos. |
| gate-01 | 109/110 arnés, fallo al escribir un objeto Git del fixture temporal, cero escenarios del índice. Reproducción aislada init/add correcta. No se atribuye una causa no demostrada ni se cambiaron controles. |
| gate-02 | Resultado íntegro aprobado indicado arriba. No se suman resultados parciales para fabricar este verde. |

Logs y resultados locales en evidence/requisitos-profesor-20261122, excluidos de Git. Se conserva la advertencia no bloqueante preexistente de pg sobre consultas concurrentes y una futura versión; no se actualizaron dependencias.

## Revisión y restricciones

- **P0/P1/P2: sin hallazgos bloqueantes pendientes** en este incremento. La corrección R-01 anterior permanece intacta.
- **P3 anteriores conservados:** SVG por ausencia de URL, sin recuperación automática ante fallo remoto; HTTPS/sintaxis no garantizan DNS efectivo, disponibilidad o licencia. Límites WHATWG/IDNA/trim/Unicode documentados. No se amplía ese alcance.
- La retirada es conservadora: bloquea cualquier ocurrencia propia o celebración registrada, incluso programación pasada sin hecho. No borra ni corrige misas; puede inactivarse/reasignarse un horario sin hechos antes de retirar.
- Matriz de seguridad anterior semánticamente intacta salvo la nueva ruta propia. Zod de fotos, identidad, sesión, CSP y recursos aprobados permanecen sin cambios. Sin privilegios nuevos para Coordinación, tesorero o visitante.
- Índice final examinado: 331 archivos (329 de la ejecución y dos documentos finales), sin .env, .demo, evidence, dependencias o credenciales privadas preparadas; cero coincidencias de 38 valores sensibles locales comparados solo en memoria. Los fixtures siguen siendo ficticios.
- Ramas de ambos: **feat/ajustes-escolares-20261121**. HEAD/main locales conservados: producto **06e479c773d460e9533469eddb780a4f1e371fa5**; arnés **f7e2df00d730577c4a7fa379f8338a234af664f7**. Sin commits reales de estos repositorios, push, merges, despliegues, Render/Supabase o bases remotas.

## Pendientes y revisión compartible

**No quedan requisitos funcionales recientes sin cubrir técnicamente ni pruebas fallidas en el estado final.** Siguen pendientes la aceptación docente/humana y las PC anteriores; no se declaran resueltas por estos tests. Inventario funerario, pagos/reserva, comunicaciones externas, recotización y correcciones históricas no forman parte de este incremento.

[Guía de reglas, API y reproducción](indicaciones-profesor-20261122.md). Los parches anteriores se conservan como históricos; las nuevas exportaciones exactas del índice se preparan en **evidence/requisitos-profesor-20261122/ecclesia-sistema.patch** y **ecclesia-arnes-codex.patch**, con manifiesto de tamaños, huellas y árboles. Esos archivos locales no se incluyen en Git.
