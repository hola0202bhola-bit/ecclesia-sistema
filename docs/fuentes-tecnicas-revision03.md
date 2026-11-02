# Fuentes técnicas consultadas — 2026-11-01

- Caso DOCX original y su extracción OOXML cotejada; P063–065, P092–093 para Iglesias, P152–157 para referencia/arnés. Revisiones 01/02 y auditorías preservadas con hashes.
- Chat «Ayuda actividad programación», ID 6ae771a0-5fd4-83e8-bf0b-e4c6c06e4266, recuperado mediante read_thread. Reclasificación PC visible; cuerpo exacto de ocho preguntas ausente en resultado. El cuestionario revisión03 es reconstrucción, no cita literal. Confirmación del stack/Codex y ausencia de respuestas nuevas recibidas directamente en el chat actual.
- [INEGI: servicio oficial](https://www.inegi.org.mx/servicios/catalogoUnico.html) y [ayuda del catálogo](https://www.inegi.org.mx/contenidos/app/ageeml/Ayuda/Ayuda_Gral_Cat_Unico.pdf): consulta y equivalencias/historia; no asumir inmutabilidad universal de claves.
- [Respuesta de localidad usada](https://gaia.inegi.org.mx/wscatgeo/v2/localidades/211140001): bytes conservados en prisma/fuentes. Consulta 2026-11-01, periodo devuelto 2015-06-01, metadato Censo 2020. No inferir de esto corte de un catálogo nacional descargado.
- [Prisma PostgreSQL v7](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql) y [drivers v7](https://docs.prisma.io/docs/orm/v7/core-concepts/supported-databases/database-drivers): adaptador pg y configuración separada. Versiones obtenidas de npm; 7.10.1 estable elegida sobre latest 8.0.0-rc.29 observado.
- [embedded-postgres](https://www.npmjs.com/package/embedded-postgres) y [repositorio del autor](https://github.com/leinelissen/embedded-postgres): cluster local con binarios PostgreSQL. Wrapper/plataforma 18.6.0-beta.19; versión real del servidor guardada por SELECT version(). No se usa PGlite como prueba de Prisma/PostgreSQL real.
- [Aviso minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249): avisos moderados transitivos en herramientas de desarrollo según auditorías online adjuntas. No se aplicó la degradación sugerida de ESLint ni un override mayor sin revisión. EJS se actualizó a 7.0.2 y se verificó su renderizado.

Estas fuentes justifican decisiones de implementación; no son respuestas del profesor ni aceptación académica.
