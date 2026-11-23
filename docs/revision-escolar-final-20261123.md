# Correcciones finales de revisión escolar — 23/11/2026

Se conservan los PR #3 y #4 sin reescribirlos ni fusionarlos. Esta corrección añade espacio y una línea propia al horario de servicios y al detalle de pláticas en la ficha, y estabiliza la preparación del fixture masivo descrito abajo. README y guía de cuentas distinguen estado vigente de antecedentes: PR #1/#2 incorporados y catorce migraciones, con #3/#4 aún en borrador. No cambia lógica, permisos, contrato, datos ni dependencias.

El arnés hermano corrige por separado la resolución nativa de rutas del hook y conserva fingerprint, snapshot de índice, instalación offline por lock y todos los controles. La evidencia de esta revisión debe vincularse a sus árboles/SHA, logs y ejecución final; las cifras históricas no sustituyen esa ejecución.

Orden preparado para una autorización posterior: #3 → #4 → esta corrección; la corrección del arnés se valida junto al conjunto. Antes de integrar, comprobar de nuevo heads/bases, compatibilidad y ausencia de despliegue automático; no se ha consultado ni cambiado Render en esta revisión. No hay autorización de fusión, despliegue o migración de bases reales. Aceptación docente, pruebas en teléfono físico y PC previas continúan pendientes.

## Preparación del fixture masivo

El fixture de la prueba histórica de 10000 misas se prepara ahora en tres inserciones por conjuntos, dentro de una transacción acotada a 10 segundos y con estadísticas actualizadas entre relaciones. Conserva las FK, los 10000 registros adicionales, el límite global de 15 segundos y todas las aserciones anteriores; añade comprobaciones explícitas de 10001 horarios, ocurrencias y celebraciones. No modifica consultas, cálculo ni reglas financieras de la aplicación.

El gate posterior a la corrección de Git volvió a fallar por el timeout de este fixture, antes de llegar al fallo preparado del último escenario. Una medición del prefijo de 100 pruebas separó 10288 ms de carga y 934 ms de consulta; el caso aislado había tardado 2923 ms en total. Esto localiza la variación en preparación sintética; no demuestra un defecto de la consulta financiera ni identifica por sí solo el plan interno exacto. La carga por fases y ANALYZE evita depender de la actualización eventual de estadísticas tras un crecimiento artificial brusco. La transacción permite cancelar y revertir la preparación antes de agotar los 15 segundos y evita que siga insertando durante la limpieza tras un timeout.

[ANALYZE de PostgreSQL](https://www.postgresql.org/docs/18/sql-analyze.html) actualiza estadísticas del planificador. La evidencia final debe conservar estos intentos fallidos separados y volver a ejecutar el gate íntegro sobre el nuevo árbol; ninguna comprobación parcial reemplaza ese gate.
