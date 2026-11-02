# Proyecto Ecclesia — aplicación web

Express/TypeScript + PostgreSQL/Prisma + EJS. IA principal: Codex, elegida por el alumno. Se priorizan dos entregas: este repositorio y [el arnés](https://github.com/hola0202bhola-bit/ecclesia-arnes-codex). No se exige cierre formal de Fase 0 para continuar desarrollo.

Disponible: consulta pública con selectores y filtros; listado, alta y edición EJS de iglesias; API, personal, usuarios por Coordinación y sesiones revocables. [Estado y límites](docs/estado-producto.md). Seed: una iglesia ficticia, seis tipos de P063, 32 estados y 2,478 municipios del snapshot oficial INEGI. Localidades: solo 211140001, Heroica Puebla de Zaragoza. No es el catálogo nacional completo ni el sistema terminado.

## Instalar, validar y arrancar

Node 24 y npm. Para ejecutar la app hace falta una base PostgreSQL propia vacía. Para las pruebas no: el arnés crea PostgreSQL aislado y nunca usa su DATABASE_URL externa. Clonar como hermanos con estos nombres:

```powershell
git clone https://github.com/hola0202bhola-bit/ecclesia-sistema.git proyecto-ecclesia
git clone https://github.com/hola0202bhola-bit/ecclesia-arnes-codex.git arnes-codex
cd proyecto-ecclesia
npm ci
npm run generate
cd ../arnes-codex
npm ci
npm run check -- ../proyecto-ecclesia
cd ../proyecto-ecclesia
Copy-Item .env.example .env
```

Editar **solo el .env local**: DATABASE_URL de la base propia, JWT_SECRET aleatorio de al menos 32 bytes, PORT y APP_ORIGIN exacto (por defecto `http://127.0.0.1:3000`). No compartir credenciales ni versionar ese archivo. Después:

```powershell
npm run db:migrate
npm run db:seed
npm run build
npm run db:coordinacion
npm start
```

`db:coordinacion` compila y pide identificador y contraseña oculta/confirmación en una terminal interactiva; solo crea la primera Coordinación si no existe ninguna cuenta. No hay contraseña predeterminada ni bootstrap HTTP. Si ya hay cuentas se rechaza sin reemplazarlas. Para crear más, entrar como Coordinación en [acceso local](http://127.0.0.1:3000/personal/login) → Gestionar usuarios. Contraseña mínima 15 caracteres y máxima 72 bytes UTF-8; un rol por cuenta, iglesia obligatoria para administrador/tesorero y vacía para Coordinación. [Supuestos técnicos y límites](docs/adr/006.md).

Si ya hay cuentas, omitir `db:coordinacion`. Para actualizar: `git pull --ff-only`, `npm ci`, `npm run generate`, `npm run db:migrate`, `npm run db:seed`, `npm run build` y `npm start`. Conservar base y .env existentes.

En el navegador: [acceso del personal](http://127.0.0.1:3000/personal/login) → **Gestionar iglesias** → **Registrar iglesia** (Coordinación) o **Editar**. Administrador solo edita la asignada; tesorero no obtiene gestión. Tipo y ubicación se seleccionan por nombre; el alta solo ofrece localidades verificadas cargadas. Errores conservan campos; una edición obsoleta responde 409 sin sobrescribir y permite cargar la versión actual para comparar. Campos opcionales vacíos conservan datos previos al editar; borrado pendiente de política. Cierre/reapertura bloqueados.

Fuentes: [servicio oficial INEGI](https://www.inegi.org.mx/servicios/catalogounico.html), respuestas originales, URL, fecha y hashes en `prisma/fuentes/manifest.json`. Consulta del 1 de noviembre de 2026, metadatos estadísticos Censo 2020; no se afirma vigencia territorial nacional actualizada. `db:seed` valida hashes, conteos, claves y jerarquía antes de importar en una transacción; conserva versión/manifest en CatalogoVersion. Repetir no duplica; cambiar contenido bajo una versión ya importada se rechaza con rollback. Nuevas fuentes/versiones requieren revisión del snapshot. No hay descarga remota al arrancar ni edición web de catálogos.

Consulta sin cuenta en [iglesias](http://127.0.0.1:3000/iglesias), estado 21. La web usa cookie HttpOnly y formularios con protección CSRF. El servidor sigue enlazado a 127.0.0.1. Para HTTPS configurar APP_ORIGIN correcto; eso activa Secure en cookie. Despliegue público y prueba móvil/carga no están realizados. El objetivo de arranque menor a 10 minutos depende de disponer de Node, red y PostgreSQL; no se afirma haberlo medido.

| API /api/v1 | Uso |
| --- | --- |
| POST /auth/login | JSON identificador/password; devuelve bearer 1h, usuario y csrfToken; no crea cookie |
| GET /auth/me | Perfil actual y sesión válida |
| POST /auth/logout | Revoca el bearer usado; 204 |
| GET /usuarios?page=1&pageSize=20 | Coordinación; paginado, sin contraseñas/hash |
| POST /usuarios | Coordinación; identificador, password, rol e iglesiaId según rol |
| GET /iglesias?estadoClave=21 y GET /iglesias/:id | Consulta pública |
| GET /catalogos/estados, /catalogos/municipios?estadoClave=21, /catalogos/localidades?estadoClave=21&municipioClave=114 y /catalogos/tipos-iglesia | Consulta pública paginada (page/pageSize), versión y alcance parcial |
| POST /iglesias y PATCH /iglesias/:id | Bearer de cuenta real; Coordinación o administrador propio para edición; version requerida |

También se puede usar `Authorization: Bearer ...` en Postman para gestión de iglesias; los esquemas completos están en [OpenAPI](openapi.yaml), con disponibilidad por operación, y [subconjunto implementado](docs/api-referencia-revision03.json). El perfil histórico de JWT externo se conserva solo para regresión explícita; el servidor normal exige sesión persistida. `npm test` ejecuta todo el pipeline de producto; el gate completo se ejecuta desde el arnés como arriba.

## Estado y evidencia

[Matriz y dependencias](docs/estado-producto.md), [evidencia del incremento previo de identidad](docs/evidencia-identidad.md), [arquitectura](docs/ARCHITECTURE.md), [ADR 006](docs/adr/006.md). Quedan patrimonio/índice, servicios/pláticas, agenda, diezmos, solicitudes, catálogo nacional y ampliaciones de identidad. No se inventan respuestas docentes ni se presenta la autorización como revisión humana del código.

## Antecedente íntegro: README de R1/R2/R3

El texto siguiente describe aquella revisión. Sus restricciones de alcance y ausencia de login fueron superadas por el incremento actual; se conserva para trazabilidad.

# Proyecto Ecclesia — Fase 0, correcciones R1/R2/R3

Fase 0 abierta. Único incremento de producto: Iglesias mínimo de referencia. Revisión 02 preservada como antecedente; no iniciar Fase 1. El alumno confirmó Express + TypeScript + PostgreSQL + Prisma, EJS, Vitest/Supertest y Codex como IA principal en esta revisión. No hay respuestas nuevas ni validación docente.

Estado publicado, SHA base y límites H01/H02/H08/H09: [repositorios](docs/repositorios-revision03.md). Correcciones y resultados ejecutados: [revisión 04](docs/correcciones-r1-r3.md).

Leer docs/decisiones-pc-revision03.md, docs/consultas-docente-revision03.md y docs/referencia-iglesias-revision03.md. Documentos revisión01/02 conservados son historial; las vistas revision03 prevalecen cuando difieran. RF/RN originales y fuentes no se reescriben como aprobados.

## Instalar y comprobar

Requiere Node 24 y npm. Clonar como directorios hermanos `proyecto-ecclesia` y `arnes-codex`, con esos nombres locales, siguiendo los [comandos Windows](docs/repositorios-revision03.md). `.gitattributes` conserva LF en texto incluso con `core.autocrlf=true` y preserva binarios. Los locks fijan dependencias exactas. PostgreSQL de prueba se descarga como dependencia de desarrollo de plataforma; primera instalación necesita red y espacio, y la primera verificación puede necesitar descarga del motor Prisma. No desactivar validación TLS. En redes con CA corporativa usar la CA del sistema solo si corresponde.

Desde proyecto-ecclesia:

~~~text
npm ci
npm run generate
npm run build
~~~

Desde arnes-codex:

~~~text
npm ci
npm run check -- ../proyecto-ecclesia
~~~

El check ejecuta arnés, contrato, inventario completo de fuentes/arquitectura y pipeline real de producto con BD aislada. npm test en proyecto ejecuta las pruebas/BD desde el arnés hermano, tras generar el cliente. No requiere configurar DATABASE_URL para pruebas. Los secretos efímeros no se imprimen ni se guardan en evidencias. Los logs de pruebas contienen solo datos ficticios y puertos locales.

## Ejecutar la referencia local

Crear una BD vacía propia para la referencia en PostgreSQL. Copiar .env.example a .env y completar allí credenciales y secreto JWT aleatorio de al menos 32 bytes. No compartirlos ni versionarlos. DATABASE_URL del ejemplo es un marcador, no una credencial útil.

~~~text
npm run generate
npm run db:migrate
npm run db:seed
npm run build
npm start
~~~

Abrir http://127.0.0.1:3000/iglesias y consultar estado 21. API: /api/v1/iglesias?estadoClave=21. Datos ficticios: una iglesia, una localidad oficial y seis tipos. No es el seed final de 40 iglesias/catálogos nacionales. No hay login ni cuentas iniciales; escrituras requieren principal firmado de emisor externo confiable. Para demostrar permisos usar pruebas, no inventar usuarios de producción.

Reapertura/cierre y gestión de cerradas devuelven bloqueo explícito hasta aclaración PC-04. RF-02 integrado con patrimonio/servicios/agenda sigue pendiente; no se devuelve colección vacía como si esos módulos existieran. El contrato general openapi.yaml conserva diseño de otros dominios y marca disponibilidad por operación. docs/api-referencia-revision03.json es el subconjunto ejecutable.

## Revisión y repositorios

H09 publicación: dos repositorios reales verificados en los SHA base enlazados arriba. H09 historial desde semana 1: residual académico pendiente; los commits de importación no lo prueban. Las notas antiguas se conservan como antecedentes. Revisión humana del código, validación del cliente, respuestas a ocho grupos, aceptación del perfil PC-02 y requisitos académicos adicionales siguen pendientes. Consultar [evidencias disponibles y procedencia](docs/evidencias-revision04/README.md). Los archivos externos del antiguo paquete no son dependencias de estos repositorios.
