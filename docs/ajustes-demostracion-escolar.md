> Actualización autorizada 22/11/2026: retirada lógica/versionada de asignación sin hechos/programación y responsable institucional/costo público de referencia opcionales; cotización individual privada intacta. Esta ampliación supera solo las exclusiones históricas correspondientes del texto siguiente. [Reglas y pruebas actuales](indicaciones-profesor-20261122.md).

# Ecclesia — ajustes finales de demostración escolar

22/11/2026: corrección R-01 de compatibilidad en los seis esquemas de ambos contratos y pruebas negativas Ajv/Zod. Se mantienen los ajustes aprobados y la validación Zod. [Reglas verificables y límites de normalización](revision-compatibilidad-contratos-20261122.md); resultados actuales en [estado-producto](estado-producto.md). Los resultados del 21/11 siguientes se conservan como evidencia de esa revisión.

- **Ficha:** descripción opcional (hasta 500 caracteres) y foto remota opcional, siempre HTTPS; se pueden borrar con campos vacíos en el formulario. Sin datos se conserva el diseño anterior y el SVG del directorio.
- **Imagen:** no hay subidas de archivos ni dependencia del disco temporal de Render. Utilizar una foto pública cuya licencia permita el uso; el navegador la carga desde el alojamiento original sin enviar Referer. Se exige HTTPS y nombre DNS público: se rechazan IP literales, nombres locales/reservados, credenciales, fragmentos y espacios interiores. No se resuelve DNS ni se comprueba disponibilidad, contenido o licencia remotos. Si la URL deja de servir una imagen, debe corregirse o eliminarse; el SVG predeterminado se usa cuando no hay URL.
- **Criptas:** oferta y solicitud sin publicar precios; el administrador de la iglesia revisa disponibilidad, establece el costo individual en MXN y el solicitante consulta con folio/clave. El flujo existente de 15 días no cambia. No se añade pago ni reserva física.
- **Seguridad:** validación Zod, escape EJS, límites de tamaño, HTTPS estricto, actualización de CSP solo para imágenes HTTPS. Los roles y auditoría previos permanecen sin cambios. No almacenar datos personales reales para la demo.
- **Persistencia:** migración aditiva 202611210001_ficha_escolar agrega dos columnas opcionales. No se alteran migraciones antiguas. Comprobar la base de demostración local con npm run db:demo; no aplicar migraciones a Render/Supabase por este ajuste.
- **Pruebas:** casos añadidos en tests/iglesias.test.ts y tests/gestion-iglesias.test.ts: creación/edición/omisión/borrado, persistencia/contratos, matriz de permisos, obsolescencia, URL inválida, EJS escapado, CSP, SVG sin foto y textos funerarios. Prueba SQL de actualización desde las doce migraciones con iglesia/cuenta/sesión previas. Los casos históricos de cuentas y CT20 actualizan el recuento exacto a trece y conservan sus mismas comprobaciones de actualización; la prueba de solicitudes copia las columnas de su esquema histórico en vez de usar SELECT * sobre una tabla más reciente. No se eliminan casos ni se reducen umbrales.

## Procedencia y decisiones

Fuente del incremento: `Ecclesia_ajustes_escolares_20261121.zip`, LEEME_PRIMERO.md del 21/11/2026, solicitado expresamente por el usuario. Amplía la limitación anterior de ADR011 solo para los dos campos de iglesia. No implica aceptación docente ni cierre de las PC de negocio. Se mantienen el login obligatorio y el folio/clave adicional de solicitudes; el formulario no promete solicitudes sin cuenta ni asociación automática al usuario.

Ambas carpetas recibidas carecían de `.git`. Se recuperó el historial auténtico de GitHub sin checkout ni sustitución de archivos: producto `06e479c773d460e9533469eddb780a4f1e371fa5`, arnés `f7e2df00d730577c4a7fa379f8338a234af664f7`; sus contenidos estaban limpios frente a esas bases. Se creó `feat/ajustes-escolares-20261121` y se aplicó el instalador del ZIP adaptando únicamente su guarda para reconocer esa rama ya creada. Después se revisó y corrigió el código generado. Main y remotos no se modifican.

Los contratos OpenAPI y subconjunto de referencia contienen los campos opcionales y anulables. API: omitir conserva el valor en edición; `null` elimina; cadena vacía es inválida. Formulario: vacío o solo espacios elimina estos dos campos; los otros opcionales conservan su política anterior. Se conserva el versionado de Iglesia. No se introduce auditoría de campos básicos que no existía antes.

## Reproducir la comprobación

1. Node 24 y `npm ci` en las dos carpetas hermanas.
2. Producto: `npm run generate`, `npm run build`, `npm run format:check`, `npm run lint`, `npm test`.
3. Arnés: `npm run check -- ../ecclesia-sistema`. Incluye regresiones del índice, contratos, arquitectura, cobertura, PostgreSQL propio y smokes compilados de API/front/admin. Nunca pasar una DATABASE_URL remota.
4. Producto: `npm run db:demo`; acceder con las cuentas sintéticas del archivo local excluido. Editar una iglesia desde Gestión, verificar tarjeta/ficha, borrar campos y comprobar SVG; consultar espacios y seguimiento privado.
5. Revisar `git diff --check` y el diff completo. Los resultados efectivamente ejecutados se registran en [estado-producto](estado-producto.md); esta lista no acredita que hayan pasado.

## Guion de 5–10 minutos

1. Iniciar la demo local con cuentas ficticias; explicar inicio de sesión obligatorio y el rol visitante.
2. Recorrer directorio, filtros, paginación y perfil del usuario.
3. Abrir ficha de iglesia con descripción/fotografía; comprobar ausencia de foto en otra ficha.
4. Entrar como Coordinación o administrador de esa iglesia y editar descripción/foto.
5. Mostrar patrimonio, misas/sacerdotes y servicios/pláticas.
6. Abrir criptas, leer responsable y costo por cotización. Simular folio/clave sin información real.
7. Enseñar repositorio de aplicación, arnés y resultados actuales de pruebas; indicar límites no aprobados por el docente.

## Estado de la entrega

Cambios **locales preparados en el índice**, en ramas `feat/ajustes-escolares-20261121` de producto y arnés; sin commit, push, PR, integración o despliegue automático. Se conserva el alcance pequeño del arnés: seis aserciones del smoke sustituyen una expectativa de texto obsoleta, sin eliminar casos.

Comprobado el 21/11/2026: `npm test` del producto y gate integral posterior con salida 0; **500/500 producto y 106/106 arnés**, sin omitidas, cobertura de líneas **97.59%**, trece migraciones y smokes sobre PostgreSQL propio. Revisión de interfaz CT20 ejecutada: guardar, borrar/restaurar descripción/foto, carga real de la imagen, SVG sin foto y aclaraciones funerarias visibles. [Evidencia y límites completos](estado-producto.md), [resumen estructurado](evidencias-escolares-20261121.json). Las credenciales y capturas permanecen solo en carpetas locales excluidas de Git.

No quedan pruebas fallidas de este alcance. Continúan la revisión humana/docente y las PC anteriores; la disponibilidad de la foto depende de su proveedor. Se observó una advertencia no bloqueante de pg, sin cambiar dependencias ni reducir validaciones. Main local/remoto se volvió a comprobar sin cambios; no se accedió a Render, Supabase o bases remotas.
