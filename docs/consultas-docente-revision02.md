> Vista histórica conservada de revisión 01/02. Para estado vigente consultar decisiones-pc-revision03.md, consultas-docente-revision03.md, referencia-iglesias-revision03.md y trazabilidad-revision03.md. Las afirmaciones anteriores de ausencia total de producto/23 preguntas docentes no describen revisión 03.

# Consultas priorizadas para el docente — revisión 02

Preparación: 1 de noviembre de 2026, America/Mexico_City. Fuente: sección 10.2 de `requerimientos.md`, `pendientes-docente.md` y H01 de la auditoría de Fase 0. **No se han recibido respuestas. Las 23 PC siguen abiertas.** Este documento organiza la consulta; no cambia el requisito original ni convierte alternativas en decisiones aprobadas.

Las letras identifican subpreguntas de trabajo, sin renumerar las PC originales. Cada subpregunta queda pendiente hasta registrar una respuesta real o un acuerdo explícito de tratamiento. Una respuesta parcial no resuelve la PC completa. El alumno elige y justifica decisiones puramente técnicas; al docente se consultan las restricciones académicas y, en su papel de cliente, las reglas del negocio pendientes.

## Prioridad 1: condiciones del curso, permisos y módulo de referencia Iglesias

Resolver primero PC-21 y PC-19, después PC-01–04. Estos puntos condicionan H02; no procede declarar listo el módulo de referencia mediante supuestos.

| PC | Subpreguntas a consultar — todas pendientes | Qué desbloquea |
| --- | --- | --- |
| PC-21 | a) ¿Hay stack o IA fijados para el grupo? b) ¿Qué métrica debe alcanzar el mínimo de cobertura de 70 %? c) ¿En qué entorno y con qué prerrequisitos se mide el arranque menor de 10 minutos? d) ¿Cuáles son las fechas definitivas? e) Como aclaración ya registrada en la agenda: ¿el trabajo previo en Work y esta continuación en Codex cuentan como una misma herramienta principal?, ¿cuál se declaró previamente? | Restricciones de CT-01/04/12/14/21 y revisión de ADR-001. El mínimo de 70 % no se reduce por preguntar la métrica. Si existió un cambio efectivo de IA principal, registrar el ADR real exigido por P054. |
| PC-19 | a) ¿Coordinación puede leer reportes base? b) ¿Puede leer datos privados de solicitudes o solo administrar lo expresamente indicado? c) ¿Un usuario acumula roles? d) ¿Puede pertenecer a varias iglesias? e) ¿Administrador puede capturar diezmos además del tesorero? f) ¿Quién crea las primeras cuentas? | Matriz de rol y ámbito de RF-06/RNF-02/03/CA-04; autorización del módulo de referencia y ADR-004. No ampliar permisos mientras falta respuesta. |
| PC-01 | a) ¿Qué versión y fuente del catálogo INEGI se usarán? b) ¿Cómo se actualizará? c) ¿Cómo se representan ciudad y localidad? | Catálogos y claves geográficas de RF-05/RN-02/RNF-08/CT-20. |
| PC-02 | a) ¿Qué campos de iglesia son obligatorios? b) ¿Qué campos de objeto son obligatorios? c) ¿Se admite año desconocido sin siglo? d) ¿Cómo se registra construcción por etapas? e) ¿Se admite fecha futura? f) ¿Qué formatos de contacto se aceptan? g) ¿Qué precisión de coordenadas se necesita? | Create/Patch y nulabilidad de RF-03/07. Resolver al menos las partes de Iglesias para H02; dejar las de Objetos individualmente pendientes si no se contestan. |
| PC-03 | a) ¿Capacidad es mínimo, máximo, intervalo o valor exacto? b) ¿Cómo se combinan filtros? c) ¿Cómo se buscan nombres con acentos? d) ¿Se admiten fragmentos y con qué semántica? | Consultas de Iglesias, RF-01/CA-01. |
| PC-04 | a) ¿Quién cierra? b) ¿Quién reabre? c) ¿La ficha cerrada se consulta por enlace directo? d) ¿Se admite gestión privada mientras está cerrada? e) ¿Se registran hechos históricos durante el cierre? | Cierre, reapertura, consulta y conservación de RF-04/RN-03. |

