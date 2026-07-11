Arquitectura planteada para el desarrollo de un sistema de reporte por zonas o por “grupos de apoyo”
El sistema debe ser una Progressive Web App Offline-First por las condiciones en las que se encuentran los entornos donde van a apoyar los grupos de voluntarios y profesionales. Para ello, debemos tomar en cuenta que:
Para que una PWA funcione 100% offline, el almacenamiento local no puede ser localStorage (es muy limitado). Debemos usar IndexedDB.

Esquema de base de datos planteada
Zonas/Misión
Id_misión
Dirección
Municipio
Estado
Fecha_Inicio
Estatus_Misión
Estatus_sincronización

Insumos llevados
Id_insumo_llevado
Id_misión
Categoría
Descripción
Cantidad
Unidad
Observaciones
Categoría
Estatus_cargamento (Entregado/Retorno)
Estatus_sincronización

Transporte
Id_transporte
Id_misión
Tipo_transporte
Número de placa
Nombre_conductor
Estatus_sincronización

Personal/Voluntarios/Profesionales
Id_personal_misión
Id_misión
Cédula
Nombre
Categoría del voluntariado (Estudiante/profesional/voluntario)
Especialidad
Estatus_sincronización

Atendidos
Id_Atención
Id_misión
Cédula_personal
Cédula_atendido
Nombre_Atendido
Teléfono_contacto
Fecha_Hora_Atención
Notas de la atención
Insumos dados (Array/JSON)
Estatus_sincronización

Insumos en necesidad
Id_reporte_necesidad
Id_misión
Categoría
Descripción
Cantidad Requerida
Unidad
Observaciones
Prioridad
Estatus (Reportado/Enproceso/Atendido)
Estatus_sincronización

Estrategia de Sincronización:
•	Identificadores (IDs): Queda estrictamente prohibido usar IDs numéricos autoincrementables (1, 2, 3...). Si dos usuarios en zonas distintas crean un reporte offline, ambos generarán el ID 1 y todo colapsará al sincronizar. Usaremos UUIDs (v4) generados en el teléfono.
•	Estado de Sincronización: Cada registro tendrá un campo status_sync que puede ser "pending" (pendiente) o "synced" (sincronizado).
Flujo de Funcionamiento Técnico
Paso 1: Preparación (Online)
Antes de salir al campo, el equipo abre la PWA en la base o con datos móviles. El Service Worker descarga los archivos de la app (HTML, JS, CSS) para que funcione sin internet. Opcionalmente, se descarga el catálogo de insumos estándar.
Paso 2: Operación en el Campo (Offline)
El coordinador crea la Nueva Misión y registra los transportes y el personal. A medida que llegan los afectados, los estudiantes y profesionales registran las Atenciones y las Necesidades desde sus teléfonos o tabletas.Todo se guarda inmediatamente en IndexedDB con status_sync: "pending". El usuario ve un ícono de una nube con una línea diagonal (Modo Offline).
Paso 3: Retorno y Sincronización (Online)
Al detectar que el dispositivo recupera conexión a internet (usando el evento navigator.onLine), la PWA activa el proceso de fondo
¿Cómo funcionará esto en la PWA para el Coordinador y los Voluntarios?
1.	Pantalla del Coordinador (Inicio de Misión): Al llegar a la zona (aún con señal o antes de salir), el coordinador le da a "Nueva Misión". Registra la zona, los transportes (Tabla 2) y el personal que va en el viaje (Tabla 4). Toda esta info se guarda en el IndexedDB del teléfono del coordinador.
2.	Distribución del Trabajo (Modo Offline): Si hay varios voluntarios con la PWA, cada uno en su teléfono puede registrar "Atendidos" (Tabla 5). Como cada atención genera su propio Id_Atención con un UUID aleatorio, no importa que 5 voluntarios estén registrando personas al mismo tiempo sin internet, los datos nunca se van a pisar ni a duplicar.
3.	Cierre de la visita (El reporte de Necesidades): Antes de irse de la zona, el coordinador abre el módulo "Levantamiento de Necesidades" en su PWA. Evalúa qué falta y llena la Tabla 6.
4.	La Sincronización: Al regresar a una zona con Wifi o datos móviles, la aplicación detecta la red de forma automática. Envía primero la Misión, luego los Transportes y el Personal, después las Atenciones y por último las Necesidades. El servidor central procesa todo y cambia el Estatus_Sincro a "Sincronizado".

Identidad Visual y UI
Tipografía Principal: Inria Sans
Paleta de Colores (Aplicación técnica sugerida):
Fondos & Superficies: Light Gray (#F5F5F5, #F0F0F0), Blanco (#FFFFFF)
Textos: Dark Gray (#333333, #666666), Negro (#000000)
Color de Marca / Énfasis Primario: Azul Corporativo (#00244D)
Elementos Interactivos (Botones/Links): Azul Vivo (#145CAD, #1FAAE1, #127BA4)
Estados / Alertas: Celeste Claro (#68B1ED), Menta/Neutral (#8FBFBF)
Bordes y Deshabilitados: Gris (#BEBEBE, #E3E3E3)

#Características
•	Debe haber un dashboard según el tipo de usuario que ingrese, uno es el director general, que puede acceder a la información de todos los usuarios, insumos, reportes, y modificar o eliminar datos, e inactivar personal. El de administrador que podrá, al igual que el director, ver los reportes e info del personal, pero solo ver, no modificar, el coordinador, que será encargado de crear las misiones, cargar los insumos, transporte y personal que irá, y el personal que pueden ser profesionales o voluntarios que podrán registrar a las personas atendidas. Cada quien debe tener su dashboard según los privilegios y funciones a las que pueda acceder.
•	Debe generar estadísticas y reportes que recopilen la información relevante.
