# Patrimonio e índice — 2 de noviembre de 2026

Bases inspeccionadas: aplicación `b23b6b62e2dd3ec8ce7531fd075a4965928e6961`, arnés `453eb8368090e3f83b066905087ec0625e1859e3`. Incremento autorizado por el alumno; sin respuestas nuevas del cliente ni aprobación docente.

## Uso en navegador

Actualizar ambos repositorios con `git pull --ff-only`; instalar sus locks con `npm ci`. En aplicación: `npm run generate`, `npm run db:migrate`, `npm run db:seed`, `npm run build`, `npm start`. Conservar el `.env` local y la base existentes. Configuración inicial en README.

Entrar en `/personal/login` con una cuenta **ADMIN_IGLESIA** asignada a una iglesia abierta → **Gestionar patrimonio** → **Registrar pieza**. Coordinación crea esa cuenta desde Gestionar usuarios; no se le concede captura de patrimonio por inferencia. No hay cuentas ni contraseñas automáticas.

La lista permite editar cada pieza y pasar una vigente a prestada, perdida o baja. Cada escritura conserva actor, fecha, antes/después y versión en `CambioPatrimonio`, dentro de la misma transacción. Dos cambios con la misma versión no ganan ambos. No se expone auditoría en la consulta pública ni hay DELETE HTTP. La auditoría no se presenta como almacenamiento inalterable frente al dueño de la BD; su consulta específica por UI queda pendiente.

Sin sesión: `/iglesias` → ficha → **Consultar patrimonio e índice**, o `/ranking-patrimonial` (**Iglesias reconocidas**). El ranking permite país (ubicación vacía), estado, municipio y ciudad/localidad por claves oficiales; Puebla: `21 / 114 / 0001`. Tipo y antigüedad se evalúan sobre la misma pieza vigente. Estos filtros seleccionan iglesias; su índice sigue sumando todas las piezas vigentes.

Para reproducir P074 con corte **2026**, registrar estas cuatro piezas. Los demás campos de material/conservación/ubicación que el ejemplo no especifica deben etiquetarse como demostración ficticia; no se presentan como datos históricos reales.

| Descripción escrita en P074 | Tipo | Año / siglo | INAH | Aportación en 2026 |
| --- | --- | --- | --- | --- |
| Imagen de San Miguel Arcángel | Imagen de santo | 1720 | Sí | 20.0 |
| Retablo lateral | Retablo | Siglo 18, año exacto vacío → 1750 | No | 9.1 |
| Par de candelabros de plata | Orfebrería | 1890 | No | 4.0 |
| Piano vertical | Piano | 1950 | No | 2.4 |

Resultado: **35.5, Alto valor patrimonial**. El par es un registro para reproducir el ejemplo, sin multiplicarlo por dos; no resuelve el modelo general de conjuntos PC05. En otros años el resultado puede variar por los tramos de antigüedad. El test siempre inyecta 2026.

## Reglas, decisiones provisionales y pendientes

- P068/P071–074: siglo XVIII → 1750; bases 1/2/4/7/10 en 50/100/200/300; factores 1.5/1.3/1.2/1/0.8; INAH suma 5 **después** de multiplicar. Suma solo vigentes; umbrales 8/20/40 y etiquetas literales. Cálculo puro en décimas enteras; API devuelve cadenas decimales. Sin redondeo binario ni reloj/ORM dentro del dominio.
- Corte técnico provisional PC05: año calendario UTC capturado al arrancar la app, inyectable en pruebas. Reiniciar al cambiar de año. Se muestra referencia y `criterioId` en los resultados. No se afirma política temporal validada por el cliente.
- RF07/PC02: perfil mínimo exige descripción, tipo, material, conservación, ubicación interna e INAH booleano; exactamente un año o siglo. Se rechaza fecha desconocida/futura, sin inventarla. Los campos de texto no clasifican la conservación en categorías nuevas. Cambiar año por siglo mediante PATCH requiere poner `anioExacto: null` y viceversa.
- RF08/PC06: solo VIGENTE → PERDIDO/PRESTADO/BAJA. Recuperación de vigencia y otras transiciones pendientes; se rechazan sin mutación. Capturas nuevas empiezan vigentes. Consulta pública solo vigente; otras piezas quedan accesibles al administrador propio, como decisión conservadora provisional de publicación. Cerradas reciben 404 también en gestión patrimonial.
- RF10/PC07: exclusiones literales de cerradas y sin registros. Índice cero con registros se incluye provisionalmente; empates por nombre e ID, sin top N. No se atribuyen estas decisiones al cliente.
- RF11/PC08: parámetros `caso-v1` persistidos y versionados por migración; función recibe criterios separados. **Ajuste y activación por Coordinación, historia de criterios/índices y nuevos formatos de precisión siguen pendientes.** No editar parámetros a mano para simular esa función. Endpoints de criterios siguen diseño no implementado.
- Alcance acotado: lectura de ranking calcula sobre snapshot RepeatableRead antes de paginar, en memoria. Sin caché, medición de carga ni afirmación de rendimiento nacional. La edición bloquea la fila iglesia y comprueba versión del objeto dentro de la transacción. FK/CHECK protegen persistencia y auditoría fallida revierte toda la escritura.
- INEGI: no se amplió este incremento; la localidad oficial existente permite demostrar patrimonio. Se conservan los bytes/hashes/jerarquía y la importación idempotente anterior. Catálogo nacional y cantidades finales de entrega pendientes.

## Trazabilidad y verificación

| Requisito / fuente | Código | Prueba en `tests/patrimonio.test.ts` |
| --- | --- | --- |
| RF07, P067–068/P093 | dominio, DTO Zod, servicio/repositorio, EJS | Alta/edición real, fechas, FK, campos, permisos y aislamiento |
| RF08, P068 | `validarCambioCondicion`, transacción y auditoría | Cada exclusión, conservación, rechazo de reactivación, concurrencia y rollback |
| RF09, P070–074 | `calcularIndice` puro y criterios persistidos | 35.5 puro y HTTP+BD; cada frontera, tipo, INAH y distinción |
| RF10, P075 | ranking snapshot y EJS | Ámbitos geográficos, orden, empate, cero provisional, cerradas y sin objetos |
| RF11, P075/P092 | versión inicial y función parametrizada | Coherencia BD/dominio y cambio de factor solo como entrada de prueba; UI de configuración pendiente |
| RF12, P076 | filtros AND tipo/antigüedad | Puebla, misma pieza, límites y exclusión de prestada |

Reproducir: desde el arnés `npm run check -- ../proyecto-ecclesia`. Ejecuta migraciones, doble seed, PostgreSQL real temporal, cuatro suites, cobertura, compilación, contratos, arquitectura, smoke HTTP y regresiones del índice Git. Resultados finales en `estado-producto.md`. Revisión visual pública en navegador local IAB: 35.5, cuatro aportaciones y filtro de Puebla con imágenes de 300 años. Capturas locales fuera de Git. Formularios privados comprobados por HTTP con sesiones; sin recorrido manual privado, móvil físico ni despliegue.
