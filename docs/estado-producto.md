# Estado de la aplicación y siguiente incremento

Incremento Iglesias web/catálogos, 1 de noviembre de 2026. Bases remotas verificadas: aplicación `e3337c7d4475f29ad749b4b4fcc40732398ec3b0`, arnés `7bdea6311a295f1ff64be3e8f64a3d5455559032`. Mismos repositorios; requisitos y fuentes originales preservados. Los apartados de identidad siguientes conservan su procedencia.

Disponible en EJS: listado paginado por estado para Coordinación, alta/edición con Zod, tipos/ubicaciones por nombre, conservación de campos y conflicto 409 sin sobrescritura. Administrador solo lista/edita su iglesia; tesorero y anónimo rechazados. Se reutilizan servicio, FK, versiones transaccionales y sesiones; Origin/CSRF y escapes EJS. Sin permisos nuevos ni gestión de cerradas.

Fuentes: `prisma/fuentes/manifest.json` con URL, consulta, conteos y SHA-256 de respuestas originales. Snapshot INEGI: 32 estados, 2,478 municipios y una localidad (211140001); metadatos estadísticos Censo 2020, sin afirmar vigencia territorial completa actual. Seis tipos de P063. Importación local validada, transaccional y versionada con `db:seed`; consulta API paginada y selectores web. Catálogo nacional de localidades y administración general pendientes; alta limitada a localidades cargadas.

Verificación final ejecutada: `npm run check -- ../proyecto-ecclesia` desde el arnés, salida 0. **78/78 pruebas del arnés y 149/149 del producto** (70 Iglesias, 30 Identidad, 49 gestión/catálogos), sin omitidas. PostgreSQL 18.6 real aislado: tres migraciones, doble seed, actualización desde esquema anterior conservando iglesia/usuario, rollback de importación y concurrencia HTTP. Contratos y 22 fuentes analizadas sin violaciones; lint, formato y compilación estricta aprobados. Cobertura de 21 fuentes: líneas 98.66%, sentencias 98.49%, funciones 100%, ramas 92.60%; server.ts excluido de instrumentación y comprobado con smoke HTTP compilado. Hook: positivo y rechazos de índice preparados aprobados, sin alterar índice/archivos. Reportes locales reproducibles en evidence/vitest.json, evidence/database.json y coverage/coverage-summary.json (excluidos de Git). No se ejecutaron pruebas manuales de navegador/móvil, carga ni despliegue HTTPS.

1 de noviembre de 2026, America/Mexico_City. Prioridad confirmada por el alumno: **dos repositorios**, aplicación y arnés. Se conservan especificación y antecedentes. P017 enumera otros entregables en el documento original, pero no se los impone como entregas separadas en esta continuación. No se exige ceremonia de Fase 0 para desarrollar. Ninguna decisión técnica se atribuye a las profesoras.

Inspección inicial real: sistema `acc6cd353512ddfdb0e330083f83f4843e990e0b`, arnés `dcf5cbbbd38c5c74ce11209f62dc883f0da7e961`, clonados de sus remotos. Ambos tenían Iglesias mínimo y gate; no había login/cuentas. El DOCX binario no está en esos árboles Git; se consultó la transcripción íntegra `fuentes/caso-parrafos.md` con hash de procedencia y las figuras, sin afirmar un cotejo nuevo contra el binario ausente.

| Obligatorio y fuente | Evidencia inicial | Tras este incremento |
| --- | --- | --- |
| RF01–04: iglesias, ficha y cierre; P063–065 | `src/modules/iglesias`, 70 pruebas reales sobre PostgreSQL | Consulta, alta/edición EJS y API; ficha integrada y cierre pendientes |
| RF05: catálogos INEGI; P063/P092 | Migración y seed: seis tipos y una localidad oficial | Estados y municipios del snapshot oficial consultables; localidades nacionales y administración general pendientes |
| RF06: autenticación, usuarios y aislamiento; P022/P092–093/P130 | Solo JWT externo; sin cuentas/login | Login/logout, sesiones persistidas, perfil, lista paginada y alta por Coordinación; UI de personal y usuarios. Edición/desactivación/recuperación y roles múltiples pendientes |
| RF07–12: patrimonio, índice y ranking; P067–076 | Contratos/ADR; sin código | Pendiente; ejemplo 35.5 y fórmula escritos no requieren nuevas respuestas |
| RF13–15: servicios y pláticas; P078–079 | Solo diseño | Pendiente |
| RF16–21: padres, horarios y celebraciones; P081–083 | Solo diseño | Pendiente; requiere iglesias/zona e identidad |
| RF22–24: diezmos y reportes; P085–086 | Solo diseño | Pendiente; depende de celebraciones e identidad |
| RF25–31: espacios, solicitudes y cotizaciones; P088–090 | Solo diseño | Pendiente; depende de iglesias e identidad para personal; visitante sin cuenta |

