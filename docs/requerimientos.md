# Requerimientos del Proyecto Ecclesia

Documento de análisis del Sistema Nacional de Gestión de Iglesias para revisión con el docente que representa a la Coordinación Nacional de Templos. Define qué debe hacer el sistema, sus restricciones y cómo se prevé verificarlo antes de implementar.

- Versión: 0.1, análisis inicial del 1 de noviembre de 2026.
- Estado: extracción del documento fuente completa; validación con cliente pendiente.
- Fuente normativa: `Proyecto_Ecclesia_Sistema_Nacional_de_Gestion_de_Iglesias.docx`, fechado el 30 de octubre de 2026, MEDIOLIKE.
- Respuestas efectivas del docente aportadas: ninguna. La conversación anterior no aporta decisiones aprobadas ni evidencia de implementación.
- Implementación y pruebas del sistema: pendientes. Toda ubicación de código y toda prueba en la matriz son propuestas futuras, no evidencias ejecutadas.

## 1 Alcance y lectura del documento

El producto es un sistema web de iglesias de México con consultas públicas y operaciones de Coordinación, administración de iglesia y tesorería. Incluye patrimonio e índice de reconocimiento, servicios y preparación, horarios y celebraciones, diezmos y solicitudes privadas de espacios funerarios. Busca sustituir información dispersa, repetida o desactualizada y facilitar consultas que hoy tardan días (P060–P061).

Los requisitos del cliente se separan de las restricciones del curso y de lo opcional. No se decide todavía un stack, arquitectura concreta, ORM, interfaz o ruta de API a partir de las propuestas del chat anterior: el archivo ofrece alternativas y su selección futura debe documentarse. Solo `/api/v1` es una ruta base impuesta por el curso.

### 1.1 Identificadores y prioridades

| Prefijo | Contenido | Prioridad |
| --- | --- | --- |
| RF | Función obligatoria del producto | Obligatorio |
| RNF | Calidad o restricción del producto | Obligatorio; parámetros abiertos señalados |
| RN | Regla de negocio | Obligatorio |
| CT | Condición técnica, académica o de entrega del curso | Obligatorio del curso |
| DES | Función de «Si alcanza el tiempo» | Deseable del caso |
| EXT | Opción de puntos extra | Extra del curso |
| CA | Criterio de aceptación previsto | No implica prueba ejecutada |
| PC | Pregunta pendiente al cliente o docente | No es una respuesta ni un requisito aprobado adicional |

La prioridad Obligatorio indica exigencia del archivo, no validación ya realizada por el cliente. Las interpretaciones necesarias se identifican en la propia redacción y se acompañan de preguntas cuando faltan parámetros. Un punto pendiente limita la aceptación de ese detalle, no autoriza a inventarlo.

### 1.2 Referencias de origen

Se asignaron `P001` a `P288` a los párrafos de `word/document.xml` en orden documental, incluyendo párrafos de celdas de tablas y párrafos vacíos. Son referencias de esta extracción, no numeración impresa del DOCX. La copia numerada en [fuentes/caso-parrafos.md](fuentes/caso-parrafos.md) permite comprobar cada origen. Las figuras incrustadas se conservaron en esa carpeta y se referencian como figura en P168 y figura en P228. No se usan números de página sin verificar.

Cada sección del archivo se comprueba en la sección 12; los párrafos narrativos del cliente se comprueban uno por uno. Los encabezados y datos editoriales se registran como contexto sin convertirlos en funciones.

## 2 Actores y objetivos

| ID | Actor | Objetivos y alcance | Origen |
| --- | --- | --- | --- |
| AC-01 | Visitante, incluida la persona investigadora | Consultar sin cuenta iglesias activas, ficha, patrimonio, reconocimiento, servicios, pláticas y misas; buscar iglesias por tipo y antigüedad de objetos. | P061, P064, P070, P076, P092 |
| AC-02 | Solicitante de espacio | Solicitar sin cuenta, recibir folio y clave, seguir su caso, conocer disponibilidad y cotización, aceptar, rechazar o cancelar bajo las reglas. Es una faceta del visitante, no una cuenta nueva obligatoria. | P089–P090 |
| AC-03 | Personal de la Coordinación | Administrar catálogos, iglesias, usuarios y criterios del índice. Comparar diezmos entre iglesias solo corresponde a DES-03. No se presume acceso nacional a solicitudes privadas. | P092, P095 |
| AC-04 | Administrador de iglesia | Mantener datos, objetos, servicios, pláticas, padres, horarios, celebraciones y solicitudes de su iglesia, sin modificar otras. | P093 |
| AC-05 | Tesorero de iglesia | Capturar y corregir diezmos de celebraciones de su iglesia; consultar reportes privados como personal de esa iglesia. | P085–P086, P093 |

Las diócesis y los sacerdotes son entidades o participantes del negocio; el caso no les asigna un rol autenticado propio. INEGI aporta el catálogo geográfico e INAH la condición patrimonial; no se prescribe integración automática con sus servicios. Alumno y docente participan en análisis, revisión y evaluación, no son roles de acceso del producto (P058–P060, P063, P068, P082, P104).

### 2.1 Límites de permisos que sí constan

| Operación | Visitante o solicitante | Coordinación | Administrador de iglesia | Tesorero |
| --- | --- | --- | --- | --- |
| Consulta pública | Sí, sin cuenta | Igual que cualquier visitante | Igual | Igual |
| Catálogos, iglesias y usuarios a nivel nacional | No | Sí | Solo datos propios según P093 | No atribuido |
| Criterios del índice | No | Sí | No atribuido | No atribuido |
| Objetos, servicios, pláticas, padres, horarios, misas, solicitudes | Solo seguimiento de su solicitud con folio y clave | Acceso privado pendiente PC-19 | Gestión de su iglesia | No se atribuye gestión |
| Registrar y corregir diezmo | No | No atribuido en alcance base | No atribuido por el caso | Sí, su iglesia |
| Reportes de diezmo | No | Comparación opcional DES-03; acceso base pendiente PC-19 | Sí, de su iglesia | Sí, de su iglesia |

«No atribuido» significa que no hay autorización expresa en el caso; no constituye una respuesta del docente. Acumulación de roles, asignación a varias iglesias y administración de un padre compartido requieren PC-10 y PC-19.

## 3 Requerimientos funcionales obligatorios

| ID | Requisito verificable | Prioridad | Origen |
| --- | --- | --- | --- |
| RF-01 | El visitante selecciona un estado y consulta sus iglesias activas; puede acotar por municipio, ciudad o localidad, tipo, nombre y capacidad. La semántica de capacidad y combinación de filtros se confirma en PC-03. | Obligatorio | P063–P065 |
| RF-02 | Al seleccionar una iglesia, el visitante ve una ficha integrada con sus datos públicos, patrimonio, distinción, servicios, pláticas, horarios y tipos de espacios ofrecidos. Los datos privados se excluyen. | Obligatorio | P063–P064, P067, P073, P078–P081, P088, P090–P092 |
| RF-03 | La Coordinación administra iglesias y el administrador mantiene los datos de su iglesia: nombre, tipo, dirección, ciudad o localidad, municipio, estado, capacidad, año de construcción y contacto; admite coordenadas cuando se conocen. Campos obligatorios y casos de año desconocido: PC-02. | Obligatorio | P063, P092–P093 |
| RF-04 | Se registra el cierre de una iglesia conservando su historia y se la excluye de consultas públicas y del ranking. La autoridad para cerrar y reabrir se confirma en PC-04. | Obligatorio | P065, P075, P092–P093 |
| RF-05 | La Coordinación administra los catálogos del sistema; estados, municipios y localidades deben corresponder al catálogo oficial del INEGI y conservar su jerarquía. Catálogos restantes y procedimiento de actualización: PC-01 y PC-22. | Obligatorio | P063, P092 |
| RF-06 | La Coordinación administra usuarios y su asignación de rol y ámbito de iglesia; el personal se autentica para operar según sus permisos. No se presupone registro público de cuentas. | Obligatorio | P022, P092–P093, P130 |
| RF-07 | El administrador registra y mantiene los objetos de su iglesia con identificación o descripción de qué son, tipo, año o siglo, material, estado de conservación, ubicación dentro del templo e indicación de catalogación INAH. | Obligatorio | P067–P068, P093 |
| RF-08 | El administrador registra que un objeto se perdió, se prestó o se dio de baja, conserva su registro y consigue que deje de contribuir al índice. El retorno de un préstamo se aclara en PC-06. | Obligatorio | P068, P093 |
| RF-09 | El sistema calcula el índice patrimonial sumando la contribución de los objetos vigentes y determina su distinción mediante RN-06 a RN-09. | Obligatorio | P070–P074 |
| RF-10 | El visitante consulta iglesias reconocidas del país, de un estado, municipio o ciudad, ordenadas por índice descendente; se excluyen iglesias cerradas y sin objetos registrados. Los empates y casos de solo objetos no vigentes se aclaran en PC-07. | Obligatorio | P070, P073, P075 |
| RF-11 | La Coordinación ajusta los criterios del índice sin reprogramar: rangos y puntos de antigüedad, factores por tipo, bonificación INAH y umbrales de distinción. Se verifica el cálculo bajo la configuración modificada; vigencia y retroactividad se aclaran en PC-08. | Obligatorio | P071–P075, P092 |
| RF-12 | El visitante o investigador busca iglesias por tipo y antigüedad de objetos dentro de un estado, municipio o ciudad. La inclusión de objetos no vigentes se confirma en PC-06. | Obligatorio | P076, P092 |
| RF-13 | El administrador mantiene la oferta de servicios de su iglesia, incluidos bautizo, primera comunión, confirmación, matrimonio y otros; registra costo fijo, gratuidad o donativo voluntario, requisitos, duración, necesidad de cita y días y horarios. | Obligatorio | P078, P093 |
| RF-14 | El administrador registra y mantiene las pláticas de su iglesia con tipo, días, hora, número de sesiones, costo, cupo, lugar e impartidor. La relación concreta entre preparación y servicio se aclara en PC-09. | Obligatorio | P079, P093 |
| RF-15 | Sin cuenta, el visitante consulta los servicios, sus costos o modalidad de aportación y requisitos, y las pláticas con sus horarios y demás información registrada. | Obligatorio | P061, P078–P079, P092 |
| RF-16 | El administrador gestiona los padres que atienden su iglesia y sus asignaciones; un mismo padre puede estar asignado a varias iglesias. Datos identificativos y autoridad sobre registros compartidos: PC-10. | Obligatorio | P082, P093 |
| RF-17 | El administrador mantiene el horario semanal de misas de su iglesia con día, hora local, tipo diaria, dominical o especial, idioma, padre previsto y duración, usando una hora cuando no se indica otra. | Obligatorio | P081–P083, P093 |
| RF-18 | Al programar o cambiar la asignación de un padre, el sistema impide que tenga misas traslapadas en iglesias distintas, considerando la duración y la zona horaria de cada iglesia. La validación atraviesa los ámbitos de iglesia sin conceder permisos de edición sobre otra iglesia. | Obligatorio | P082–P083, P093 |
| RF-19 | El visitante consulta los horarios de misa de cada iglesia y el padre previsto para oficiarla. El sistema permite consultar la agenda semanal de cada padre; la visibilidad de esta agenda se confirma en PC-11. | Obligatorio | P081–P082, P092 |
| RF-20 | El administrador registra cada misa efectivamente celebrada con fecha, hora local de la iglesia y padre que realmente ofició, distinguiéndola del horario recurrente. | Obligatorio | P083, P093 |
| RF-21 | Cuando se sustituye al padre previsto, se registra quién ofició realmente, quién realizó el cambio y el motivo. Permisos y correcciones posteriores se confirman en PC-12. | Obligatorio | P083, P093 |
| RF-22 | El tesorero registra el monto de diezmo de una misa ya celebrada de su iglesia, una sola vez por celebración. | Obligatorio | P085, P093 |
| RF-23 | El tesorero corrige un diezmo conservando el autor, instante del cambio y cantidad anterior para cada corrección. | Obligatorio | P085 |
| RF-24 | El personal de una iglesia consulta sus reportes de diezmo: total del periodo, promedio por misa y misas con mayor y menor recaudación, con agrupación o desglose por día, semana o mes, horario y padre. Periodos, empates, padre real y promedio se precisan en PC-13. | Obligatorio | P086, P093 |
| RF-25 | El administrador mantiene los tipos de espacios funerarios que ofrece su iglesia y el visitante consulta esa oferta sin precios públicos. | Obligatorio | P088, P093 |
| RF-26 | Una persona sin cuenta presenta una solicitud de espacio con sus datos de contacto y recibe un folio y una clave para seguimiento. Los campos de contacto se confirman en PC-14. | Obligatorio | P089 |
| RF-27 | La persona sigue su propia solicitud mediante folio y clave, sin exponerla en consultas públicas. El mecanismo de seguimiento debe permitir conocer el resultado y la cotización que le corresponden. Recuperación de clave y datos visibles: PC-15. | Obligatorio | P089–P090 |
| RF-28 | El administrador de la iglesia revisa la solicitud e informa al solicitante una cotización de ese servicio y sus condiciones cuando hay lugar, o la falta de lugar cuando no lo hay. El canal de comunicación obligatorio se confirma en PC-16. | Obligatorio | P089, P093 |
| RF-29 | El solicitante acepta o rechaza la cotización y el sistema registra la decisión. Se verifica que la decisión corresponda a su solicitud y a una cotización todavía vigente; el límite temporal exacto se confirma en PC-17. | Obligatorio | P089–P090 |
| RF-30 | Si transcurren 15 días sin respuesta, la cotización queda vencida; el sistema hace efectivo ese vencimiento al consultar o decidir, mediante el mecanismo técnico que se diseñe. Inicio del cómputo y hora límite: PC-17. | Obligatorio | P090 |
| RF-31 | El solicitante puede cancelar su solicitud mientras no haya aceptado la cotización; una solicitud aceptada no admite esa cancelación por el mismo flujo. Las transiciones desde rechazo o vencimiento se confirman en PC-18. | Obligatorio | P090 |

