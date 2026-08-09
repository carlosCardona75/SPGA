# SGPA Backend

Backend del Sistema de Gestión de Programación Académica (SGPA), desarrollado como proyecto de práctica profesional para el programa de Fisioterapia de la Fundación Universitaria del Área Andina.

El sistema permite administrar docentes, materias, grupos, aulas, períodos académicos, asignaciones y horarios. También incorpora autenticación, control de acceso por roles, validaciones de negocio y exportación de horarios a Excel.

## Funcionalidades principales

- Gestión de docentes.
- Gestión de materias.
- Gestión de grupos académicos.
- Gestión de aulas.
- Gestión de períodos académicos.
- Asignación de docentes a grupos y períodos.
- Programación y consulta de horarios.
- Detección de cruces de horarios de docentes.
- Detección de cruces de horarios de grupos.
- Validación de disponibilidad de aulas.
- Control del máximo de horas permitido por docente.
- Consulta del perfil, asignaciones y horario del docente autenticado.
- Exportación de horarios a archivos Excel.
- Autenticación mediante JSON Web Token (JWT).
- Autorización mediante roles ADMIN y DOCENTE.
- Contraseñas protegidas mediante hash.
- Contraseñas temporales con cambio obligatorio.
- Límite de intentos fallidos de inicio de sesión.
- Encabezados HTTP de seguridad mediante Helmet.
- Restricción de acceso mediante CORS.
- Manejo global de errores y rutas inexistentes.

## Tecnologías utilizadas

- Node.js
- Express
- MySQL
- JavaScript
- JSON Web Token
- bcryptjs
- ExcelJS
- Helmet
- express-rate-limit
- CORS
- dotenv

## Requisitos previos

Antes de ejecutar el backend se requiere:

- Node.js 18 o superior.
- npm.
- MySQL Server.
- Git.
- Una base de datos MySQL creada para el SGPA.
- Un archivo `.env` configurado a partir de `.env.example`.

Para verificar las versiones instaladas:

```bash
node --version
npm --version
git --version
```

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/carlosCardona75/SPGA.git
```

### 2. Ingresar a la carpeta del backend

```bash
cd SPGA/sgpa-backend
```

### 3. Instalar las dependencias

```bash
npm install
```

### 4. Crear el archivo de variables de entorno

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

También se puede copiar manualmente `.env.example`, cambiar el nombre de la copia a `.env` y completar sus valores.

> El archivo `.env` contiene información privada y no debe publicarse en el repositorio.

## Variables de entorno

El archivo `.env` debe contener las siguientes variables:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=horarios_docentes
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contrasena_mysql

JWT_SECRET=genera_una_clave_segura_de_128_caracteres
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
```

Descripción de las variables:

- `PORT`: puerto en el que se ejecutará el backend.
- `DB_HOST`: dirección del servidor MySQL.
- `DB_PORT`: puerto de MySQL.
- `DB_NAME`: nombre de la base de datos.
- `DB_USER`: usuario autorizado para conectarse a MySQL.
- `DB_PASSWORD`: contraseña del usuario de MySQL.
- `JWT_SECRET`: clave privada utilizada para firmar los tokens de autenticación.
- `JWT_EXPIRES_IN`: tiempo de vigencia de los tokens.
- `CORS_ORIGIN`: dirección del frontend autorizado para consumir la API.

> En producción deben utilizarse credenciales institucionales y una clave JWT segura. Nunca deben escribirse valores reales en `.env.example` ni publicarse en GitHub.

## Ejecución

### Modo normal

```bash
npm start
```

### Modo de desarrollo

```bash
npm run dev
```

Por defecto, la API queda disponible en:

```text
http://localhost:3000
```

Para verificar el funcionamiento del servidor:

```http
GET http://localhost:3000/api/test
```

Respuesta esperada:

```json
{
  "ok": true,
  "mensaje": "Servidor funcionando correctamente"
}
```

## Estructura del proyecto

