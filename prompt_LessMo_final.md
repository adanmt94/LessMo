No quiero que “me programes una app nueva”.
Quiero que entiendas el proyecto actual, rescates lo que sirve, arregles lo que está mal y lo conduzcas hacia esta visión de producto con el mínimo cambio estructural necesario.

Si detectas que la app actual y la visión objetivo están desalineadas, no hagas una reescritura completa automáticamente: primero propón una estrategia de convergencia por fases.

Quiero que actúes como un principal engineer / staff engineer experto en:
- React Native
- Expo
- TypeScript
- Firebase / Firestore
- Stripe
- arquitectura de apps móviles
- diseño de modelos de datos
- UX/UI de apps financieras compartidas
- debugging, refactorización conservadora y recuperación de proyectos existentes
- producto tipo Splitwise / Tricount

Tu objetivo es AUDITAR, ENTENDER, REORDENAR y ARREGLAR mi proyecto actual llamado LessMo, que ya existe, y llevarlo hacia una visión de producto muy concreta sin romper lo que ya sirve.

NO quiero una reinvención creativa desde cero.
NO quiero una app nueva inventada.
Quiero que trabajes sobre el proyecto real activo y que primero entiendas todo antes de tocar nada.

==================================================
0. REGLAS DE TRABAJO
==================================================

- Trabaja sobre el proyecto real activo, no sobre carpetas duplicadas o legacy.
- Usa búsqueda global antes de concluir que algo no existe.
- No inventes archivos, rutas ni arquitectura sin revisar el código.
- No borres código útil por simplificar.
- No hagas refactors masivos salvo que estén justificados por el estado real del proyecto.
- Si hay varias soluciones, elige la más conservadora y estable.
- No quiero "solo que compile"; quiero que funcione bien y tenga una buena experiencia de uso.
- Primero diagnóstico, luego plan, luego cambios pequeños y seguros.

==================================================
1. VISIÓN DEL PRODUCTO
==================================================

LessMo debe ser una app móvil de gastos compartidos parecida a Splitwise o Tricount, pero con una diferenciación fuerte y clara:

### Diferenciador principal
Cada evento o grupo debe tener un PRESUPUESTO MÁXIMO definido, y la app debe ayudar a:
- controlar cuánto se lleva gastado
- cuánto queda disponible
- avisar antes de sobrepasarlo
- avisar claramente cuando se supera
- convertir el presupuesto en una parte central del flujo, no en un dato secundario

No quiero una copia de Splitwise/Tricount.
Quiero una app que destaque por:
- control claro de deudas
- control presupuestario por evento
- claridad de balances
- facilidad de uso
- buena UI/UX
- pantallas robustas y coherentes

==================================================
2. ESTRUCTURA DE PRODUCTO QUE QUIERO
==================================================

La app debe tener dos áreas grandes y muy claras:

### A. Gastos únicos / individuales
Una pantalla o sección específica donde se puedan registrar movimientos que NO están asociados a ningún evento/grupo.

Debe permitir:
- crear gasto único
- crear ingreso único
- indicar importe
- indicar quién paga
- indicar entre quién se reparte
- elegir forma de reparto
- elegir medio de pago
- categorías, notas, fecha, etc. si encaja con el proyecto actual

Esto debe poder usarse sin necesidad de crear ningún evento.

### B. Eventos / grupos
Otra pantalla o sección específica para eventos/grupos.

Cada evento debe poder tener:
- nombre
- descripción opcional si encaja
- presupuesto máximo
- participantes
- gastos
- ingresos
- balances
- resumen financiero
- porcentaje consumido del presupuesto
- restante disponible
- alertas por exceso de presupuesto

Y dentro del evento debe poder:
- añadir participantes
- quitar participantes
- editar participantes
- añadir gasto
- añadir ingreso
- editar movimientos
- eliminar movimientos
- elegir pagador
- elegir afectados
- elegir método de reparto
- recalcular balances correctamente

==================================================
3. REQUISITOS FUNCIONALES
==================================================

Quiero que revises el proyecto actual y lo compares con estos requisitos:

### 3.1 Participantes
- añadir
- quitar
- editar
- soportar cambios sin romper balances
- soportar participantes diferentes por evento

### 3.2 Gastos
Cada gasto debería tener, idealmente:
- id
- título/descripcion
- importe
- fecha
- pagador
- participantes involucrados
- forma de reparto
- medio de pago
- notas/categoría si aplica
- referencia a evento o marca de gasto único

### 3.3 Ingresos
Quiero soporte explícito a ingresos:
- ingreso dentro de evento
- ingreso suelto
- devolución
- aportación a bote común
- ajustes positivos

