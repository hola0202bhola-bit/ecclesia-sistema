> Vista histórica conservada de revisión 01/02. Para estado vigente consultar decisiones-pc-revision03.md, consultas-docente-revision03.md, referencia-iglesias-revision03.md y trazabilidad-revision03.md. Las afirmaciones anteriores de ausencia total de producto/23 preguntas docentes no describen revisión 03.

# Matriz vigente de trazabilidad — revisión 02

Fecha de esta vista: 1 de noviembre de 2026, America/Mexico_City. [Extracción inicial](requerimientos.md) preservada sin modificación. Las rutas son destinos propuestos de [ARCHITECTURE.md](ARCHITECTURE.md), no carpetas existentes. Toda prueba PV sigue prevista; ningún RF/RN está ejecutado como producto.

## Estado actual que sustituye la instrucción histórica de la sección 13

La extracción inicial decía validar antes de diseñar. Ya hay modelo/API/diagramas preliminares; corresponde revisar ese diseño y actualizarlo con respuestas reales antes de aprobarlo o implementar flujos bloqueados. No volver a presentar el diseño como pendiente de empezar ni afirmar que fue aprobado. Se preservan fechas, IDs y texto histórico. H01 y H02 impiden cerrar Fase 0.

## RF → módulo/capas → operaciones → verificación

En la columna capas, P=presentation, A=application, D=domain, I=infrastructure. P adapta entrada/salida, A autoriza/orquesta, D contiene reglas, I consulta/persiste; ninguna fila permite saltarse dependencias. Integraciones entre módulos necesitan fachada/puerto revisado y composición; no se autorizan imports internos cruzados por esta matriz.