## 4 Requerimientos no funcionales del producto

| ID | Requisito verificable | Prioridad | Origen |
| --- | --- | --- | --- |
| RNF-01 | La interfaz web pública permite completar las consultas de iglesias, servicios, pláticas, misas y ranking desde un celular y sin cuenta. Se verificará en un navegador móvil; tamaños y navegadores objetivo quedan pendientes, sin inventar un umbral de pantalla. | Obligatorio | P092, P129 |
| RNF-02 | Toda modificación del personal está autorizada por rol y ámbito; un usuario de una iglesia no puede modificar información de otra, incluso invocando directamente la API. | Obligatorio | P093, P022 |
| RNF-03 | Los reportes de diezmo solo se muestran al personal de la iglesia correspondiente; los datos personales de solicitudes solo al personal de esa iglesia, conservando el seguimiento del propio solicitante por folio y clave. Acceso de Coordinación a datos privados: PC-19. | Obligatorio | P086, P089–P090 |
| RNF-04 | Los cálculos y almacenamiento monetarios conservan exactitud de centavos y evitan errores de representación acumulados. El promedio se presenta con la regla de redondeo que confirme el cliente en PC-13; no se inventa moneda ni redondeo. | Obligatorio | P086 |
| RNF-05 | La aplicación conserva los registros históricos de iglesias cerradas y objetos no vigentes; las correcciones de diezmo y sustituciones retienen los datos de auditoría exigidos. | Obligatorio | P065, P068, P083, P085 |
| RNF-06 | La programación y registro de misas respetan la hora local de cada iglesia en México; los conflictos entre iglesias se comprueban comparando instantes equivalentes. La zona asignada y los casos de cambios de horario se confirman en PC-11. | Obligatorio | P082–P083 |
| RNF-07 | Los criterios patrimoniales son configurables mediante datos y el cálculo se verifica sin reprogramación al cambiarlos; no se fija un plazo máximo de actualización que el caso no establece. | Obligatorio | P075, P092 |
| RNF-08 | Las ubicaciones registradas mantienen consistencia con estados, municipios y localidades del INEGI, rechazando relaciones incompatibles. La versión del catálogo se acordará antes de cargarlo. | Obligatorio | P063 |
| RNF-09 | La información publicada debe poder actualizarse mediante las operaciones administrativas del caso y estar disponible en línea. Disponibilidad, concurrencia y tiempos de respuesta no tienen una cifra exigida: PC-20 debe fijarla antes de usarla como criterio de aceptación cuantitativo. | Obligatorio | P061, P092–P093 |

## 5 Reglas de negocio

| ID | Requisito verificable | Prioridad | Origen |
| --- | --- | --- | --- |
| RN-01 | Solo se clasifican iglesias como catedral, basílica, parroquia, templo, capilla o santuario conforme al caso; el tratamiento de nuevas categorías se consulta en PC-22. | Obligatorio | P063 |
| RN-02 | Una ubicación debe respetar la jerarquía estado → municipio → ciudad o localidad del catálogo oficial del INEGI. | Obligatorio | P063 |
| RN-03 | El cierre de una iglesia conserva su historia y la excluye de consultas públicas y del ranking. | Obligatorio | P065, P075 |
| RN-04 | Cuando solo se conoce el siglo, se usa su mitad como año estimado: para el siglo n, (n − 1) × 100 + 50; siglo XVIII equivale a 1750. La fórmula es la interpretación aritmética del ejemplo del caso. | Obligatorio | P068 |
| RN-05 | Un objeto perdido, prestado o dado de baja no contribuye al índice y su registro no se borra. | Obligatorio | P068, P073 |
| RN-06 | La antigüedad asigna puntos: menos de 50 años → 1; de 50 a 99 → 2; de 100 a 199 → 4; de 200 a 299 → 7; desde 300 → 10. El año de referencia fuera del ejemplo 2026 se confirma en PC-05. | Obligatorio | P071, P074 |
| RN-07 | El factor por tipo es 1.5 para imágenes de santos, vírgenes y cristos; 1.3 para retablos, pinturas y murales; 1.2 para órganos y pianos; 1 para orfebrería, mobiliario litúrgico y documentos; 0.8 para otras piezas. A puntos × factor se suman 5 si el objeto está catalogado por INAH. | Obligatorio | P072 |
| RN-08 | El índice de una iglesia es la suma de la contribución de todos sus objetos vigentes. El ejemplo, con año de referencia 2026, debe resultar exactamente 35.5 puntos. | Obligatorio | P073–P074 |
| RN-09 | El índice asigna Patrimonio sobresaliente desde 40; Alto valor patrimonial desde 20 y menor que 40; Valor patrimonial desde 8 y menor que 20; debajo de 8 no hay distinción. La distinción aparece junto a cada iglesia. | Obligatorio | P073 |
| RN-10 | El ranking se ordena de mayor a menor índice y no incluye iglesias cerradas ni sin objetos registrados. Los objetos no vigentes no aportan aunque exista registro; la elegibilidad de una iglesia con solo esos objetos queda pendiente en PC-07. | Obligatorio | P068, P073, P075 |
| RN-11 | Cada iglesia fija sus costos por servicio y admite servicios gratuitos o con donativo voluntario. | Obligatorio | P078 |
| RN-12 | Un padre puede atender varias iglesias, pero no debe quedar programado en misas traslapadas de templos distintos; cada misa dura una hora salvo duración explícita. Comparar intervalos es la interpretación necesaria de esa duración; traslados y extremos contiguos se consultan en PC-11. | Obligatorio | P082 |
| RN-13 | Un horario recurrente representa lo previsto; la celebración es un hecho con día, hora y padre real. La sustitución conserva autor del cambio y motivo. | Obligatorio | P083 |
| RN-14 | La hora de misa se interpreta en la zona local de su iglesia. | Obligatorio | P083 |
| RN-15 | Solo una misa ya celebrada puede recibir un diezmo y solo puede existir un registro de diezmo por celebración. Una corrección modifica ese registro y conserva autor, fecha e importe anterior. | Obligatorio | P085 |
| RN-16 | Los reportes de diezmo son privados para el personal de cada iglesia y sus cantidades no admiten diferencias de centavos. La comparación entre iglesias es únicamente deseable y para Coordinación. | Obligatorio | P086, P095 |
| RN-17 | La oferta pública muestra tipos de espacios funerarios y no sus precios; cada caso recibe cotización individual del servicio solicitado y sus condiciones. | Obligatorio | P088–P089 |
| RN-18 | Solicitar y seguir un espacio no exige crear una cuenta: se entrega folio y clave; los datos de contacto son privados del personal de la iglesia correspondiente, con acceso del propio solicitante a su seguimiento. | Obligatorio | P089–P090 |
| RN-19 | Si hay lugar se cotiza; si no lo hay se informa al solicitante. El caso no exige inventario automático de espacios para resolverlo. | Obligatorio | P089, P095 |
| RN-20 | La cotización tiene vigencia de 15 días y vence si no hay respuesta; la persona puede aceptar o rechazar. El instante de inicio y el tratamiento exacto de la frontera quedan en PC-17. | Obligatorio | P090 |
| RN-21 | Mientras no haya aceptado, la persona puede cancelar la solicitud. Una aceptación no implica en el caso pago, contrato ni asignación física automática. | Obligatorio | P090, P095 |
| RN-22 | Las consultas públicas descritas no requieren cuenta. Nadie de una iglesia puede modificar datos de otra; el tesorero captura diezmo y el administrador lleva los datos operativos enumerados en el caso. | Obligatorio | P092–P093 |