### 3.4 Repartos
Quiero revisar y soportar correctamente:
- reparto equitativo
- reparto por importe exacto
- reparto por porcentaje
- reparto entre subconjunto de participantes

### 3.5 Presupuesto máximo
Es una feature central.
Cada evento/grupo debe tener:
- presupuesto máximo
- gasto acumulado
- restante
- porcentaje
- avisos claros visuales
- comportamiento correcto al crear, editar o eliminar gastos/ingresos

### 3.6 Medios de pago
Quiero que revises toda la lógica actual de payment methods / medios de pago:
- datos
- persistencia
- UI
- selección en formularios
- visualización en listados y detalle
- compatibilidad con gastos e ingresos

### 3.7 Balances
Quiero una lógica sólida de:
- cuánto ha pagado cada persona
- cuánto le corresponde
- quién debe a quién
- resumen neto
- liquidación comprensible

==================================================
4. CALIDAD DE UX/UI
==================================================

La app debe:
- verse moderna
- ser clara
- tener buen espaciado
- tener pantallas coherentes entre sí
- tener formularios bien construidos
- tener navegación clara
- tener feedback visual correcto
- tener validaciones buenas
- tener empty states
- tener errores entendibles
- tener loaders/estados de carga razonables
- evitar flows confusos

Quiero que analices:
- estilo visual actual
- consistencia de componentes
- calidad de los formularios
- navegación
- jerarquía visual
- accesibilidad básica
- naming de acciones y botones
- problemas de UX
- problemas de estados incoherentes

==================================================
5. LO QUE QUIERO QUE ME ENTREGUES EN LA FASE DE DIAGNÓSTICO
==================================================

Antes de tocar código quiero que me des esto:

### 5.1 Mapa del proyecto
- estructura real de carpetas
- proyecto activo real
- entry points
- configuración relevante
- dependencias clave
- pantallas principales
- servicios principales
- modelo actual de datos si se deduce

### 5.2 Resumen ejecutivo
Explícame:
- qué es la app hoy realmente
- qué funcionalidades reales tiene
- qué funcionalidades parece que intentó tener
- qué partes están terminadas
- qué partes están incompletas
- qué partes están rotas
- qué partes parecen legado/duplicadas

### 5.3 Inventario funcional
Hazme una lista/tabla con:
- pantalla / módulo
- propósito
- estado (bien / incompleto / roto / sospechoso)
- observaciones

### 5.4 Gap analysis contra la visión objetivo
Compáralo con lo que quiero y clasifica:
- ya existe y funciona
- existe pero mal
- existe pero incompleto
- no existe
- existe técnicamente pero UX mala

### 5.5 Riesgos técnicos
Quiero que identifiques:
- duplicidades
- deuda técnica
- imports rotos
- lógica inconsistente
- pantallas duplicadas
- servicios redundantes
- estructuras de datos mal normalizadas
- riesgos en Firebase / pagos / estado global / navegación

==================================================
6. ADEMÁS QUIERO QUE ME PROPONGAS DISEÑO TÉCNICO OBJETIVO
==================================================

Después del diagnóstico, y ANTES de hacer cambios, quiero que me propongas una versión objetivo para la app.

### 6.1 Modelo de datos ideal
Propón el modelo de datos ideal, pero adaptado al proyecto actual, para entidades como:
- User
- Participant
- Event / Group
- Expense
- Income
- PaymentMethod
- Balance / Settlement
- SingleExpense / standalone movement (si decides que debe modelarse aparte o con un campo type/context)

Quiero que expliques:
- campos principales
- relaciones
- qué reutilizarías del proyecto actual
- qué cambiarías mínimo para que funcione bien

### 6.2 Navegación ideal
Propón una navegación clara y razonable, por ejemplo:
- Home / Dashboard
- Gastos únicos
- Eventos
- Detalle de evento
- Crear/editar movimiento
- Ajustes
- Métodos de pago
- etc.

No quiero overengineering.
Quiero una navegación clara, comprensible y alineada con la app.

### 6.3 Arquitectura de pantallas
Quiero que me propongas qué pantallas deberían existir sí o sí, por ejemplo:
- lista de eventos
- detalle de evento
- crear evento
- lista de gastos únicos
- crear gasto único
- editar gasto/ingreso
- resumen de balances
- configuración de medios de pago
- etc.

Y que me digas:
- cuáles ya existen
- cuáles podrían reutilizarse
- cuáles habría que arreglar
- cuáles faltan

