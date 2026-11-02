> Vista histórica conservada de revisión 01/02. Para estado vigente consultar decisiones-pc-revision03.md, consultas-docente-revision03.md, referencia-iglesias-revision03.md y trazabilidad-revision03.md. Las afirmaciones anteriores de ausencia total de producto/23 preguntas docentes no describen revisión 03.

# Contrato: correcciones de revisión 02

Fecha de esta revisión: 1 de noviembre de 2026, America/Mexico_City. La API no está implementada. Los ADR y las PC conservan su estado propuesto/pendiente; esta revisión no declara aprobación del cliente.

| Hallazgo | Corrección técnica realizada | Límite de aceptación |
| --- | --- | --- |
| H06 | Resumen público requerido SacerdoteResumenPublico={id,nombre} en HorarioMisa; ejemplo paginado en agenda_horarios anónima | Solo esquema y declaración security=[]; falta consulta HTTP real del producto y su autorización |
| H07 | Lecturas mutables con version; CreateInput/PatchInput separados; PATCH exige version y al menos un cambio; PUT de criterios exige datos completos y version; 409 documentado | Falta transacción y rechazo efectivo de comandos obsoletos en BD/servicio |
| H08 | Altas vacías rechazadas; reloj HH:mm 00:00–23:59; textos significativos, capacidad/cupo no negativos; decimales exactos de criterios y listas no vacías; duración inicial de misa default 60 | Obligatoriedad de negocio y validación semántica siguen abiertas. No se inventa signo/precisión/moneda |
| H12 | Nueva matriz RF/RN → módulos/capas propuestos → operación → PV/estado; extracción original intacta | No hay código ni pruebas de producto; PV siguen previstos |
| H13 | Índice en Iglesia acompañado siempre de distinción, criterio y referencia; referencia 2026 solo en muestra | Falta cálculo real y política temporal PC-05/08 |

## Campos y políticas que requieren validación

Los esquemas CreateInput con minProperties=1 expresan únicamente que un objeto vacío no es una orden útil. Un ejemplo de un solo atributo puede ser estructuralmente válido y seguir incompleto para el negocio. No copiarlo al servidor como validación final. Se conservan los Input originales para inspección y los endpoints apuntan a los nuevos tipos de alta/edición.

| Recurso/campos | PC pendientes y decisión que falta |
| --- | --- |
| Iglesia: nombre, tipoId, claves geográficas, direccion, capacidad, anioConstruccion, contacto, zonaIana y coordenadas | PC-01/02/03/04/19/22: required definitivos, año desconocido, catálogos, filtros, cierre y roles. No se crean nuevos campos obligatorios de negocio |
| Usuario: identificador/password/rolCoordinacion/membresias | PC-19/21: bootstrap, asignaciones, acumulación, permisos y restricciones del grupo. Su version no habilita permisos |
| Objeto: descripcion/tipoId/anioExacto/siglo/material/conservacion/ubicacionInterna/catalogadoInah | PC-02/05/06: required definitivos, fechas desconocidas/futuras, conjuntos, retorno y publicación. Comparar año/siglo en validación semántica |
| Servicio y Platica: modalidad/importe/moneda/requisitos/sesiones/cupo/horarios/lugar/impartidor | PC-02/09/13: required, relación preparación–servicio, importes por modalidad, moneda/precisión. No se obliga a cobrar un donativo |
| Sacerdote: sacerdoteId/nombre/funcion | PC-10: autoridad, identidad compartida y agregado identidad/asignación. Patch no cambia el identificador de ruta. El esquema no resuelve autorización ni distribución física del contador |
| HorarioMisa: diaSemana/horaLocal/tipo/idioma/sacerdotePrevistoId/vigenciaDesde/vigenciaHasta | PC-10/11: required definitivos, autoridad, vigencias/excepciones, extremos y política temporal. Duración 60 proviene del caso y no de una respuesta inventada |
| Celebracion: horarioId/fechaLocal/horaLocal/sacerdoteRealId/motivoSustitucion | PC-12: sin horario, permisos y corrección histórica; reloj local no sustituye validación de instantes y zonas |
| Criterio: bonusInah/tramos/factores/umbrales, numeroVersionConfiguracion y version | PC-05/08: referencia temporal, precisión/valores admitidos, activación e historia. Falta validación de huecos, superposiciones, orden, duplicados y cobertura completa de tipos |
| Diezmo/Reporte: importe/moneda/promedio | PC-13/19: signo/máximo, moneda, cortes, redondeo, denominador del promedio, permisos |
| Solicitud/Contacto/Cotizacion/Oferta | PC-14/15/16/17/18/19/22: contacto requerido, seguimiento, comunicación, cómputo de 15 días, transiciones y permisos. No se convierten campos de contacto propuestos en obligatorios |

## Recorrido propuesto de concurrencia

1. Leer Iglesia u Objeto y conservar version devuelta.
2. Enviar PATCH (version y campos) o cierre/condición (version y datos de comando).
3. El servidor futuro deberá comparar e incrementar dentro de transacción y devolver la nueva version.
4. Repetir una mutación con la versión anterior deberá producir 409 sin cambiar datos ni auditoría.

Las pruebas de esta revisión acreditan únicamente pasos contractuales 1/2 y la presencia de 409. Los pasos de ejecución 3/4 son aceptación pendiente de H02. En Criterio, numeroVersionConfiguracion es la revisión patrimonial; version es concurrencia. En CotizacionInput, version pertenece a Solicitud. No se mezcla con un número de nueva cotización.

## Pruebas y alcance

[Suite de muestras](https://github.com/hola0202bhola-bit/ecclesia-arnes-codex/blob/3d107dab51140b23c594d7da73e5ba9ca82bef7f/tests/schema-regression.test.mjs): IDs H06/H07/H08/H13. Ejecutar desde el arnés: node --test tests/schema-regression.test.mjs. Usa Ajv 2020 con strict=false y validateFormats=false: valida estructura, patrones de reloj/decimales y dependencias de propiedades; no certifica formatos UUID, email, fecha, zona IANA, servidor, BD ni cobertura funcional. Las salidas de la revisión 02 se entregan aparte; no se modifican las evidencias de revisión 01.