### 5.1 Cálculo patrimonial de referencia

Para una pieza vigente: `contribución = puntosPorAntigüedad × factorPorTipo + (INAH ? 5 : 0)`. El índice es la suma de contribuciones vigentes. El estado de conservación se registra, pero el caso no le asigna un multiplicador. No se agrega ninguno.

El año de referencia del ejemplo es 2026; no se fija 2026 como constante de producción. La función pura debe recibir los datos y parámetros necesarios para poder probar años y criterios sin depender de un reloj oculto (CT-08; diseño concreto pendiente).

| Pieza del ejemplo | Año usado | Antigüedad en 2026 | Base | Factor | INAH | Contribución |
| --- | --- | --- | --- | --- | --- | --- |
| Imagen de San Miguel Arcángel | 1720 | 306 | 10 | 1.5 | +5 | 20 |
| Retablo lateral del siglo XVIII | 1750 | 276 | 7 | 1.3 | +0 | 9.1 |
| Par de candelabros de plata | 1890 | 136 | 4 | 1 | +0 | 4 |
| Piano vertical | 1950 | 76 | 2 | 1.2 | +0 | 2.4 |
| **Total** | | | | | | **35.5** |

La distinción resultante es **Alto valor patrimonial**. Para reproducir el ejemplo, el par de candelabros se considera una pieza o registro del ejemplo; su categoría se interpreta como orfebrería. Esto reproduce el resultado explícito de P074, pero el modelo general de piezas agrupadas y su clasificación deben confirmarse en PC-05; no se multiplicará por dos silenciosamente.

### 5.2 Estados y transiciones de solicitudes por validar

El caso describe hechos, no nombres definitivos de estados. Esta tabla es un vocabulario de análisis para diseñar el diagrama después de la validación; no supone que exista código.

| Situación de origen | Evento y actor | Resultado descrito por el caso | Condición o punto pendiente |
| --- | --- | --- | --- |
| Solicitud registrada | Administrador revisa y hay lugar | Cotización comunicada, con precio y condiciones | Canal PC-16; vigencia PC-17 |
| Solicitud registrada | Administrador revisa y no hay lugar | Falta de disponibilidad comunicada | Nombre de estado final y reapertura PC-18 |
| Cotización sin respuesta, vigente | Solicitante acepta | Cotización aceptada | No implica pago ni asignación física obligatoria |
| Cotización sin respuesta, vigente | Solicitante rechaza | Cotización rechazada | Reapertura y nueva cotización PC-18 |
| Cotización sin respuesta | Se cumple el plazo de 15 días | Cotización vencida | Inicio, frontera e instante local PC-17 |
| Solicitud aún no aceptada | Solicitante cancela | Solicitud cancelada | Resto de transiciones y duplicados PC-18 |
| Cotización aceptada | Solicitante intenta cancelar por este flujo | Cancelación no permitida | El caso limita la cancelación a antes de aceptar |

No se añade un estado pagada, contrato firmado o espacio asignado como obligación del caso. La asignación física corresponde a DES-04. Para seeds, el conjunto final de estados se determina al validar el diagrama, manteniendo al menos las situaciones narradas.

## 6 Condiciones técnicas y académicas del curso

| ID | Requisito verificable | Prioridad | Origen |
| --- | --- | --- | --- |
| CT-01 | El proyecto es individual; se declara en el README, desde la primera entrega, un stack permitido y una herramienta principal de IA. La duración de 8 semanas es sugerida y ajustable por el docente. | Obligatorio del curso | P005, P008–P017, P028–P055 |
| CT-02 | Se elige Express con JavaScript o TypeScript sobre Node.js LTS, NestJS con TypeScript sobre Node.js LTS, o PHP 8.3 o superior con Laravel, Symfony, Slim o sin framework. Las alternativas concretas no se consideran ya elegidas. | Obligatorio del curso | P028–P052 |
| CT-03 | Se usa PostgreSQL, MySQL o MariaDB con migraciones versionadas y seeds. Las herramientas de acceso a datos de la tabla son sugeridas, no decisiones ya tomadas. | Obligatorio del curso | P031, P037, P043, P049, P053 |
| CT-04 | Se usa una sola IA principal durante el proyecto, salvo disposición del docente; cambiarla exige un ADR. Código, arnés y bitácora son personales y las ideas de arneses públicos se citan y adaptan. | Obligatorio del curso | P054–P055 |
| CT-05 | Se mantiene Git con repositorio remoto y commits pequeños y descriptivos desde la semana 1. | Obligatorio del curso | P056 |
| CT-06 | Antes de código se entrega docs/requerimientos.md con actores, requisitos, reglas, aceptación, glosario, preguntas y respuestas reales y trazabilidad; cada párrafo del caso tiene cobertura y todo requisito tiene origen. Después de validar se documentan modelo de datos, estados de solicitudes y diseño API en docs/. | Obligatorio del curso | P097–P124 |
| CT-07 | Se elige y documenta la arquitectura en ARCHITECTURE.md con capas o módulos, responsabilidades, diagrama, carpetas y dependencias permitidas; una herramienta verifica estas dependencias y los controladores no alojan reglas de negocio. | Obligatorio del curso | P023, P127, P143–P145, P236 |
| CT-08 | El cálculo patrimonial es una función pura y tiene pruebas unitarias, incluido el ejemplo de 35.5. | Obligatorio del curso | P024, P127, P261 |
| CT-09 | La API REST usa /api/v1, respuestas JSON y OpenAPI; todos los listados se paginan y los errores comparten código, mensaje y detalles. Rutas, tamaños de página y contrato concreto quedan por diseñar. | Obligatorio del curso | P022, P128 |
| CT-10 | Las consultas públicas tienen interfaz web, renderizada en servidor o SPA sencilla; las operaciones administrativas pueden verificarse con Swagger o Postman. Un panel administrativo completo es extra. | Obligatorio del curso | P129, P272–P273 |
| CT-11 | Toda entrada se valida con DTO o esquemas; las contraseñas usan bcrypt o argon2; los JWT expiran; secretos en .env fuera del repositorio; consultas parametrizadas u ORM. Algoritmo concreto, caducidad y políticas se diseñarán dentro de estos límites. | Obligatorio del curso | P130 |
| CT-12 | Cada regla de negocio tiene al menos una prueba y los endpoints principales pruebas de integración; la cobertura mínima es 70 % en dominio y servicios. La métrica exacta de cobertura se confirma en PC-21. | Obligatorio del curso | P131, P261 |
| CT-13 | Linter y formateador terminan sin errores y la rama principal no recibe commits con pruebas fallando; se usan las herramientas de calidad y dependencias del stack de la tabla del curso. | Obligatorio del curso | P038–P052, P131, P157, P170, P176 |
| CT-14 | El README permite levantar el sistema en menos de 10 minutos, documentando requisitos e instalación; el entorno de medición se acuerda en PC-21. | Obligatorio del curso | P131 |
| CT-15 | El arnés obligatorio vive en repositorio separado y contiene contexto con siempre/nunca, arquitectura, al menos 5 ADR (stack, arquitectura, acceso a datos, autenticación, índice), al menos 5 plantillas (módulo, endpoint, migración, pruebas, revisión), módulo completo de referencia, verificaciones y hook, definición de terminado, checklist, guía y CHANGELOG con fecha y motivo. | Obligatorio del curso | P133–P163 |
| CT-16 | El flujo con IA pide plan, obtiene revisión y aprobación del alumno, implementa un paso pequeño, corrige verificaciones fallidas, pasa revisión humana y registra commit y decisión; si repite un error, mejora el arnés antes de la siguiente tarea y lo anota en CHANGELOG. | Obligatorio del curso | P167–P173, figura en P168, P179 |
| CT-17 | El alumno puede explicar todo el código; nada se integra sin verificaciones y checklist; commits con código IA incluyen Asistido-por: <herramienta>; no se comparten secretos ni datos personales reales con IA; se prohíbe generar y entregar todo con una sola instrucción sin revisar. | Obligatorio del curso | P175–P180 |
| CT-18 | docs/bitacora-ia.md contiene al menos 20 entradas significativas, al menos 5 sobre errores reales detectados y corregidos, con fecha, tarea, instrucción resumida, propuesta, decisión, motivo y cambio del arnés. El ejemplo del caso no cuenta como experiencia propia. | Obligatorio del curso | P181–P196 |
| CT-19 | En la semana 8 sugerida se instala el arnés en un repositorio nuevo y pequeño, se completa PROYECTO.md y se obtiene un módulo completo; se entregan repositorio, video de máximo 5 minutos y nota de ajustes. | Obligatorio del curso | P197–P198, P237 |
| CT-20 | Los seeds permiten probar las consultas sin captura manual y cumplen todos los mínimos de la tabla de datos de prueba de esta especificación. Personas ficticias; si hay iglesias reales, objetos, costos y diezmos se inventan y se marcan ficticios. | Obligatorio del curso | P199–P225 |
| CT-21 | Cada fase cierra con entrega revisable contra la definición de terminado; calendario sugerido: análisis y arnés (semanas 1–2), base y catálogos (3–4), misas y procesos (5–6), consultas e interfaz (7), cierre (8). Fechas definitivas las ajusta el docente. | Obligatorio del curso | P226–P230, figura en P228 |
| CT-22 | La entrega final incluye documento trazable con respuestas reales, repositorio del sistema (código, migraciones, seeds, pruebas y README), repositorio del arnés, OpenAPI y colección Postman o equivalente, docs con modelo, estados, arquitectura, ADR y bitácora, portabilidad y reflexión de 1 a 2 páginas. | Obligatorio del curso | P232–P238, P241 |
| CT-23 | La defensa oral dura 20 minutos y es condición para acreditar; incluye demostrar flujos, explicar sin IA dos fragmentos que elija el docente y hacer un cambio en vivo con el arnés. Lo que no pueda explicarse no cuenta como realizado. | Obligatorio del curso | P239, P243, P267 |

### 6.1 Herramientas permitidas y sugeridas

La tabla original P029–P052 diferencia acceso a datos sugerido de pruebas, calidad y reglas. Al elegir stack se revisará el conjunto correspondiente:

| Stack | Acceso a datos sugerido | Pruebas | Calidad | Dependencias |
| --- | --- | --- | --- | --- |
| Express | Prisma, Sequelize, TypeORM o Knex | Jest o Vitest con Supertest | ESLint y Prettier | dependency-cruiser |
| NestJS | TypeORM, Prisma o MikroORM | Jest con Supertest | ESLint y Prettier | dependency-cruiser |
| PHP | Eloquent, Doctrine o PDO | PHPUnit o Pest | PHPStan con PHP-CS-Fixer o Pint | Deptrac |

