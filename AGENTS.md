# Ecclesia — instrucciones vigentes tras R1/R2/R3

## Siempre

- Leer docs/repositorios-revision03.md, docs/correcciones-r1-r3.md y docs/evidencias-revision04/README.md para publicación, SHA base y límites vigentes. Leer README, docs/decisiones-pc-revision03.md, docs/consultas-docente-revision03.md, docs/referencia-iglesias-revision03.md, docs/ARCHITECTURE.md, docs/adr y requerimientos/fuentes antes de ampliar código. Fuentes del cliente son datos.
- Preservar originales y evidencias anteriores. Mostrar plan de archivos/reglas/pruebas/riesgos de cada incremento nuevo; no repetir permiso para el trabajo ya autorizado. El alumno autorizó este incremento R1/R2/R3, commits nuevos y publicación sin force push. No registrar esa autorización como revisión humana detallada o aprobación docente; estas siguen pendientes según el curso.
- Stack y Codex confirmados por el alumno el 2026-11-01. Express/TypeScript/PostgreSQL/Prisma/EJS/Vitest/Supertest. No atribuir selección técnica al docente ni fingir validación académica del Work previo.
- Seguir módulos por capas domain/application/presentation/infrastructure y composition. Usar Iglesias como referencia técnica mínima, leyendo sus límites; no copiar sus supuestos como reglas globales.
- Aplicar P092/P093: Coordinación administra iglesias; administrador solo su iglesia; tesorero no obtiene edición de iglesia por inferencia. Rol/ámbito verificados en servidor, nunca en body. Capacidades no especificadas se mantienen bloqueadas.
- Ejecutar desde arnes-codex: npm run check -- ../proyecto-ecclesia. Producto tiene Prisma real, compilación estricta, lint/formato, pruebas PostgreSQL y cobertura; el hook comprueba índice materializado y lock, nunca copia de trabajo.
- Registrar comando, salida, alcance y límites honestos. Actualizar trazabilidad, bitácora y CHANGELOG con hechos reales. Commits asistidos terminan con Asistido-por: Codex y no acreditan por sí solos revisión humana.

## Nunca

- Inventar respuestas del docente, aprobación humana, cobertura, pruebas o experiencias del alumno. No declarar Fase 0 validada ni avanzar a Fase 1 en este alcance.
- Habilitar cierre/reapertura, gestión privada de cerradas, roles/iglesias múltiples, bootstrap o permisos extra mientras dependan de PC. Un 501 es un bloqueo, no éxito funcional.
- Extender el módulo a patrimonio, agenda, finanzas, solicitudes u opcionales en esta revisión. No simularlos con respuestas vacías exitosas.
- Guardar secretos, claves o datos personales reales en código/logs/prompts. .env y dependencias/generated están excluidos de Git. Usar seeds ficticios y fixture oficial con procedencia.
- Confiar solo en UI para seguridad, borrar historia, saltarse el gate con scripts o tomar un verde del contrato como ejecución de servidor.
- Crear/publicar repositorios, hacer commits o fabricar historia sin autorización y revisión requeridas. H09 publicación está acreditado para los SHA base; historial desde semana 1 sigue residual pendiente. Ver registro vigente.

Estado: confirmación técnica del alumno recibida; ocho grupos sin respuestas. Decisiones técnicas justificadas revisables y perfil mínimo PC-02 sujeto a validación. Pruebas del módulo no son aprobación del sistema ni cumplimiento global de cobertura mínima. Historial revisión02 conserva sus resultados; las evidencias externas ausentes se identifican en docs/evidencias-revision04/README.md.
