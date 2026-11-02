# Iglesias mínimo de referencia — alcance y límites

1 de noviembre de 2026, America/Mexico_City. Único módulo de producto autorizado en esta revisión. Demuestra capas, DTO, servicio, persistencia, HTTP/EJS y pruebas. **No equivale a Iglesias funcionalmente completo ni valida Fase 0.**

| Operación | Estado |
| --- | --- |
| GET /api/v1/iglesias | Real: estado requerido; municipio/localidad/tipo/nombre/capacidadMin/capacidadMax; coincidencia parcial literal del nombre (incluye `%`, `_` y `\`), sin acentos/caso; AND, capacidad inclusiva, page/pageSize, orden estable |
| GET /api/v1/iglesias/:id | Real: solo bloque iglesia de ficha; cerrada/inexistente 404. No simula bloques de otros dominios |
| POST /api/v1/iglesias | Real: principal de Coordinación verificado. Perfil mínimo de referencia sujeto PC-02 |
| PATCH /api/v1/iglesias/:id | Real: Coordinación o administrador de ESA iglesia; version requerida, UPDATE condicional e incremento transaccional; conflicto 409 |
| POST /:id/cerrar y /:id/reabrir | Autenticadas pero 501 PC04_PENDIENTE; sin modificación. Sin token 401. No se inventa quién puede cerrar/reabrir |
| /iglesias y /iglesias/:id | Vistas EJS públicas, salida escapada; sin acceso directo a Prisma |
| Otros dominios y DELETE | No implementados; 404 |

Capas: domain contiene tipos, puertos, normalización y error; application coordina permisos, publicación y reglas del incremento; presentation valida con Zod y adapta HTTP; infrastructure usa Prisma; composition conecta dependencias. shared/infrastructure verifica un JWT de un emisor externo confiable, no incorpora cuentas/roles de identidad nuevos.

Perfil provisional de captura: nombre, tipo, geografía y dirección requeridos para que el ejemplo tenga identificación y ubicación consistente. Capacidad/año/contacto/coordenadas/zona se omiten si desconocidos, no se rellenan. Límite de texto, enteros finitos/rangos físicos y zona IANA son defensas técnicas. Coordenadas se envían/editan juntas. Años futuros reciben 422 PC02_PENDIENTE para no decidir esa política. Falta aclarar nulabilidad definitiva y eliminación de opcionales: no se implementa null para borrar datos sin acordarlo. La migración de referencia no es el modelo final.

Autorización: P092 habilita administración de iglesias por Coordinación; P093 habilita al administrador de su propia iglesia. Ningún header/campo de cliente otorga rol/ámbito. JWT HS256 firmado, exp/issuer/audience obligatorios; secreto mínimo 32 bytes y sin default. Rechaza perfiles de múltiples roles/iglesias: fuera del alcance implementado, no prohibición atribuida al profesor. No hay login, bootstrap, cuentas ni cambio de membresías. Solo el emisor confiable configurado puede emitir credenciales; pruebas generan identidades ficticias efímeras. En servidor standalone no se entrega una clave válida ni endpoint para fabricarla. HTTPS/rotación/revocación/alta de usuarios pendientes de identidad; arranque restringido a 127.0.0.1.

PostgreSQL tiene FK de tipo y combinación geográfica, CHECK de capacidad/nombre/coordenadas/version, migración versionada y seed idempotente. Una edición fallida no incrementa la versión; dos concurrentes con la misma versión no ganan ambas. No se agrega auditoría de otros dominios ni borrado histórico.

INEGI: respuesta oficial conservada en prisma/fuentes/inegi-localidad.json, consulta 2026-11-01, clave 211140001. El proveedor devuelve periodo 2015-06-01 y metadato Censo 2020; fecha de consulta NO es fecha de corte de catálogo. Un registro de servicio no demuestra que se importó el catálogo nacional vigente. Los seis tipos provienen de P063 y la iglesia/ubicación de calle/contactos son ficticios.

Pruebas: PostgreSQL real nuevo por ejecución, migra, ejecuta seed dos veces y Vitest/Supertest. Ignora DATABASE_URL externa para no tocar BD ajenas. Mide las siete fuentes salvo server.ts (arranque), con umbral interno de 70% en líneas/sentencias/funciones/ramas. El mínimo académico no se reduce; su métrica sigue PC-21. El arnés exige reporte no vacío y cobertura por cada fuente medida. Las salidas originales de revisión 03 pertenecen al paquete externo, ausente en GitHub; consultar [procedencia y resultados actuales](evidencias-revision04/README.md); no extrapolar al resto de Ecclesia, al catálogo nacional, móvil, carga o seguridad productiva completa.
