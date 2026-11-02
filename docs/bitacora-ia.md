# Bitácora de trabajo asistido

Registro inicial de hechos de esta continuación. La decisión del alumno permanece pendiente; las acciones de la IA no se registran como aprobaciones humanas. No se cuenta el ejemplo del enunciado ni se inventan veinte entradas o cinco errores.

| Fecha | Tarea | Instrucción resumida | Propuesta de la IA | Acción y estado de revisión | Motivo | Cambio del arnés |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-01 | Cotejo y revisión Fase 0 | Inspeccionar ZIP frente al Word y reutilizar lo correcto | Conservar extracción, figuras e IDs; señalar 23 PC abiertas | Archivos preparados, revisión del alumno pendiente | El material no contiene respuestas reales ni diseño aprobado | Regla de no sustituir PC por supuestos |
| 2026-11-01 | Diseño preliminar | Continuar ER, estados, API, arquitectura y arnés inicial | Modelo lógico, flujo con guardas, OpenAPI y cinco ADR propuestos | Borrador creado por encargo; aceptación técnica pendiente | Permite revisar decisiones sin migrar datos ni inventar negocio | Contexto, plantillas y comprobaciones iniciales |

Las ejecuciones exactas se registran en evidencias. La inspección de fuentes y pruebas de herramientas no equivale a pruebas de negocio, integración, cobertura ni aceptación. Nuevas entradas deben registrar experiencias reales, decisiones revisadas y errores efectivamente detectados por el alumno.

## Incidencia real de comprobación del arnés

La primera ejecución de las pruebas falló porque el script apuntaba a `dependency-cruise.mjs`, que no existe en el paquete instalado. La inspección del paquete mostró `dependency-cruiser.mjs`; se corrigió la ruta y se repitieron las siete pruebas, que pasaron. Es un error de la IA detectado por herramientas durante esta sesión, no un error detectado y aprobado por el alumno; no se cuenta como una de las cinco entradas exigidas al alumno. No se ha registrado una repetición de este error.


## Continuación de revisión 02 — 1 de noviembre de 2026

| Fecha | Tarea | Instrucción resumida | Propuesta de la IA | Acción y estado de revisión | Motivo | Cambio del arnés |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-01 | BLOQUE B H03/H04/H05/H11 | Corregir hallazgos reales e incrementar pruebas | Snapshot del índice, inventario TS, límites de capas y política de seguridad | Defectos reproducidos en copia de revisión 01; correcciones y regresiones ejecutadas; revisión humana pendiente | El original aceptaba índice inválido, omitía TS y no exigía documentos/seguridad efectivos | Scripts, versión fijada, dependencias y regresiones; resultados exactos separados en evidencias-revision02 |
| 2026-11-01 | H01/H09/H10 | Preparar pendientes sin inventar respuestas | Priorizar 23 PC y evidencia manual de dos repositorios/ADR | Dos documentos preparados; ninguna PC respondida ni ADR aprobado | Las decisiones corresponden al docente/alumno según su ámbito | AGENTS recuerda bloqueos y evidencia real |
| 2026-11-01 | H06/H07/H08/H12/H13 | Corregir coherencia técnica inequívoca | Resumen público, versiones, DTO separados, sintaxis y trazabilidad/procedencia | Contrato y 30 casos de esquema preparados y ejecutados; aceptación de producto pendiente | Evitar que el contrato impida la información ya exigida o acepte estructuras vacías | Regresiones de esquema con directorio de snapshot explícito |

Incidencias de esta ejecución: ESLint detectó globals URL aún no declarados en nuevos archivos y se corrigió la configuración. Las pruebas Git encontraron primero permisos del entorno temporal y después alias de ruta corta Windows; se ejecutaron con acceso local necesario y se corrigió la comparación de raíz por identidad de directorio. No se cuentan como fallos del producto ni errores detectados por el alumno. La instalación inicial de Ajv 8.17.1 generó un aviso de dependencia; se fijó 8.20.0. Los avisos restantes de herramientas constan en el diagnóstico de dependencias. No hay commits, aprobación humana, cobertura de producto ni fase completada.

La inspección de las salidas íntegras de hooks detectó que node:test heredaba NODE_TEST_CONTEXT y omitía sus pruebas internas al ejecutarse desde otro test. Se corrigió la propagación de ese contexto y se añadió una aserción que exige ejecutar la suite interna en cada hook positivo. La suite externa anterior pasó 72 casos, pero esa omisión interna no se presenta como evidencia final. Se añadieron también rechazos de colisión de rutas/enlace del índice. El resultado definitivo posterior consta en evidencias-revision02.


## Continuación revisión 03 — 1 de noviembre de 2026, America/Mexico_City

Solicitud real: preservar revisión02, reclasificar PC, completar solo Iglesias mínimo e integrar pipeline sin avanzar Fase1. Confirmación explícita del alumno del stack/Codex y ausencia de respuestas nuevas recibidas en este chat. Revisión técnica ejecutada por Codex; revisión humana detallada aún pendiente. No son entradas atribuidas al alumno ni se fabrican cinco errores detectados por él.

Se identificó que la conversión dinámica de un esquema Patch perdía sus tipos; TypeScript lo rechazó y se corrigió usando partial/extend tipados. Lint detectó un parámetro de middleware sin uso y se corrigió. Son incidencias detectadas automáticamente por herramientas, no por el alumno. El primer intento de red encontró cadena CA no reconocida; se usó CA del sistema sin desactivar TLS. Se evitó adoptar Prisma latest RC, fijando 7.10.1. EJS se actualizó tras audit real para eliminar su cadena de ejecución afectada; se repitieron pruebas. No se ejecutó audit fix --force.

Se implementaron filtros/publicación/permisos explícitos/Prisma/validación y pruebas reales. Se mejoró arnés: gate real de producto, cobertura por fuente y dependencias de snapshot por lock sin scripts, manteniendo pruebas históricas como fixtures sin producto y agregando pruebas del índice de producto por separado. Resultados finales solo en informe/evidencias revision03, no en este relato anticipado. No hubo contacto docente, publicación, commits ni aprobación del código por el alumno.
