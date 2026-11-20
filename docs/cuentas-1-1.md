# Ecclesia 1.1 — probar cuentas y permisos

Esta etapa se prepara en `feat/ecclesia-1-1-cuentas` de aplicación y arnés. No está integrada en main ni desplegada. El usuario confirma una instalación Render previa; este trabajo solo utiliza bases efímeras locales.

## Recorrido

1. Con ambos repositorios en la misma rama y dependencias instaladas, ejecutar `npm run db:demo` en la aplicación. Usa su propia base `.demo`, aplica migraciones aditivas y conserva las ediciones anteriores. No utiliza DATABASE_URL ajena. El directorio lleva ahora al login.
2. Elegir **Crear una cuenta**, indicar un identificador de 3–80 caracteres ASCII y contraseña de al menos 15 caracteres (máximo 72 bytes UTF-8). Se crea exclusivamente VISITANTE, sin asignar una iglesia ni privilegios. Entrar con esa cuenta.
3. Consultar directorio, filtros y ficha. **Mi cuenta** permite cambiar nombre visible, presentación y elegir un símbolo local. Guardar y recargar comprueba persistencia. Abrir dos pestañas y editar la misma versión: una debe pedir recargar, conservando el cambio ya guardado.
4. Como visitante, abrir una ruta de gestión: el front dirige al admin para la navegación; el admin requiere una cuenta de personal y rechaza al visitante. API exige sesión y conserva los permisos del servidor.
5. Con ADMIN_IGLESIA o TESORERO sintético de `.demo/accesos-locales.json`, entrar al personal: la iglesia asignada se muestra por nombre en el panel/perfil. No se puede modificar ese ámbito desde el perfil. Coordinación conserva gestión de cuentas y catálogos.
6. Cerrar sesión y comprobar que el token/sesión anterior dejó de ser válido. Un reinicio del front conserva el perfil y las sesiones no cerradas en PostgreSQL.

## API de cuentas

| Operación | Acceso y resultado |
| --- | --- |
| POST `/api/v1/auth/registro` | JSON identificador/password. 201 VISITANTE sanitizado, 409 repetido, 422 campos inválidos, 429 límite. No instala cookie ni acepta rol/iglesia. |
| POST `/api/v1/auth/login` | Credenciales; bearer revocable de una hora. Las rutas web usan su propia cookie host-only. |
| GET `/api/v1/auth/me` | Cuenta activa actual y token CSRF de esa sesión. |
| GET `/api/v1/cuenta/perfil` | Solo sesión persistida propia. Campos personales, usuarioId y versión; no existe selección de otro usuario. |
| PUT `/api/v1/cuenta/perfil` | nombreVisible, presentacion (strings o null), avatar y version. 409 si cambió. No admite rol, iglesiaId, usuarioId, contraseña o URLs de imagen. |

Perfil privado del titular; no cambia la ficha de una iglesia. Consultas “públicas” significan accesibles a cualquier usuario autenticado. Seguimiento de solicitudes requiere además su folio/clave: registrarse no recupera solicitudes anteriores ni elimina ese secreto.

## Validación y actualización futura

Desde arnes-codex ejecutar `npm run check -- ../proyecto-ecclesia`. Incluye suites previas, cuentas, migraciones/rollback/concurrencia, contratos y tres entrypoints compilados con login obligatorio. Se añaden pruebas de formularios/CSRF/XSS y de un reinicio real del front en la base efímera. Resultados efectivamente ejecutados: [estado del producto](estado-producto.md).

Para Render se necesitará primero revisión e integración explícita de esta rama, copia de seguridad y despliegue autorizado de la misma revisión en API/front/admin. API aplicará la migración aditiva; el resto debe actualizarse coordinadamente. No ejecutar `db:demo`, seed ni provisión de cuentas en la base real por este instructivo. No se realizó ninguna de esas operaciones remotas.

Decisiones, compatibilidad de las regresiones históricas y límites: [ADR 011](adr/011.md).