```text
sgpa-backend/
├── database/
│   └── migrations/
├── docs/
├── plantillas/
├── scripts/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── asignacionController.js
│   │   ├── aulaController.js
│   │   ├── authController.js
│   │   ├── docenteController.js
│   │   ├── grupoController.js
│   │   ├── horarioController.js
│   │   ├── materiaController.js
│   │   ├── periodoController.js
│   │   └── usuarioController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── asignacionRoutes.js
│   │   ├── aulaRoutes.js
│   │   ├── authRoutes.js
│   │   ├── docenteRoutes.js
│   │   ├── grupoRoutes.js
│   │   ├── horarioRoutes.js
│   │   ├── materiaRoutes.js
│   │   ├── periodoRoutes.js
│   │   └── usuarioRoutes.js
│   └── app.js
├── .env.example
├── package.json
├── README.md
└── server.js
```

La aplicación utiliza una arquitectura organizada por responsabilidades:

- `config`: configuración de la conexión con MySQL.
- `controllers`: lógica de las operaciones y validaciones.
- `routes`: definición de los endpoints y permisos.
- `middlewares`: autenticación y autorización.
- `database/migrations`: cambios controlados en la estructura de la base de datos.
- `docs`: documentación de pruebas y sustentación.
- `plantillas`: plantillas Excel reutilizables para importar planes de estudio.
- `scripts`: procesos auxiliares de importación y mantenimiento.

## Roles y permisos

### Rol ADMIN

Puede:

- Administrar docentes, materias, grupos, aulas y períodos.
- Administrar usuarios.
- Crear y modificar asignaciones.
- Crear, modificar y eliminar horarios.
- Consultar todos los registros.
- Exportar horarios a Excel.
- Restablecer contraseñas de usuarios.

### Rol DOCENTE

Puede:

- Consultar su perfil.
- Consultar sus asignaciones.
- Consultar su horario.
- Consultar materias, grupos, aulas y períodos autorizados.
- Cambiar su propia contraseña.

El rol DOCENTE no puede crear, modificar ni eliminar información administrativa.

## Endpoints principales

Las rutas protegidas requieren el encabezado:

Encabezado requerido: Authorization: Bearer TOKEN_JWT

### Autenticación

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/registro-inicial` | Público condicionado | Crea exclusivamente el primer administrador |
| POST | `/api/auth/login` | Público | Inicia sesión y genera un token |
| GET | `/api/auth/perfil` | Autenticado | Consulta el usuario autenticado |
| PATCH | `/api/auth/cambiar-password` | Autenticado | Cambia la contraseña propia |

El inicio de sesión permite cinco intentos fallidos por dirección IP dentro de un período de 15 minutos. El sexto intento devuelve `429 Too Many Requests`.

### Usuarios

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/usuarios` | ADMIN | Lista los usuarios |
| POST | `/api/usuarios` | ADMIN | Crea un usuario |
| PATCH | `/api/usuarios/:id/restablecer-password` | ADMIN | Genera una contraseña temporal |

### Docentes

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/docentes` | ADMIN | Lista los docentes |
| GET | `/api/docentes/mi-perfil` | DOCENTE | Consulta el perfil docente propio |
| GET | `/api/docentes/:id` | ADMIN | Consulta un docente por ID |
| POST | `/api/docentes` | ADMIN | Crea un docente |
| PUT | `/api/docentes/:id` | ADMIN | Actualiza un docente |
| DELETE | `/api/docentes/:id` | ADMIN | Elimina un docente |

### Materias, grupos, aulas y períodos

Estos módulos utilizan el mismo patrón CRUD:

| Método | Ruta base | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/materias` | ADMIN y DOCENTE | Lista las materias |
| GET | `/api/grupos` | ADMIN y DOCENTE | Lista los grupos |
| GET | `/api/aulas` | ADMIN y DOCENTE | Lista las aulas |
| GET | `/api/periodos` | ADMIN y DOCENTE | Lista los períodos |
| GET | `/api/{modulo}/:id` | ADMIN y DOCENTE | Consulta un registro por ID |
| POST | `/api/{modulo}` | ADMIN | Crea un registro |
| PUT | `/api/{modulo}/:id` | ADMIN | Actualiza un registro |
| DELETE | `/api/{modulo}/:id` | ADMIN | Elimina un registro |

En `{modulo}` se utiliza `materias`, `grupos`, `aulas` o `periodos`.