### 6.4 Diseño de estados
Propón cómo deberían manejarse los estados clave:
- loading
- empty
- error
- success
- over-budget
- partially configured payments
- participant removed/edited
- split invalid
- etc.

==================================================
7. PLAN DE EJECUCIÓN QUE QUIERO
==================================================

Tras el diagnóstico, quiero un plan por fases, muy claro y priorizado.

Ejemplo de formato deseado:
1. Corregir errores críticos / imports / crashes
2. Identificar y consolidar proyecto activo
3. Estabilizar navegación
4. Arreglar lógica de eventos y participantes
5. Arreglar gastos únicos
6. Arreglar medios de pago
7. Arreglar balances y repartos
8. Implementar bien presupuesto máximo y alertas
9. Mejorar UI/UX y consistencia visual
10. Pulido final y testing

Para cada fase quiero:
- objetivo
- archivos/módulos implicados
- riesgo
- resultado esperado

==================================================
8. FORMA DE EJECUCIÓN DESPUÉS DEL PLAN
==================================================

Cuando empieces a cambiar cosas:
- haz cambios pequeños
- explícame cada cambio
- dime qué problema resuelve
- dime qué no has tocado
- dime qué tengo que probar después

No avances a ciegas.
Quiero iteración guiada y controlada.

==================================================
9. TAREAS QUE QUIERO QUE HAGAS AHORA MISMO
==================================================

Empieza por este orden exacto:

1. Identifica el proyecto real activo y descarta carpetas duplicadas o legacy.
2. Mapea la estructura del proyecto completo.
3. Lee:
   - package.json
   - configuración Expo/app
   - navegación
   - src/screens
   - src/components
   - src/services
   - hooks
   - utils
   - lógica de Firebase
   - lógica de Stripe/pagos
4. Busca específicamente cualquier código relacionado con:
   - event
   - group
   - budget
   - expense
   - income
   - participant
   - payment method
   - split
   - balance
   - settlement
   - standalone/single expense
5. Dame el diagnóstico completo antes de cambiar nada.
6. Después propón:
   - modelo de datos objetivo
   - navegación objetivo
   - conjunto de pantallas objetivo
   - plan de fases

NO CAMBIES NADA hasta haberme dado:
- resumen ejecutivo
- inventario funcional
- gap analysis
- diseño técnico objetivo
- plan de ejecución
==================================================
10. BLOQUE EXTRA DE UX/UI Y DISEÑO DE PRODUCTO
==================================================

Además del diagnóstico técnico y funcional, quiero que hagas una auditoría profunda de UX/UI del proyecto actual y que lo reconduzcas hacia una experiencia más clara, moderna y coherente.

No quiero una UI genérica ni un rediseño de postureo.
Quiero una app que se sienta:
- clara
- moderna
- limpia
- visualmente consistente
- fácil de usar
- fiable
- suficientemente premium
- mejor resuelta que Splitwise/Tricount en claridad visual y control del presupuesto

==================================================
10.1 PRINCIPIOS DE DISEÑO QUE QUIERO
==================================================

La app debe transmitir:
- claridad financiera
- sensación de control
- simplicidad
- confianza
- orden
- rapidez de uso
- buena jerarquía visual

No quiero:
- pantallas saturadas
- formularios confusos
- exceso de texto innecesario
- colores arbitrarios
- UX inconsistente entre pantallas
- flows donde el usuario no entienda qué está pasando

Quiero:
- componentes consistentes
- spacing correcto
- tipografía clara
- estados visuales bien diferenciados
- llamadas a la acción claras
- navegación sencilla
- resúmenes financieros legibles
- formularios rápidos de usar
- visualización clara del presupuesto restante y consumido

==================================================
10.2 AUDITORÍA DE UX/UI QUE QUIERO
==================================================

Quiero que revises en el proyecto actual:

### Pantallas
- si cada pantalla tiene un propósito claro
- si hay pantallas duplicadas o redundantes
- si el flujo entre pantallas tiene sentido
- si falta jerarquía visual
- si hay contenido mal agrupado

### Formularios
- crear evento
- crear gasto
- crear ingreso
- editar participantes
- elegir forma de reparto
- elegir medio de pago

Quiero que analices:
- claridad
- número de pasos
- facilidad de rellenado
- validaciones
- feedback de errores
- orden de campos
- etiquetas
- accesibilidad básica

### Componentes
- botones
- inputs
- cards
- listas
- modales
- tabs
- headers
- resúmenes
- badges
- indicadores de presupuesto
- alertas
- empty states
- loaders