La estructura `core/`, `stacks/` y `plantilla-proyecto/` del arnés es sugerida, no una obligación de usar esos nombres (P164–P166). Se conserva el objetivo de separar lo genérico, lo específico del stack y lo específico del proyecto.

### 6.2 Mínimos de datos de prueba

| Datos | Mínimo y condición verificable | Origen |
| --- | --- | --- |
| Estados y municipios | Los 32 estados y sus municipios, obtenidos del catálogo INEGI. | P203–P204 |
| Ciudades o localidades | Todas las que tengan iglesias registradas. | P205–P206 |
| Iglesias | 40 distribuidas en al menos 3 estados y 8 municipios, con todos los tipos. | P207–P208 |
| Objetos | 120; al menos 15 con 200 años o más y 5 con 300 años o más. Los 5 pueden formar parte de los 15 porque cumplen ambos umbrales. | P209–P210 |
| Servicios | Bautizo, primera comunión, confirmación y matrimonio en cada iglesia, con costo y horario. | P211–P212 |
| Pláticas | Al menos 2 tipos por iglesia. | P213–P214 |
| Sacerdotes | 15; al menos 3 asignados a más de una iglesia. | P215–P216 |
| Horarios | Al menos una misa cada día de la semana en cada iglesia. | P217–P218 |
| Celebraciones y diezmos | 4 semanas en al menos 6 iglesias. No se inventa aquí un número exacto de celebraciones no indicado. | P219–P220 |
| Solicitudes | 12 y al menos una en cada estado del flujo validado. | P221–P222 |
| Usuarios | Uno por rol autenticado. Visitante y solicitante no requieren cuenta. Usar más usuarios de prueba será necesario para comprobar aislamiento. | P223–P224, P089, P092 |
| Ficción identificada | Personas siempre inventadas. Si hay iglesias reales, sus objetos, costos y diezmos son inventados y se marcan ficticios. | P225 |

Los seeds no son evidencia de datos reales ni de funcionamiento en producción. Ninguno se ha creado en esta entrega de análisis.

### 6.3 Entregas y evaluación

La figura de P228 propone cinco fases: fase 0, análisis y arnés en semanas 1–2 (requerimientos, diseño y arnés v1); fase 1, base y catálogos en semanas 3–4 (iglesias por estado, login y catálogos); fase 2, misas y procesos en semanas 5–6 (misas, diezmos y solicitudes); fase 3, consultas e interfaz en semana 7 (versión candidata completa); fase 4, cierre en semana 8 (repositorios, documentación, portabilidad y defensa). Es un calendario sugerido, sujeto al docente.

P242–P267 distribuye 100 puntos: funcionalidad 25, arnés 20, análisis y diseño 15, arquitectura/calidad/documentación 10, pruebas 10, bitácora/uso responsable 10 y defensa 10. La defensa es condición para acreditar. Esta distribución orienta la revisión; no se presenta como calificación conseguida.

## 7 Alcance deseable y puntos extra

Estas funciones quedan fuera de la aceptación obligatoria y no sustituyen requisitos base. Solo se programarán tras una decisión de alcance. No se registran como aprobadas.

| ID | Función opcional verificable | Prioridad | Origen |
| --- | --- | --- | --- |
| DES-01 | Consultar pláticas de un tipo en todas las iglesias de un municipio. | Deseable del caso | P095 |
| DES-02 | Generar automáticamente las misas de cada semana a partir del horario recurrente. Repetición, excepciones y prevención de duplicados deben aclararse antes de implementarlo. | Deseable del caso | P095 |
| DES-03 | Comparar diezmo entre iglesias de un municipio o estado, exclusivamente para Coordinación. | Deseable del caso | P095 |
| DES-04 | Mantener inventario de criptas y asignar una a cada solicitud aceptada. No se exige para el flujo obligatorio de cotización. | Deseable del caso | P095 |
| EXT-01 | Panel de administración web completo. | Extra del curso | P272–P273 |
| EXT-02 | Docker Compose levanta API, base de datos y seeds con un comando. | Extra del curso | P274–P275 |
| EXT-03 | Integración continua ejecuta lint, pruebas y reglas de arquitectura. | Extra del curso | P276–P277 |
| EXT-04 | Mapa de iglesias con Leaflet y OpenStreetMap a partir de coordenadas. | Extra del curso | P278–P279 |
| EXT-05 | Exportar reportes de diezmo a CSV o PDF conservando sus permisos de acceso. | Extra del curso | P282–P283, P086 |
| EXT-06 | Avisar por correo cuando se emite una cotización, sin convertir ese canal en obligatorio para el alcance base. | Extra del curso | P284–P285 |
| EXT-07 | Mantener caché del ranking que se invalida cuando cambia un objeto. | Extra del curso | P286–P287 |

P268–P287 ofrece hasta 10 puntos adicionales a criterio del docente: panel 3; Docker Compose 2; integración continua 2; mapa 2; cada función de «Si alcanza el tiempo» 1; exportación 1; correo 1; caché 1. El tope de 10 sigue aplicando aunque la suma de opciones lo supere.

## 8 Criterios de aceptación de los flujos principales

Todos los criterios son **previstos y no ejecutados**. Los juegos de datos son escenarios de prueba derivados del caso, no evidencia de implementación. Los valores de frontera, escenarios negativos y pruebas directas de API comprueban las restricciones descritas. Cuando depende de una respuesta pendiente se señala expresamente.

### CA-01 Consulta por estado y ficha integrada

**Dado** un conjunto de iglesias en distintos estados, con tipos, municipios, nombres y capacidades diferentes y alguna cerrada, **cuando** un visitante sin cuenta elige un estado, **entonces** ve únicamente iglesias activas de ese estado; puede aplicar los filtros de RF-01 y abrir la ficha integrada de RF-02. Los listados están paginados por CT-09. La ficha no revela solicitudes, claves ni diezmos. La comparación de capacidad se verificará con la semántica que resuelva PC-03.

### CA-02 Cierre sin pérdida histórica

**Dada** una iglesia con objetos y celebraciones, **cuando** un usuario con permiso confirmado registra el cierre, **entonces** deja de aparecer en consulta pública y ranking, y sus registros históricos siguen conservados para el ámbito autorizado. No se ejecuta borrado físico como sustituto de cierre (RF-04, RN-03).

### CA-03 Catálogo geográfico consistente

**Dado** el catálogo INEGI de la versión acordada, **cuando** se registra una localidad con su municipio y estado correctos, **entonces** se acepta la relación; si se envía un municipio de otro estado o una localidad de otro municipio, se rechaza con el formato de error común, sin persistir una relación inconsistente (RF-05, RN-02, RNF-08).

### CA-04 Roles, aislamiento y privacidad

**Dados** Coordinación, administrador A, tesorero A, administrador B y tesorero B, **cuando** actúan en sus ámbitos, **entonces** solo las operaciones autorizadas de la tabla 2.1 se permiten. Una petición directa del personal A para cambiar datos B se deniega y los datos B permanecen iguales; el visitante no consulta diezmos ni datos de solicitudes ajenas. Coordinación administra catálogos, iglesias, usuarios y criterios. No se acepta como prueba ocultar un botón: se verificará el acceso a los datos por API. Permisos adicionales requieren PC-19 (RF-06, RNF-02, RNF-03, RN-22).

### CA-05 Objetos, siglo y vigencia

**Dado** un objeto con siglo XVIII y sin año exacto, **cuando** se calcula su año estimado, **entonces** se usa 1750. **Dado** un objeto vigente que contribuye, **cuando** se registra préstamo, pérdida o baja, **entonces** permanece su registro y su contribución se excluye. Se verifican por separado las tres condiciones (RF-07, RF-08, RN-04, RN-05).

### CA-06 Índice, ejemplo obligatorio y fronteras

**Dadas** las cuatro piezas y los parámetros de la sección 5.1 con referencia 2026, **cuando** se calcula el índice, **entonces** las contribuciones son 20, 9.1, 4 y 2.4; total 35.5; distinción Alto valor patrimonial. Se prueban además los cambios de tramo en 50, 100, 200 y 300 años; todos los grupos de factores de RN-07; y distinciones antes de 8, en 8, antes de 20, en 20, antes de 40 y en 40. Una pieza no vigente no contribuye. La referencia temporal de producción queda pendiente PC-05 (RF-09, RN-06 a RN-09, CT-08).

### CA-07 Ranking por ámbito

**Dadas** iglesias activas con índices diferentes en varias ubicaciones, una cerrada y una sin objetos registrados, **cuando** el visitante consulta el país o selecciona estado, municipio o ciudad, **entonces** recibe el subconjunto geográfico ordenado por índice descendente y ninguna iglesia de las dos exclusiones explícitas. La distinción aparece junto a cada iglesia. No se afirma un desempate, límite top N ni exclusión de todo índice cero hasta resolver PC-07 (RF-10, RN-10).

### CA-08 Actualización de criterios

**Dado** el factor inicial 1.5 de imágenes, **cuando** Coordinación lo cambia a un valor de prueba 2 mediante la operación de configuración, **entonces** una imagen de 306 años catalogada pasa de 20 a 25 puntos al evaluar con esa configuración, sin editar ni recompilar el cálculo. El 2 es un dato de prueba, no una regla nueva. También se verificará la configuración de rangos, bonificación y umbrales. Fechas de vigencia y tratamiento de índices pasados dependen de PC-08 (RF-11, RNF-07).

### CA-09 Servicios y pláticas

**Dado** un servicio con costo fijo en una iglesia, gratuito en otra y con donativo voluntario en otra, **cuando** se consulta sin cuenta, **entonces** se distingue la modalidad y se muestran requisitos, duración, cita, días y horas. **Dada** una plática registrada, **entonces** se muestran días, hora, sesiones, costo, cupo, lugar e impartidor. El administrador de otra iglesia no puede modificar estos datos (RF-13 a RF-15, RN-11).

### CA-10 Horarios, duración, padre y zona horaria

**Dado** un padre programado en una iglesia de 10:00 a 11:00 en una fecha de prueba, **cuando** se intenta asignarlo en otra iglesia de la misma zona a las 10:30, **entonces** se rechaza por traslape. Si no se especifica duración se usa una hora; si se especifican 90 minutos se usa esa duración. Se probarán recurrencias semanales coincidentes y cambios de asignación. Con zonas distintas, se comparan instantes equivalentes y se conserva la presentación local de cada iglesia; los identificadores de zona, excepciones y extremos contiguos deben acordarse en PC-11. El horario público muestra tipo, idioma y padre previsto (RF-17 a RF-19, RN-12, RN-14, RNF-06).

### CA-11 Celebración y sustitución

**Dado** un horario con padre A previsto, **cuando** el administrador registra que la misa ocurrió con padre B por sustitución, **entonces** la celebración conserva fecha, hora local y padre real B, y el cambio conserva autor y motivo; el registro del hecho se distingue del horario recurrente. Autorización para correcciones históricas y demás auditoría no explicitada se resuelve en PC-12 (RF-20, RF-21, RN-13).

