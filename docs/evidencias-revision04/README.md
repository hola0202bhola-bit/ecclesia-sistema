# Evidencias disponibles — R1/R2/R3

1 de noviembre de 2026, America/Mexico_City. Separar ejecución técnica, estado remoto y aceptación humana. Fase 0 permanece abierta.

El [resumen verificable](verificacion.json) registra los resultados efectivamente ejecutados en esta revisión y los hashes de fuentes/locks. La reproducción negativa de R1 produjo cinco fallos antes del arreglo; esos fallos esperados no se presentan como el resultado final.

| Ejecución final | Resultado comprobado |
| --- | --- |
| Gate completo en copia de trabajo | Salida 0, 75/75 arnés y 70/70 producto, sin omitidas |
| Gate completo en clones Windows nuevos de R1/R2 | Salida 0, mismos 75/70, `core.autocrlf=true`, checkout idéntico a cada blob y siete PNG preservados |
| PostgreSQL real | 18.6 Windows x86_64; migración, doble seed y smoke del servidor compilado |
| Hook de producto | Índice válido aceptado y cuatro fallos preparados rechazados; índice y working tree conservados en los cinco escenarios |
| Cobertura medida | Líneas/sentencias/funciones 100%, ramas 76/79 (96.2%); siete fuentes |

Los clones de prueba se crearon desde los commits locales derivados de las bases GitHub verificadas, identificados en el JSON; no se presentan como descarga remota de las correcciones. Los resultados de publicación se comprueban por separado. Las repeticiones internas del hook no se suman como pruebas independientes.

Comandos reproducibles: `npm ci` en ambos hermanos, `npm run generate` en producto y `npm run check -- ../proyecto-ecclesia` desde arnés. El gate genera localmente `evidence/vitest.json`, `evidence/database.json` y `coverage/coverage-summary.json` en el producto. Esas carpetas están excluidas de Git para evitar publicar rutas locales o archivos generados. La regresión del índice guarda logs si se define `ECCLESIA_HOOK_EVIDENCE_DIR` fuera del arnés; no escribir allí durante una prueba porque su fingerprint debe permanecer estable.

## Antecedentes disponibles y ausentes

- [Evidencias revisión 01 conservadas](../evidencias/README.md): resultados de herramientas de esa fecha, no ejecución del producto actual. No se reetiquetan como nuevos.
- `Ecclesia_Fase0_revision_03.zip`, `evidencias-revision02/`, `evidencias-revision03/`, `INFORME_REVISION_03.md` y `antecedentes/` pertenecen al paquete externo anterior. No se incluyeron en estos repositorios públicos. Las menciones históricas son referencias de procedencia, no rutas locales que el clon deba resolver. Para consultarlos se necesita la entrega original; el gate no depende de ellos.
- `Informe_aceptacion_tecnica_Fase0.md`, `Guia_defensa_Iglesias.md` y `Validacion_docente_Fase0.md` son adjuntos recibidos en la conversación referida. No contienen aprobación del profesor. Sus observaciones motivan este incremento; sus enlaces externos no se convierten en evidencia presente en GitHub.
- Los commits base publicados están enlazados en [repositorios](../repositorios-revision03.md); identifican exactamente la evidencia de publicación inicial. La publicación de commits nuevos requiere comprobación remota posterior y se informa por separado.

Los logs completos de esta ejecución se entregan con el informe al alumno; este resumen publicado evita incluir rutas personales. La cobertura corresponde a siete fuentes medidas de Iglesias y excluye el arranque `server.ts`, con prueba HTTP separada. No prueba móvil, carga, portabilidad académica, tiempo de instalación menor de diez minutos, CI remoto, comprensión del alumno ni aceptación docente. H01 abierto; H02 aceptación pendiente; H08 parcial; H09 historial residual.
