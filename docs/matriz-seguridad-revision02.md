RF22–24 implementados sin cambiar la política de roles previa: TESORERO propio en captura/corrección/consulta/historial; ADMIN_IGLESIA y TESORERO propios en reportes. Coordinación denegada. La matriz siguiente conserva las rutas; disponibilidad y DTO reales en OpenAPI/subconjunto y [ADR009](adr/009.md).

# Matriz explícita de rutas — revisión 02

Fecha: 2026-11-01. Línea base del contrato recibido, sin ampliar permisos ni cerrar PC-19. El comprobador compara método, ruta, operationId, roles y cada alternativa de autenticación contra `arnes-codex/stacks/express/ecclesia-security-policy.json`. Las alternativas OpenAPI son OR: una alternativa vacía expondría una ruta. Esta matriz no prueba autorización ni ámbito en un servidor.

| Método/ruta | Operación | Roles propuestos | Autenticación |
| --- | --- | --- | --- |
| `POST /auth/login` | identidad_login | PUBLICO | Pública, sin credencial |
| `GET /usuarios` | identidad_usuarios | COORDINACION | PersonalJWT |
| `POST /usuarios` | identidad_alta | COORDINACION | PersonalJWT |
| `PATCH /usuarios/{usuarioId}` | identidad_editar | COORDINACION | PersonalJWT |
| `GET /catalogos/estados` | catalogos_estados | PUBLICO | Pública, sin credencial |
| `GET /catalogos/municipios` | catalogos_municipios | PUBLICO | Pública, sin credencial |
| `GET /catalogos/localidades` | catalogos_localidades | PUBLICO | Pública, sin credencial |
| `GET /catalogos/{catalogo}` | catalogos_tipos | PUBLICO | Pública, sin credencial |
| `POST /catalogos/{catalogo}` | catalogos_alta | COORDINACION | PersonalJWT |
| `PATCH /catalogos/{catalogo}/{itemId}` | catalogos_editar | COORDINACION | PersonalJWT |
| `GET /iglesias` | iglesias_buscar | PUBLICO | Pública, sin credencial |
| `POST /iglesias` | iglesias_alta | COORDINACION | PersonalJWT |
| `GET /iglesias/{iglesiaId}` | iglesias_ficha | PUBLICO | Pública, sin credencial |
| `PATCH /iglesias/{iglesiaId}` | iglesias_editar | COORDINACION, ADMIN_IGLESIA | PersonalJWT |
| `POST /iglesias/{iglesiaId}/cerrar` | iglesias_cerrar | COORDINACION, ADMIN_IGLESIA | PersonalJWT |
| `POST /iglesias/{iglesiaId}/reabrir` | iglesias_reabrir | COORDINACION, ADMIN_IGLESIA | PersonalJWT |
| `GET /ranking-patrimonial` | patrimonio_ranking | PUBLICO | Pública, sin credencial |
| `GET /iglesias/por-patrimonio` | patrimonio_buscar | PUBLICO | Pública, sin credencial |
| `GET /iglesias/{iglesiaId}/objetos` | patrimonio_objetos | PUBLICO | Pública, sin credencial |
| `POST /iglesias/{iglesiaId}/objetos` | patrimonio_altaObjeto | ADMIN_IGLESIA | PersonalJWT |
| `PATCH /iglesias/{iglesiaId}/objetos/{objetoId}` | patrimonio_editarObjeto | ADMIN_IGLESIA | PersonalJWT |
| `PUT /iglesias/{iglesiaId}/objetos/{objetoId}/condicion` | patrimonio_condicion | ADMIN_IGLESIA | PersonalJWT |
| `GET /criterios-patrimoniales` | patrimonio_criterios | COORDINACION | PersonalJWT |
| `POST /criterios-patrimoniales` | patrimonio_crearCriterio | COORDINACION | PersonalJWT |
| `PUT /criterios-patrimoniales/{criterioId}` | patrimonio_editarCriterio | COORDINACION | PersonalJWT |
| `POST /criterios-patrimoniales/{criterioId}/activar` | patrimonio_activar | COORDINACION | PersonalJWT |
| `GET /iglesias/{iglesiaId}/servicios` | servicios_servicios | PUBLICO | Pública, sin credencial |
| `POST /iglesias/{iglesiaId}/servicios` | servicios_altaServicio | ADMIN_IGLESIA | PersonalJWT |
| `PATCH /iglesias/{iglesiaId}/servicios/{recursoId}` | servicios_editarServicio | ADMIN_IGLESIA | PersonalJWT |
| `GET /iglesias/{iglesiaId}/platicas` | servicios_platicas | PUBLICO | Pública, sin credencial |
| `POST /iglesias/{iglesiaId}/platicas` | servicios_altaPlatica | ADMIN_IGLESIA | PersonalJWT |
| `PATCH /iglesias/{iglesiaId}/platicas/{recursoId}` | servicios_editarPlatica | ADMIN_IGLESIA | PersonalJWT |
| `GET /iglesias/{iglesiaId}/sacerdotes` | agenda_sacerdotes | ADMIN_IGLESIA | PersonalJWT |
| `POST /iglesias/{iglesiaId}/sacerdotes` | agenda_asignar | ADMIN_IGLESIA | PersonalJWT |
| `PATCH /iglesias/{iglesiaId}/sacerdotes/{sacerdoteId}` | agenda_editarSacerdote | ADMIN_IGLESIA | PersonalJWT |
| `GET /sacerdotes/{sacerdoteId}/agenda` | agenda_semanal | ADMIN_IGLESIA | PersonalJWT |
| `GET /iglesias/{iglesiaId}/horarios-misa` | agenda_horarios | PUBLICO | Pública, sin credencial |
| `POST /iglesias/{iglesiaId}/horarios-misa` | agenda_crearHorario | ADMIN_IGLESIA | PersonalJWT |
| `PATCH /iglesias/{iglesiaId}/horarios-misa/{horarioId}` | agenda_editarHorario | ADMIN_IGLESIA | PersonalJWT |
| `GET /iglesias/{iglesiaId}/celebraciones` | agenda_celebraciones | ADMIN_IGLESIA | PersonalJWT |
| `POST /iglesias/{iglesiaId}/celebraciones` | agenda_registrarHecho | ADMIN_IGLESIA | PersonalJWT |
| `PATCH /iglesias/{iglesiaId}/celebraciones/{celebracionId}` | agenda_corregirHecho | ADMIN_IGLESIA | PersonalJWT |
| `POST /iglesias/{iglesiaId}/celebraciones/{celebracionId}/sustituciones` | agenda_sustituir | ADMIN_IGLESIA | PersonalJWT |
| `GET /iglesias/{iglesiaId}/celebraciones/{celebracionId}/sustituciones` | agenda_historial | ADMIN_IGLESIA | PersonalJWT |
| `POST /iglesias/{iglesiaId}/celebraciones/{celebracionId}/diezmo` | diezmos_registrar | TESORERO | PersonalJWT |
| `GET /iglesias/{iglesiaId}/celebraciones/{celebracionId}/diezmo` | diezmos_consultar | TESORERO | PersonalJWT |
| `PUT /iglesias/{iglesiaId}/celebraciones/{celebracionId}/diezmo` | diezmos_corregir | TESORERO | PersonalJWT |
| `GET /iglesias/{iglesiaId}/celebraciones/{celebracionId}/diezmo/correcciones` | diezmos_historial | TESORERO | PersonalJWT |
| `GET /iglesias/{iglesiaId}/reportes/diezmos` | diezmos_reporte | ADMIN_IGLESIA, TESORERO | PersonalJWT |
| `GET /iglesias/{iglesiaId}/ofertas-espacio` | solicitudes_ofertas | PUBLICO | Pública, sin credencial |
| `POST /iglesias/{iglesiaId}/ofertas-espacio` | solicitudes_altaOferta | ADMIN_IGLESIA | PersonalJWT |
| `PATCH /iglesias/{iglesiaId}/ofertas-espacio/{ofertaId}` | solicitudes_editarOferta | ADMIN_IGLESIA | PersonalJWT |
| `POST /iglesias/{iglesiaId}/solicitudes` | solicitudes_alta | PUBLICO | Pública, sin credencial |
| `GET /iglesias/{iglesiaId}/solicitudes` | solicitudes_listarPrivado | ADMIN_IGLESIA | PersonalJWT |
| `GET /solicitudes/{folio}` | solicitudes_seguimiento | SOLICITANTE | SolicitudClave |
| `GET /iglesias/{iglesiaId}/solicitudes/{solicitudId}` | solicitudes_detallePrivado | ADMIN_IGLESIA | PersonalJWT |
| `POST /iglesias/{iglesiaId}/solicitudes/{solicitudId}/cotizaciones` | solicitudes_cotizar | ADMIN_IGLESIA | PersonalJWT |
| `POST /iglesias/{iglesiaId}/solicitudes/{solicitudId}/sin-lugar` | solicitudes_sinLugar | ADMIN_IGLESIA | PersonalJWT |
| `POST /solicitudes/{folio}/aceptar` | solicitudes_aceptar | SOLICITANTE | SolicitudClave |
| `POST /solicitudes/{folio}/rechazar` | solicitudes_rechazar | SOLICITANTE | SolicitudClave |
| `POST /solicitudes/{folio}/cancelar` | solicitudes_cancelar | SOLICITANTE | SolicitudClave |
| `GET /iglesias/{iglesiaId}/reportes/diezmos/extremos` | diezmos_extremos | ADMIN_IGLESIA, TESORERO | PersonalJWT |