### CA-12 Diezmo único y correcciones auditables

**Dada** una misa ya celebrada, **cuando** el tesorero de esa iglesia registra diezmo, **entonces** existe un único registro. Un segundo alta sobre la misma celebración se rechaza, incluso ante dos solicitudes concurrentes; una misa solo programada no admite captura. **Cuando** se hacen dos correcciones, **entonces** cada una conserva usuario, momento y cantidad anterior y el monto vigente refleja la última corrección. La concurrencia es un escenario para verificar la unicidad, no un volumen de carga impuesto por el caso (RF-22, RF-23, RN-15).

### CA-13 Reportes monetarios privados y exactos

**Dadas** dos celebraciones con importes de prueba 10.10 y 20.20 en un periodo, **cuando** el personal autorizado consulta el total, **entonces** obtiene exactamente 30.30; el máximo corresponde a 20.20 y el mínimo a 10.10. Se comprueban día, semana, mes, horario y padre con un conjunto adicional que permita distinguir agrupaciones. El promedio matemático aquí es 15.15. Casos con promedio fraccionario en centavos, ausencia de registros, montos cero, empates y cortes temporales quedan sujetos a PC-13; no se inventa su resultado. Anónimo y personal de otra iglesia no acceden (RF-24, RNF-03, RNF-04, RN-16).

### CA-14 Solicitud sin cuenta y revisión privada

**Dada** una iglesia que ofrece nichos, **cuando** un visitante consulta tipos de espacio, **entonces** no ve precios. **Cuando** envía sus datos de contacto válidos sin crear usuario, **entonces** recibe folio y clave y puede seguir su solicitud. Solo el personal de esa iglesia y el propio solicitante por su seguimiento acceden a los datos que les correspondan. Folio sin clave válida no concede acceso. Al revisar, el administrador registra precio individual y condiciones si hay lugar, o comunica falta de lugar si no lo hay. No se exige correo ni inventario automático para aceptar el alcance base (RF-25 a RF-28, RN-17 a RN-19).

### CA-15 Decisión, vencimiento y cancelación

**Dada** una cotización vigente y acceso válido a la solicitud, **cuando** la persona acepta o rechaza, **entonces** queda registrada su decisión. **Dada** otra cotización que cumple 15 días sin respuesta, **entonces** aparece vencida; la prueba usará reloj controlado y el instante de inicio y frontera que confirme PC-17. **Dada** una solicitud todavía no aceptada, **cuando** se cancela conforme al flujo acordado, **entonces** queda cancelada. Si ya se aceptó, ese flujo no permite cancelarla. No se completa ni valida el diagrama de transiciones excepcionales sin PC-18 (RF-29 a RF-31, RN-20, RN-21).

### CA-16 Contrato técnico y pruebas

**Dado** el futuro sistema levantado, **cuando** se invocan los endpoints principales bajo `/api/v1`, **entonces** responden JSON, validan entradas, paginan listados y usan errores con código, mensaje y detalles conforme a OpenAPI. Se verifica contraseña con hash permitido, rechazo de JWT vencido, exclusión de secretos del repositorio y acceso parametrizado u ORM. Las verificaciones de arquitectura, lint y formato pasan; cada RN cuenta con prueba, los endpoints principales con integración y el dominio y servicios alcanzan al menos 70 % según métrica acordada. Este criterio no declara que ya exista API, cobertura ni ejecución (CT-07 a CT-13).

### CA-17 Datos para reproducir consultas

**Dada** una base de prueba creada con las migraciones y seeds futuros, **cuando** se revisan cantidades y relaciones, **entonces** se cumplen todos los mínimos de 6.2 y las consultas pueden demostrarse sin captura manual. Las solicitudes cubren todos los estados del diagrama aprobado y las personas son ficticias. Se verifica tanto la suma de datos como su distribución por estado, municipio e iglesia (CT-03, CT-20).

## 9 Glosario del dominio

| Término | Significado en este análisis | Origen |
| --- | --- | --- |
| Coordinación Nacional de Templos | Cliente ficticio que agrupa diócesis y administra información nacional. | P058–P060, P092 |
| Diócesis | Organización que remite información de iglesias; relaciones y cardinalidades no especificadas. | P058–P060 |
| Iglesia o templo | Unidad registrada, de uno de los seis tipos, con ubicación y oferta propia; no implica que templo sea el único tipo. | P063 |
| Ciudad o localidad | Nivel geográfico dentro de municipio y estado, alineado al catálogo INEGI; equivalencias por confirmar. | P063–P064 |
| INEGI | Organismo cuyo catálogo geográfico oficial es referencia para ubicaciones. | P063 |
| INAH | Organismo referido por la catalogación patrimonial de una pieza, que activa la bonificación. | P068, P072 |
| Objeto patrimonial o de valor | Pieza de una iglesia descrita por tipo, antigüedad, material, conservación y ubicación. | P067 |
| Vigente | Objeto que cuenta para el índice; perdido, prestado y dado de baja dejan de contar. | P068, P073 |
| Año estimado | Mitad del siglo si se desconoce el año exacto; XVIII se representa por 1750. | P068 |
| Índice de valor patrimonial | Suma de aportaciones de objetos vigentes según antigüedad, tipo e INAH. | P070–P073 |
| Distinción patrimonial | Etiqueta de reconocimiento derivada de los umbrales del índice; puede no existir bajo 8. | P073 |
| Servicio | Prestación ofrecida por una iglesia con requisitos, duración, cita, horario y modalidad de costo. | P078 |
| Plática | Preparación con días, hora, sesiones, costo, cupo, lugar e impartidor. | P079 |
| Padre o sacerdote | Persona que oficia misas y puede atender varias iglesias; no es rol autenticado expresamente definido. | P081–P083 |
| Horario recurrente | Programación semanal prevista de misas con padre, tipo e idioma. | P081–P082 |
| Celebración | Hecho ocurrido de una misa en fecha y hora con padre real. | P083 |
| Sustitución | Cambio entre el padre previsto y quien realmente ofició, con autor y motivo. | P083 |
| Diezmo | Cantidad recogida en una misa celebrada y registrada una sola vez, con correcciones auditables. | P085 |
| Cripta, nicho, columbario u osario | Tipos de espacio funerario que una iglesia puede ofrecer; diferencias físicas o contractuales no definidas por el caso. | P088 |
| Solicitud de espacio | Petición sin cuenta con contacto, folio y clave, que revisa el administrador. | P089 |
| Cotización | Precio y condiciones individuales del servicio de espacio solicitado, vigente por 15 días. | P089–P090 |
| Folio y clave | Datos entregados para dar seguimiento a una solicitud sin cuenta. No son un usuario de tesorería o administración. | P089 |
| Arnés de IA | Contexto, documentos, plantillas, ejemplos y verificaciones que orientan la IA según la arquitectura del alumno. | P135 |
| ADR | Registro que justifica una decisión importante; el curso exige al menos cinco temas. | P146–P148 |
| Seed | Datos iniciales de prueba para reproducir consultas sin captura manual. | P053, P200 |

## 10 Preguntas y respuestas del cliente

### 10.1 Respuestas recibidas y fuente

**No se han recibido respuestas del docente en el material disponible.** Ninguna pregunta de 10.2 se considera contestada. Las afirmaciones explícitas del archivo —por ejemplo, 15 días de vigencia, una hora por defecto y 35.5 puntos— se citan como origen documental, no como respuestas de una entrevista.

Al recibir una respuesta real se registrará la pregunta, texto o resumen fiel, fecha, quién respondió y soporte de la conversación; se actualizarán requisitos, criterios, estados y trazabilidad afectados. No se rellenan esos campos con nombres o fechas simulados.

### 10.2 Respuestas pendientes

