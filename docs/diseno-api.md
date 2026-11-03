RF22–24 operativo según [ADR009](adr/009.md): las cinco operaciones registrar/consultar/corregir/historial/reporte conservan sus rutas y permisos. El contrato ejecutable usa cadenas de importe/centavos, versión y promedio racional. Consulta del reporte: periodo DIA/SEMANA/MES, desglose NINGUNO/HORARIO/SACERDOTE/HORARIO_SACERDOTE, desde/hasta y filtros de UUID opcionales; límite 366 días/10000 misas sin truncamiento. Sin paginación de reporte/historial en este subalcance; extremos incluidos con todos sus empates. La ruta separada de extremos paginados y los antiguos DTO de diseño siguen propuestos, no son aliases ejecutables.

API ejecutable RF16–21: rutas /iglesias/{iglesiaId}/misas y /iglesias/{iglesiaId}/agenda documentadas en OpenAPI y subconjunto; administrador propio y consulta pública explícitos. [Uso y límites](adr/008.md). Las rutas antiguas propuestas de agenda no se habilitan como alias.

RF13–15 implementados en el subalcance informativo: [guía vigente](incremento-servicios.md), ADR007 y DTO ejecutables en OpenAPI. Las descripciones de propuesta que siguen se conservan como antecedentes; PC-09/22 permanecen abiertas.

> Vista histórica conservada de revisión 01/02. Para estado vigente consultar decisiones-pc-revision03.md, consultas-docente-revision03.md, referencia-iglesias-revision03.md y trazabilidad-revision03.md. Las afirmaciones anteriores de ausencia total de producto/23 preguntas docentes no describen revisión 03.

# Diseño preliminar de API REST

Contrato fuente: [openapi.yaml](../openapi.yaml), OpenAPI 3.1.1 escrito como JSON válido también en YAML. La API no está implementada. IDs, rutas, nombres, paginación y códigos HTTP son decisiones técnicas propuestas; `x-pending` señala PC abiertas. Los esquemas con campos de negocio sin `required` definitivo son intencionadamente preliminares y no deben copiarse como validación final.

## Convenciones para revisión

- Base `/api/v1`, JSON de entrada y salida. Publicar el contrato en Swagger en una entrega futura; importarlo hoy no acredita endpoints.
- Listados con `page` desde 1, `pageSize` propuesto 20, máximo técnico propuesto 100 y respuesta `{data,meta:{page,pageSize,total}}`. La ficha integra datos y enlaces a recursos paginados, sin descargar todas las relaciones. Los grupos del reporte usan su propia página y los empates de máximos/mínimos se consultan en una colección paginada de extremos; PC-13 fija su semántica.
- Un solo error `{code,message,details:[{field,reason}]}`. 400 para sintaxis, 401 para credencial, 403 para permiso, 404 para recurso no visible, 409 para versión/duplicado/estado, 422 para datos o regla de negocio, 429 para limitación de intentos. No enviar SQL, stack traces, claves ni contactos en errores.
- JWT de personal expirable y clave de solicitud en `X-Solicitud-Clave`; folio solo identifica. Sin credenciales en query strings. Seguimiento y respuestas privadas con `Cache-Control: no-store`. El alta devuelve la clave una sola vez; las demás proyecciones no tienen ese campo.
- La operación determina el rol permitido y el servidor verifica el ámbito. El administrador edita su iglesia; Coordinación solo las capacidades expresas. No dar acceso nacional a solicitudes o diezmos por ser Coordinación. PC-19 puede modificar la matriz tras una respuesta real.
- Dinero como cadena de decimal exacto, con moneda explícita pendiente PC-13. Instantes ISO 8601 con zona, recurrencia como día y hora civil de iglesia. No aceptar `actorId` del cliente: lo toma el servidor de las credenciales.
- Cambios concurrentes usan `version` esperada y devuelven la actual; el servicio actualiza y audita dentro de transacción. Las rutas PATCH de negocio todavía requieren concretar validación parcial/control de versión por recurso antes de implementar.
- Registrar rutas literales como `/iglesias/por-patrimonio` antes de `/{iglesiaId}`. No incluir DELETE de iglesias/objetos como sustituto del cierre o baja histórica.

## Operaciones propuestas

Los permisos de la tabla son una propuesta conservadora basada en P092–P093. Donde hay PC pendiente, el contrato no autoriza implementar la capacidad ambigua. Agenda de sacerdote interna provisional, edición de identidad compartida, cierre/reapertura y lectura de cerradas requieren sus respuestas antes de habilitar rutas.

