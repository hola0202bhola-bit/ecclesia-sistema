# Ficha y trámites funerarios — revisión escolar del 23/11/2026

## Requisitos contrastados y alcance

Se revisaron el chat de continuidad, `docs/ajustes-demostracion-escolar.md`, `docs/indicaciones-profesor-20261122.md`, P063/P088–090 de `docs/fuentes/caso-parrafos.md`, el formulario, la composición de ficha y el módulo Solicitudes. Descripción de hasta 500 caracteres y fotografía HTTPS opcionales ya estaban implementadas con las migraciones 13/14; no se añaden columnas, contratos ni permisos. Se conserva el inicio de sesión obligatorio.

P088 prescribe cotización individual y precios privados. La ampliación del 22/11 documenta la confirmación del usuario para mostrar un responsable institucional y una referencia opcional por tipo de oferta. No se encontró una exigencia de precio público fijo obligatorio: se conserva la cotización individual privada, la referencia definida por la administración sigue siendo opcional y su ausencia invita a solicitar cotización. `0.00` sigue siendo una referencia definida. No se interpreta referencia como disponibilidad, cotización definitiva, pago o reserva; siguen intactos folio/clave, vigencia y decisiones del flujo privado.

Estado remoto al comenzar: producto `main` 84e3a1b8d514d8a52162d6244d9149905872058d; arnés `main` 54a50eb (actualizado de GitHub). Los PR #2 ya estaban integrados. El único PR abierto encontrado fue el #3 del producto, corrección de tarjeta asignada; continúa aparte. Se creó la rama `feat/ficha-tramites-escolares` desde main, sin incorporar ese PR. Este incremento modifica zonas distintas del CSS y otras vistas. El arnés se usa sin cambios desde su main vigente.

## Cambios mínimos

- `views/ficha.ejs`: presenta responsable y referencia por tipo directamente en la ficha, usando solo la proyección pública que ya suministra composition. Sin oferta muestra un estado vacío explícito.
- `views/partials/espacios-publicos.ejs` y `views/espacios.ejs`: una plantilla compartida conserva el mismo dato y mensaje en ficha y solicitud; salida EJS escapada, etiquetas semánticas y tarjetas con el estilo existente.
- `views/iglesia-formulario.ejs`: agrupa descripción/foto en Presentación en el directorio y asocia ayuda accesible a cada campo. Los vacíos conservan su semántica previa de borrado; no cambia la edición de otros datos.
- `public/ecclesia.css`: respeta saltos de línea de la descripción, mantiene los campos a ancho completo y adapta las tarjetas a una o dos columnas.
- `tests/solicitudes.test.ts`: cuatro casos nuevos cubren las dos vistas con referencia ausente/cero/máxima, escape HTML y retiro de oferta; se amplía la prueba existente de privacidad a la ficha completa sin eliminar aserciones históricas.

Sin cambios en lógica de negocio, Prisma, migraciones, dependencias, roles ni el arnés. Sin merge, despliegue, recursos Render/Supabase o bases reales. Los importes y personas usados para comprobar son ficticios.

## Validación y límites

**Gate-02 íntegro aprobado, salida 0**, en una única ejecución desde el arnés: **525/525 producto**, **110/110 arnés**, sin fallidas, canceladas u omitidas; control del índice positivo y rechazos esperados aprobados, con índice/directorio conservados. Contratos y arquitectura **60/60**, cero violaciones; cobertura de líneas **97.57%**, sentencias **97.11%**, funciones **98.92%**, ramas **91.00%**. Inicio 2026-11-23T05:56:35.8875441-06:00; fin 2026-11-23T06:42:29.3986254-06:00; **45.89 minutos**. PostgreSQL 18.6 propio, catorce migraciones y doble seed, smokes compilados de CT20/cuentas/tres procesos/solicitudes/finanzas/UI/INEGI correctos; bases efímeras detenidas y eliminadas. Los **335 archivos congelados** permanecieron idénticos durante toda la ejecución; después solo se completó esta documentación. La demo visual final aprobó 25 combinaciones y cerró con salida 0. Se prepara el commit y la publicación de la rama/PR en borrador, sin integración o despliegue automático.

Pipeline previo del producto: salida 0, **525/525** en 13 archivos, cobertura de líneas 97.57%, sentencias 97.11%, funciones 98.92%, ramas 91.00%; PostgreSQL 18.6 propio, catorce migraciones, doble seed y smokes compilados aprobados, base detenida/eliminada. Revisión visual final: **25 combinaciones** en 320/390/768/1024/1440 px, demo CT20 y formularios reales; textos largos/multilínea, foto cargada, borrado/restauración, ayuda asociada y referencias ausente/cero/máxima sin desborde. Se examinaron las seis capturas completas de ficha/espacios/formulario a 390/1440. Cierre final de demo normal con salida 0. Advertencia previa de pg no bloqueante conservada, sin modificar dependencias.

Gate-01, 05:51:49–05:54:17 -06:00: salida 1, **109/110 arnés**, sin omitidas. Falló `git add` en el fixture temporal de `product-index.test.mjs`, antes del caso positivo: Permission denied al escribir un objeto de tests/cuentas.test.ts. No se presenta como gate aprobado. Los 335 archivos de producto/arnés congelados permanecieron idénticos. Se desactivó únicamente `core.fscache` mediante entorno del proceso y tres reproducciones de copiar/inicializar/indexar pasaron; no se altera la configuración global, el arnés ni sus controles. Después se reubicaron las notas de CHANGELOG/estado para que el parche completo del PR #3 aplique sin conflictos (`git apply --check`, solo lectura). Se prepara una nueva congelación y repetición íntegra.

La comprobación visual usa una demo CT20 propia y formularios reales, con Edge automatizado. La imagen de prueba es SVG ficticio servido mediante interceptación HTTPS del navegador; verifica la carga y el diseño del campo, no disponibilidad, contenido o licencia de una fotografía externa. No equivale a teléfono físico ni aceptación docente.

Preparación del entorno: el primer intento de generar Prisma encontró EPERM al tocar una caché fuera del área de trabajo; se resolvió con copia de esa caché a una carpeta local. La compilación inicial posterior a ese fallo no disponía del cliente generado; tras generar correctamente, la compilación pasó. Los intentos preliminares del navegador tuvieron problemas de permisos/red entre entornos y expectativas incorrectas del comprobador (ruta de login, trim de texto y cuatro tipos CT20). Se corrigió el comprobador sin rebajar controles del producto. La primera demo se detuvo por procesos identificados al no estar disponible su entrada interactiva; las ejecuciones posteriores usan control local y cierre normal. Estos intentos no se presentan como validación aprobada.

## Pendientes de confirmación

Aceptación docente del diseño y del alcance académico, contenido y permiso de uso de fotografías definitivas, cargo institucional real y referencia opcional que cada iglesia decida publicar. No se solicitan esos datos para la demo. Las PC de negocio anteriores siguen abiertas; esta revisión no las cierra ni impone un precio fijo.
