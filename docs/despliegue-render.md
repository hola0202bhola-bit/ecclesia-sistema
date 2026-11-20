Ecclesia 1.1 (rama): el usuario reporta Render funcionando; este incremento no se despliega ni accede a esa base. El directorio/API ahora requieren sesión y front añade /cuenta/login, /cuenta/registro y /cuenta/perfil. Ver [guía actual](cuentas-1-1.md); las descripciones de consulta anónima siguientes pertenecen a la etapa anterior.

# Render: primera etapa, tres servicios

19 de noviembre de 2026. Preparación implementada; **sin despliegue ni URL real acreditados**. No se han creado recursos ni bases remotas. No hay cambios de esquema, datos originales o permisos de negocio.

`render.yaml` usa el subconjunto JSON de YAML 1.2, como el OpenAPI existente, para comprobarlo sin añadir dependencias.

## Arquitectura y alcance

Un repositorio y un monolito modular se ejecutan como tres procesos Express/EJS. Cada proceso utiliza sus propios routers y accede a la misma base PostgreSQL mediante las capas existentes. El front y admin **no son SPA ni clientes HTTP de la API**: extraerlos a repositorios o clientes independientes es otra etapa. Las carpetas `src/modules/*` y composition conservan las dependencias actuales.

| Servicio / APP_SURFACE | Rutas disponibles | Rutas excluidas |
| --- | --- | --- |
| api | `/api/v1/**`, `/health/live`, `/health/ready` | HTML, login web y assets |
| front | `/iglesias/**`, `/ranking-patrimonial`, `/solicitudes/**`, assets y salud | API y escrituras privadas |
| admin | `/personal/**`, assets y salud | API y operaciones de visitantes |

GET/HEAD a una página del otro sitio redirige al origen configurado conservando solo la ruta, nunca consulta/cuerpo. POST no se redirige y responde 404. El directorio y solicitudes continúan públicos según P089/P092. Los roles propios siguen siendo COORDINACION, ADMIN_IGLESIA y TESORERO; no hay autorregistro ni rol visitante inventado. Login conserva Origin exacto, bcrypt, cookie host-only HttpOnly/SameSite=Strict/Secure con HTTPS, CSRF y revocación persistente. Sin CORS ni cookies compartidas por dominio. API usa bearer; no recibe cookies desde el navegador de otro sitio automáticamente.

`all` sigue siendo el modo local de `npm run db:demo`; producción rechaza ese modo. Puertos enteros 1–65535, secretos mínimos de 32 bytes y orígenes exactos sin rutas/credenciales se validan antes de conectar. Render usa `RENDER_EXTERNAL_URL` como origen propio, salvo APP_ORIGIN explícito. HOST pasa a 0.0.0.0 en Render y conserva loopback local. TRUST_PROXY_HOPS acepta solo 0/1; el Blueprint fija un salto, que debe corresponder al proxy de entrada. No añadir otros proxies sin revisar la topología. Los límites por IP existentes usan ese salto; el límite de login sigue siendo por proceso, no distribuido.

## Configuración concreta antes del despliegue

1. Elegir una base PostgreSQL vacía destinada a esta instalación y conservar su URL privada con TLS según el proveedor. No utilizar la base propia existente ni la demo `.demo`. Elegir proveedor, región, copias y coste es una decisión aún pendiente; el Blueprint no crea una base ni contrata planes de pago.
2. Conectar `ecclesia-sistema` en Render y revisar `render.yaml`. Define tres web services Free, Node 24, generación/compilación completa y despliegue automático desactivado. Crear un Blueprint sí puede iniciar el primer despliegue; `off` solo evita los siguientes automáticos. Revisar nombres y las URL efectivamente asignadas; no tomar ejemplos como URL existente.
3. Configurar **la misma DATABASE_URL y JWT_SECRET aleatorio** en los tres servicios, dentro de Render, nunca en Git/chat. En front configurar ADMIN_ORIGIN con la URL HTTPS exacta de admin; en admin FRONT_ORIGIN con la URL HTTPS exacta de front. Si se usa dominio propio configurar APP_ORIGIN con ese origen en cada servicio. No poner slash final. `sync: false` solicita valores al crear; cambios posteriores se hacen manualmente en Render.
4. Desplegar API primero. `node scripts/render-start.mjs api` valida entorno y ejecuta `prisma migrate deploy`; si falla, no arranca. Usa las once migraciones existentes. Front/admin no migran ni crean usuarios. El build no escribe datos. No se ejecuta `db:demo` en Render.
5. Cargar el catálogo mínimo una sola vez con `npm run db:seed` desde un entorno controlado conectado explícitamente a esa base nueva. Esto incorpora la iglesia ficticia mínima; no es el fixture CT20 ni un catálogo nacional completo. Crear la primera Coordinación con `npm run db:coordinacion` desde una terminal interactiva que tenga DATABASE_URL/JWT_SECRET locales y seguros, usando la misma revisión compilada. El comando no acepta claves en argumentos ni crea contraseña por defecto. Si el plan no ofrece terminal remota, realizar esos comandos desde un clon local limpio con conexión autorizada a la base nueva. No añadir bootstrap HTTP.
6. Desplegar front y admin; comprobar salud, directorio, login y permisos. `/health/live` solo prueba proceso; `/health/ready` prueba conexión PostgreSQL y no certifica seed/migraciones/contenido. Verificar las once migraciones y datos por separado. La API no muestra páginas; front/admin responden 404 a API. Probar cierre/reapertura, solicitudes y reporte con cuentas sintéticas del alcance correcto antes de introducir datos reales.

## Limitaciones de la plataforma y evidencia

Según documentación oficial consultada el 19/11/2026, los web services Free pueden dormir después de 15 minutos y pierden archivos locales al reiniciar; no almacenar datos ni credenciales de demo en ellos. La base gratuita tiene sus propias limitaciones/expiración: no se asume persistencia ilimitada ni disponibilidad de terminal/pre-deploy en Free. Cada servicio puede despertar de forma independiente. La preparación no acredita rendimiento, aceptación móvil física ni servicio productivo.

Fuentes primarias: [Blueprint](https://render.com/docs/blueprint-spec), [web services y bind](https://render.com/docs/web-services), [variables propias](https://render.com/docs/environment-variables), [límites Free](https://render.com/docs/free). El archivo YAML se verifica estructuralmente en el arnés y pasó validación local contra el [esquema oficial](https://render.com/schema/render.yaml.json). La validación por API del proveedor y el despliegue HTTPS remoto siguen pendientes.

## Validación reproducible

Desde `arnes-codex`: `npm run check -- ../proyecto-ecclesia`. Mantiene todas las suites y añade `tests/deployment.test.ts`. El arnés arranca los tres entrypoints compilados contra su propia base efímera, con HOST=0.0.0.0 y puertos asignados; verifica rutas, salud, login, sesión compartida en PostgreSQL y revocación entre procesos. La prueba HTTPS de cookies/Origin/CSRF se realiza con Supertest y origen HTTPS configurado, no con un certificado remoto. Resultados ejecutados en `estado-producto.md`.