### Asignaciones

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/asignaciones` | ADMIN | Lista todas las asignaciones |
| GET | `/api/asignaciones/mis-asignaciones` | DOCENTE | Lista las asignaciones propias |
| GET | `/api/asignaciones/:id` | ADMIN | Consulta una asignación |
| POST | `/api/asignaciones` | ADMIN | Crea una asignación |
| PUT | `/api/asignaciones/:id` | ADMIN | Actualiza una asignación |
| DELETE | `/api/asignaciones/:id` | ADMIN | Elimina una asignación |

### Horarios

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/horarios` | ADMIN | Lista y filtra todos los horarios |
| GET | `/api/horarios/mi-horario` | DOCENTE | Consulta el horario propio |
| GET | `/api/horarios/exportar` | ADMIN | Exporta horarios a Excel |
| GET | `/api/horarios/:id` | ADMIN | Consulta un horario |
| POST | `/api/horarios` | ADMIN | Crea un horario |
| PUT | `/api/horarios/:id` | ADMIN | Actualiza un horario |
| DELETE | `/api/horarios/:id` | ADMIN | Elimina un horario |

## Validaciones de negocio

Antes de crear o actualizar información, el backend comprueba:

- Existencia de docentes, materias, grupos, aulas y períodos relacionados.
- Formato y obligatoriedad de los campos.
- Valores válidos para el estado: `0` o `1`.
- Formato de días y horas.
- Que la hora inicial sea menor que la hora final.
- Que un docente no tenga horarios cruzados.
- Que un grupo no tenga horarios cruzados.
- Que un aula no esté ocupada en el mismo período, día y rango horario.
- Que un docente no supere su máximo de horas.
- Que no se dupliquen asignaciones de docente, grupo y período.
- Que no se eliminen registros que tengan relaciones activas.
- Que las contraseñas cumplan los requisitos de seguridad.
- Que los usuarios con contraseña temporal la cambien antes de utilizar las rutas protegidas.

## Códigos HTTP utilizados

| Código | Significado | Uso en el SGPA |
|---|---|---|
| 200 | OK | Consulta o actualización realizada correctamente |
| 201 | Created | Registro creado correctamente |
| 400 | Bad Request | Datos obligatorios, formatos o valores inválidos |
| 401 | Unauthorized | Credenciales o token inválidos |
| 403 | Forbidden | Usuario sin permiso, inactivo o con cambio de contraseña pendiente |
| 404 | Not Found | Registro o ruta no encontrada |
| 409 | Conflict | Duplicados, cruces de horario o relaciones existentes |
| 429 | Too Many Requests | Exceso de intentos fallidos de inicio de sesión |
| 500 | Internal Server Error | Error interno controlado por el servidor |

## Seguridad

El backend implementa las siguientes medidas:

- Hash de contraseñas mediante `bcryptjs`.
- Autenticación mediante JWT.
- Tokens con tiempo de expiración.
- Autorización basada en roles.
- Cambio obligatorio de contraseñas temporales.
- Restablecimiento administrativo de contraseñas.
- Bloqueo temporal por intentos repetidos de inicio de sesión.
- Encabezados HTTP de seguridad mediante Helmet.
- Ocultamiento del encabezado `X-Powered-By`.
- Restricción del origen autorizado mediante CORS.
- Variables sensibles almacenadas fuera del código.
- Manejo global de errores sin exponer información técnica.
- Auditoría de dependencias de producción sin vulnerabilidades conocidas al momento de la revisión.

## Base de datos

El backend utiliza MySQL y, por defecto, espera una base de datos llamada:

`horarios_docentes`