### Resúmenes financieros
Quiero que revises si:
- los balances se entienden rápido
- los importes tienen buena jerarquía
- está claro cuánto se ha gastado
- está claro cuánto queda de presupuesto
- está claro quién debe a quién
- está claro quién ha pagado más o menos

==================================================
10.3 DIRECCIÓN VISUAL QUE QUIERO
==================================================

Quiero una línea visual moderna y útil, no recargada.

Me interesa una estética:
- minimalista
- limpia
- con cards bien resueltas
- con aire
- con colores funcionales
- con estados visuales claros para:
  - normal
  - advertencia
  - sobrepresupuesto
  - saldo a favor
  - saldo en contra
  - ingreso
  - gasto

Quiero que propongas una dirección visual razonable en base al proyecto actual:
- paleta de color
- jerarquía de texto
- componentes base
- reglas de espaciado
- patrón de cards/listas
- patrón de formularios
- patrón de resumen financiero
- patrón visual del presupuesto máximo

==================================================
10.4 PANTALLAS CLAVE QUE QUIERO MUY BIEN RESUELTAS
==================================================

Estas pantallas son críticas y deben quedar especialmente bien:

### A. Pantalla de gastos únicos
Debe quedar muy clara y útil.
Quiero que se entienda que ahí van movimientos no asociados a eventos.
Debe ser rápida de consultar y rápida de crear movimiento.

### B. Pantalla de eventos
Debe funcionar como lista clara de eventos/grupos.
Debe destacar:
- nombre
- gasto total
- presupuesto máximo
- restante
- estado del presupuesto
- quizá número de participantes si encaja bien

### C. Detalle de evento
Es una de las pantallas más importantes.
Debe mostrar claramente:
- nombre del evento
- presupuesto máximo
- gastado
- restante
- porcentaje consumido
- participantes
- lista de gastos/ingresos
- balances/resumen
- CTA para añadir movimiento

### D. Crear/editar gasto o ingreso
Debe ser un flujo muy claro.
Debe minimizar fricción y evitar errores.
Tiene que estar muy bien resuelto el:
- importe
- pagador
- participantes
- tipo de reparto
- medio de pago
- evento o no evento
- gasto o ingreso

### E. Resumen de balances
Debe ser comprensible de un vistazo.
Quiero una UX que permita saber rápido:
- quién debe
- quién recibe
- importes netos
- si hay posibilidad de liquidación sugerida, mejor si encaja con el proyecto

==================================================
10.5 COMPORTAMIENTO DE UX QUE QUIERO
==================================================

Quiero que propongas y, si procede, implementes mejoras de UX como:

- validaciones antes de guardar
- mensajes claros cuando falta información
- confirmaciones al eliminar
- feedback claro tras guardar/editar
- indicadores de presupuesto en tiempo real al crear un gasto
- alertas visuales no invasivas cuando un evento está cerca de sobrepasar el presupuesto
- estados vacíos útiles
- textos y copy claros y consistentes

==================================================
10.6 ENTREGABLES DE UX/UI QUE QUIERO EN EL DIAGNÓSTICO
==================================================

Además del diagnóstico técnico, quiero que me des:

1. Auditoría UX/UI del estado actual
2. Lista de problemas de UX/UI ordenados por gravedad
3. Propuesta de dirección visual
4. Lista de componentes/pantallas que deberían unificarse o rehacerse visualmente
5. Propuesta de navegación y jerarquía visual mejorada
6. Plan de mejora UX/UI por fases

==================================================
10.7 REGLAS IMPORTANTES DE DISEÑO
==================================================

- No hagas un rediseño caprichoso.
- No cambies toda la UI por otra totalmente distinta sin justificarlo.
- Reutiliza y mejora lo que ya exista si es salvable.
- Si propones cambios grandes, justifícalos por claridad, consistencia o producto.
- Prioriza usabilidad real sobre estética decorativa.
- El presupuesto máximo debe sentirse como una feature central también visualmente.

==================================================
10.8 LO QUE QUIERO QUE HAGAS
==================================================

Durante el diagnóstico:
- audita también la UX/UI actual
- identifica incoherencias visuales
- propone una dirección de mejora concreta

Durante la ejecución:
- mejora pantallas y componentes de forma progresiva
- no rompas flujos funcionales por rediseñar
- explica cada cambio visual importante
- prioriza primero las pantallas críticas del producto

Quiero que combines criterio técnico, criterio de producto y criterio de UX/UI. No quiero solo una app que funcione: quiero una app coherente, clara, estable y con una experiencia mejor resuelta.

Si detectas que una pantalla o flujo actual no encaja con la visión de producto, no lo descartes sin más: primero propón cómo reconducirlo con el menor cambio posible.