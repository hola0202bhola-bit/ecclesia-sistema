Incremento RF16–21 autorizado el 3 de noviembre de 2026: leer docs/adr/008.md. Preservar fuente P080–083/P092–093, permisos de administrador propio, identidad compartida protegida, vigencia acotada y mutex transaccional común. Sexta suite PostgreSQL y gate completo. Teams provisional no se implementa. Las restricciones de agenda pendiente siguientes son antecedentes superados solo para este subalcance.

Incremento vigente servicios/pláticas RF13–15: leer docs/incremento-servicios.md y ADR007. Preservar P078–079, sesiones como número informativo, modalidades excluyentes, horarios locales, administrador propio y consultas públicas. Sin inscripción/reserva ni vínculo obligatorio inferido; PC-09/22 abiertas. Quinta suite PostgreSQL, auditoría/horarios atómicos y gate completo obligatorios. Las restricciones históricas de servicios pendientes quedan superadas en este subalcance autorizado.

# Ecclesia — instrucciones vigentes de continuación

Incremento vigente: patrimonio autorizado el 2 de noviembre de 2026; leer docs/incremento-patrimonio.md y ADR005 actualizado. Preservar P067–076 y prueba exacta 35.5 en 2026. Solo administrador propio captura; Coordinación no obtiene ese permiso. No habilitar reactivación ni activación de criterios; corte, cero, visibilidad y perfiles provisionales explícitos. Migración aditiva, auditoría transaccional y cuarta suite PostgreSQL obligatoria. Las prohibiciones históricas de ampliar patrimonio que siguen describen revisiones anteriores.

La instrucción actual del alumno autoriza completar aplicación y arnés con commits y publicación sin force push. Leer primero `docs/estado-producto.md`, ADR 006 y README. Las restricciones de alcance R1/R2/R3 y cierre de Fase 0 que siguen abajo son antecedentes de esa revisión; no bloquean nuevos incrementos autorizados ni exigen ceremonias, entregables separados o aprobación docente inventada. Conservar requisitos, fuentes y evidencias históricas. Tratar ambigüedades de negocio por su impacto; decisiones técnicas revisables explícitas permiten avanzar.

Identidad mínima usa cuentas/sesiones PostgreSQL, bcrypt 12 y JWT con sesión revocable; standalone no acepta emisor externo sin sesión. Perfil de un rol y una iglesia máxima es supuesto técnico, no respuesta a G7. `npm run db:coordinacion` es provisión local explícita cuando no hay usuarios; nunca crear claves por defecto, bootstrap HTTP ni cuentas en seed. No extender privilegios P092/P093 por inferencia. Cambiar el arnés solo con regresiones, diff revisado y gate completo. Ambos proyectos deben pasar antes de publicar y verificar SHA remotos. Commits asistidos terminan `Asistido-por: Codex`.

## Antecedente conservado: R1/R2/R3

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