| RF | Módulo previsto y capas | Operación OpenAPI | Prueba de producto prevista | Evidencia actual y estado |
| --- | --- | --- | --- | --- |
| RF-01 | src/modules/iglesias/; P/A/I | `iglesias_buscar` | PV-RF-01: Estado y filtros con iglesias activas y cerradas; CA-01 | Sin prueba de producto ejecutada; producto pendiente |
| RF-02 | src/modules/iglesias/; P/A/I | `iglesias_ficha`, `patrimonio_objetos` | PV-RF-02: Ficha con relaciones y ausencia de datos privados; CA-01 | Sin prueba de producto ejecutada; producto pendiente |
| RF-03 | src/modules/iglesias/; P/A/D/I | `iglesias_alta`, `iglesias_editar` | PV-RF-03: Alta y cambio con todos los datos citados y coordenadas ausentes | H07-patch-Iglesia / H07 lecturas (solo contrato); producto pendiente |
| RF-04 | src/modules/iglesias/; P/A/D/I | `iglesias_cerrar`, `iglesias_reabrir` | PV-RF-04: Cerrar y comprobar conservación de relaciones y exclusión pública; CA-02 | H07-patch-Iglesia / H07 lecturas (solo contrato); producto pendiente |
| RF-05 | src/modules/catalogos/; P/A/I | `catalogos_estados`, `catalogos_municipios`, `catalogos_localidades`, `catalogos_tipos`, `catalogos_alta`, `catalogos_editar` | PV-RF-05: Relaciones geográficas válidas e inválidas; CA-03 | Sin prueba de producto ejecutada; producto pendiente |
| RF-06 | src/modules/identidad/; P/A/D/I | `identidad_login`, `identidad_usuarios`, `identidad_alta`, `identidad_editar` | PV-RF-06: Acceso autenticado y permisos por rol e iglesia; CA-04 | Sin prueba de producto ejecutada; producto pendiente |
| RF-07 | src/modules/patrimonio/; P/A/D/I | `patrimonio_objetos`, `patrimonio_altaObjeto`, `patrimonio_editarObjeto` | PV-RF-07: Registrar objetos con año, siglo y condición INAH; CA-05 | H07-patch-Objeto (solo contrato); producto pendiente |
| RF-08 | src/modules/patrimonio/; P/A/D/I | `patrimonio_condicion` | PV-RF-08: Excluir cada condición sin borrar el registro; CA-05 | H07-patch-Objeto (solo contrato); producto pendiente |
| RF-09 | src/modules/patrimonio/; P/A/D/I | `patrimonio_ranking` | PV-RF-09: Ejemplo 35.5 y límites de antigüedad y distinción; CA-06 | H13 procedencia (solo contrato); producto pendiente |
| RF-10 | src/modules/patrimonio/; P/A/I | `patrimonio_ranking` | PV-RF-10: Ámbitos, orden y exclusiones explícitas; CA-07 | H13 procedencia (solo contrato); producto pendiente |
| RF-11 | src/modules/patrimonio/; P/A/D/I | `patrimonio_criterios`, `patrimonio_crearCriterio`, `patrimonio_editarCriterio`, `patrimonio_activar` | PV-RF-11: Modificar parámetros y comprobar resultado nuevo sin cambiar código; CA-08 | H08-criterios (solo sintaxis); producto pendiente |
| RF-12 | src/modules/patrimonio/; P/A/I | `patrimonio_buscar` | PV-RF-12: Consulta de imágenes de al menos 300 años en Puebla y otros ámbitos | Sin prueba de producto ejecutada; producto pendiente |
| RF-13 | src/modules/servicios/; P/A/D/I | `servicios_servicios`, `servicios_altaServicio`, `servicios_editarServicio` | PV-RF-13: Crear y consultar cada modalidad de costo y los datos del servicio; CA-09 | H08-create-Servicio/Platica (solo contrato); producto pendiente |
| RF-14 | src/modules/servicios/; P/A/D/I | `servicios_platicas`, `servicios_altaPlatica`, `servicios_editarPlatica` | PV-RF-14: Alta y consulta de plática prebautismal con todos los campos; CA-09 | H08-create-Servicio/Platica (solo contrato); producto pendiente |
| RF-15 | src/modules/servicios/; P/A/I | `servicios_servicios`, `servicios_platicas` | PV-RF-15: Consultar oferta y pláticas de una iglesia sin autenticar; CA-09 | H08-create-Servicio/Platica (solo contrato); producto pendiente |
| RF-16 | src/modules/agenda/; P/A/D/I | `agenda_sacerdotes`, `agenda_asignar`, `agenda_editarSacerdote` | PV-RF-16: Padre compartido en varias iglesias sin duplicar su identidad | Sin prueba de producto ejecutada; producto pendiente |
| RF-17 | src/modules/agenda/; P/A/D/I | `agenda_crearHorario`, `agenda_editarHorario` | PV-RF-17: Horario recurrente con idioma y duración predeterminada o explícita; CA-10 | H08-clock-HorarioMisaInput / default 60 (solo contrato); producto pendiente |
| RF-18 | src/modules/agenda/; P/A/D/I | `agenda_crearHorario`, `agenda_editarHorario`, `agenda_sustituir` | PV-RF-18: Conflicto entre iglesias y zonas distintas, incluso al editar; CA-10 | H08-clock-HorarioMisaInput / default 60 (solo contrato); producto pendiente |
| RF-19 | src/modules/agenda/; P/A/I | `agenda_semanal`, `agenda_horarios` | PV-RF-19: Horario público con padre y agenda semanal consistente | H06 resumen anónimo declarado (solo contrato); producto pendiente |
| RF-20 | src/modules/agenda/; P/A/D/I | `agenda_celebraciones`, `agenda_registrarHecho`, `agenda_corregirHecho` | PV-RF-20: Registrar un hecho sin confundirlo con la programación; CA-11 | H07-patch-Celebracion (solo contrato); producto pendiente |
| RF-21 | src/modules/agenda/; P/A/D/I | `agenda_registrarHecho`, `agenda_corregirHecho`, `agenda_sustituir`, `agenda_historial` | PV-RF-21: Sustitución con autor y motivo consultables; CA-11 | H07-patch-Celebracion (solo contrato); producto pendiente |
| RF-22 | src/modules/diezmos/; P/A/D/I | `diezmos_registrar`, `diezmos_consultar` | PV-RF-22: Celebración válida, intento duplicado y misa no celebrada; CA-12 | Sin prueba de producto ejecutada; producto pendiente |
| RF-23 | src/modules/diezmos/; P/A/D/I | `diezmos_corregir`, `diezmos_historial` | PV-RF-23: Dos correcciones sucesivas con historial completo; CA-12 | Sin prueba de producto ejecutada; producto pendiente |
| RF-24 | src/modules/diezmos/; P/A/I | `diezmos_reporte`, `diezmos_extremos` | PV-RF-24: Conjunto de montos conocidos y cada dimensión solicitada; CA-13 | Sin prueba de producto ejecutada; producto pendiente |
| RF-25 | src/modules/solicitudes/; P/A/I | `solicitudes_ofertas`, `solicitudes_altaOferta`, `solicitudes_editarOferta` | PV-RF-25: Consultar criptas, nichos, columbarios u osarios sin precios; CA-14 | Sin prueba de producto ejecutada; producto pendiente |
| RF-26 | src/modules/solicitudes/; P/A/D/I | `solicitudes_alta` | PV-RF-26: Alta sin usuario y entrega de folio y clave; CA-14 | Sin prueba de producto ejecutada; producto pendiente |
| RF-27 | src/modules/solicitudes/; P/A/I | `solicitudes_seguimiento` | PV-RF-27: Credenciales válidas, folio ajeno y clave incorrecta; CA-14 | Sin prueba de producto ejecutada; producto pendiente |
| RF-28 | src/modules/solicitudes/; P/A/D/I | `solicitudes_listarPrivado`, `solicitudes_detallePrivado`, `solicitudes_cotizar`, `solicitudes_sinLugar` | PV-RF-28: Revisión con y sin disponibilidad; CA-14 | Sin prueba de producto ejecutada; producto pendiente |
| RF-29 | src/modules/solicitudes/; P/A/D/I | `solicitudes_aceptar`, `solicitudes_rechazar` | PV-RF-29: Aceptación y rechazo mediante seguimiento privado; CA-15 | Sin prueba de producto ejecutada; producto pendiente |
| RF-30 | src/modules/solicitudes/; P/A/D/I | `solicitudes_seguimiento`, `solicitudes_detallePrivado`, `solicitudes_aceptar`, `solicitudes_rechazar`, `solicitudes_cancelar` | PV-RF-30: Reloj controlado con y sin respuesta durante la vigencia; CA-15 | Sin prueba de producto ejecutada; producto pendiente |
| RF-31 | src/modules/solicitudes/; P/A/D/I | `solicitudes_cancelar` | PV-RF-31: Cancelar antes de aceptar y rechazar cancelación tras aceptar; CA-15 | Sin prueba de producto ejecutada; producto pendiente |