## Prioridad 2: cerrar diseño obligatorio por dominio

El orden agrupa decisiones relacionadas. Antes del cierre global de Fase 0 deben resolverse las partes obligatorias de PC-05–18/22 o registrarse su tratamiento acordado expresamente con el docente; su traslado a otra entrega no se presume aprobado.

| PC | Subpreguntas a consultar — todas pendientes | Impacto principal |
| --- | --- | --- |
| PC-22 | a) Además de geografía y criterios, ¿qué catálogos administra Coordinación? b) ¿Cómo se amplían tipos de iglesias? c) ¿Objetos? d) ¿Servicios? e) ¿Espacios? f) ¿Idiomas? | RF-05/07, RN-01; repercute también en Iglesias y en el alta de otros módulos. |
| PC-05 | a) ¿Antigüedad por año calendario actual, fecha exacta u otro corte? b) ¿Qué ocurre con año desconocido? c) ¿Con año futuro? d) ¿El par de candelabros de P074 es un único registro de orfebrería? e) ¿Cómo se modelan conjuntos? f) ¿Qué precisión y redondeo tendrá el índice con criterios futuros? | RF-09, RN-04/06–09, CA-06 y ADR-005. Se conserva el ejemplo documental 2026 = 35.5 sin convertirlo en fecha fija de producción. |
| PC-06 | a) ¿Cómo se recupera vigencia al devolver un préstamo? b) ¿Qué estados existen? c) ¿Las búsquedas públicas por tipo/antigüedad muestran objetos prestados, perdidos o de baja? d) ¿La ficha los muestra? | RF-07/08/12, RN-05; publicación y conservación. |
| PC-07 | a) ¿Cómo se desempatan índices iguales? b) ¿Hay límite de resultados? c) ¿Se incluyen iglesias con objetos registrados pero ninguno vigente y con índice cero? | RF-10, RN-10, CA-07. |
| PC-08 | a) ¿Cuándo entra en vigor un cambio de criterios? b) ¿Afecta todo el ranking de inmediato? c) ¿Se conserva histórico? d) ¿Quién lo aprueba además de Coordinación? | RF-11, RNF-07, CA-08; activación e historia de criterios. |
| PC-09 | a) ¿Cómo se relacionan pláticas y servicios? b) ¿Hay requisitos de asistencia? c) ¿Reserva de cupo? d) ¿Inscripción? | RF-13–15. Informar cupo sí está exigido; inscripción automática no se presume. |
| PC-10 | a) ¿Qué datos identifican al padre? b) ¿Quién modifica su identidad compartida? c) ¿Necesita cuenta propia? d) ¿Se conserva historial de asignaciones? e) ¿Se registra diócesis? f) ¿Con qué cardinalidad respecto a iglesias? | RF-16 e identidad compartida; no duplicar identidades por iglesia para evitar esta decisión. |
| PC-11 | a) ¿Agenda semanal pública o interna? b) ¿Cómo se define zona horaria de la iglesia? c) ¿Se permiten intervalos contiguos? d) ¿Misas simultáneas en el mismo templo? e) ¿Tiempos de traslado? f) ¿Excepciones? g) ¿Cruce de medianoche? h) ¿Cómo se resuelven horas ambiguas por cambio horario? | RF-17–19, RN-12, RNF-06, CA-10; conflictos y publicación. Mostrar el nombre del padre previsto en un horario público no implica publicar su agenda completa. |
| PC-12 | a) ¿Quién corrige celebraciones pasadas? b) ¿Quién corrige sustituciones? c) ¿Hasta cuándo? d) ¿Se conserva fecha del cambio? e) ¿Padre previsto anterior u otro historial? f) ¿Puede registrarse una celebración no programada? | RF-20/21, RN-13; historia y auditoría. |
| PC-13 | a) ¿Qué moneda se usa? b) ¿Se admite monto cero? c) ¿Negativo? d) ¿Cómo se redondea el promedio? e) ¿Las celebraciones sin captura quedan fuera del divisor? f) ¿Qué significa semana? g) ¿Dónde cortan los periodos? h) ¿Cómo se muestran empates? i) ¿Ausencia de datos? j) ¿Reportes por padre según quien realmente ofició? | RF-22–24, RNF-04, CA-13. No decidir importes, escala, corte o divisor por conveniencia técnica. |
| PC-14 | a) ¿Qué datos de contacto se solicitan? b) ¿Cuáles son obligatorios? c) ¿Hay otros datos de la petición además del tipo de espacio? d) ¿Cuánto se conservan? e) ¿Cómo se atiende rectificación? f) ¿Eliminación de datos personales? | RF-26, RNF-03; resolver antes de persistir solicitudes. |
| PC-15 | a) ¿Qué contenido permite consultar folio y clave? b) ¿Cómo se recupera la clave? c) ¿Qué intentos se limitan? d) ¿Cómo debe generarse y protegerse según las necesidades del cliente? | RF-27, RN-18; completar política funcional, dejando al alumno la selección y justificación de mecanismos técnicos seguros. |
| PC-16 | a) ¿Cómo se informa cotización o falta de lugar en el alcance base: seguimiento en pantalla, contacto manual u otro canal? | RF-28. El aviso automático por correo permanece como extra EXT-06, sin aprobación presumida. |
| PC-17 | a) ¿Los 15 días empiezan al emitir o comunicar? b) ¿Son días naturales? c) ¿Qué zona e instante terminan la vigencia? d) ¿Qué sucede exactamente en el límite? e) ¿Cómo se resuelve aceptación simultánea al vencimiento? f) ¿Se permiten nuevas versiones de cotización? | RF-29/30, RN-20, CA-15; frontera temporal y concurrencia. El plazo documental de 15 días se conserva. |
| PC-18 | a) ¿Estados oficiales y transiciones? b) ¿Se reabre tras rechazo? c) ¿Vencimiento? d) ¿Falta de lugar? e) ¿Se cancela desde esos estados no aceptados? f) ¿Qué sucede con respuestas duplicadas? g) ¿Simultáneas? | RF-28–31; no cerrar la máquina de estados con transiciones inventadas. La cancelación tras aceptación sigue prohibida por el caso. |

