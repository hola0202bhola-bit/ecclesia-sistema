# Cierre de sesión desde el perfil de administración

Corrección local autorizada el 23/11/2026. Base aprobada: `803f5037b6c8b729af42dec15e7af11eaef55f39`; arnés sin cambios en `473533a7b9e4e479e8c76d2835a6e2cecb9d662e`.

## Problema y cambio

En la instalación escolar de Render, Coordinación puede entrar al panel y al perfil propio de administración. Al pulsar **Cerrar sesión** desde ese perfil, la sesión se revoca, pero el controlador dirige a `/cuenta/login`; esa ruta no se sirve en la superficie `admin` y devuelve 404.

El controlador ahora utiliza `res.locals.loginLink`, que composición calcula previamente con dos destinos internos fijos según la superficie: `/personal/login` en administración y `/cuenta/login` en front/local. Se reutiliza la misma decisión que ya utilizan los enlaces de acceso de la interfaz. No toma un destino del cuerpo, consulta o encabezado de la petición.

Se conserva la revocación persistida y el borrado de cookie, así como CSRF, Origin, cookies host-only, roles y límites. No se cambian vistas, migraciones, contratos, dependencias, configuración de Render ni datos existentes. No se amplían permisos de Visitante. Trazabilidad: [ADR 011](adr/011.md), [cuentas 1.1](cuentas-1-1.md) y separación de superficies en `composition/deployment.ts`.

## Regresiones

`tests/deployment.test.ts` añade tres casos con PostgreSQL real: administración, front y modo local `all`. Cada uno abre el perfil con una sesión persistida; rechaza cierre sin CSRF o con otro Origin sin revocar la sesión; realiza el cierre válido; comprueba destino interno y formulario de acceso disponible (200), cookie retirada con atributos seguros y rechazo posterior del token/cookie revocados. Parámetros `returnTo` externos se ignoran.

Antes de corregir el controlador, las dos suites focalizadas ejecutaron 85 pruebas: 84 pasaron y falló exactamente el nuevo caso de administración por `/cuenta/login` frente a `/personal/login`. La limpieza del primer clúster local se completó por separado tras detenerse su lanzador; no se usó ninguna base remota. Después de corregirlo, las 85 pruebas pasaron, sin omisiones, y el clúster temporal se detuvo/eliminó normalmente.

Comprobación completa desde el arnés: `npm run check -- ../ecclesia-sistema`, salida **0**, una ejecución de **46,90 minutos** (23/11/2026 20:54:53–21:41:47, America/Mexico_City). **528/528 producto**, **117/117 arnés**, sin fallidas, canceladas u omitidas. Los **67 escenarios del índice** conservaron índice y archivos de trabajo. Prisma, TypeScript, lint/formato, contratos y arquitectura **60/60, cero violaciones**, catorce migraciones, doble seed aislado, CT20 y smokes compilados, incluidos los tres entrypoints, aprobados. Cobertura: líneas **97,57 %**, sentencias **97,11 %**, funciones **98,92 %**, ramas **91,00 %**.

Los **341 archivos** congelados y el árbol del índice permanecieron idénticos durante esa ejecución. Después solo se actualizaron resultados documentales y trazabilidad; código y pruebas se mantienen congelados para el commit, cuyo hook valida nuevamente el índice materializado. La advertencia de deprecación de consultas concurrentes de `pg` de una suite existente no impidió la ejecución; no se actualizaron dependencias. El arnés continúa íntegro en su commit aprobado.

## Límite de esta fase

Solo preparación, validación y commit local para revisión. Sin push, merge ni nuevo despliegue. Render conserva la revisión aprobada anterior y el fallo remoto seguirá presente hasta autorizar y publicar una revisión corregida. La prueba remota con Visitante y la aceptación docente continúan pendientes; las pruebas locales no las sustituyen.
