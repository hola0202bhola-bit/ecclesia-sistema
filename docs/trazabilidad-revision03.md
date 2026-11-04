CT20/CT03 y RF02: [fuentes P199–225, mínimos, relaciones y pruebas reales](demo-ct20.md), más [mapa priorizado de brechas obligatorias](brechas-obligatorias.md). Migración CargaDemo y tests/demo.test.ts añaden distribución/relaciones, seguridad, no sobrescritura y compatibilidad con los ocho esquemas previos. La ficha web integra proyecciones públicas con límites explícitos; API básica y RF04/05/11 siguen con las brechas indicadas. No se declaran PC ni flujo aprobados por el docente.

Incremento RF25–31, RN17–21, RNF03, CA14–15: [tabla fuente/implementación/prueba en ADR010](adr/010.md), P088–P090/P092–P093 originales preservados. Octava suite solicitudes PostgreSQL real, contrato HTTP, seguridad/aislamiento, reloj/concurrencia, migración aditiva y auditoría. PC14–19 no respondidas; campos, retención, canal y excepciones son supuestos técnicos. Los antecedentes de solicitudes pendientes siguientes quedan superados solo en el subalcance descrito.

Actualización RF16–21: [ADR 008](adr/008.md) enlaza cada RF y P081–083/P092–093 con módulo agenda y tests/agenda.test.ts; el diseño futuro conservado abajo sigue como antecedente.

# Trazabilidad del incremento mínimo

Incremento Iglesias web/catálogos: P063–064 / RF01/03 → gestion.ts, formularios/listado EJS y servicio Iglesias; P092–093 → mismos permisos y ámbito. P063/P204 / RF05 → respuestas INEGI con manifest, importación transaccional y consulta paginada; P206 y localidades nacionales siguen parciales. tests/gestion-iglesias.test.ts comprueba HTTP+PostgreSQL, vistas, CSRF/XSS, concurrencia, fuentes y migración desde datos previos. P065 / RF04 mantiene bloqueo. La tabla histórica siguiente no sustituye [el estado vigente](estado-producto.md).

RF/RN/P originales siguen en requerimientos.md. docs/trazabilidad-revision02.md conserva la matriz completa de 31 RF/22 RN prevista. Esta tabla NO declara implementado todo un RF al cubrir solo una parte.

| Fuente / requisito | Implementación/prueba real | Límite |
| --- | --- | --- |
| P063–064 / RF-01 | listar por estado, filtros AND, DTO Zod y repositorio Prisma; suite consulta pública | Semántica técnica PC-03: coincidencia parcial literal (R1), sin acentos/caso; catálogo parcial |
| P063–064 / RF-02 | ficha básica con iglesia, JSON/EJS | Patrimonio/servicios/pláticas/agenda integrados pendientes; no fingir RF-02 completo |
| P063 / RF-03 | POST/PATCH por capas, FK/validación, transacción de versión, pruebas de persistencia/concurrencia | Perfil mínimo sujeto PC-02; sin identidad/login completo |
| P065 / RF-04 / RN-03 | exclusión de cerradas en lista/ficha, registro conservado y pruebas | Comandos cierre/reapertura/gestión de cerradas bloqueados PC-04 |
| P092–093 / RF-06 / RNF-02/03 | JWT verificado y servicio con ámbito propio; pruebas de token/rol/otra iglesia | Solo permisos explícitos de Iglesias; ampliaciones PC-19 pendientes |
| P053 / CT acceso relacional | Migración PostgreSQL, seed idempotente, FK/CHECK, dos clientes reales | No hay esquema/seed global de otros dominios |
| P127/P154/P157 | módulo por capas, grafo completo, tests/gate/hook reales | No es aceptación funcional docente |
| P261 mínimo 70% | V8 en fuentes de referencia salvo arranque, cuatro umbrales 70% | No representa sistema completo; métrica académica pendiente |

Pruebas ejecutadas e informes machine-readable se entregan separados de pruebas previstas. H01: validación del cliente abierta, ahora ocho grupos. H02: evaluar evidencia técnica del mínimo implementado; no ocultar bloqueo de aceptación por PC-02/04/19. H08: validación de referencia real, reglas restantes abiertas. H09 publicación: acreditada en ambos SHA base; historial desde semana 1: residual pendiente. Ver [URLs, commits y límites vigentes](repositorios-revision03.md). H10: stack/IA confirmados por alumno; arquitectura/acceso justificables aplicados al incremento, ADR 004/005 con partes de diseño aún propuestas.

## Incremento R1/R2/R3

| Reserva | Artefactos y verificación | Límite |
| --- | --- | --- |
| R1 / PC03 / RF01 | Adaptador Prisma escapa el patrón LIKE después de normalizar; 13 regresiones PostgreSQL de consulta ordinaria/símbolos con positivos y negativos; la prueba de texto SQL se mantiene separada | No cambia permisos, contrato de datos ni alcance de negocio |
| R2 / instalación P157 | `.gitattributes` en ambos repositorios; clon Windows nuevo con conversión automática, cotejo de bytes/binarios y gate | No acredita instalación humana en menos de diez minutos ni prueba móvil |
| R3 / H09 y trazabilidad | README, AGENTS, registro de publicación, índice de evidencias y bitácora; conserva antecedentes fechados | No aprueba H01/H02/H08 ni dispensa historia P056 |

Resultados efectivamente ejecutados y comandos: [evidencias revisión 04](evidencias-revision04/README.md).