## Prioridad 3: aceptación y alcance opcional

| PC | Subpreguntas a consultar — todas pendientes | Tratamiento |
| --- | --- | --- |
| PC-20 | a) ¿Qué disponibilidad se considera aceptable? b) ¿Tiempos de respuesta? c) ¿Usuarios simultáneos? d) ¿Navegadores? e) ¿Dispositivos? f) ¿Cómo se controla que la información esté actualizada? | RNF-01/09. Resolver antes de definir aceptación medible; no inventar SLA. |
| PC-23 | Si se aprueban los deseables: a) ¿Cómo evitar duplicados al generar celebraciones? b) ¿Reglas de inventario de espacios? c) ¿Reserva? d) ¿Asignación? e) ¿Liberación? | DES-02/04. Puede quedar diferida si no se aprueba ese alcance; registrar el acuerdo real. La ausencia de esos extras no constituye por sí misma un defecto de implementación base. |

## Registro para usar después de la sesión

No se rellenan respuestas anticipadamente. Para cada subpregunta contestada, crear un registro con: **PC y letra, respuesta fiel, fecha real, nombre o rol de quien respondió, enlace o archivo de soporte, RF/RN/CA afectados, artefactos actualizados y subpreguntas aún abiertas**. Conservar el soporte recibido sin secretos. Registrar un aplazamiento solo cuando esté expresamente acordado, con alcance y condición de reapertura.

La sesión y sus resultados no se han realizado ni acreditado en esta revisión. H01 permanece abierto; este listado no constituye aprobación ni evidencia de entrevista.
