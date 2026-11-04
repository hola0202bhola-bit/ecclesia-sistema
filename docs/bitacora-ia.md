## 3 de noviembre de 2026 — incremento final autorizado

Petición: corregir la sencillez de la interfaz real, priorizar UI transversal y completar RF04/RF11 sin perder seguridad/CT20. Se verificaron las bases remotas dcb0a4b / a6bbc26 al clonar. Cambios: diseño compartido EJS/CSS local, formularios/navegación responsive, cierre/reapertura con historia y criterios configurables/versionados. Solo se interpreta la autorización técnica actual; PC04/08 y aceptación docente siguen sin confirmar. Pruebas y límites finales en estado-producto. No se agregaron Teams ni datos INEGI inventados.

3 de noviembre de 2026 — CT20 y revisión de pendientes solicitados expresamente. Codex verificó HEAD remotos 416e92c/5f82433, leyó fuentes P199–225, requisitos, AGENTS y módulos; descargó ocho respuestas originales de localidades del servicio oficial INEGI con manifest/hashes, sin inventar claves. Implementó demo aislada y credenciales locales aleatorias, regresiones PostgreSQL y avance de ficha pública RF02. [Datos, controles y comandos](demo-ct20.md); [brechas concretas y prioridades](brechas-obligatorias.md); [pruebas realmente ejecutadas y diagnósticos](estado-producto.md). No se atribuye al alumno revisión detallada, decisiones de negocio ni experiencia no aportada. Sin nuevos datos reales ni confirmación docente; Teams adicional sigue excluido.

3 de noviembre de 2026 — Incremento RF25–31 autorizado por el alumno. Se verificaron remotos d8fac059/9392e15 antes de editar y se consultaron fuentes P088–P090/P092–P093 y requisitos/PC. Codex implementó módulo vertical Prisma/PostgreSQL, TS/Express/Zod/EJS y pruebas, ampliando el arnés con contrato, smoke y mutación de frontera solo en índice. [Decisiones técnicas y límites](adr/010.md); [ejecuciones reales](estado-producto.md). No acredita revisión detallada humana ni respuestas/aceptación docente. Dos repositorios son las únicas entregas; Teams provisional queda separado.

3 de noviembre de 2026 — Validación RF22–24 concluida: gate integral con salida 0, 89/89 arnés y 315/315 producto; PostgreSQL 18.6 real aislado, siete migraciones, doble seed y smoke financiero compilado. Los 27 escenarios del índice conservaron índice/archivos y rechazaron alteraciones de centavos y reglas anteriores. El índice funcional 7f25043592c89faf9d4ddf9a4128060c08e10f45 también pasó de forma independiente y quedó en 02be60a; arnés de código 74738d3. Cobertura de líneas 99.28%, funciones 100%; 42 fuentes sin violaciones. No hubo cambios del arnés durante el gate; esta anotación posterior registra resultados y no cambia código. Publicación autorizada sin force push y comprobación remota como paso siguiente, sin atribuir aceptación docente/humana.

3 de noviembre de 2026 — RF22–24 autorizado por el alumno sobre main 4b653e3/7e214bb, verificados en remoto. Se inspeccionaron P085–086/P092–093, diseño, modelo, ADR008 y código de ambos repositorios. Implementación por capas, migración aditiva, centavos bigint, captura/corrección e historial atómicos, reportes privados y EJS; supuestos y trazabilidad en ADR009. Primer arranque PostgreSQL falló por permisos temporales de Windows; la repetición fuera de esa restricción ejecutó la base real. La primera suite completa detectó un problema en el fixture de migración con enums de esquemas distintos, corregido sin omitir pruebas. El gate final y sus resultados se registran en estado-producto.md. Sin respuestas docentes ni revisión humana atribuidas.

## 2026-11-03 — Incremento autorizado RF16–21