| Método y ruta relativa | Operación | Acceso propuesto | PC abiertas |
| --- | --- | --- | --- |
| `POST /auth/login` | `identidad_login`: Autenticar personal | PUBLICO | PC-19 |
| `GET /usuarios` | `identidad_usuarios`: Listar usuarios | COORDINACION | PC-19 |
| `POST /usuarios` | `identidad_alta`: Crear cuenta de personal | COORDINACION | PC-19 |
| `PATCH /usuarios/{usuarioId}` | `identidad_editar`: Actualizar usuario y membresías | COORDINACION | PC-19 |
| `GET /catalogos/estados` | `catalogos_estados`: Consultar estados | PUBLICO | PC-01 |
| `GET /catalogos/municipios` | `catalogos_municipios`: Consultar municipios | PUBLICO | PC-01 |
| `GET /catalogos/localidades` | `catalogos_localidades`: Consultar localidades | PUBLICO | PC-01 |
| `GET /catalogos/{catalogo}` | `catalogos_tipos`: Consultar tipos públicos | PUBLICO | PC-22 |
| `POST /catalogos/{catalogo}` | `catalogos_alta`: Administrar catálogo mediante alta | COORDINACION | PC-01, PC-22 |
| `PATCH /catalogos/{catalogo}/{itemId}` | `catalogos_editar`: Actualizar catálogo | COORDINACION | PC-01, PC-22 |
| `GET /iglesias` | `iglesias_buscar`: Listar iglesias activas por estado | PUBLICO | PC-03 |
| `POST /iglesias` | `iglesias_alta`: Registrar iglesia | COORDINACION | PC-01, PC-02 |
| `GET /iglesias/{iglesiaId}` | `iglesias_ficha`: Consultar ficha pública integrada | PUBLICO | PC-04, PC-06 |
| `PATCH /iglesias/{iglesiaId}` | `iglesias_editar`: Mantener datos de iglesia | COORDINACION, ADMIN_IGLESIA | PC-02, PC-19 |
| `POST /iglesias/{iglesiaId}/cerrar` | `iglesias_cerrar`: Cerrar sin borrar historial | COORDINACION, ADMIN_IGLESIA | PC-04 |
| `POST /iglesias/{iglesiaId}/reabrir` | `iglesias_reabrir`: Reabrir sin borrar historial | COORDINACION, ADMIN_IGLESIA | PC-04 |
| `GET /ranking-patrimonial` | `patrimonio_ranking`: Ranking por ámbito geográfico | PUBLICO | PC-05, PC-07, PC-08 |
| `GET /iglesias/por-patrimonio` | `patrimonio_buscar`: Buscar por tipo de objeto y antigüedad | PUBLICO | PC-05, PC-06 |
| `GET /iglesias/{iglesiaId}/objetos` | `patrimonio_objetos`: Consultar objetos publicables | PUBLICO | PC-06 |
| `POST /iglesias/{iglesiaId}/objetos` | `patrimonio_altaObjeto`: Registrar objeto | ADMIN_IGLESIA | PC-02, PC-05 |
| `PATCH /iglesias/{iglesiaId}/objetos/{objetoId}` | `patrimonio_editarObjeto`: Mantener objeto | ADMIN_IGLESIA | PC-02, PC-05 |
| `PUT /iglesias/{iglesiaId}/objetos/{objetoId}/condicion` | `patrimonio_condicion`: Cambiar condición sin borrar objeto | ADMIN_IGLESIA | PC-06 |
| `GET /criterios-patrimoniales` | `patrimonio_criterios`: Listar versiones de criterios | COORDINACION | PC-08 |
| `POST /criterios-patrimoniales` | `patrimonio_crearCriterio`: Preparar versión de criterios | COORDINACION | PC-05, PC-08 |
| `PUT /criterios-patrimoniales/{criterioId}` | `patrimonio_editarCriterio`: Editar borrador de criterios | COORDINACION | PC-08 |
| `POST /criterios-patrimoniales/{criterioId}/activar` | `patrimonio_activar`: Activar criterios sin reprogramar | COORDINACION | PC-08 |
| `GET /iglesias/{iglesiaId}/servicios` | `servicios_servicios`: Consultar servicios y horarios | PUBLICO | PC-09 |
| `POST /iglesias/{iglesiaId}/servicios` | `servicios_altaServicio`: Registrar servicios | ADMIN_IGLESIA | PC-09, PC-13 |
| `PATCH /iglesias/{iglesiaId}/servicios/{recursoId}` | `servicios_editarServicio`: Mantener servicios | ADMIN_IGLESIA | PC-09, PC-13 |
| `GET /iglesias/{iglesiaId}/platicas` | `servicios_platicas`: Consultar platicas y horarios | PUBLICO | PC-09 |
| `POST /iglesias/{iglesiaId}/platicas` | `servicios_altaPlatica`: Registrar platicas | ADMIN_IGLESIA | PC-09, PC-13 |
| `PATCH /iglesias/{iglesiaId}/platicas/{recursoId}` | `servicios_editarPlatica`: Mantener platicas | ADMIN_IGLESIA | PC-09, PC-13 |
| `GET /iglesias/{iglesiaId}/sacerdotes` | `agenda_sacerdotes`: Consultar sacerdotes asignados | ADMIN_IGLESIA | PC-10 |
| `POST /iglesias/{iglesiaId}/sacerdotes` | `agenda_asignar`: Registrar o asignar sacerdote compartido | ADMIN_IGLESIA | PC-10 |
| `PATCH /iglesias/{iglesiaId}/sacerdotes/{sacerdoteId}` | `agenda_editarSacerdote`: Mantener asignación e identidad autorizada | ADMIN_IGLESIA | PC-10 |
| `GET /sacerdotes/{sacerdoteId}/agenda` | `agenda_semanal`: Consultar agenda semanal prevista | ADMIN_IGLESIA | PC-10, PC-11 |
| `GET /iglesias/{iglesiaId}/horarios-misa` | `agenda_horarios`: Consultar misas con padre previsto | PUBLICO | PC-11 |
| `POST /iglesias/{iglesiaId}/horarios-misa` | `agenda_crearHorario`: Programar misa y comprobar traslapes | ADMIN_IGLESIA | PC-10, PC-11 |
| `PATCH /iglesias/{iglesiaId}/horarios-misa/{horarioId}` | `agenda_editarHorario`: Cambiar programación y comprobar traslapes | ADMIN_IGLESIA | PC-11 |
| `GET /iglesias/{iglesiaId}/celebraciones` | `agenda_celebraciones`: Listar hechos celebrados | ADMIN_IGLESIA | PC-12 |
| `POST /iglesias/{iglesiaId}/celebraciones` | `agenda_registrarHecho`: Registrar celebración efectiva | ADMIN_IGLESIA | PC-12 |
| `PATCH /iglesias/{iglesiaId}/celebraciones/{celebracionId}` | `agenda_corregirHecho`: Corregir celebración con autorización histórica | ADMIN_IGLESIA | PC-12 |
| `POST /iglesias/{iglesiaId}/celebraciones/{celebracionId}/sustituciones` | `agenda_sustituir`: Registrar sustitución con autor y motivo | ADMIN_IGLESIA | PC-11, PC-12 |
| `GET /iglesias/{iglesiaId}/celebraciones/{celebracionId}/sustituciones` | `agenda_historial`: Consultar sustituciones | ADMIN_IGLESIA | PC-12 |
| `POST /iglesias/{iglesiaId}/celebraciones/{celebracionId}/diezmo` | `diezmos_registrar`: Registrar único diezmo de misa celebrada | TESORERO | PC-13 |
| `GET /iglesias/{iglesiaId}/celebraciones/{celebracionId}/diezmo` | `diezmos_consultar`: Consultar captura propia | TESORERO | PC-19 |
| `PUT /iglesias/{iglesiaId}/celebraciones/{celebracionId}/diezmo` | `diezmos_corregir`: Corregir diezmo atómicamente con historial | TESORERO | PC-13 |
| `GET /iglesias/{iglesiaId}/celebraciones/{celebracionId}/diezmo/correcciones` | `diezmos_historial`: Consultar auditoría de correcciones | TESORERO | PC-19 |
| `GET /iglesias/{iglesiaId}/reportes/diezmos` | `diezmos_reporte`: Consultar reportes privados de iglesia | ADMIN_IGLESIA, TESORERO | PC-13, PC-19 |
| `GET /iglesias/{iglesiaId}/ofertas-espacio` | `solicitudes_ofertas`: Consultar tipos de espacio sin precios | PUBLICO | Sin PC específica; validación general pendiente |
| `POST /iglesias/{iglesiaId}/ofertas-espacio` | `solicitudes_altaOferta`: Mantener oferta de tipos de espacio | ADMIN_IGLESIA | PC-22 |
| `PATCH /iglesias/{iglesiaId}/ofertas-espacio/{ofertaId}` | `solicitudes_editarOferta`: Actualizar tipo ofrecido | ADMIN_IGLESIA | PC-22 |
| `POST /iglesias/{iglesiaId}/solicitudes` | `solicitudes_alta`: Solicitar espacio sin cuenta | PUBLICO | PC-14, PC-15 |
| `GET /solicitudes/{folio}` | `solicitudes_seguimiento`: Seguir solicitud con folio y clave | SOLICITANTE | PC-15, PC-16, PC-17 |
| `GET /iglesias/{iglesiaId}/solicitudes` | `solicitudes_listarPrivado`: Listar solicitudes privadas propias | ADMIN_IGLESIA | PC-19 |
| `GET /iglesias/{iglesiaId}/solicitudes/{solicitudId}` | `solicitudes_detallePrivado`: Revisar solicitud propia | ADMIN_IGLESIA | PC-17, PC-19 |
| `POST /iglesias/{iglesiaId}/solicitudes/{solicitudId}/cotizaciones` | `solicitudes_cotizar`: Informar precio y condiciones individuales | ADMIN_IGLESIA | PC-13, PC-16, PC-17, PC-18 |
| `POST /iglesias/{iglesiaId}/solicitudes/{solicitudId}/sin-lugar` | `solicitudes_sinLugar`: Informar falta de disponibilidad | ADMIN_IGLESIA | PC-16, PC-18 |
| `POST /solicitudes/{folio}/aceptar` | `solicitudes_aceptar`: Aceptar con seguimiento privado | SOLICITANTE | PC-15, PC-17, PC-18 |
| `POST /solicitudes/{folio}/rechazar` | `solicitudes_rechazar`: Rechazar con seguimiento privado | SOLICITANTE | PC-15, PC-17, PC-18 |
| `POST /solicitudes/{folio}/cancelar` | `solicitudes_cancelar`: Cancelar con seguimiento privado | SOLICITANTE | PC-15, PC-17, PC-18 |