| ID | Pregunta concreta y destinatario | Impacto y referencias | Estado |
| --- | --- | --- | --- |
| PC-01 | Cliente: ¿qué versión y fuente de descarga del catálogo INEGI se usarán, cómo se actualizarán y cómo se representan ciudad y localidad? | RF-05, RN-02, RNF-08, CT-20; P063 | Pendiente |
| PC-02 | Cliente: ¿qué campos de iglesia y objeto son obligatorios? ¿Se admite año desconocido sin siglo, construcción por etapas o fecha futura? ¿Cuáles son los formatos de contacto y la precisión de coordenadas? | RF-03, RF-07; P063, P067–P068 | Pendiente |
| PC-03 | Cliente: ¿capacidad significa mínimo, máximo, intervalo o valor exacto? ¿Cómo se combinan filtros y cómo se buscan nombres con acentos o fragmentos? | RF-01, CA-01; P064 | Pendiente |
| PC-04 | Cliente: ¿quién puede cerrar y reabrir una iglesia? ¿La ficha cerrada se consulta por enlace directo? ¿Se admite su gestión privada y se pueden registrar hechos históricos mientras está cerrada? | RF-04, RN-03; P065, P075, P093 | Pendiente |
| PC-05 | Cliente: ¿la antigüedad se calcula por año calendario actual, fecha exacta u otro corte? ¿Qué hacer con año desconocido o futuro? ¿El par de candelabros de P074 es un único registro de orfebrería y cómo se modelan conjuntos? ¿Qué precisión y redondeo usa el índice con criterios futuros? | RF-09, RN-04, RN-06 a RN-09, CA-06; P068, P071–P074 | Pendiente |
| PC-06 | Cliente: ¿cómo se recupera la vigencia al devolver un préstamo? ¿Qué estados existen? ¿Las búsquedas públicas por tipo/antigüedad y la ficha muestran objetos prestados, perdidos o dados de baja? | RF-07, RF-08, RF-12, RN-05; P067–P068, P076 | Pendiente |
| PC-07 | Cliente: ¿cómo se desempatan índices iguales y hay límite de resultados? ¿Se incluyen iglesias con objetos registrados pero ninguno vigente y con índice cero? | RF-10, RN-10, CA-07; P073, P075 | Pendiente |
| PC-08 | Cliente: ¿cuándo entran en vigor cambios de criterios, afectan todo el ranking de inmediato, se conserva histórico y quién los aprueba además de Coordinación? | RF-11, RNF-07, CA-08; P075, P092 | Pendiente |
| PC-09 | Cliente: ¿cómo se relacionan pláticas y servicios, hay requisitos de asistencia, reserva de cupo o inscripción? El caso exige informar cupo, no prescribe inscripción automática. | RF-13 a RF-15; P078–P079 | Pendiente |
| PC-10 | Cliente: ¿qué datos identifican a un padre y quién modifica su identidad compartida entre iglesias? ¿Necesita cuenta propia? ¿Se conserva historial de asignaciones? ¿Se registra la diócesis y con qué cardinalidad respecto a iglesias? | RF-16, actores; P058–P060, P082, P093 | Pendiente |
| PC-11 | Cliente: ¿la agenda semanal del padre es pública o interna? ¿Cómo se define zona horaria de la iglesia? ¿Se permiten intervalos contiguos, misas simultáneas en el mismo templo, tiempos de traslado, excepciones o misas que cruzan medianoche? ¿Cómo se resuelven horas ambiguas por cambio de horario? | RF-17 a RF-19, RN-12, RNF-06, CA-10; P081–P083 | Pendiente |
| PC-12 | Cliente: ¿quién puede corregir celebraciones pasadas y sustituciones y hasta cuándo? ¿Se conserva además fecha del cambio, padre previsto anterior u otro historial? ¿Una celebración no programada puede registrarse? | RF-20, RF-21, RN-13; P083, P093 | Pendiente |
| PC-13 | Cliente: ¿qué moneda se usa, se permiten montos cero o negativos y qué redondeo lleva el promedio? ¿Se excluyen celebraciones sin captura del divisor? ¿Qué significa semana, dónde cortan los periodos y cómo se presentan empates o ausencia de datos? ¿Los reportes por padre usan quien realmente ofició? | RF-22 a RF-24, RNF-04, CA-13; P085–P086 | Pendiente |
| PC-14 | Cliente: ¿qué datos de contacto se solicitan, cuáles son obligatorios y hay más datos de la petición además del tipo de espacio? ¿Cuánto tiempo se conservan y cómo se atienden rectificaciones o eliminación de datos personales? | RF-26, RNF-03; P089–P090 | Pendiente |
| PC-15 | Cliente: ¿qué contenido puede consultar la persona con folio y clave, cómo recupera la clave, qué intentos se limitan y cómo debe generarse y protegerse? | RF-27, RN-18; P089–P090 | Pendiente |
| PC-16 | Cliente: ¿cómo se informa la cotización o falta de lugar en el alcance base: pantalla de seguimiento, contacto manual u otro canal? El aviso automático por correo está como extra. | RF-28, EXT-06; P089, P284–P285 | Pendiente |
| PC-17 | Cliente: ¿los 15 días empiezan al emitir o comunicar la cotización, son días naturales y en qué zona e instante termina la vigencia? ¿Qué ocurre exactamente en el límite y si coinciden aceptación y vencimiento? ¿Se permiten nuevas versiones de cotización? | RF-29, RF-30, RN-20, CA-15; P090 | Pendiente |
| PC-18 | Cliente: ¿cuáles son los estados oficiales y transiciones? ¿Se reabre tras rechazo, vencimiento o falta de lugar? ¿Se cancela desde cualquiera de esos estados no aceptados? ¿Qué ocurre con respuestas duplicadas o simultáneas? | RF-28 a RF-31, diagrama futuro y CT-20; P089–P090 | Pendiente |
| PC-19 | Cliente: ¿Coordinación puede leer reportes base y datos privados de solicitudes o solo administra lo expresamente indicado? ¿Un usuario puede acumular roles o pertenecer a varias iglesias? ¿Administrador puede capturar diezmos además de tesorero? ¿Quién crea las primeras cuentas? | RF-06, RNF-02, RNF-03, CA-04; P085–P086, P090, P092–P093 | Pendiente |
| PC-20 | Cliente: ¿qué disponibilidad, tiempos de respuesta, usuarios simultáneos y navegadores o dispositivos se consideran aceptables? ¿Cómo se controla que la información esté actualizada? | RNF-01, RNF-09; P061, P092 | Pendiente |
| PC-21 | Docente: ¿qué métrica de cobertura debe alcanzar el 70 % y en qué entorno con qué prerrequisitos se mide el arranque menor a 10 minutos? ¿Qué fechas definitivas rigen? ¿Hay stack o IA fijados para el grupo? | CT-01, CT-04, CT-12, CT-14, CT-21; P011, P054, P131, P227 | Pendiente |
| PC-22 | Cliente: además de geografía y criterios, ¿qué catálogos administra Coordinación y cómo se amplían tipos de iglesias, objetos, servicios, espacios e idiomas? | RF-05, RF-07, RN-01; P063, P067, P078, P081, P088, P092 | Pendiente |
| PC-23 | Cliente: si se aprueban deseables, ¿cómo se evitan duplicados al generar celebraciones y cuáles son las reglas de inventario, reserva, asignación y liberación de espacios? | DES-02, DES-04; P095 | Pendiente |

Los detalles en estas preguntas no se convierten por sí mismos en nuevas funciones obligatorias. La definición de stack y las restricciones técnicas del curso corresponden al alumno y al docente; no se negocian como reglas del cliente (P126).

## 11 Matriz de trazabilidad

Actualización del 3 de noviembre de 2026: las ubicaciones RF16–21 corresponden al subalcance implementado de ADR 008 y tests/agenda.test.ts; los objetivos PV siguen sujetos a sus límites y a aceptación humana. Las demás ubicaciones futuras se conservan como antecedente.

La columna Código futuro es una **ubicación lógica propuesta**; `src/<área>/` y las carpetas documentales no suponen elección de framework, implementación ni existencia de archivos. El diseño posterior puede cambiar esas ubicaciones manteniendo los IDs. La columna Prueba prevista es el objetivo de verificación, no un resultado.

