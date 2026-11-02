> Vista histórica conservada de revisión 01/02. Para estado vigente consultar decisiones-pc-revision03.md, consultas-docente-revision03.md, referencia-iglesias-revision03.md y trazabilidad-revision03.md. Las afirmaciones anteriores de ausencia total de producto/23 preguntas docentes no describen revisión 03.

# Continuación incremental

Cada incremento comienza con un plan de archivos, validaciones y pruebas que revisa el alumno, según P168–P173. El diseño de esta entrega ya fue solicitado; eso no significa aprobación automática para implementar todo el producto. Ninguna etapa siguiente se registra como terminada por existir en este plan.

| Incremento | Trabajo concreto | Condición de salida y evidencia |
| --- | --- | --- |
| 0A, esta entrega | Cotejar fuentes, conservar requisitos, proponer ER, estados, API, arquitectura y arnés inicial | Artefactos revisables y comprobaciones de herramientas registradas; revisión humana pendiente |
| 0B | Sesión de preguntas, empezando PC-21/19/17/18 y aclaraciones del primer módulo | Respuestas con fecha, autor y soporte; requisitos actualizados; diseños y ADR revisados por alumno |
| 0C | Aceptar stack, fijar versiones compatibles y preparar repositorios separados | Plan aprobado, dos repositorios, instalación reproducible y comandos reales documentados |
| 0D | Módulo de referencia Iglesias: DTO, servicio, repositorio, rutas de consulta, alta y pruebas | PC-01/02/03/04 y permisos resueltos; revisar plan antes de código; prueba API con PostgreSQL de prueba, aislamiento y reglas de dependencias |
| 0E | Cerrar arnés v1 con módulo de referencia, lint, formato, pruebas y hook de producto | Comprobaciones reales positivas y negativas; checklist humana y commit marcado; no usar el verde documental como verde del sistema |
| 1A | Migraciones y seeds geográficos oficiales, identidad y primeras consultas | Procedencia INEGI y aislamiento por API, no solo UI; demostrar primer listado por estado |
| 1B | Patrimonio, criterios, servicios y pláticas | PC pertinentes resueltas, ejemplo 35.5 automatizado y configuración modificable sin recompilar |
| 2 y posteriores | Agenda/celebraciones, diezmos, solicitudes y web pública | Entregas pequeñas con reglas y endpoints principales probados; respetar calendario del docente |

## Primer encargo de implementación que deberá revisarse

Preparar exclusivamente Iglesias y sus puertos, con campos y filtros ya confirmados; no construir todos los dominios. El plan debe mostrar carpetas, esquema mínimo y rollback, acceso por estado, ficha pública sin privados, validaciones de jerarquía INEGI, errores comunes, paginación, permisos de alta/edición y pruebas reales sobre dos iglesias. Solo después de aprobar ese plan se escribe código de producto.

## Cierre pendiente de Fase 0

- Validación de requisitos y estados con el docente, con evidencia.
- Revisión y decisión del alumno sobre cinco ADR y arquitectura.
- Módulo completo de referencia funcionando y enlazado desde AGENTS.md.
- Herramientas del stack y hook ejecutados sobre código de producto; cobertura de dominio/servicios conforme PC-21.
- Dos repositorios remotos y commits pequeños revisados. No se publican en esta entrega.

Los mínimos completos de seeds, 20 entradas de bitácora con cinco errores reales, portabilidad, reflexión y defensa corresponden al desarrollo y cierre del proyecto. No deben fabricarse para aparentar avance.