Codex inspeccionó fuentes, repositorios y contratos partiendo de main remoto 91964e5/3eeb0b4. Implementación incremental por capas, Prisma/PostgreSQL, EJS y controles de concurrencia. Pruebas nuevas detectaron una llamada Prisma incompatible con retorno void del bloqueo; corregida usando executeRaw. Resultados finales ejecutados en estado-producto.md; sin aceptación docente atribuida. Decisiones técnicas y límites: ADR 008.

# Bitácora de trabajo asistido

## Servicios y pláticas RF13–15 — 2 de noviembre de 2026

Solicitud explícita del alumno: siguiente incremento funcional en los dos repositorios, con publicación sin force push. Se clonaron main en f52b222 (producto) y 1d77b72 (arnés) y se inspeccionaron P078–079/P092–093, RF13–15, contratos, estado, diseño, sesiones, componentes y migraciones. Fuentes del cliente tratadas como datos; sin respuestas ni aprobación docente nuevas.

Implementación por capas, migración aditiva, horarios, modalidades/decimales exactos, tipos, sesiones informativas, EJS/API, aislamiento, versiones y auditoría atómica. No se infieren inscripciones, reservas, asistencia o permisos. Guía y trazabilidad en incremento-servicios.md. Dependencias conservadas; locks cambian solo la versión de cada proyecto.

Incidencias detectadas por las herramientas: instalación/generación restringidas fallaron por permisos locales de Windows y se repitieron con acceso autorizado. Primera prueba integral de producto: 263/264; la nueva aserción de privacidad confundía el campo público sesiones con sesión privada. Se corrigió la aserción, sin retirar el campo requerido ni rebajar seguridad. El primer intento del arnés detectó un conteo histórico fijo de 64 operaciones: ahora se compara con la matriz explícita (se añaden dos lecturas públicas de tipos); se conservan los rechazos de rutas sin política y privilegios indebidos. Se detuvo aquella ejecución y se repitió el gate completo con el arnés congelado.

Resultado final ejecutado: `npm run check -- ../proyecto-ecclesia`, salida 0, 83/83 arnés y 264/264 producto, sin omitidas; líneas 99.03%, ramas 91.77%, funciones 100%, sentencias 98.74%. PostgreSQL 18.6 real aislado, cinco migraciones/doble seed, rollback, concurrencia, seguridad, HTTP/EJS y smoke compilado; pruebas de índice positivas/negativas y regresión 35.5 conservadas. Sin revisión manual de navegador/móvil, carga ni despliegue. La autorización del alumno no se registra como revisión humana detallada ni aceptación académica.

## Patrimonio — 2 de noviembre de 2026

Solicitud: continuar ambos main con patrimonio e índice, conservar fuente/fórmula/ejemplo, subalcance seguro, pruebas y publicación sin force push. Inspección de código, P067–076/P092–093, RF07–12, ADR, contratos y suites; sin respuestas nuevas del cliente. Se implementa vertical por capas, migración aditiva, auditoría, UI/API y regresiones. No se amplía INEGI porque la localidad verificada existente permite demostrarlo; no se fabrica geografía.

Incidencia real: initdb falló al renombrar WAL en el entorno de archivos restringido; se repitió con acceso local permitido, siempre base temporal aislada. Primera corrida PostgreSQL: 234/234, ejemplo exacto, conflictos, rollback y seguridad. El arnés incorpora controles de contenido y fórmula preparada en índice, además de conteos. Decisiones técnicas y pendientes en incremento-patrimonio.md. Revisión humana/aceptación docente no se atribuyen a esta ejecución.