| `GET /iglesias/{iglesiaId}/reportes/diezmos/extremos` | `diezmos_extremos`: Máximos/mínimos paginados | ADMIN_IGLESIA, TESORERO | PC-13, PC-19 |

## Trazabilidad RF a operaciones

- **RF-01**: `iglesias_buscar`.
- **RF-02**: `iglesias_ficha`, `patrimonio_objetos`.
- **RF-03**: `iglesias_alta`, `iglesias_editar`.
- **RF-04**: `iglesias_cerrar`, `iglesias_reabrir`.
- **RF-05**: `catalogos_estados`, `catalogos_municipios`, `catalogos_localidades`, `catalogos_tipos`, `catalogos_alta`, `catalogos_editar`.
- **RF-06**: `identidad_login`, `identidad_usuarios`, `identidad_alta`, `identidad_editar`.
- **RF-07**: `patrimonio_objetos`, `patrimonio_altaObjeto`, `patrimonio_editarObjeto`.
- **RF-08**: `patrimonio_condicion`.
- **RF-09**: `patrimonio_ranking`.
- **RF-10**: `patrimonio_ranking`.
- **RF-11**: `patrimonio_criterios`, `patrimonio_crearCriterio`, `patrimonio_editarCriterio`, `patrimonio_activar`.
- **RF-12**: `patrimonio_buscar`.
- **RF-13**: `servicios_servicios`, `servicios_altaServicio`, `servicios_editarServicio`.
- **RF-14**: `servicios_platicas`, `servicios_altaPlatica`, `servicios_editarPlatica`.
- **RF-15**: `servicios_servicios`, `servicios_platicas`.
- **RF-16**: `agenda_sacerdotes`, `agenda_asignar`, `agenda_editarSacerdote`.
- **RF-17**: `agenda_crearHorario`, `agenda_editarHorario`.
- **RF-18**: `agenda_crearHorario`, `agenda_editarHorario`, `agenda_sustituir`.
- **RF-19**: `agenda_semanal`, `agenda_horarios`.
- **RF-20**: `agenda_celebraciones`, `agenda_registrarHecho`, `agenda_corregirHecho`.
- **RF-21**: `agenda_registrarHecho`, `agenda_corregirHecho`, `agenda_sustituir`, `agenda_historial`.
- **RF-22**: `diezmos_registrar`, `diezmos_consultar`.
- **RF-23**: `diezmos_corregir`, `diezmos_historial`.
- **RF-24**: `diezmos_reporte`, `diezmos_extremos`.
- **RF-25**: `solicitudes_ofertas`, `solicitudes_altaOferta`, `solicitudes_editarOferta`.
- **RF-26**: `solicitudes_alta`.
- **RF-27**: `solicitudes_seguimiento`.
- **RF-28**: `solicitudes_listarPrivado`, `solicitudes_detallePrivado`, `solicitudes_cotizar`, `solicitudes_sinLugar`.
- **RF-29**: `solicitudes_aceptar`, `solicitudes_rechazar`.
- **RF-30**: `solicitudes_seguimiento`, `solicitudes_detallePrivado`, `solicitudes_aceptar`, `solicitudes_rechazar`, `solicitudes_cancelar`.
- **RF-31**: `solicitudes_cancelar`.

