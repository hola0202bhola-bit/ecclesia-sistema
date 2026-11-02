# Ejecución del incremento de identidad

1 de noviembre de 2026, America/Mexico_City. Bases remotas inspeccionadas: sistema `acc6cd353512ddfdb0e330083f83f4843e990e0b`, arnés `dcf5cbbbd38c5c74ce11209f62dc883f0da7e961`. No se reetiquetan resultados anteriores como nuevos.

Ejecutado antes de ampliar el producto: instalación de ambos locks, generación Prisma y `npm test` sobre la base: 70/70 pruebas, PostgreSQL real, migración, doble seed y smoke compilado. Las dependencias se instalaron con validación TLS; bcryptjs requirió usar las CA confiables del sistema (`NODE_USE_SYSTEM_CA=1`), sin desactivar verificación.

Ejecutado tras implementación: `npm test` (pipeline fijado por el arnés) con ambas migraciones sobre PostgreSQL aislado, seed dos veces y **100/100 pruebas**, ninguna pendiente. Cobertura V8 medida: líneas 98.96%, sentencias 98.65%, funciones 100%, ramas 93.29%. Quince fuentes medidas; `server.ts` queda fuera de instrumentación y tiene smoke separado. `check-architecture` inventarió 16/16 fuentes sin infracciones. Validación estructural OpenAPI 0.4.0 exitosa. Login/cuentas/roles/CSRF se verifican por HTTP con Supertest y PostgreSQL real, sin mocks de persistencia.

Smoke de servidor compilado: consulta API 200, consulta EJS 200, acceso de personal 200, usuarios anónimos 401 y alta de iglesia anónima 401. No es prueba de navegador móvil ni despliegue público.

Incidencias de esta ejecución: un intento restringido falló en initdb por permisos de archivos temporales; se repitió con acceso normal y BD aislada. El primer test de JWT sin exp construía un payload con exp undefined, que jsonwebtoken no permite firmar; se corrigió quitando la propiedad y se comprobó rechazo HTTP 401. Se corrigió el formato del script nuevo antes de aceptar el gate. Ninguna incidencia se atribuye al alumno ni se cuenta como revisión humana.

La herramienta real de primera cuenta se ejecutó en una terminal interactiva con PostgreSQL temporal propio: se introdujeron identificador ficticio, contraseña oculta y confirmación; creó una cuenta y su login HTTP real devolvió 200 con rol Coordinación. Se detuvieron servidor/BD y se eliminaron solo esos datos temporales.

El primer gate completo detectó expectativas históricas de 62 pruebas internas frente a las 64 actuales y una expresión que buscaba exclusivamente el prefijo TAP aunque Node imprimía su reporte de consola. Se actualizaron las expectativas a mínimos que incluyen ambas regresiones nuevas; no se omitieron pruebas ni se convirtió el fallo en éxito.

**Gate completo final ejecutado:** `npm run check -- ../proyecto-ecclesia` desde arnés, salida **0**, 77/77 pruebas del arnés y 100/100 del producto, ninguna omitida. Las regresiones del índice ejecutaron el positivo y los cinco rechazos de producto, conservando índice y copia de trabajo. Contratos: 31 requisitos, 23 preguntas, 64 operaciones; inventario de 16 fuentes, sin infracciones. PostgreSQL 18.6 real, ambas migraciones, doble seed y smoke compilado. Cobertura final de 15 fuentes: líneas **98.97% (289/292)**, sentencias **98.65% (294/298)**, funciones **100% (87/87)**, ramas **93.29% (167/179)**. El porcentaje inicial 98.96% anterior corresponde a una ejecución previa; el final incluye el mínimo de contraseña por caracteres Unicode.

El hook del commit final y la publicación se registran por separado cuando se ejecuten. Logs completos en el área local de trabajo; los reportes generados habituales son `evidence/vitest.json`, `evidence/database.json` y `coverage/coverage-summary.json` (excluidos de Git).

No se afirma aceptación docente, validación humana detallada, recuperación de contraseña, cobertura nacional, prueba móvil/carga ni arranque medido menor a diez minutos. `npm install` informó diez avisos moderados en el árbol de dependencias; no se aplicó actualización masiva fuera de este incremento.