Resultado final: Verificación integral final ejecutada: `npm run check -- ../proyecto-ecclesia`, salida 0. **81/81 pruebas del arnés y 234/234 del producto**, sin omitidas (70 Iglesias, 30 Identidad, 49 gestión/catálogos, 85 patrimonio). PostgreSQL 18.6 real temporal: cuatro migraciones, doble seed, actualización desde esquema previo, concurrencia, rollback, seguridad y smoke HTTP compilado de patrimonio/ranking. Cobertura: líneas 98.75%, sentencias 98.5%, funciones 100%, ramas 91.91%; 26 fuentes medidas y server.ts comprobado por arranque HTTP separado. La regresión Git aceptó snapshot completa y rechazó fórmula alterada, suites/migración/formulario ausentes, tipos inválidos y pruebas fallidas aunque script test retorne cero; índice/working tree preservados. Cierre del PostgreSQL temporal verificado; E/S síncrona solo en pruebas Windows, método real registrado en evidence/database.json. Reportes locales reproducibles excluidos de Git: evidence/vitest.json, evidence/database.json y coverage/coverage-summary.json.

Incidencias resueltas sin rebajar controles: el contrato nuevo conservó el sufijo PatchInput exigido por regresiones previas; snapshots incompletos se rechazan antes de instalar. Un trabajador de E/S quedó abierto tras completar pruebas/smoke en Windows: configuración síncrona solo de las bases temporales, verificada en la repetición integral. Revisión visual pública IAB con datos ficticios y capturas locales, sin prueba manual privada ni aceptación académica.

## Incremento Iglesias web/catálogos — 1 de noviembre de 2026

Solicitud: continuar los dos repositorios existentes, gestión EJS, catálogos auténticos, pruebas y publicación autorizada sin force push. Se inspeccionaron fuentes originales, código, pruebas y bases remotas. Se reutilizan servicios/permisos; se descargaron respuestas oficiales INEGI y se fijaron hashes/versión. La migración es aditiva; fuentes y antecedentes no se reescriben.

Incidencias reales: PostgreSQL no pudo inicializar archivos en el entorno restringido; se ejecutó con acceso local permitido. La primera corrida real pasó 144/145: una aserción esperaba la dirección original aun cuando la prueba la enviaba vacía. Se corrigió para comprobar los valores realmente enviados; no se rellenan datos inventados. Después pasó 147/147. La revisión añadió conservación de opcionales y estados HTTP de errores grandes/malformados; el resultado final se registra en estado-producto.md. Son hallazgos de Codex/herramientas, no errores ni aprobaciones atribuidos al alumno. Revisión humana y reglas ambiguas mantienen su estado; sin ceremonia ni entregable separado.

## Continuación de producto — 1 de noviembre de 2026

El alumno autorizó priorizar los dos repositorios, inspeccionar implementación/fuente y completar el siguiente incremento vertical, con commits descriptivos y publicación sin force push. Se clonaron ambos main con los SHA indicados; se leyó la fuente numerada y se comprobó la base de 70 pruebas. No se imponen ceremonias de Fase 0 ni se atribuyen respuestas a las profesoras.

Se eligió identidad porque Iglesias ya tenía persistencia y permisos pero no cuentas ni login. Se implementaron cuentas/sesiones, acceso/salida, perfil, alta/listado por Coordinación, UI de personal/usuarios y herramienta inicial explícita, conservando Iglesias. Supuestos técnicos en ADR 006; matriz/dependencias en estado-producto.md. No se activaron reglas ambiguas de patrimonio, cierres, contabilidad o solicitudes. El arnés exige ambas suites y migra PostgreSQL, amplía contrato/smoke y añade rechazo de suite de identidad ausente del índice. Ejecuciones y errores reales de la IA: [evidencia](evidencia-identidad.md). La autorización no se registra como revisión humana del código.

Resultado comprobado: gate completo 77/77 arnés y 100/100 producto; hook de commit ejecutado sobre snapshot del índice. Commits funcionales `abf147e` (aplicación) y `7bdea63` (arnés), publicados con avance normal y SHA remoto verificado en ambos main. Se probó también la provisión interactiva de primera cuenta y login HTTP sobre PostgreSQL temporal. No se hizo despliegue ni se atribuye esta ejecución a una revisión humana del alumno.

## Antecedentes conservados

Registro inicial de hechos de esta continuación. La decisión del alumno permanece pendiente; las acciones de la IA no se registran como aprobaciones humanas. No se cuenta el ejemplo del enunciado ni se inventan veinte entradas o cinco errores.

