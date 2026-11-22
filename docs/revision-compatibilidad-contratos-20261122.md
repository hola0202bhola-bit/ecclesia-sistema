# Corrección R-01 — contratos de la ficha escolar

22/11/2026, America/Mexico_City. Segunda revisión favorable del usuario, con corrección de compatibilidad obligatoria antes del commit. No acredita aceptación docente. Ramas `feat/ajustes-escolares-20261121` en los dos repositorios; sin commits, publicación o despliegue.

## Cambios acotados

Se actualizan exclusivamente las propiedades `fotoUrl` y `descripcion` de `Iglesia`, `IglesiaInput`, `IglesiaCreateInput`, `IglesiaPatchInput`, `IglesiaReferenciaCreateInput` e `IglesiaReferenciaPatchInput`, en `openapi.yaml` y `docs/api-referencia-revision03.json`. Se conservan los demás esquemas, rutas, roles, límites, nulabilidad y obligatoriedad existentes.

Zod del servidor, permisos, CSP, EJS, respaldo SVG, migración 13 y sus doce predecesoras permanecen intactos. Los cuatro casos nuevos de producto se incorporan a Iglesias; el arnés añade dos casos de contrato sin retirar controles. El informe anterior y sus dos parches se conservan como instantánea histórica; ya no representan los archivos corregidos.

## Restricciones ejecutables

- `descripcion`: string/null, longitud 1–500 y patrón `\S`. Rechaza vacío o solo blancos, incluidos tabulaciones, saltos de línea y espacios Unicode reconocidos por ECMA-262. `null` elimina; omitir conserva al editar.
- `fotoUrl`: string/null, longitud 1–700 y patrón ECMA-262 de URL absoluta `https://` sin distinguir mayúsculas. Host con al menos un punto, etiquetas de hasta 63 caracteres, sufijo ASCII alfabético y punto DNS final opcional. Se admiten etiquetas IDN, rutas/consultas sin espacios interiores y puertos 0–65535 (incluidos ceros iniciales). No permite userinfo, fragmentos, IP literales ni URL vacía. La restricción `not` rechaza los sufijos localhost/local/internal/invalid/test/example/onion con cualquier combinación de mayúsculas. Ese `not` se limita a string para no rechazar null.
- La ruta y consulta pueden contener `@` o `%23`: no son userinfo ni un fragmento literal. No se eliminan datos válidos por buscar esos símbolos en toda la URL.
- Se conservan `null`, omisión y el comportamiento del formulario: vacío/solo espacios en los dos campos se normaliza a null antes del DTO JSON. Una cadena vacía enviada directamente por API se rechaza.

No se depende de `format: uri`: por sí solo no exige HTTPS ni los demás límites. Las pruebas Ajv aplican los patrones aun con `validateFormats: false`.

## Límites que siguen en Zod

JSON Schema valida la representación recibida, no transforma valores. Zod ejecuta trim y `new URL` con las reglas WHATWG/IDNA. El contrato espera la forma absoluta con `https://`; no pretende representar todas las formas no canónicas que el parser puede normalizar (p. ej. separadores, escapes en el host o notación abreviada de esquema).

Para IDN, el tamaño definitivo y la validez de las etiquetas después de convertirlas a ASCII requieren el parser del servidor. `maxLength` de JSON Schema cuenta caracteres Unicode de la entrada; Zod limita unidades UTF-16 después de trim. El texto no ASCII en el límite, o un valor muy rellenado con blancos exteriores, requiere la comprobación final del servidor. Los casos de correspondencia cubren valores canónicos, IDN ordinario y límites ASCII; no se afirma equivalencia matemática de todas las normalizaciones Unicode posibles.

Ni estos patrones ni Zod resuelven DNS o verifican redirecciones, contenido, disponibilidad o licencia. HTTPS y un nombre con apariencia DNS no garantizan un destino efectivo público. No se amplía el respaldo SVG: funciona cuando no hay URL; una URL remota rota sigue requiriendo corrección o eliminación, como ya estaba documentado.

## Pruebas y reproducción

`tests/iglesias.test.ts` comprueba los doce esquemas de propiedades con Ajv y compara la aceptación con crearInput/editarInput de Zod. Incluye HTTP, javascript/data/file, userinfo, fragmento incluso vacío, IPv4/IPv6/formas numéricas, sufijos locales, blancos, tipos inválidos, puerto inválido, null y omisión. Positivos: HTTPS, mayúsculas, subdominios, puerto, DNS final con punto, IDN, consulta con @, fragmento codificado, 700 caracteres ASCII y descripción de 500.

`tests/ficha-escolar-contract.test.mjs` del arnés exige rechazo de las mismas familias negativas, reglas iguales entre ambos archivos, nulabilidad, opcionalidad y positivos HTTPS. No reemplaza las pruebas PostgreSQL, seguridad, índice o cobertura.

Comandos: desde el producto `npm test`; desde `ecclesia-arnes-codex`, `npm run check -- ../ecclesia-sistema`. El gate íntegro vuelve a generar/compilar y ejecutar las suites con bases propias efímeras. No se omiten pruebas ni se modifica el arnés durante la pasada. El gate completo del 22/11 terminó con salida 0: **504/504 producto y 108/108 arnés**, sin omisiones; cobertura de líneas 97.59%, trece migraciones y pruebas compiladas correctas. Los 65 escenarios de índice conservaron índice y directorio. El primer intento de producto falló antes de pruebas por P2028 en seed; se conserva separado de la repetición íntegra correcta y del gate aprobado. [Resultados, tiempos y límites](estado-producto.md), [resumen y huellas](evidencias-contratos-20261122.json). Solo se actualizó documentación tras congelar/verificar los 216 archivos ejecutables durante el gate.