Orden por dependencias: identidad → iglesias/catálogos → patrimonio e índice → servicios/pláticas y agenda → diezmos; espacios/solicitudes es otra rama a partir de iglesias e identidad. MVP factible inmediato: consulta pública + acceso del personal + gestión básica de iglesias y cuentas; la base de acceso y la gestión EJS/API de iglesias ya están disponibles. Un MVP del negocio más amplio requiere además oferta/horarios y ficha integrada; no se presenta el primer incremento como sistema terminado. P095 y extras del curso siguen separados de lo obligatorio.

Los datos de entrega P200–225 siguen incompletos: se cargaron los estados y municipios del snapshot INEGI y la localidad inicial; faltan nuevas localidades, 40 iglesias en 3 estados/8 municipios y todos los tipos, 120 objetos (15 de 200+ años, 5 de 300+), cuatro servicios y dos tipos de pláticas por iglesia, 15 sacerdotes (3 compartidos), misas cada día, cuatro semanas de celebraciones/diezmos en seis iglesias, 12 solicitudes cubriendo estados y un usuario por rol. El seed actual no cubre esas cantidades; la provisión inicial de este incremento no se presenta como seed final de usuarios.

## Trazabilidad del incremento de identidad

| Regla | Implementación | Prueba real |
| --- | --- | --- |
| P092: Coordinación administra usuarios, sin registro público | `identidad/application/servicio.ts`, router, migración Usuario | `identidad.test.ts`: altas/listado, roles prohibidos, duplicado concurrente, sin bootstrap HTTP |
| P093: administrador solo su iglesia; tesorero sin edición inferida | sesión obtiene rol/ámbito desde Usuario; servicio Iglesias intacto | Login real de administrador y tesorero; edición propia, rechazo de otra iglesia y de tesorero |
| P130: bcrypt, JWT expirable, validación | bcrypt costo 12, DTO Zod, JWT HS256 1h, tabla Sesion | Hash verificable, rechazos de entrada, firma/issuer/audience/exp/subject, vencimiento en BD |
| RNF02: autorización del servidor | permisos actuales de BD por petición; sesión revocable | Cambio de rol en BD efectivo; usuario inactivo y logout invalidan acceso |
| Seguridad técnica web | cookie HttpOnly/SameSite/CSRF/Origin; Secure en HTTPS; sin caché | Formularios, CSRF ausente/incorrecto, origen ajeno, cookie segura y cierre |
| Inicio local sin credenciales predeterminadas | `npm run db:coordinacion`; creación inicial con bloqueo transaccional | Servicio de inicialización concurrente permite una sola cuenta; terminal interactiva tiene validación aparte |

Supuestos revisables: identificador local normalizado (sin correo obligatorio), un rol y una iglesia máxima por cuenta, contraseña mínimo 15 caracteres y máximo 72 bytes UTF-8 (rechazo, nunca truncamiento), JWT de una hora, límite local de 10 intentos por IP/15 minutos. El primer usuario se crea solo mediante herramienta local explícita cuando no existe ninguno. Son decisiones de implementación, no reglas dictadas por el cliente. No se habilitan roles/iglesias múltiples ni privilegios sobre finanzas o solicitudes por inferencia. No hay seed de usuarios, contraseñas de ejemplo utilizables ni autenticación externa habilitada en standalone.

Limitaciones: catálogo y seed parciales, sin recuperación/cambio de contraseña, sin despliegue HTTPS ni prueba de carga/dispositivo móvil. El límite de intentos es por proceso (no distribuido). La autorización se comprueba al inicio de cada petición; una transacción ya en curso no se cancela retroactivamente. Las sesiones caducadas se rechazan; su limpieza programada está pendiente. Campos opcionales vacíos al editar conservan datos; eliminación pendiente, sin activar nulabilidad nueva. La migración geográfica es aditiva y no borra ni reclasifica registros anteriores; no añade FK retroactiva Localidad–Municipio que pudiera invalidarlos. La FK Iglesia–Localidad sigue vigente. Ver [ADR 006](adr/006.md); [evidencia de identidad](evidencia-identidad.md) corresponde al incremento anterior.
