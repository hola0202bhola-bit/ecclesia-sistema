# Revisión de navegación y demostración — 25/11/2026

El usuario autorizó revisión y correcciones locales, commits revisables y una propuesta de iglesias ficticias. Publicación, despliegue y escritura remota requieren aprobación separada. No se modifica main ni se toca Supabase.

## Diagnóstico

La consulta del 25/11 encontró main y los tres servicios live en e0c49499c0c90e11396a5d91decdb13680f11927. Los dos despliegues recientes del front usan el mismo commit: no hay evidencia de rollback de código en ese contraste; no prueba ausencia de cambios históricos de datos. Modelo, migración 13, validación, edición, directorio y ficha conservan fotoUrl/descripcion. La base remota tenía una iglesia sin ninguno de esos contenidos: esa ausencia es de datos.

El defecto de navegación sí se reprodujo por HTTPS anónimo: aparecían ambos enlaces. Se elimina la inferencia de sesión por mera presencia de una cookie. Composición reutiliza JWT y sesión persistida, sin emisor externo para navegación web. Un 401 deja enlaces ocultos; otros errores siguen el tratamiento existente. Se conservan los filtros de cada ruta, login obligatorio, CSRF/Origin, revocación, ámbito y cookies host-only. La sesión del front no autentica el host admin; el salto del personal sigue abriendo su login. El acceso directo y el enlace del pie continúan disponibles.

| Sesión                                        | Mi cuenta | Área del personal                                     |
| --------------------------------------------- | --------- | ----------------------------------------------------- |
| Anónima, falsa o revocada                     | Oculto    | Oculto                                                |
| VISITANTE válida                              | Visible   | Oculto                                                |
| COORDINACION, ADMIN_IGLESIA, TESORERO válidas | Visible   | Visible según superficie; permisos reales en servidor |

Header y errores comparten estas condiciones. No se cambia CSS, reglas de negocio, migraciones ni dependencias. Se añaden cuatro ilustraciones SVG originales CC0 en public/demo-20261125 para la propuesta, sin afirmar publicación de sus URL.

## Verificación ejecutada

Gate completo aprobado con salida 0: 531/531 producto, 117/117 arnés y 67 escenarios del índice (uno aceptado y 66 rechazos esperados), sin omisiones; arquitectura 60/60 sin infracciones, cobertura de líneas 97.54%. Los 197 archivos congelados permanecieron idénticos. Después solo se actualiza documentación. Ejecución 2026-11-25T16:15:36.9075222-06:00–2026-11-25T18:01:57.8227249-06:00, Node 24.22.3 y PostgreSQL 18.6 propios.

Tres casos parametrizados nuevos cubren all/front/admin, anónimo y cookies falsas, cuatro roles y revocación. El smoke compilado comprueba navegación, rechazo administrativo de visitante, separación de cookies y persistencia/reinicio sin eliminar pruebas. La ejecución focalizada previa aprobó 220 casos; su cobertura parcial global fue insuficiente y no se registró como gate aprobado. Los intentos interrumpidos y el fallo de permisos de caché Prisma se conservan en el informe local. Un fallo concurrente anterior de Solicitudes pasó al repetirlo aisladamente; no se afirma causalidad de Node ni se cambió su expectativa.

UI real local: anónimo/visitante en 360, 768 y 1280 px; personal, tarjeta asignada y edición en 360 px. Sin desbordamiento horizontal en los recorridos comprobados. Cuatro combinaciones foto/descripción en tres anchos, escape y campos de edición presentes. Sin foto, directorio conserva SVG genérico y ficha omite imagen; sin descripción omite bloque. No se añade reemplazo ante URL rota, comportamiento aprobado existente. Las nuevas ilustraciones respondieron 200 image/svg+xml localmente. La imagen HTTPS usada en el navegador para carga real era un recurso ya publicado, no las ilustraciones propuestas. Roles/edición no se probaron con cuentas remotas.

## Propuesta separada y límites

Cuatro iglesias inequívocamente ficticias: Alba/Puebla, Olivo/Atlixco, Aurora/Apizaco y Brisa/Xalapa. La propuesta multirregional necesita tres localidades oficiales ausentes, además de cuatro iglesias; sin cuentas, sacerdotes, operaciones, dinero o datos privados. Datos, huellas, fuentes y SQL exactos permanecen como entregables locales para revisión, no como seed remoto automático. Ensayo local propio PostgreSQL 18.6: 10/10, con transacción atómica, idempotencia/concurrencia, rechazo de colisiones/ediciones, bloqueo por referencias y reversión exacta del lote; original conservado y cero cuentas finales.

No se ejecutó SQL de escritura remoto. Antes de cargar se requieren aprobación expresa del plan, respaldo actual con restauración aislada comprobada y publicación HTTPS validada de imágenes. El plan Free no acredita respaldo existente ([documentación Render](https://render.com/docs/postgresql-backups)). Después de una carga, volver a e0c49499 retiraría los nuevos SVG: preservar recursos en una versión compatible aprobada o revertir exclusivamente el lote intacto/sin uso con aprobación separada; nunca forzar borrados o restaurar globalmente. No se modifican iglesia original, cuentas, datos reales ni paquetes escolares previos. No se declara revisión humana detallada, video o aceptación docente.
