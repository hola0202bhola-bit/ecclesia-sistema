# Tarjeta «Tu iglesia asignada» — 22–23/11/2026

Corrección de presentación solicitada por el alumno. Base de producto: `84e3a1b8d514d8a52162d6244d9149905872058d`; arnés sin cambios: `54a50eb55295f724675363812e0ad5a1f594f5eb`.

## Causa y cambio

`personal.ejs` y `cuenta-perfil.ejs` utilizaban `.hero`, una cuadrícula de portada con dos columnas. Sus tres hijos distribuían la etiqueta y el nombre en columnas distintas y el enlace en otra fila. Se sustituye únicamente esa clase por `.assigned-church`, con una columna, separación de 8 px, relleno adaptable y el mismo borde, fondo, radio y sombra que las tarjetas existentes. Nombre completo alineado a la izquierda, tipografía adaptable y enlace inmediatamente debajo, con objetivo táctil de al menos 44 px. La sección queda identificada por su encabezado para tecnologías de asistencia.

Se conservan condición de iglesia asignada, escape EJS, datos, enlaces, formularios, permisos, rutas y lógica. Sin cambios en src, dependencias, contratos ni migraciones. El estilo `.hero` de las portadas permanece intacto.

## Verificación visual ejecutada

Microsoft Edge sin interfaz visible, plantillas EJS completas y CSS reales, datos ficticios locales; comparación con la versión base. Panel del personal y perfil en 320, 390, 768, 1024 y 1440 px. Cuarenta combinaciones de vista/ancho/nombre: nombre normal, largo con espacios, palabra extensa sin espacios y contenido HTML escapado. Diez casos adicionales sin iglesia asignada.

Comprobaciones aprobadas: etiqueta/nombre/enlace apilados y alineados, enlace cercano al nombre, sin desborde horizontal, nombre íntegro, destino conservado, HTML escapado y foco visible con teclado. Capturas revisadas de escritorio, móvil y nombre largo. El diseño conserva colores y tipografías existentes. No equivale a prueba en teléfono físico ni aceptación del profesor. El renderizado aislado no sustituye los casos HTTP/autenticados del arnés.

## Verificación integral

Gate íntegro aprobado en una única ejecución final: desde `arnes-codex`, `npm run check -- ../proyecto-ecclesia`, salida 0. Inicio 2026-11-22T23:01:33.3915483-06:00; fin 2026-11-23T00:02:31.6523123-06:00; duración 60.97 minutos. **521/521 pruebas del producto y 110/110 del arnés**, ninguna fallida u omitida. Los 67 escenarios del índice incluyen una aceptación y 66 rechazos esperados; índice y directorio de trabajo conservados en todos. Arquitectura 60/60, cero infracciones; cobertura de líneas 97.57 %. Prisma, compilación estricta, lint/formato, contratos y smokes compilados de todos los módulos/API/front/admin aprobados. El formato del CSS se comprobó también expresamente con Prettier.

PostgreSQL 18.6 temporal propio: catorce migraciones y doble seed, CT20 y comprobaciones HTTP/EJS reales; `externalDatabaseUsed=false`. Base detenida y archivos eliminados al terminar. No se utilizaron bases existentes ni se ejecutaron despliegues. Los SHA-256 de las tres vistas/estilos corregidos permanecieron idénticos entre la revisión visual y el cierre del gate; el arnés sigue sin cambios. Después del gate solo se completó esta documentación y sus registros.

Intento anterior, registrado por separado: 109/110 del arnés, salida 1 por `Permission denied` al escribir un objeto Git temporal, antes de las pruebas del producto. El error se reprodujo en una copia desechable; con `core.fscache=false` solo en el entorno del proceso, tres reproducciones prepararon el índice correctamente. La ejecución final repitió todos los controles, sin modificar scripts, pruebas, límites ni umbrales. TEMP/TMP se mantuvieron en la raíz de trabajo y la instalación utilizó los certificados del sistema sin debilitar TLS. Los logs de ambos intentos permanecen en carpetas locales de trabajo, separados.

La entrega se prepara en rama/PR para revisión, sin fusionar ni desplegar. Esta evidencia técnica no acredita aceptación docente ni pruebas en teléfono físico.