RF-09 se evalúa al devolver índice/distinción de ranking y ficha; no exige un endpoint público que acepte criterios arbitrarios. RF-30 se aplica en lectura y decisiones, no mediante un endpoint público «vencer». La programación automática de misas, inventario físico y correo son opcionales y no se incluyen como rutas obligatorias.

## Ejemplos técnicos sin datos reales

```json
{"code":"VERSION_CONFLICT","message":"El registro cambió; vuelve a consultarlo.","details":[]}
```

```json
{"data":[],"meta":{"page":1,"pageSize":20,"total":0}}
```

El índice patrimonial de aceptación usa 2026 y 35.5 conforme al caso; producción necesita PC-05/08. No se define un ejemplo de solicitud con contacto real ni un vencimiento que invente la frontera temporal.

## Revisión antes de generar controladores

Resolver los `x-pending` del incremento, cerrar DTO y proyecciones privadas/públicas, revisar proyecciones y semántica de extremos del reporte y definir transporte de sesión web. Después implementar un endpoint a la vez con pruebas de API y persistencia real en BD de prueba. Validar este archivo solo comprueba el contrato, no reglas ejecutadas, aislamiento o cobertura.

## Referencias técnicas consultadas

- [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html): estructura del contrato y esquemas de seguridad. No se afirma que sea la última versión.
- [Reglas de dependency-cruiser](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md): configuración del arnés.
- [Ciclo de versiones Node.js](https://github.com/nodejs/Release/blob/main/README.md): usar una rama LTS compatible al fijar el stack.


## Revisión 02: precisiones técnicas del contrato (1 de noviembre de 2026)

Se conserva el texto de revisión inicial como contexto histórico. La propuesta técnica vigente se detalla en [contrato-revision02.md](contrato-revision02.md); no constituye respuesta ni aprobación docente. El contrato 0.2.0 separa CreateInput/PatchInput, exige una versión esperada en modificaciones y devuelve version en sus proyecciones mutables. La respuesta 409 representa un conflicto de concurrencia; no se adopta ETag/If-Match. Criterio separa numeroVersionConfiguracion, identificador lógico de configuración, de version, contador de concurrencia. CotizacionInput.version se refiere a la solicitud que se modifica.

Los CreateInput rechazan objetos vacíos y las propiedades tipadas inválidas. Esto no cierra qué campos del negocio deben ser obligatorios: conservar x-pending y consultar la tabla de campos pendientes. Los PatchInput exigen version y al menos un campo permitido; no aplican valores por defecto a campos omitidos. HorarioMisaCreateInput declara duración por defecto 60, que el futuro servidor debe aplicar y probar; hoy solo existe el contrato.

HorarioMisa contiene sacerdotePrevisto con id y nombre públicos, obligatorio para RF-19, sin publicar la agenda ni contactos privados. Su GET mantiene security=[] y dispone de un ejemplo ficticio validado por esquema. Esta comprobación no es una petición HTTP anónima a una API desplegada.

Iglesia admite indice/distincion/criterioId/referenciaTemporal conjuntamente mediante dependentRequired: si aparece un dato del cálculo deben aparecer los otros. No se presume un cálculo ya realizado en todas las fichas. El año 2026 permanece solo en el ejemplo de aceptación, nunca como valor por defecto de producción.

La [matriz vigente](trazabilidad-revision02.md) reemplaza las rutas lógicas anteriores para planificar implementación; los IDs PV siguen previstos y no acreditan ejecución de producto.
