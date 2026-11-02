> Vista histórica conservada de revisión 01/02. Para estado vigente consultar decisiones-pc-revision03.md, consultas-docente-revision03.md, referencia-iglesias-revision03.md y trazabilidad-revision03.md. Las afirmaciones anteriores de ausencia total de producto/23 preguntas docentes no describen revisión 03.

# Revisión del análisis y avance de Fase 0

Fecha: 1 de noviembre de 2026. Resultado: reutilizar el análisis del ZIP y continuar con un diseño preliminar. No hay evidencia de validación con el docente. La frase «terminó con los requerimientos» describe la elaboración del documento, no resuelve las preguntas de la sección 10 ni satisface por sí sola P112, P123 y P232.

## Qué se inspeccionó

El ZIP contiene seis archivos: dos índices, requisitos, transcripción y dos figuras. No contiene código, modelo ER, estados, OpenAPI, arquitectura, ADR desarrollados, bitácora ni arnés. Se cotejó el DOCX real, no solo el resumen de la conversación. SHA-256 del Word: `D079E6D122DF85142828A376BAD11FFBBE519596A898D654EDC95C7D5FF9DD30`.

Los 288 párrafos del cuerpo OOXML tienen correspondencia en la transcripción. Las diferencias literales detectadas en P166, P172 y P241 corresponden a cercas de código y saltos de línea, y en P177 al escape HTML del marcador de herramienta. Las dos figuras son idénticas a las del Word y se inspeccionaron visualmente. El archivo no contiene comentarios ni inserciones/eliminaciones de control de cambios. El cotejo es de contenido y estructura; no se certifica la paginación ni el diseño visual completo del Word.

## Qué está bien y se conserva

| Evidencia en requisitos | Correspondencia en el enunciado | Resultado |
| --- | --- | --- |
| Actores, permisos atribuidos y límites | P089–P093, P107 | Reutilizar; no crear cuenta obligatoria para visitante ni sacerdote |
| 31 RF, 9 RNF y 22 RN | P060–P093, P108–P109 | Cubren los módulos narrados; preservar IDs |
| 23 CT separados del negocio | P126–P180 y entregables | Evita convertir sugerencias técnicas en respuestas del cliente |
| 4 DES y 7 EXT separados | P095, P268–P287 | No hacer obligatorio inventario, correo, mapa o panel completo |
| 17 criterios CA y matriz de trazabilidad | P110–P113, P131 | Son pruebas previstas; no hay resultados ejecutados del producto |
| Ejemplo patrimonial 20 + 9.1 + 4 + 2.4 = 35.5 | P068–P074 | Interpretación del par de candelabros declarada, no duplicar su valor |
| 23 preguntas y ausencia explícita de respuestas | P104, P112 | Correcto reconocer incertidumbre; falta la validación real |
| Seeds y entregas académicas | P199–P241 | Conserva mínimos y calendario sugerido, sin fechas inventadas |

No se identificó un bloque funcional obligatorio completamente omitido en la extracción. Esa conclusión documental no asegura que todos los matices del negocio estén resueltos.

## Carencias y pendientes

| Hallazgo | Consecuencia | Tratamiento de esta revisión |
| --- | --- | --- |
| Ninguna PC tiene respuesta verificable | No declarar requisitos validados ni diseño aprobado | Agenda priorizada y registro de respuestas vacío |
| Stack del chat anterior era propuesta | No tratar Express/Prisma/EJS como imposición del curso | ADR-001 y ADR-003 propuestos; confirmar PC-21 |
| Requisitos preparados en Work y continuación en Codex | P054 exige una IA principal y ADR si se cambia | Confirmar declaración previa y criterio del docente; no afirmar que la continuidad cumple automáticamente esa regla |
| No hay entidades, claves ni restricciones | Aislamiento, histórico y concurrencia aún no diseñados | Modelo lógico con claves compuestas y transacciones previstas |
| No hay flujo aprobado | No suponer pago, reserva física o reapertura | Diagrama preliminar con PC-17 y PC-18 visibles |
| Rutas futuras de la matriz no son código real | No medir cobertura ni pruebas de integración | OpenAPI preliminar y mapeo RF a operaciones |
| No hay arnés ni verificaciones | P135–P163 todavía incompletos | Contexto, cinco plantillas, checklist, configuración y comprobaciones iniciales |
| Falta módulo completo de referencia | El arnés v1 del curso aún no está cerrado | Planificar Iglesias después de validar y aprobar plan |
| No hay remotos ni commits, ni evidencia del arranque | CT-05 y CT-14 pendientes | Guía para dos repositorios; no publicar sin encargo |
| Bitácora y cinco errores exigidos son evidencia futura | No rellenarlos con ejemplos ficticios | Registrar esta sesión como propuesta pendiente de revisión del alumno |

## Decisiones que se pueden preparar

La separación de capas, el formato de errores, los IDs técnicos, las transacciones, el almacenamiento decimal, la protección de claves y las plantillas del arnés son propuestas de ingeniería. No contestan preguntas del cliente. Los campos de negocio obligatorios, permisos ampliados, fecha límite de cotización, visibilidad de agenda y reglas de reportes permanecen sujetos a las PC.

P123 coloca el diseño después de requisitos validados. Por encargo del usuario se adelanta un borrador revisable; no se ejecutan migraciones ni se implementan flujos dependientes de respuestas. El paso siguiente es revisar los diseños y resolver sus bloqueos, no generar todo el sistema.
