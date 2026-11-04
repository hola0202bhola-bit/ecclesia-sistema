# Demostración CT20 y CT03

3 de noviembre de 2026, America/Mexico_City. Continuación autorizada del alumno; no aceptación docente. Fuente: [caso P199–225](fuentes/caso-parrafos.md#p199), [requerimientos 6.2](requerimientos.md#62-mínimos-de-datos-de-prueba). Bases remotas verificadas antes de editar: aplicación `416e92c97939ff45dedccfc58df0506c814b5d2f`, arnés `5f82433d20bd3e5726dc22d37b19a71e7d3b3589`.

## Ejecutar sin una base propia

Requisitos: Node 24, dependencias de desarrollo instaladas por `npm ci` en ambos repositorios hermanos. La instalación inicial requiere red para paquetes y motores; no se desactiva TLS. Desde `proyecto-ecclesia`:

```text
npm run db:demo
```

El comando crea y abre exclusivamente su propio PostgreSQL local en `.demo/postgres`, con usuario y base `ecclesia_demo`, contraseña aleatoria y un puerto libre. **Ignora DATABASE_URL y la base de .env**: no intenta conectar, migrar, limpiar ni poblar una base del usuario. Genera Prisma, aplica las nueve migraciones, carga CT20, compila y muestra el enlace local del servidor. No necesita PostgreSQL instalado ni ejecutar `db:seed` o `db:coordinacion`.

Abra el enlace mostrado, seleccione Puebla (21), Tlaxcala (29) o Veracruz (30), y abra una ficha. La ficha resume datos públicos y enlaza al patrimonio, servicios, pláticas, misas y espacios completos. Personal → login permite usar las cuentas exclusivas de la demo. Los identificadores, contraseñas y comprobantes de seguimiento están **solo en `.demo/accesos-locales.json`**, nunca en esta guía ni en Git. Hay Coordinación, seis administradores y seis tesoreros; el índice de cada usuario corresponde a una de las primeras seis iglesias (iglesiaId en el archivo). Los 12 comprobantes se corresponden por posición con `idDemo("solicitud", 0..11)`; contienen folio, clave y verificador. Use folio/clave en Seguimiento de solicitud. No hace falta crear una cuenta de solicitante.

Ctrl+C detiene el servidor y PostgreSQL. Volver a ejecutar el comando abre la misma demostración: **no reemplaza ediciones, sesiones, contraseñas, solicitudes ni historial**. No use `db:seed` sobre la base demo; seed mínimo y CT20 son alternativas separadas. El seed mínimo conserva exactamente su comportamiento anterior y no crea usuarios.

La referencia temporal se fija al crear `.demo`; por defecto es el instante real. Para una reproducción histórica, solo en la primera creación:

```text
npm run db:demo -- --referencia=2026-11-03T18:00:00.000Z
```

Debe ser un instante válido y no futuro. La aplicación **continúa usando el reloj real**: una cotización demo COTIZADA caduca 15 días después de su emisión, también si se abrió una demostración histórica. No se congela el reloj del servidor para conservar un estado artificialmente. La referencia, las fuentes y la versión de carga no pueden cambiarse en una base demo existente. Para otro escenario, use otra copia del proyecto sin `.demo`; no se ofrece un reset destructivo.

`.demo` contiene una base y credenciales locales; está excluida de Git, formato y copias de prueba del arnés. No compartirla como entregable ni alojar este servidor de demostración públicamente. Solo datos sintéticos. Los permisos de archivo solicitados son 0600; en Windows la protección efectiva depende de los permisos de la carpeta del usuario, no se afirma haber instalado una ACL nueva. Si desaparece el archivo de accesos de una demo ya cargada, se rechaza regenerar credenciales inservibles: restaurar el archivo local o crear otra copia demo. Si un cierre abrupto deja `ejecucion.lock`, verificar que el proceso y ese PostgreSQL ya terminaron antes de retirar únicamente ese archivo local; el programa nunca elimina un bloqueo que no posee.

## Datos y relaciones

| Fuente / condición | Conjunto CT20 v1 |
| --- | --- |
| P203–206 | 32 estados y 2478 municipios del snapshot oficial ya conservado; ocho localidades oficiales verificadas para todas las iglesias de la demo. |
| P207–208 | 40 iglesias ficticias; cinco por municipio; Puebla 15, Tlaxcala 15 y Veracruz 10; los seis tipos. Dirección/contacto ficticios y correos `example.invalid`. |
| P209–210 | Tres objetos por iglesia, 120 en total. Cinco de 320 años y otros diez de 220 años respecto del año de referencia; 15 cumplen >=200 y cinco >=300. Los indicadores INAH son simulados y la descripción lo advierte. |
| P211–214 | Cuatro servicios por iglesia (160), cada uno con costo decimal y horario local; dos tipos distintos de pláticas por iglesia (80), con horarios, costo y demás campos. Todos los importes y personas son ficticios. |
| P215–218 | Quince sacerdotes ficticios; todos compartidos entre dos o tres iglesias. Siete horarios por iglesia (280); franjas 07:00, 09:00 y 11:00 para impedir traslapes de sacerdotes compartidos. |
| P219–220 | Cuatro semanas completas anteriores al lunes local de referencia, en seis iglesias: 28 celebraciones por iglesia (168), cada una concluida y con un diezmo ficticio exacto y registro de captura por su tesorero. |
| Vigencias | Recurrencias materializadas para las cuatro semanas históricas y las cuatro siguientes: 56 días inclusivos, 2240 ocurrencias. Zona explícita America/Mexico_City en las ocho localidades elegidas, sin rellenar zonas de iglesias ajenas. Las agendas vencen al finalizar el intervalo: no se promete recurrencia perpetua. |
| P221–222 | Doce solicitudes, distribuidas entre seis iglesias y los cuatro tipos. Cubren REGISTRADA, COTIZADA, SIN_LUGAR, ACEPTADA, RECHAZADA, VENCIDA y CANCELADA, exactamente el flujo implementado en ADR010, todavía provisional. |
| P223–225 | Trece usuarios, los tres roles autenticados y seis ámbitos distintos; personas, iglesias, patrimonio, montos y contactos ficticios. Visitante/solicitante permanecen sin cuenta. |

Los nombres, IDs, relaciones, montos y fechas son deterministas para una referencia y versión dadas. **Las contraseñas, sales bcrypt, folios y claves se generan con aleatoriedad criptográfica**: deliberadamente no son deterministas ni están publicados. Contraseñas de 192 bits, bcrypt costo 12 con sal por usuario; claves de solicitud de 256 bits y solo SHA-256 persistido en SolicitudEspacio. El comprobante local es la única copia deliberada de acceso; ni la auditoría ni los mensajes de ejecución contienen claves/contactos.

La carga valida destino loopback, nombre exclusivo, confirmación explícita, identidad de conexión, todos los hashes y jerarquías antes de poblar. No admite bases ocupadas, **incluidas las del seed mínimo**. La transacción adquiere un mutex y bloqueos de tablas para impedir dos cargas/carreras. CargaDemo se confirma junto con todos los datos; un fallo tardío revierte todo. Repetir con el mismo identificador es un no-op; con distinta referencia/fuentes se rechaza. No usa upsert para modificar personas ni registros de negocio. Las filas de catálogos preinstaladas por migraciones no se editan.

Este importador de fixtures crea un estado inicial, no falsifica acciones humanas por HTTP. Las celebraciones preservan actores propios y las capturas de diezmo su auditoría inicial; las solicitudes tienen cadena de versiones/actores/instantes coherente con el flujo. No genera logs de lectura, pagos, reservas físicas, contratos, documentos de difuntos ni comunicaciones externas. Los límites de intentos empiezan vacíos y la aplicación sigue aplicando todos los límites persistentes. La retención de datos reales continúa pendiente PC14; conservar una base sintética no la resuelve.

## INEGI: procedencia y alcance

El servicio oficial documenta las consultas por clave de localidad en [Catálogo Único INEGI](https://www.inegi.org.mx/servicios/catalogounico.html). Respuestas JSON **con bytes originales**, URL exacta, fecha de consulta y SHA-256 en `prisma/demo/fuentes/manifest.json`. Claves comprobadas: Atlixco `210190001`, Puebla `211140001`, San Andrés Cholula `211190001`, Ciudad de Apizaco `290050001`, Tlaxcala de Xicohténcatl `290330001`, San Dionisio Yauhquemehcan `290430001`, Xalapa-Enríquez `300870001`, Veracruz `301930001`. Ninguna clave/nombre se inventa ni se deduce de que una cabecera deba ser 0001: las ocho respuestas efectivas se conservan y validan.

Los metadatos estadísticos corresponden a Censo 2020. El snapshot de estados/municipios procede de la consulta de noviembre ya versionada, sin atribuirle actualización territorial nacional en tiempo real. La demo añade ocho localidades, **no completa el catálogo nacional ni la administración de catálogos RF05**. `CatalogoVersion` guarda ambos manifiestos; `CargaDemo` guarda el hash combinado de su procedencia. No se descarga información al arrancar la demo.

## Verificación reproducible

```text
# Desde proyecto-ecclesia: pipeline completo del producto con dos bases temporales
npm test
# Desde arnes-codex: gate integral, incluidas regresiones del índice preparado
npm run check -- ../proyecto-ecclesia
```

El arnés crea `ecclesia_test` y `ecclesia_demo_test` en un PostgreSQL efímero propio y descarta ambas al terminar; ignora la DATABASE_URL del usuario. La suite CT20 comprueba distribución, relaciones, antigüedades, recurrencias, zonas, ausencia de traslapes, historia de cuatro semanas, auditorías/roles, flujo/vigencias, privacidad HTTP, hashes, aislamiento, concurrencia, rollback y preservación al repetir. También aplica las ocho migraciones anteriores con datos y después la novena sin perder identidad/criterios. La suite patrimonial conserva el ejemplo exacto 35.5; no se sustituye por una suma del dataset demo.

El gate exige los archivos de la demo, la suite y sus casos semánticos. Su regresión prepara solo en el índice la pérdida de un objeto y exige el rechazo por relaciones/distribución, además de conservar los checks anteriores. Smoke del servidor compilado sobre la base CT20 comprueba la ficha real y privacidad; no acredita dispositivo móvil ni producción. Los resultados efectivamente ejecutados se anotan en [estado](estado-producto.md). El [mapa de brechas](brechas-obligatorias.md) distingue avance funcional y requisitos pendientes.
