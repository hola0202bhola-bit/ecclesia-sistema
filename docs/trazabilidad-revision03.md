# Trazabilidad del incremento mínimo

RF/RN/P originales siguen en requerimientos.md. docs/trazabilidad-revision02.md conserva la matriz completa de 31 RF/22 RN prevista. Esta tabla NO declara implementado todo un RF al cubrir solo una parte.

| Fuente / requisito | Implementación/prueba real | Límite |
| --- | --- | --- |
| P063–064 / RF-01 | listar por estado, filtros AND, DTO Zod y repositorio Prisma; suite consulta pública | Semántica técnica PC-03, catálogo parcial |
| P063–064 / RF-02 | ficha básica con iglesia, JSON/EJS | Patrimonio/servicios/pláticas/agenda integrados pendientes; no fingir RF-02 completo |
| P063 / RF-03 | POST/PATCH por capas, FK/validación, transacción de versión, pruebas de persistencia/concurrencia | Perfil mínimo sujeto PC-02; sin identidad/login completo |
| P065 / RF-04 / RN-03 | exclusión de cerradas en lista/ficha, registro conservado y pruebas | Comandos cierre/reapertura/gestión de cerradas bloqueados PC-04 |
| P092–093 / RF-06 / RNF-02/03 | JWT verificado y servicio con ámbito propio; pruebas de token/rol/otra iglesia | Solo permisos explícitos de Iglesias; ampliaciones PC-19 pendientes |
| P053 / CT acceso relacional | Migración PostgreSQL, seed idempotente, FK/CHECK, dos clientes reales | No hay esquema/seed global de otros dominios |
| P127/P154/P157 | módulo por capas, grafo completo, tests/gate/hook reales | No es aceptación funcional docente |
| P261 mínimo 70% | V8 en fuentes de referencia salvo arranque, cuatro umbrales 70% | No representa sistema completo; métrica académica pendiente |

Pruebas ejecutadas e informes machine-readable se entregan separados de pruebas previstas. H01: validación del cliente abierta, ahora ocho grupos. H02: evaluar evidencia técnica del mínimo implementado; no ocultar bloqueo de aceptación por PC-02/04/19. H08: validación de referencia real, reglas restantes abiertas. H09: preparado, no creado/publicado. H10: stack/IA confirmados por alumno; arquitectura/acceso justificables aplicados al incremento, ADR 004/005 con partes de diseño aún propuestas.