| Fecha | Tarea | Instrucción resumida | Propuesta de la IA | Acción y estado de revisión | Motivo | Cambio del arnés |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-01 | Cotejo y revisión Fase 0 | Inspeccionar ZIP frente al Word y reutilizar lo correcto | Conservar extracción, figuras e IDs; señalar 23 PC abiertas | Archivos preparados, revisión del alumno pendiente | El material no contiene respuestas reales ni diseño aprobado | Regla de no sustituir PC por supuestos |
| 2026-11-01 | Diseño preliminar | Continuar ER, estados, API, arquitectura y arnés inicial | Modelo lógico, flujo con guardas, OpenAPI y cinco ADR propuestos | Borrador creado por encargo; aceptación técnica pendiente | Permite revisar decisiones sin migrar datos ni inventar negocio | Contexto, plantillas y comprobaciones iniciales |

Las ejecuciones exactas se registran en evidencias. La inspección de fuentes y pruebas de herramientas no equivale a pruebas de negocio, integración, cobertura ni aceptación. Nuevas entradas deben registrar experiencias reales, decisiones revisadas y errores efectivamente detectados por el alumno.

## Incidencia real de comprobación del arnés

La primera ejecución de las pruebas falló porque el script apuntaba a `dependency-cruise.mjs`, que no existe en el paquete instalado. La inspección del paquete mostró `dependency-cruiser.mjs`; se corrigió la ruta y se repitieron las siete pruebas, que pasaron. Es un error de la IA detectado por herramientas durante esta sesión, no un error detectado y aprobado por el alumno; no se cuenta como una de las cinco entradas exigidas al alumno. No se ha registrado una repetición de este error.


## Continuación de revisión 02 — 1 de noviembre de 2026

| Fecha | Tarea | Instrucción resumida | Propuesta de la IA | Acción y estado de revisión | Motivo | Cambio del arnés |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-01 | BLOQUE B H03/H04/H05/H11 | Corregir hallazgos reales e incrementar pruebas | Snapshot del índice, inventario TS, límites de capas y política de seguridad | Defectos reproducidos en copia de revisión 01; correcciones y regresiones ejecutadas; revisión humana pendiente | El original aceptaba índice inválido, omitía TS y no exigía documentos/seguridad efectivos | Scripts, versión fijada, dependencias y regresiones; resultados exactos separados en evidencias-revision02 |
| 2026-11-01 | H01/H09/H10 | Preparar pendientes sin inventar respuestas | Priorizar 23 PC y evidencia manual de dos repositorios/ADR | Dos documentos preparados; ninguna PC respondida ni ADR aprobado | Las decisiones corresponden al docente/alumno según su ámbito | AGENTS recuerda bloqueos y evidencia real |
| 2026-11-01 | H06/H07/H08/H12/H13 | Corregir coherencia técnica inequívoca | Resumen público, versiones, DTO separados, sintaxis y trazabilidad/procedencia | Contrato y 30 casos de esquema preparados y ejecutados; aceptación de producto pendiente | Evitar que el contrato impida la información ya exigida o acepte estructuras vacías | Regresiones de esquema con directorio de snapshot explícito |

Incidencias de esta ejecución: ESLint detectó globals URL aún no declarados en nuevos archivos y se corrigió la configuración. Las pruebas Git encontraron primero permisos del entorno temporal y después alias de ruta corta Windows; se ejecutaron con acceso local necesario y se corrigió la comparación de raíz por identidad de directorio. No se cuentan como fallos del producto ni errores detectados por el alumno. La instalación inicial de Ajv 8.17.1 generó un aviso de dependencia; se fijó 8.20.0. Los avisos restantes de herramientas constan en el diagnóstico de dependencias. No hay commits, aprobación humana, cobertura de producto ni fase completada.

