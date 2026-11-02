# Documentación vigente de Fase 0

- [Repositorios publicados, SHA base, reproducción Windows y límites H01/H02/H08/H09](repositorios-revision03.md).
- [Correcciones R1/R2/R3](correcciones-r1-r3.md) y [evidencias disponibles](evidencias-revision04/README.md).
- [Referencia Iglesias](referencia-iglesias-revision03.md), [trazabilidad](trazabilidad-revision03.md), [decisiones PC](decisiones-pc-revision03.md) y [consultas pendientes](consultas-docente-revision03.md).

Las rutas a carpetas externas en el registro siguiente corresponden al paquete histórico. No existen como dependencias hermanas del clon; su procedencia se aclara en el índice de evidencias anterior. No se convierten resultados antiguos en pruebas nuevas.

## Índice histórico conservado

> Vista histórica conservada de revisión 01/02. Para estado vigente consultar decisiones-pc-revision03.md, consultas-docente-revision03.md, referencia-iglesias-revision03.md y trazabilidad-revision03.md. Las afirmaciones anteriores de ausencia total de producto/23 preguntas docentes no describen revisión 03.

# Documentación de Ecclesia

Los [requisitos v0.1](requerimientos.md) son la base original conservada; su estado sigue siendo extracción completa y validación pendiente. Los diseños de esta revisión no modifican ese estado.

| Documento | Uso y estado |
| --- | --- |
| [Revisión](revision-fase0.md) | Cotejo del ZIP y el Word, carencias y límites |
| [Preguntas al docente](pendientes-docente.md) | Priorización de PC-01 a PC-23, sin respuestas inventadas |
| [Modelo de datos](modelo-datos.md) | ER y diccionario lógico preliminares; no es migración |
| [Diagramas exportados](diagramas/README.md) | Cinco vistas PNG/SVG y fuentes Mermaid editables |
| [Estados](estados-solicitudes.md) | Flujo propuesto, guardas y decisiones pendientes |
| [API](diseno-api.md) | Reglas comunes y catálogo de operaciones; contrato en ../openapi.yaml |
| [Arquitectura](ARCHITECTURE.md) | Responsabilidades, carpetas, dependencias y riesgos |
| [ADR](adr/README.md) | Cinco propuestas técnicas razonadas |
| [Plan incremental](plan-incremental.md) | Revisiones y criterios de salida |
| [Bitácora](bitacora-ia.md) | Registro de esta sesión, sin aprobación humana simulada |
| [Evidencias](evidencias/README.md) | Ejecuciones y alcance verificable |

Las referencias P001–P288 remiten a [la transcripción del enunciado](fuentes/caso-parrafos.md), no a páginas impresas. La matriz original señala ubicaciones futuras; el mapeo nuevo a módulos y operaciones está en el diseño de API.


## Adiciones de revisión 02

- consultas-docente-revision02.md: las 23 PC sin respuesta, priorizadas y desglosadas.
- acciones-manuales-revision02.md: evidencia real que falta para H09/H10.
- contrato-revision02.md: correcciones y campos pendientes de validación.
- trazabilidad-revision02.md: vista vigente sin alterar extracción inicial.
- matriz-seguridad-revision02.md: línea base pública/privada comprobada por el arnés.

Consultar el informe de revisión 02 y ../evidencias-revision02/ desde la raíz del paquete. Las evidencias antiguas no se reetiquetan como pruebas actuales.