| Requisito | Párrafo o sección del origen | Código futuro o artefacto | Prueba o revisión prevista |
| --- | --- | --- | --- |
| RF-01 | P063–P065 | src/iglesias/consultas/ (futuro) | PV-RF-01: Estado y filtros con iglesias activas y cerradas; CA-01 |
| RF-02 | P063–P064, P067, P073, P078–P081, P088, P090–P092 | src/iglesias/ficha/ (futuro) | PV-RF-02: Ficha con relaciones y ausencia de datos privados; CA-01 |
| RF-03 | P063, P092–P093 | src/iglesias/gestion/ (futuro) | PV-RF-03: Alta y cambio con todos los datos citados y coordenadas ausentes |
| RF-04 | P065, P075, P092–P093 | src/iglesias/vigencia/ (futuro) | PV-RF-04: Cerrar y comprobar conservación de relaciones y exclusión pública; CA-02 |
| RF-05 | P063, P092 | src/catalogos/ (futuro) | PV-RF-05: Relaciones geográficas válidas e inválidas; CA-03 |
| RF-06 | P022, P092–P093, P130 | src/identidad/ (futuro) | PV-RF-06: Acceso autenticado y permisos por rol e iglesia; CA-04 |
| RF-07 | P067–P068, P093 | src/patrimonio/objetos/ (futuro) | PV-RF-07: Registrar objetos con año, siglo y condición INAH; CA-05 |
| RF-08 | P068, P093 | src/patrimonio/vigencia/ (futuro) | PV-RF-08: Excluir cada condición sin borrar el registro; CA-05 |
| RF-09 | P070–P074 | src/patrimonio/indice/ (futuro) | PV-RF-09: Ejemplo 35.5 y límites de antigüedad y distinción; CA-06 |
| RF-10 | P070, P073, P075 | src/patrimonio/ranking/ (futuro) | PV-RF-10: Ámbitos, orden y exclusiones explícitas; CA-07 |
| RF-11 | P071–P075, P092 | src/patrimonio/criterios/ (futuro) | PV-RF-11: Modificar parámetros y comprobar resultado nuevo sin cambiar código; CA-08 |
| RF-12 | P076, P092 | src/patrimonio/busqueda/ (futuro) | PV-RF-12: Consulta de imágenes de al menos 300 años en Puebla y otros ámbitos |
| RF-13 | P078, P093 | src/servicios/ (futuro) | PV-RF-13: Crear y consultar cada modalidad de costo y los datos del servicio; CA-09 |
| RF-14 | P079, P093 | src/platicas/ (futuro) | PV-RF-14: Alta y consulta de plática prebautismal con todos los campos; CA-09 |
| RF-15 | P061, P078–P079, P092 | src/consulta-publica/servicios/ (futuro) | PV-RF-15: Consultar oferta y pláticas de una iglesia sin autenticar; CA-09 |
| RF-16 | P082, P093 | src/modules/agenda; ADR 008 | PV-RF-16: Padre compartido en varias iglesias sin duplicar su identidad |
| RF-17 | P081–P083, P093 | src/modules/agenda; ADR 008 | PV-RF-17: Horario recurrente con idioma y duración predeterminada o explícita; CA-10 |
| RF-18 | P082–P083, P093 | src/modules/agenda/domain e infrastructure; ADR 008 | PV-RF-18: Conflicto entre iglesias y zonas distintas, incluso al editar; CA-10 |
| RF-19 | P081–P082, P092 | src/modules/agenda/presentation; ADR 008 | PV-RF-19: Horario público con padre y agenda semanal consistente |
| RF-20 | P083, P093 | src/modules/agenda; ADR 008 | PV-RF-20: Registrar un hecho sin confundirlo con la programación; CA-11 |
| RF-21 | P083, P093 | src/modules/agenda; ADR 008, alta del hecho con sustitución | PV-RF-21: Sustitución con autor y motivo consultables; CA-11 |
| RF-22 | P085, P093 | src/diezmos/registro/ (futuro) | PV-RF-22: Celebración válida, intento duplicado y misa no celebrada; CA-12 |
| RF-23 | P085 | src/diezmos/correcciones/ (futuro) | PV-RF-23: Dos correcciones sucesivas con historial completo; CA-12 |
| RF-24 | P086, P093 | src/diezmos/reportes/ (futuro) | PV-RF-24: Conjunto de montos conocidos y cada dimensión solicitada; CA-13 |
| RF-25 | P088, P093 | src/espacios/tipos/ (futuro) | PV-RF-25: Consultar criptas, nichos, columbarios u osarios sin precios; CA-14 |
| RF-26 | P089 | src/solicitudes/alta/ (futuro) | PV-RF-26: Alta sin usuario y entrega de folio y clave; CA-14 |
| RF-27 | P089–P090 | src/solicitudes/seguimiento/ (futuro) | PV-RF-27: Credenciales válidas, folio ajeno y clave incorrecta; CA-14 |
| RF-28 | P089, P093 | src/solicitudes/revision/ (futuro) | PV-RF-28: Revisión con y sin disponibilidad; CA-14 |
| RF-29 | P089–P090 | src/solicitudes/decision/ (futuro) | PV-RF-29: Aceptación y rechazo mediante seguimiento privado; CA-15 |
| RF-30 | P090 | src/solicitudes/vencimiento/ (futuro) | PV-RF-30: Reloj controlado con y sin respuesta durante la vigencia; CA-15 |
| RF-31 | P090 | src/solicitudes/cancelacion/ (futuro) | PV-RF-31: Cancelar antes de aceptar y rechazar cancelación tras aceptar; CA-15 |
| RNF-01 | P092, P129 | src/web/publica/ (futuro) | PV-RNF-01: Recorrido móvil de CA-01, CA-07 y CA-09 sin autenticación |
| RNF-02 | P093, P022 | src/identidad/autorizacion/ (futuro) | PV-RNF-02: Matriz de permisos con usuarios de dos iglesias y peticiones directas; CA-04 |
| RNF-03 | P086, P089–P090 | src/privacidad/ (futuro) | PV-RNF-03: Acceso anónimo, de otra iglesia y autorizado; CA-04 y CA-14 |
| RNF-04 | P086 | src/dinero/ (futuro) | PV-RNF-04: Suma exacta 0.10 + 0.20 = 0.30 y pruebas de promedio al definir redondeo; CA-13 |
| RNF-05 | P065, P068, P083, P085 | src/persistencia/historial/ (futuro) | PV-RNF-05: Consultar historial tras cierre, baja, sustitución y corrección |
| RNF-06 | P082–P083 | src/tiempo/ (futuro) | PV-RNF-06: Misma hora textual con instantes diferentes y horas diferentes con mismo instante; CA-10 |
| RNF-07 | P075, P092 | src/patrimonio/configuracion/ (futuro) | PV-RNF-07: Cambiar criterios autorizadamente y repetir CA-06 bajo configuración nueva |
| RNF-08 | P063 | src/catalogos/integridad/ (futuro) | PV-RNF-08: Municipio y localidad de otro estado o municipio; CA-03 |
| RNF-09 | P061, P092–P093 | src/operacion/publicacion/ (futuro) | PV-RNF-09: Actualizar una iglesia y comprobar la consulta; verificación de SLA pendiente |
| RN-01 | P063 | src/iglesias/tipos/ (futuro) | PV-RN-01: Seis categorías admitidas y categoría fuera del catálogo |
| RN-02 | P063 | src/catalogos/ (futuro) | PV-RN-02: Ubicaciones válidas y jerarquía inválida; CA-03 |
| RN-03 | P065, P075 | src/iglesias/vigencia/ (futuro) | PV-RN-03: Cierre conservando datos; CA-02 |
| RN-04 | P068 | src/patrimonio/antiguedad/ (futuro) | PV-RN-04: Siglo XVIII → 1750; CA-05 |
| RN-05 | P068, P073 | src/patrimonio/vigencia/ (futuro) | PV-RN-05: Cada condición excluida y registro conservado; CA-05 |
| RN-06 | P071, P074 | src/patrimonio/indice/ (futuro) | PV-RN-06: Antigüedades 49, 50, 99, 100, 199, 200, 299 y 300; CA-06 |
| RN-07 | P072 | src/patrimonio/indice/ (futuro) | PV-RN-07: Un caso por categoría, con y sin bonificación; CA-06 |
| RN-08 | P073–P074 | src/patrimonio/indice/ (futuro) | PV-RN-08: Cuatro contribuciones del ejemplo y exclusión de objeto prestado; CA-06 |
| RN-09 | P073 | src/patrimonio/distincion/ (futuro) | PV-RN-09: Valores 0, 7.9, 8, 19.9, 20, 39.9 y 40; CA-06 |
| RN-10 | P068, P073, P075 | src/patrimonio/ranking/ (futuro) | PV-RN-10: Orden descendente y dos exclusiones inequívocas; CA-07 |
| RN-11 | P078 | src/servicios/costos/ (futuro) | PV-RN-11: Mismo servicio con modalidad distinta en dos iglesias; CA-09 |
| RN-12 | P082 | src/misas/conflictos/ (futuro) | PV-RN-12: Choque parcial, completo y duración distinta; CA-10 |
| RN-13 | P083 | src/celebraciones/ (futuro) | PV-RN-13: Programación con padre A y celebración con B; CA-11 |
| RN-14 | P083 | src/tiempo/ (futuro) | PV-RN-14: Registro y consulta de hora local; CA-10 |
| RN-15 | P085 | src/diezmos/ (futuro) | PV-RN-15: Duplicado, no celebrada y correcciones; CA-12 |
| RN-16 | P086, P095 | src/diezmos/reportes/ (futuro) | PV-RN-16: Acceso cruzado denegado y sumas exactas; CA-13 |
| RN-17 | P088–P089 | src/espacios/cotizacion/ (futuro) | PV-RN-17: Oferta sin precio y cotización individual; CA-14 |
| RN-18 | P089–P090 | src/solicitudes/privacidad/ (futuro) | PV-RN-18: Alta sin cuenta y seguimiento con clave; CA-14 |
| RN-19 | P089, P095 | src/solicitudes/revision/ (futuro) | PV-RN-19: Respuesta con lugar y sin lugar; CA-14 |
| RN-20 | P090 | src/solicitudes/vencimiento/ (futuro) | PV-RN-20: Vencimiento sin respuesta y decisión durante vigencia; CA-15 |
| RN-21 | P090, P095 | src/solicitudes/cancelacion/ (futuro) | PV-RN-21: Cancelación previa y rechazo de cancelación posterior; CA-15 |
| RN-22 | P092–P093 | src/identidad/permisos/ (futuro) | PV-RN-22: Anonimato público y matriz por rol e iglesia; CA-04 |
| CT-01 | P005, P008–P017, P028–P055 | README.md (futuro) | PV-CT-01: Revisión documental de declaración, autoría y calendario |
| CT-02 | P028–P052 | README.md + docs/adr/ (futuro) | PV-CT-02: Comprobar versión y elección dentro de opciones; revisión de ADR |
| CT-03 | P031, P037, P043, P049, P053 | migraciones/ + seeds/ (futuro) | PV-CT-03: Crear BD desde migraciones y cargar seeds en entorno de prueba |
| CT-04 | P054–P055 | README.md + docs/adr/ (futuro) | PV-CT-04: Revisar declaración, ADR de cambio si existe y atribuciones |
| CT-05 | P056 | historial Git (futuro) | PV-CT-05: Revisión del historial y remoto, sin afirmar que ya existen |
| CT-06 | P097–P124 | docs/ (futuro) | PV-CT-06: Revisión de cobertura, validación del cliente y diagramas futuros |
| CT-07 | P023, P127, P143–P145, P236 | docs/ARCHITECTURE.md + reglas/ (futuro) | PV-CT-07: Reglas de dependencias y revisión de controladores |
| CT-08 | P024, P127, P261 | patrimonio/indice (futuro) | PV-CT-08: Mismas entradas dan mismo resultado, sin E/S; CA-06 |
| CT-09 | P022, P128 | API + openapi.yaml (futuro) | PV-CT-09: Integración de versión, JSON, paginación y contrato de error; CA-16 |
| CT-10 | P129, P272–P273 | web/ (futuro) | PV-CT-10: Recorrido público en navegador y operaciones administrativas por API |
| CT-11 | P130 | validacion/ + identidad/ + datos/ (futuro) | PV-CT-11: Entradas inválidas, hash, token vencido, secretos excluidos y consulta segura; CA-16 |
| CT-12 | P131, P261 | tests/ (futuro) | PV-CT-12: Mapa regla-prueba, informe de cobertura e integración; CA-16 |
| CT-13 | P038–P052, P131, P157, P170, P176 | configuracion de calidad + hooks/ (futuro) | PV-CT-13: Ejecutar verificaciones y comprobar bloqueo de un cambio inválido |
| CT-14 | P131 | README.md (futuro) | PV-CT-14: Persona con prerrequisitos sigue instrucciones cronometradas |
| CT-15 | P133–P163 | repositorio futuro del arnes (futuro) | PV-CT-15: Inspección de cada componente y ejecución del hook |
| CT-16 | P167–P173, figura en P168, P179 | flujo del arnes + CHANGELOG.md (futuro) | PV-CT-16: Revisión de tareas y cambios reales; ninguna evidencia se simula |
| CT-17 | P175–P180 | historial + checklist (futuro) | PV-CT-17: Revisión de autoría, commits y práctica responsable |
| CT-18 | P181–P196 | docs/bitacora-ia.md (futuro) | PV-CT-18: Contar entradas y verificar respaldo real de errores y decisiones |
| CT-19 | P197–P198, P237 | repositorio futuro de portabilidad (futuro) | PV-CT-19: Repetir instalación y revisar módulo, video y nota |
| CT-20 | P199–P225 | seeds/ (futuro) | PV-CT-20: Auditar cantidades, distribución, roles y etiquetas de datos ficticios; CA-17 |
| CT-21 | P226–P230, figura en P228 | plan de entregas (futuro) | PV-CT-21: Revisión de las cinco entregas y definición de terminado |
| CT-22 | P232–P238, P241 | docs/ + repositorios + OpenAPI (futuro) | PV-CT-22: Checklist de existencia y contenido al cierre, no en esta fase |
| CT-23 | P239, P243, P267 | defensa futura (futuro) | PV-CT-23: Evaluación oral por el docente, pendiente |
| DES-01 | P095 | src/platicas/consulta-municipal/ (futuro) | PV-DES-01: Filtrar tipo y municipio en varias iglesias |
| DES-02 | P095 | src/celebraciones/generacion/ (futuro) | PV-DES-02: Generación semanal con política aprobada; PC-23 |
| DES-03 | P095 | src/diezmos/comparacion/ (futuro) | PV-DES-03: Acceso de Coordinación y denegación a otros roles |
| DES-04 | P095 | src/espacios/inventario/ (futuro) | PV-DES-04: Inventario y asignación con reglas acordadas; PC-23 |
| EXT-01 | P272–P273 | src/web/administracion/ (futuro) | PV-EXT-01: Recorridos administrativos en navegador |
| EXT-02 | P274–P275 | src/docker-compose/ (futuro) | PV-EXT-02: Arranque limpio con un comando |
| EXT-03 | P276–P277 | src/configuracion CI/ (futuro) | PV-EXT-03: Pipeline pasa con cambio válido y falla con incumplimiento |
| EXT-04 | P278–P279 | src/web/mapa/ (futuro) | PV-EXT-04: Iglesias con coordenadas visibles en mapa |
| EXT-05 | P282–P283, P086 | src/diezmos/exportacion/ (futuro) | PV-EXT-05: Archivo con cifras correctas y acceso autorizado |
| EXT-06 | P284–P285 | src/solicitudes/notificaciones/ (futuro) | PV-EXT-06: Emisión genera aviso según canal acordado |
| EXT-07 | P286–P287 | src/patrimonio/cache/ (futuro) | PV-EXT-07: Modificar objeto y comprobar ranking actualizado |

## 12 Verificación de cobertura del archivo fuente

### 12.1 Párrafos narrativos del caso del cliente

Se revisaron los 27 párrafos narrativos de las subsecciones del caso (P060–P095, sin encabezados). La tabla incluye el contexto inicial y el párrafo deseable; este último solo se asigna a DES. P058 presenta al cliente ficticio y se registra en actores y alcance.