La conexión se configura mediante las variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`.

### Instalación nueva de la base de datos

El archivo `database/schema.sql` contiene el esquema completo y anonimizado del SGPA. Permite crear desde cero las ocho tablas, sus índices y relaciones, sin incluir contraseñas, tokens ni datos personales.

Para una instalación nueva:

1. Ingresar a MySQL Workbench.
2. Abrir el archivo `database/schema.sql`.
3. Revisar que la base indicada sea `horarios_docentes`.
4. Ejecutar el archivo completo una sola vez.
5. Configurar en `.env` las credenciales de conexión.
6. Crear el primer administrador mediante `POST /api/auth/registro-inicial`.

### Actualización de una base existente

La carpeta `database/migrations` contiene cambios destinados únicamente a instalaciones anteriores. Actualmente incluye:

- `001_autenticacion_usuarios.sql`: agrega la estructura de autenticación, roles y control de contraseñas a una base existente.

Antes de ejecutar una migración:

1. Realizar una copia de seguridad.
2. Confirmar que se está trabajando sobre la base correcta.
3. Revisar si los cambios ya fueron aplicados.
4. Ejecutar la migración una sola vez.
5. Verificar la estructura resultante.

> En una instalación nueva se ejecuta `database/schema.sql`; no se debe ejecutar después la migración `001_autenticacion_usuarios.sql`, porque el esquema completo ya contiene esos campos.

## Scripts auxiliares

La carpeta `scripts` contiene herramientas utilizadas durante la preparación y validación de datos:

- `importarDocentes.js`: importación de docentes desde Excel.
- `importarMaterias.js`: importación de materias desde Excel.
- `importarHorario.js`: importación de información de horarios.
- `revisarHorario.js`: revisión de los datos importados.
- `validarHorario.js`: validación previa de la estructura y contenido.
- `datosPlanFisioterapia2026.js`: datos del nuevo plan de estudios de Fisioterapia (65 asignaturas, 160 créditos).
- `generarPlantillaPlanEstudios.js`: genera la plantilla Excel `plantillas/PLANTILLA_PLAN_ESTUDIOS.xlsx`.
- `importarPlanEstudios.js`: importa un plan de estudios desde la plantilla (período, materias y grupos).

Estos scripts son procesos administrativos y deben ejecutarse únicamente sobre archivos previamente revisados y con una copia de seguridad disponible.

### Importación de un plan de estudios (plantilla Excel)

El flujo permite cargar el pensum de un programa sin capturar los datos uno a uno en el sistema:

1. Ejecutar `node scripts/generarPlantillaPlanEstudios.js` para generar (o actualizar) `plantillas/PLANTILLA_PLAN_ESTUDIOS.xlsx`. La plantilla incluye de ejemplo el nuevo plan de Fisioterapia 2026.
2. En la hoja `CONFIG` ajustar: `PROGRAMA`, `PERIODO` (p. ej. `202670`), `FECHA INICIO` y `FECHA FINAL`.
3. En la hoja `PENSUM ACADÉMICO` pegar o reemplazar las filas con el pensum del programa. Si se deja vacío `COD MATERIA`, el código se genera automáticamente (`FIS001`, `FIS002`, ...).
4. Ejecutar `node scripts/importarPlanEstudios.js`.

El script crea, en una sola transacción:

- El período académico indicado en `CONFIG` (si no existe).
- Las materias nuevas (las que ya existen por código o por nombre se omiten y se reportan).
- Un grupo inicial por materia con código `semestre + 01` (por ejemplo `101`, `201`, ..., `801`).

Las materias nuevas quedan listas para asignarse a docentes desde el módulo de asignaciones y para programarse en horarios.

## Pruebas y sustentación

La documentación detallada de pruebas se encuentra en:

`docs/GUIA_PRUEBAS_Y_SUSTENTACION.md`

La guía incluye escenarios de prueba, validaciones, respuestas esperadas y procedimientos temporales utilizados para demostrar reglas de negocio.

## Auditoría de dependencias

Antes de publicar una versión se debe ejecutar:

```bash
npm audit --omit=dev

```

Al 24 de julio de 2026, npm reporta una alerta de severidad alta en `brace-expansion`, incorporada de forma transitiva por `exceljs` mediante `archiver`, `glob` y `minimatch`.

La vulnerabilidad requiere procesar patrones de archivos controlados por un atacante. El SGPA no recibe ni ejecuta patrones `glob` enviados por usuarios; ExcelJS se utiliza únicamente para generar archivos `.xlsx` desde consultas internas y la exportación está protegida mediante autenticación.

Por esta razón se adopta temporalmente la siguiente decisión:

- No ejecutar `npm audit fix --force`.
- Mantener `exceljs` en la versión funcional validada.
- No aceptar nombres de archivo ni patrones de búsqueda proporcionados por el cliente para generar la exportación.
- Mantener la ruta de exportación protegida mediante token.
- Revisar periódicamente las actualizaciones de ExcelJS y Archiver.
- Actualizar la dependencia cuando exista una solución compatible y volver a ejecutar las pruebas de exportación.

Esta excepción debe reevaluarse antes del despliegue institucional.