La inspección de las salidas íntegras de hooks detectó que node:test heredaba NODE_TEST_CONTEXT y omitía sus pruebas internas al ejecutarse desde otro test. Se corrigió la propagación de ese contexto y se añadió una aserción que exige ejecutar la suite interna en cada hook positivo. La suite externa anterior pasó 72 casos, pero esa omisión interna no se presenta como evidencia final. Se añadieron también rechazos de colisión de rutas/enlace del índice. El resultado definitivo posterior consta en evidencias-revision02.


## Continuación revisión 03 — 1 de noviembre de 2026, America/Mexico_City

Solicitud real: preservar revisión02, reclasificar PC, completar solo Iglesias mínimo e integrar pipeline sin avanzar Fase1. Confirmación explícita del alumno del stack/Codex y ausencia de respuestas nuevas recibidas en este chat. Revisión técnica ejecutada por Codex; revisión humana detallada aún pendiente. No son entradas atribuidas al alumno ni se fabrican cinco errores detectados por él.

Se identificó que la conversión dinámica de un esquema Patch perdía sus tipos; TypeScript lo rechazó y se corrigió usando partial/extend tipados. Lint detectó un parámetro de middleware sin uso y se corrigió. Son incidencias detectadas automáticamente por herramientas, no por el alumno. El primer intento de red encontró cadena CA no reconocida; se usó CA del sistema sin desactivar TLS. Se evitó adoptar Prisma latest RC, fijando 7.10.1. EJS se actualizó tras audit real para eliminar su cadena de ejecución afectada; se repitieron pruebas. No se ejecutó audit fix --force.

Se implementaron filtros/publicación/permisos explícitos/Prisma/validación y pruebas reales. Se mejoró arnés: gate real de producto, cobertura por fuente y dependencias de snapshot por lock sin scripts, manteniendo pruebas históricas como fixtures sin producto y agregando pruebas del índice de producto por separado. Resultados finales solo en informe/evidencias revision03, no en este relato anticipado. No hubo contacto docente, publicación, commits ni aprobación del código por el alumno.

## Correcciones R1/R2/R3 — 1 de noviembre de 2026

Solicitud real del alumno: continuar en los dos repositorios publicados desde los SHA base indicados, corregir búsqueda literal, LF y documentación; ejecutar gate/PostgreSQL/hook, crear commits pequeños con Asistido-por y publicar si el acceso lo permite, sin force push. No se reciben respuestas docentes ni aceptación detallada del módulo.

Se clonaron ambos repositorios y se confirmó su identidad. La reproducción de R1 con 70 casos produjo cinco fallos y 65 éxitos antes de corregir el adaptador: `%`/`_` aceptaban nombres sin símbolos y tres variantes de barra no encontraban los nombres literales. No son errores detectados por el alumno. La caché del entorno restringido no estaba disponible; la instalación se repitió con acceso local permitido, desde locks sin cambios. Los resultados finales, diferencias revisadas y estado de publicación se registran por separado en evidencias revisión04; este relato no sustituye sus salidas.

Resultado técnico ejecutado: gate completo en copia de trabajo y clones Windows nuevos, ambos salida 0 con 75 pruebas del arnés y 70 del producto. Los cinco escenarios del hook conservan índice y archivos, aceptan el índice válido y rechazan los cuatro fallos previstos. Una corrida anterior cambió la huella del arnés durante las pruebas por un ajuste local de EOL; se repitió con el arnés estable, sin contar la corrida interrumpida como validación. Los commits R1/R2 se crearon con fecha real y pie Asistido-por: Codex; el commit del producto ejecutó su hook. No se atribuyen al alumno aprobación detallada ni experiencias de depuración. La publicación de las correcciones requiere lectura remota posterior, registrada en el informe final.


RF25–31: gate integral repetido con salida 0, 343/343 producto y 93/93 arnés; 36 escenarios de índice preservados. Primer fixture temporal corregido para comprobar semántica tras superar formato. Resultados completos en estado-producto.md; sin aceptación humana/docente.