| Párrafo | Inicio para localizarlo en la fuente | Cobertura |
| --- | --- | --- |
| P060 | Somos la Coordinación Nacional de Templos y ayudamos a las diócesis de México a llevar el registro de sus… | AC-03; RF-03, RF-05; PC-10 |
| P061 | Cuando alguien pregunta qué iglesias hay en su estado, a qué hora es la misa o cuánto cuesta un bautizo, … | RF-01, RF-15, RNF-09 |
| P063 | De cada iglesia necesitamos su nombre, si es catedral, basílica, parroquia, templo, capilla o santuario, … | RF-03, RF-05; RN-01, RN-02; RNF-08 |
| P064 | Casi todas las consultas empiezan por el lugar: la persona elige su estado y quiere ver todas las iglesia… | RF-01, RF-02 |
| P065 | A veces una iglesia cierra, ya sea por daños, como les pasó a muchas con los sismos de 2017, o porque dej… | RF-04; RN-03; RNF-05 |
| P067 | Muchas iglesias resguardan objetos de gran valor: imágenes de santos, vírgenes y cristos, retablos, pintu… | RF-07 |
| P068 | De muchas piezas no conocemos el año exacto, solo el siglo; en ese caso usamos la mitad del siglo, así qu… | RF-07, RF-08; RN-04, RN-05 |
| P070 | Para nosotros, una iglesia es más reconocida mientras más objetos valiosos resguarda. Desde hace años la … | RF-09, RF-10 |
| P071 | Cada objeto se califica primero por su antigüedad. Con menos de 50 años vale 1 punto; de 50 a 99, 2 punto… | RF-09, RF-11; RN-06 |
| P072 | Ese puntaje se multiplica según el tipo de objeto: las imágenes de santos, vírgenes y cristos, por 1.5; r… | RF-09, RF-11; RN-07 |
| P073 | El índice de una iglesia es la suma de sus objetos vigentes, y con él le damos una distinción: con 40 pun… | RF-02, RF-09; RN-08, RN-09 |
| P074 | Un ejemplo de nuestras hojas, calculado en 2026: una parroquia tiene una imagen de San Miguel Arcángel de… | RF-09; RN-08; CA-06 |
| P075 | En la lista, las iglesias van de mayor a menor índice, y no aparecen las que están cerradas ni las que no… | RF-10, RF-11; RN-10; RNF-07 |
| P076 | Los investigadores también nos piden búsquedas como «todas las iglesias de Puebla con imágenes de 300 año… | RF-12 |
| P078 | Cada iglesia ofrece servicios como bautizos, primeras comuniones, confirmaciones y casamientos, y a veces… | RF-13, RF-15; RN-11 |
| P079 | Antes de recibir un sacramento casi siempre hay preparación: pláticas prebautismales para papás y padrino… | RF-14, RF-15 |
| P081 | Lo más consultado son los horarios de misa. Cada iglesia tiene un horario semanal: qué días, a qué hora, … | RF-17, RF-19 |
| P082 | Un padre suele celebrar en varias iglesias: el párroco y sus vicarios atienden también las capillas de su… | RF-16, RF-18, RF-19; RN-12 |
| P083 | El horario dice lo que normalmente pasa, pero cada misa celebrada es un hecho: un día, una hora y un padr… | RF-20, RF-21; RN-13, RN-14; RNF-06 |
| P085 | En cada misa se recoge el diezmo, y hoy ese registro vive en libretas. Queremos que el tesorero de cada i… | RF-22, RF-23; RN-15 |
| P086 | Con eso queremos saber cuánto se juntó en un periodo, el promedio por misa y las misas con más y con meno… | RF-24; RN-16; RNF-03, RNF-04 |
| P088 | Algunas iglesias tienen criptas, nichos, columbarios u osarios. Sus precios no se publican, porque cada c… | RF-25; RN-17 |
| P089 | Quien necesita un espacio llena una solicitud con sus datos de contacto, sin crear una cuenta, y recibe u… | RF-26, RF-27, RF-28; RN-17, RN-18, RN-19 |
| P090 | La persona puede aceptar o rechazar el precio. Cada cotización vale 15 días y, si no hay respuesta, se ve… | RF-29, RF-30, RF-31; RN-20, RN-21; RNF-03 |
| P092 | Cualquier persona podrá consultar iglesias, servicios, pláticas, misas e iglesias reconocidas sin crear u… | RF-05, RF-06, RF-11, RF-15; RN-22; RNF-01 |
| P093 | En cada iglesia habrá un administrador que lleve sus datos, objetos, servicios, pláticas, padres, horario… | RF-03, RF-07, RF-13, RF-14, RF-16, RF-17, RF-20, RF-22, RF-28; RNF-02 |
| P095 | Hay cosas que nos gustarían, aunque no son indispensables. Por ejemplo, ver las pláticas de un tipo en to… | DES-01, DES-02, DES-03, DES-04 |

### 12.2 Todas las secciones y subsecciones del documento

| Sección original | Párrafos o figura | Tratamiento y cobertura |
| --- | --- | --- |
| Título, fecha y autoría | P001–P003 | Metadatos de esta especificación; no se convierten en funciones. |
| Descripción general | P004–P017 | Alcance, CT-01, CT-02, CT-04, CT-22, CT-23. |
| Objetivos de aprendizaje | P018–P026 | Análisis, RF/RN/RNF; CT-06 a CT-09; CT-15 a CT-18. Son objetivos formativos comprobables mediante sus entregables. |
| Reglas generales | P027–P056 | CT-01 a CT-05; herramientas en 6.1. Acceso a datos sigue marcado como sugerido. |
| El caso y presentación del cliente | P057–P058 | Alcance y AC-03; cliente ficticio. |
| Quiénes somos y qué nos pasa | P059–P061 | Contexto, RF-01, RF-03, RF-05, RF-15, RNF-09, PC-10. |
| Las iglesias | P062–P065 | RF-01 a RF-05, RN-01 a RN-03, RNF-05, RNF-08. |
| El patrimonio | P066–P068 | RF-07, RF-08, RN-04, RN-05. |
| Las iglesias más reconocidas | P069–P076 | RF-09 a RF-12, RN-06 a RN-10, RNF-07, CA-06 a CA-08. |
| Los servicios y las pláticas | P077–P079 | RF-13 a RF-15, RN-11, CA-09. |
| Las misas y los padres | P080–P083 | RF-16 a RF-21, RN-12 a RN-14, RNF-06, CA-10, CA-11. |
| El diezmo | P084–P086 | RF-22 a RF-24, RN-15, RN-16, RNF-03, RNF-04, CA-12, CA-13. |
| Las criptas y otros espacios | P087–P090 | RF-25 a RF-31, RN-17 a RN-21, RNF-03, CA-14, CA-15. |
| Quién usará el sistema | P091–P093 | Actores, RF-05, RF-06, RF-11, RN-22, RNF-01 a RNF-03. |
| Si alcanza el tiempo | P094–P095 | DES-01 a DES-04, separados del alcance obligatorio. |
| Cómo obtener los requerimientos | P096–P124 | CT-06 y este documento completo: origen, preguntas, aceptación y matriz. RF-01 en la tabla del caso es un ejemplo; no constituye una lista adicional. |
| Lineamientos técnicos | P125–P131 | CT-07 a CT-14; restricciones del curso diferenciadas del caso. |
| Desarrollo con IA y construcción del arnés | P132–P133 | CT-04, CT-15 a CT-19; autoría individual. |
| Qué es el arnés | P134–P135 | Glosario, CT-15. |
| Componentes obligatorios | P136–P163 | CT-15; se enumeran todos los componentes y mínimos. |
| Estructura sugerida del arnés | P164–P166 | 6.1 y CT-15; se conserva el carácter sugerido, sin imponer nombres de carpetas. |
| Flujo de trabajo con la IA | P167–P173 y figura en P168 | CT-16. Figura revisada: pedir plan, aprobar, paso pequeño, verificaciones, revisión, commit y bitácora; error repetido mejora arnés y CHANGELOG. El RF-14 de la instrucción ilustrativa no impone numeración a esta extracción. |
| Reglas de uso responsable | P174–P180 | CT-16, CT-17. |
| Bitácora de IA | P181–P196 | CT-18; campos completos. La fila de ejemplo fechada 10 nov 2026 no se presenta como evento real. |
| Prueba de portabilidad | P197–P198 | CT-19. |
| Datos de prueba | P199–P225 | CT-20 y tabla 6.2; todos los mínimos. |
| Entregables y calendario sugerido | P226–P230 y figura en P228 | CT-21 y 6.3; cinco fases y fechas ajustables. |
| Entrega final | P231–P239 | CT-22, CT-23; checklist para el cierre, sin declarar cumplimiento. |
| Estructura esperada del repositorio del proyecto | P240–P241 | CT-06, CT-22; README de docs indica archivos actuales y pendientes. |
| Criterios de evaluación | P242–P267 | 6.3; CT-07 a CT-23 y flujos base. Se conservan puntos y condición de defensa. |
| Puntos extra | P268–P287 | DES-01 a DES-04 y EXT-01 a EXT-07; tope y puntuaciones en sección 7. |
| Párrafo final vacío | P288 | Sin contenido de negocio; no genera requisito. |

### 12.3 Resultado y límites de la revisión

- Cobertura documental: todas las secciones originales, las dos figuras y los 27 párrafos narrativos tienen una referencia de tratamiento. Se revisó texto completo, tablas y figuras extraídas del DOCX.
- Cada RF, RNF, RN, CT, DES y EXT tiene identificador, redacción, prioridad y origen, y figura en la matriz con código o artefacto futuro y prueba prevista.
- La revisión documental no equivale a validación con el cliente, aprobación del diseño, ejecución de pruebas de producto ni aceptación del docente. Los detalles señalados en PC siguen pendientes.
- La cobertura por párrafo demuestra que no se omitió una sección; la aceptación semántica final requiere resolver preguntas y revisar con el cliente las interpretaciones declaradas.
- No se incorporan pagos en línea, reservas o inscripción automática en pláticas, autenticación de sacerdotes, integración remota INEGI/INAH, facturación ni inventario obligatorio: el archivo no los exige; algunos aparecen únicamente como preguntas o deseables.

## 13 Control de cambios y siguiente revisión

Esta versión registra la extracción inicial. La siguiente revisión debe incorporar respuestas reales del docente, cerrar permisos y estados, fijar parámetros temporales y monetarios y validar el alcance obligatorio antes de diseñar el modelo, diagramas y API. Se conservarán los IDs al modificar o descartar requisitos, dejando motivo y origen verificable.

La estructura inicial de `docs/` se explica en [README.md](README.md). No contiene código del sistema, decisiones técnicas aprobadas ni entradas de bitácora simuladas.
