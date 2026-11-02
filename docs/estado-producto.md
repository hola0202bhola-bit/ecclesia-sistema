# Estado de la aplicación y siguiente incremento

1 de noviembre de 2026, America/Mexico_City. Prioridad confirmada por el alumno: **dos repositorios**, aplicación y arnés. Se conservan especificación y antecedentes. P017 enumera otros entregables en el documento original, pero no se los impone como entregas separadas en esta continuación. No se exige ceremonia de Fase 0 para desarrollar. Ninguna decisión técnica se atribuye a las profesoras.

Inspección inicial real: sistema `acc6cd353512ddfdb0e330083f83f4843e990e0b`, arnés `dcf5cbbbd38c5c74ce11209f62dc883f0da7e961`, clonados de sus remotos. Ambos tenían Iglesias mínimo y gate; no había login/cuentas. El DOCX binario no está en esos árboles Git; se consultó la transcripción íntegra `fuentes/caso-parrafos.md` con hash de procedencia y las figuras, sin afirmar un cotejo nuevo contra el binario ausente.

| Obligatorio y fuente | Evidencia inicial | Tras este incremento |
| --- | --- | --- |
| RF01–04: iglesias, ficha y cierre; P063–065 | `src/modules/iglesias`, 70 pruebas reales sobre PostgreSQL | Consulta, alta y edición conservadas; ficha integrada y cierre pendientes |
| RF05: catálogos INEGI; P063/P092 | Migración y seed: seis tipos y una localidad oficial | Parcial; faltan administración y catálogo nacional |
| RF06: autenticación, usuarios y aislamiento; P022/P092–093/P130 | Solo JWT externo; sin cuentas/login | Login/logout, sesiones persistidas, perfil, lista paginada y alta por Coordinación; UI de personal y usuarios. Edición/desactivación/recuperación y roles múltiples pendientes |
| RF07–12: patrimonio, índice y ranking; P067–076 | Contratos/ADR; sin código | Pendiente; ejemplo 35.5 y fórmula escritos no requieren nuevas respuestas |
| RF13–15: servicios y pláticas; P078–079 | Solo diseño | Pendiente |
| RF16–21: padres, horarios y celebraciones; P081–083 | Solo diseño | Pendiente; requiere iglesias/zona e identidad |
| RF22–24: diezmos y reportes; P085–086 | Solo diseño | Pendiente; depende de celebraciones e identidad |
| RF25–31: espacios, solicitudes y cotizaciones; P088–090 | Solo diseño | Pendiente; depende de iglesias e identidad para personal; visitante sin cuenta |

Orden por dependencias: identidad → iglesias/catálogos → patrimonio e índice → servicios/pláticas y agenda → diezmos; espacios/solicitudes es otra rama a partir de iglesias e identidad. MVP factible inmediato: consulta pública + acceso del personal + gestión básica de iglesias y cuentas; este incremento completa su base de acceso, con gestión de iglesias por API. Un MVP del negocio más amplio requiere además oferta/horarios y ficha integrada; no se presenta el primer incremento como sistema terminado. P095 y extras del curso siguen separados de lo obligatorio.

Los datos de entrega P200–225 también están pendientes: 32 estados y municipios INEGI, localidades de las iglesias, 40 iglesias en 3 estados/8 municipios y todos los tipos, 120 objetos (15 de 200+ años, 5 de 300+), cuatro servicios y dos tipos de pláticas por iglesia, 15 sacerdotes (3 compartidos), misas cada día, cuatro semanas de celebraciones/diezmos en seis iglesias, 12 solicitudes cubriendo estados y un usuario por rol. El seed actual no cubre esas cantidades; la provisión inicial de este incremento no se presenta como seed final de usuarios.

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

Limitaciones: catálogo y seed parciales, sin recuperación/cambio de contraseña, sin UI de edición de iglesias, sin despliegue HTTPS ni prueba de carga/dispositivo móvil. El límite de intentos es por proceso (no distribuido). La autorización se comprueba al inicio de cada petición; una transacción ya en curso no se cancela retroactivamente. Las sesiones caducadas se rechazan; su limpieza programada está pendiente. Ver [ADR 006](adr/006.md) y [evidencia de ejecución](evidencia-identidad.md).
