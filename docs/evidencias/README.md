> Evidencias históricas de revisión 01. Para resultados vigentes y salidas externas no incluidas en GitHub, consultar [revisión 04](../evidencias-revision04/README.md). Las afirmaciones antiguas de ausencia de BD/producto describen su fecha.

# Alcance de las verificaciones

Las evidencias de esta entrega distinguen cotejo documental, contrato y herramientas de pruebas del producto. Ver `resultado.json` y archivos de salida adjuntos cuando existan.

## Resultado ejecutado el 1 de noviembre de 2026

| Comprobación | Resultado y alcance |
| --- | --- |
| Fuentes | Hash del Word coincidente; 288 párrafos sin diferencias de contenido al normalizar formato; dos figuras idénticas |
| Reutilización | Requisitos, transcripción y figuras conservados byte por byte; solo los dos índices originales se actualizan |
| Contrato | OpenAPI válido estructuralmente, 46 rutas y 62 operaciones; 31 RF mapeados y 23 PC todavía abiertas |
| ESLint y Prettier | Sin errores en scripts y configuración del arnés, dentro del alcance de sus comandos |
| Pruebas del arnés | 7 de 7 pasan; incluyen imports permitidos, imports prohibidos, ciclos y referencias de contrato rotas |
| Hook en Git temporal | Permite documentación válida; bloquea contrato roto y código sin puerta de calidad; rechaza reemplazar/desactivar hooks existentes |
| Instalación limpia | `npm ci` con el lock entregado instala 132 paquetes desde caché; las comprobaciones pasan también en esa copia |
| Diagramas | Cinco fuentes Mermaid y cinco exportaciones PNG/SVG; las cinco vistas PNG fueron inspeccionadas |

Runtime de comprobación: Node v24.22.1; el hook utilizó el Node v24.21.0 del PATH de Git. Ambos son de la rama 24 usada para estas herramientas. Las versiones exactas de los paquetes están en `resultado.json` y `package-lock.json` del arnés. La primera corrida de arquitectura falló por una ruta incorrecta al ejecutable; se corrigió y se repitió. Las restricciones iniciales del entorno local de Git y de instalación se resolvieron al repetir con acceso a los recursos necesarios; no se convirtieron en resultados de producto.

El cotejo comprueba hash del DOCX, correspondencia de 288 párrafos y bytes de figuras. El texto OOXML no prueba paginación. No se ha certificado la maquetación completa del Word.

La validación de OpenAPI revisa estructura y referencias del contrato preliminar; no hace peticiones a una API. Las comprobaciones del arnés revisan artefactos y reglas con muestras temporales. No existe BD conectada, migración, seed ni prueba de producto; no hay cifra de cobertura. El hook probado en repositorio temporal no acredita commits o remotos de Ecclesia. El arranque menor de 10 minutos, móvil, concurrencia y portabilidad final quedan pendientes.

## Copia para repositorio público

Los registros históricos conservan sus resultados. En cinco archivos de salida se sustituyó el prefijo de una ruta personal por `[RUTA_LOCAL_REDACTADA]` antes de la publicación. No son ejecuciones nuevas. Los originales íntegros permanecen en el ZIP de revisión 03, fuera de los repositorios públicos.
