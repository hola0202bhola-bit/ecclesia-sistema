# Servicios y pláticas — RF13–RF15

2 de noviembre de 2026, America/Mexico_City. Bases clonadas y verificadas: aplicación `f52b222a32317b133c37e8c4238e56a957bb87be`, arnés `1d77b726ba1b2bd5a560780cfb77e793857b6d5c`. Se conservan los dos repositorios y los párrafos originales P078–079; no se atribuyen decisiones nuevas al cliente.

## Probar desde la aplicación

Actualizar ambos repositorios con `git pull --ff-only` y ejecutar `npm ci` en cada uno. En la aplicación: `npm run generate`, `npm run db:migrate`, `npm run db:seed`, `npm run build`, `npm start`. Conservar la base y configuración existentes; la migración es aditiva. Las cuentas existentes siguen funcionando. Para una instalación nueva, seguir el README para crear Coordinación local y después un administrador asignado a una iglesia.

1. Iniciar sesión como **ADMIN_IGLESIA** → **Gestionar servicios** → **Registrar servicio**. Seleccionar tipo, nombre, aportación, moneda, requisitos, duración, cita y horarios por día. Para otros servicios, elegir **Otro servicio** y describirlo con su nombre.
2. **Gestionar pláticas** → **Registrar plática**. Seleccionar el tipo y registrar número de sesiones, costo, moneda, cupo, lugar, impartidor y horarios. Costo cero indica gratuita. No hay inscripciones.
3. En ambos listados, **Editar** permite mantener todos los datos. Un conflicto devuelve 409, conserva lo escrito y ofrece abrir la versión actual en otra pestaña para comparar. No reintentar sustituyendo automáticamente la versión.
4. Sin sesión: **Iglesias** → seleccionar estado e iglesia → **Consultar servicios** o **Consultar pláticas**. Se muestran todos los campos informativos, con paginación. También hay enlaces entre ambas consultas.

La migración instala siete tipos de servicio (seis ejemplos de P078 y la categoría técnica Otro servicio) y cuatro tipos de preparación de P079. El seed conserva sus datos previos: no crea ofertas, usuarios ni precios supuestamente reales. Las ofertas se registran desde la aplicación. Las cantidades finales de P211–214 siguen pendientes.

## Alcance y decisiones revisables

| Fuente | Función implementada | Comprobación reproducible |
| --- | --- | --- |
| P078, RF13, RN11 | Alta/edición de oferta por iglesia; fijo, gratuito o donativo voluntario | `tests/servicios.test.ts`: modalidades, importes exactos, requisitos/duración/cita y horarios |
| P079, RF14 | Tipo, número de sesiones, costo, cupo, lugar, impartidor y varios días/horas | Alta/lectura/edición HTTP, tipos de la fuente y recorrido EJS |
| P061/P092, RF15 | Consultas públicas sin cuenta desde la ficha | JSON/EJS reales y contrato de respuestas |
| P093, RNF02 | Solo administrador propio; Coordinación y tesorero sin gestión inferida | Rechazos HTTP, acceso a recursos ajenos y vistas privadas |
| Concurrencia del diseño | Versión esperada, incremento y auditoría privados en la misma transacción | Dos ediciones simultáneas: 200/409; fallo de auditoría revierte datos/horarios/versión |
| Seguridad web existente | Sesiones reales, CSRF/Origin, validación estricta y EJS escapado | Cookie/formularios/API con entradas positivas y negativas |

Perfil técnico: campos informativos completos, textos acotados y nombres de tipos estables. Requisitos sin exigencias deben decirlo explícitamente; no se rellena información ausente. Horarios semanales locales, lunes=1 en API, uno o varios por día; pares idénticos rechazados. El número de sesiones es un dato de la preparación; no genera fechas individuales ni exige asistencia. No se infieren restricciones de traslape entre ofertas o impartidores.

Importes en `Decimal(11,2)` PostgreSQL y cadenas decimales en JSON; hasta nueve enteros y dos decimales, sin flotantes. Moneda de tres letras mayúsculas ingresada expresamente; sin moneda predeterminada ni conversión. Fijo requiere importe positivo; gratuito y donativo requieren `null`, nunca una tarifa de donativo. Pláticas admiten costo cero y cupo cero informativo, sin convertir cupo en disponibilidad o reservas. Son decisiones técnicas revisables, no respuestas a PC-13 ni reglas contables para diezmos.

Persistencia: `ServicioOfrecido`, `Platica`, catálogos y tablas de horarios con FK/CHECK/clave compuesta; `CambioOferta` guarda antes/después, actor y fecha. La auditoría se incorpora como coherencia técnica con el diseño versionado; P078–079 no ordenan un historial particular. No hay API pública de auditoría. Lecturas paginadas usan snapshot repetible; escrituras bloquean la fila de iglesia, comprueban cierre/ámbito del recurso y versión, y reemplazan horarios junto con la auditoría. El bloqueo serializa con edición de la iglesia. Se reutiliza la autorización actual por petición de Identidad.

Pendientes: PC-09 (relación servicio–preparación, asistencia, inscripciones/reservas), PC-22 (administración/ampliación general de tipos), horarios fechados/excepciones, retirada/borrado y políticas durante cierre. Iglesias cerradas no publican ni admiten gestión, según bloqueo vigente PC-04. Sin privilegios nuevos, cobros, agenda de sacerdotes ni cambios al índice patrimonial. La consulta municipal de pláticas DES-01 sigue deseable fuera de este incremento. No se declara aceptación docente, prueba móvil física, carga ni despliegue.

## API y validación

Prefijo `/api/v1`: GET/POST `/iglesias/:iglesiaId/servicios` y `/platicas`; PATCH de cada recurso en `/:recursoId`. GET es público y paginado (`page`, `pageSize` hasta 100); POST/PATCH usan sesión real/bearer del administrador propio. PATCH exige `version` y al menos un cambio; la validez de la aportación se comprueba contra el agregado resultante. `horarios` reemplaza el conjunto completo. Respuestas sin datos de auditoría ni identidad privada. Catálogos de lectura en `/catalogos/tipos-servicio` y `/catalogos/tipos-platica`.

DTO y respuestas ejecutables en `openapi.yaml` y `docs/api-referencia-revision03.json`; PC residuales permanecen abiertas. Código por capas en `src/modules/servicios`, composición compartida y vistas `oferta*.ejs`. El arnés exige suite, migración y vistas; ejecuta PostgreSQL, smoke del servidor compilado y pruebas del contenido preparado en Git. Comando integral: desde arnés, `npm run check -- ../proyecto-ecclesia`. Resultados finales en [estado del producto](estado-producto.md).