## RN → módulos/capas → operaciones → verificación

| RN | Módulos previstos y capas | Operaciones vinculadas | Prueba prevista y estado |
| --- | --- | --- | --- |
| RN-01 | src/modules/iglesias/, src/modules/catalogos/; A/D, P/I según efecto | `iglesias_alta`, `iglesias_editar`, `catalogos_estados`, `catalogos_municipios`, `catalogos_localidades`, `catalogos_tipos`, `catalogos_alta`, `catalogos_editar` | PV-RN-01: Seis categorías admitidas y categoría fuera del catálogo — prevista, no ejecutada |
| RN-02 | src/modules/catalogos/; A/D, P/I según efecto | `catalogos_estados`, `catalogos_municipios`, `catalogos_localidades`, `catalogos_tipos`, `catalogos_alta`, `catalogos_editar` | PV-RN-02: Ubicaciones válidas y jerarquía inválida; CA-03 — prevista, no ejecutada |
| RN-03 | src/modules/iglesias/, src/modules/patrimonio/; A/D, P/I según efecto | `iglesias_cerrar`, `iglesias_reabrir`, `patrimonio_ranking` | PV-RN-03: Cierre conservando datos; CA-02 — prevista, no ejecutada |
| RN-04 | src/modules/patrimonio/; A/D, P/I según efecto | `patrimonio_objetos`, `patrimonio_altaObjeto`, `patrimonio_editarObjeto`, `patrimonio_ranking` | PV-RN-04: Siglo XVIII → 1750; CA-05 — prevista, no ejecutada |
| RN-05 | src/modules/patrimonio/; A/D, P/I según efecto | `patrimonio_condicion`, `patrimonio_ranking` | PV-RN-05: Cada condición excluida y registro conservado; CA-05 — prevista, no ejecutada |
| RN-06 | src/modules/patrimonio/; A/D, P/I según efecto | `patrimonio_ranking` | PV-RN-06: Antigüedades 49, 50, 99, 100, 199, 200, 299 y 300; CA-06 — prevista, no ejecutada |
| RN-07 | src/modules/patrimonio/; A/D, P/I según efecto | `patrimonio_ranking`, `patrimonio_criterios`, `patrimonio_crearCriterio`, `patrimonio_editarCriterio`, `patrimonio_activar` | PV-RN-07: Un caso por categoría, con y sin bonificación; CA-06 — prevista, no ejecutada |
| RN-08 | src/modules/patrimonio/; A/D, P/I según efecto | `patrimonio_ranking` | PV-RN-08: Cuatro contribuciones del ejemplo y exclusión de objeto prestado; CA-06 — prevista, no ejecutada |
| RN-09 | src/modules/patrimonio/; A/D, P/I según efecto | `patrimonio_ranking` | PV-RN-09: Valores 0, 7.9, 8, 19.9, 20, 39.9 y 40; CA-06 — prevista, no ejecutada |
| RN-10 | src/modules/patrimonio/; A/D, P/I según efecto | `patrimonio_ranking` | PV-RN-10: Orden descendente y dos exclusiones inequívocas; CA-07 — prevista, no ejecutada |
| RN-11 | src/modules/servicios/; A/D, P/I según efecto | `servicios_servicios`, `servicios_altaServicio`, `servicios_editarServicio` | PV-RN-11: Mismo servicio con modalidad distinta en dos iglesias; CA-09 — prevista, no ejecutada |
| RN-12 | src/modules/agenda/; A/D, P/I según efecto | `agenda_crearHorario`, `agenda_editarHorario`, `agenda_sustituir` | PV-RN-12: Choque parcial, completo y duración distinta; CA-10 — prevista, no ejecutada |
| RN-13 | src/modules/agenda/; A/D, P/I según efecto | `agenda_celebraciones`, `agenda_registrarHecho`, `agenda_corregirHecho`, `agenda_sustituir`, `agenda_historial` | PV-RN-13: Programación con padre A y celebración con B; CA-11 — prevista, no ejecutada |
| RN-14 | src/modules/agenda/; A/D, P/I según efecto | `agenda_crearHorario`, `agenda_editarHorario`, `agenda_celebraciones`, `agenda_registrarHecho`, `agenda_corregirHecho` | PV-RN-14: Registro y consulta de hora local; CA-10 — prevista, no ejecutada |
| RN-15 | src/modules/diezmos/; A/D, P/I según efecto | `diezmos_registrar`, `diezmos_consultar`, `diezmos_corregir`, `diezmos_historial` | PV-RN-15: Duplicado, no celebrada y correcciones; CA-12 — prevista, no ejecutada |
| RN-16 | src/modules/diezmos/; A/D, P/I según efecto | `diezmos_reporte`, `diezmos_extremos` | PV-RN-16: Acceso cruzado denegado y sumas exactas; CA-13 — prevista, no ejecutada |
| RN-17 | src/modules/solicitudes/; A/D, P/I según efecto | `solicitudes_ofertas`, `solicitudes_altaOferta`, `solicitudes_editarOferta`, `solicitudes_listarPrivado`, `solicitudes_detallePrivado`, `solicitudes_cotizar`, `solicitudes_sinLugar` | PV-RN-17: Oferta sin precio y cotización individual; CA-14 — prevista, no ejecutada |
| RN-18 | src/modules/solicitudes/; A/D, P/I según efecto | `solicitudes_alta`, `solicitudes_seguimiento` | PV-RN-18: Alta sin cuenta y seguimiento con clave; CA-14 — prevista, no ejecutada |
| RN-19 | src/modules/solicitudes/; A/D, P/I según efecto | `solicitudes_listarPrivado`, `solicitudes_detallePrivado`, `solicitudes_cotizar`, `solicitudes_sinLugar` | PV-RN-19: Respuesta con lugar y sin lugar; CA-14 — prevista, no ejecutada |
| RN-20 | src/modules/solicitudes/; A/D, P/I según efecto | `solicitudes_aceptar`, `solicitudes_rechazar`, `solicitudes_seguimiento`, `solicitudes_detallePrivado`, `solicitudes_cancelar` | PV-RN-20: Vencimiento sin respuesta y decisión durante vigencia; CA-15 — prevista, no ejecutada |
| RN-21 | src/modules/solicitudes/; A/D, P/I según efecto | `solicitudes_cancelar` | PV-RN-21: Cancelación previa y rechazo de cancelación posterior; CA-15 — prevista, no ejecutada |
| RN-22 | src/modules/identidad/, src/modules/diezmos/, src/modules/solicitudes/; A/D, P/I según efecto | `identidad_login`, `identidad_usuarios`, `identidad_alta`, `identidad_editar`, `diezmos_reporte`, `diezmos_extremos`, `solicitudes_seguimiento`, `solicitudes_listarPrivado`, `solicitudes_detallePrivado`, `solicitudes_cotizar`, `solicitudes_sinLugar` | PV-RN-22: Anonimato público y matriz por rol e iglesia; CA-04 — prevista, no ejecutada |

## Evidencia ejecutable separada de aceptación

La [suite de esquemas](../../arnes-codex/tests/schema-regression.test.mjs) contiene los IDs citados arriba; valida muestras y forma de contrato, no criterios PV. Las salidas verificables se entregan en evidencias de revisión 02. Los conteos de RF/PC/operaciones acreditan referencias, no cobertura funcional. Las pruebas de arquitectura del arnés verifican fixtures de herramientas y no sustituyen pruebas de aislamiento/BD.

Las demás filas RNF/CT/DES/EXT de la extracción inicial conservan su trazabilidad histórica. H09/H10 y las PC se atienden en los listados manuales; los extras no se convierten en alcance aprobado.
