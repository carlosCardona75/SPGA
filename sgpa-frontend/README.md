# SGPA Frontend

Interfaz web del Sistema de Gestión de Programación Académica (SGPA), desarrollada como proyecto de práctica profesional para el programa de Fisioterapia de la Fundación Universitaria del Área Andina.

El frontend consume la API del backend y permite administrar docentes, materias, grupos, aulas, períodos académicos, asignaciones y horarios, con autenticación JWT, control de acceso por roles, recuperación de contraseña y exportación de información académica a Excel.

## Funcionalidades principales

- Inicio de sesión con autenticación JWT.
- Protección de rutas por sesión y por rol (ADMIN y DOCENTE).
- Dashboard con resumen general del sistema.
- CRUD completo de docentes.
- CRUD completo de materias.
- CRUD completo de grupos.
- CRUD completo de aulas.
- CRUD completo de períodos académicos.
- Gestión de asignaciones de docentes a grupos y períodos.
- Programación, consulta y filtros de horarios.
- Exportación de horarios a Excel desde la interfaz (el administrador exporta todos los horarios y el docente su propio horario).
- Exportación de docentes, asignaciones y reportes a Excel (solo ADMIN).
- Vista de reportes estadísticos con exportación a Excel.
- Perfil del usuario autenticado y cambio de contraseña.
- Recuperación de contraseña sin correo electrónico (validación de correo institucional y cédula).
- Administración de usuarios: creación de cuentas DOCENTE/ADMIN y asignación de claves temporales (solo ADMIN).
- Diseño adaptable con Material UI.
- Menú y navegación según el rol del usuario.

## Tecnologías utilizadas

- React 19
- Vite 8
- React Router DOM
- Material UI (MUI) y Material Icons
- Recharts
- React Hook Form con Yup
- Axios
- JavaScript

## Requisitos previos

- Node.js 18 o superior.
- npm.
- El backend SGPA ejecutándose (ver `sgpa-backend/README.md`).
- Opcional: una variable de entorno `VITE_API_URL` con la dirección de la API. Si no se define, se utiliza `http://localhost:3000/api` por defecto.

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/carlosCardona75/SPGA.git
```

### 2. Ingresar a la carpeta del frontend

```bash
cd SPGA/sgpa-frontend
```

### 3. Instalar las dependencias

```bash
npm install
```

### 4. Configurar la URL de la API (opcional)

Solo es necesario si la API no está en `http://localhost:3000/api`. Crear el archivo `.env.local` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:3000/api
```

Si la API está en otro servidor, cambiar la dirección por la correspondiente.

## Ejecución

### Modo de desarrollo

```bash
npm run dev
```

La aplicación queda disponible en:

```text
http://localhost:5173
```

### Build de producción

```bash
npm run build
```

### Verificación de estilo

```bash
npm run lint
```

## Roles y menú

### Rol ADMIN

- Dashboard, Docentes, Materias, Grupos, Aulas, Períodos académicos, Asignaciones, Horarios, Reportes y Usuarios.
- Puede crear, editar y eliminar información administrativa.
- Puede exportar a Excel: horarios, docentes, asignaciones y reportes.

### Rol DOCENTE

- Dashboard, Mi horario, Aulas y Períodos académicos (solo lectura).
- Consulta el perfil propio y puede cambiar su contraseña.
- Puede descargar su propio horario en Excel desde Mi horario.

El menú se construye según el rol del usuario autenticado. Las rutas administrativas también están protegidas en el enrutador, de modo que un DOCENTE no puede navegar a un módulo que no le corresponde.

## Estructura del proyecto

```text
sgpa-frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── charts/
│   │   ├── common/
│   │   ├── dialogs/
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── navigation/
│   │   ├── tables/
│   │   └── ui/
│   ├── layouts/
│   │   └── MainLayout.jsx
│   ├── pages/
│   │   ├── Asignaciones/
│   │   ├── Aulas/
│   │   ├── Dashboard/
│   │   ├── Docentes/
│   │   ├── Grupos/
│   │   ├── Horarios/
│   │   ├── Login/
│   │   │   ├── Login.jsx
│   │   │   └── RecuperarClave.jsx
│   │   ├── Materias/
│   │   ├── Perfil/
│   │   ├── Periodos/
│   │   ├── Reportes/
│   │   └── Usuarios/
│   ├── routes/
│   │   ├── AppRouter.jsx
│   │   └── ProtectedRoute.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── asignacionService.js
│   │   ├── authService.js
│   │   ├── aulaService.js
│   │   ├── dashboardService.js
│   │   ├── docenteService.js
│   │   ├── grupoService.js
│   │   ├── horarioService.js
│   │   ├── materiaService.js
│   │   ├── perfilService.js
│   │   ├── periodoService.js
│   │   ├── reporteService.js
│   │   └── usuarioService.js
│   ├── theme/
│   ├── utils/
│   │   └── rol.js
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Reglas de negocio reflejadas en la interfaz

Las siguientes reglas se validan en el formulario antes de enviar la solicitud y también son exigidas por el backend.

### Máximo de horas semanales

- La carga horaria semanal de un docente no puede superar su máximo permitido (`max_horas`), que por defecto es 40 horas.
- Al programar un horario, la interfaz suma las horas ya programadas del docente en el período y, si el nuevo bloque supera el máximo, muestra una alerta y bloquea el registro.

### Cruce de horarios

- No se permite que un docente tenga dos horarios en el mismo período, día y rango de horas que se crucen.
- No se permite que un grupo tenga dos horarios en el mismo período, día y rango de horas que se crucen.
- No se permite que un aula quede ocupada por dos horarios en el mismo período, día y rango de horas.
- El formulario de horarios detecta estos cruces antes de enviar la solicitud.

### Duplicados

- No se permite asignar el mismo docente al mismo grupo en el mismo período académico.
- No se permite registrar dos horarios con la misma asignación, día y horas.
- Las duplicaciones se detectan en el formulario y también son rechazadas por el backend.

### Validaciones generales

- Los campos obligatorios se marcan antes de guardar.
- El estado de cada registro solo admite Activo (1) o Inactivo (0).
- Las horas deben usar el formato HH:MM y la hora de inicio debe ser menor que la final.
- Los días permitidos son LUNES, MARTES, MIÉRCOLES, JUEVES, VIERNES y SÁBADO.
- Los períodos requieren una fecha final posterior a la fecha de inicio.
- La contraseña nueva debe tener al menos 8 caracteres e incluir mayúscula, minúscula y número.

## Contraseñas temporales

Cuando un usuario tiene una contraseña temporal (asignada por el administrador), el sistema lo redirige automáticamente al perfil y le exige cambiarla antes de usar los demás módulos. La contraseña solo puede cambiar con la contraseña actual correcta.

## Módulo de usuarios (solo ADMIN)

El módulo **Usuarios** permite al administrador:

- Listar las cuentas de acceso (nombre, correo, rol, estado y si la contraseña temporal está pendiente de cambio).
- Crear una cuenta nueva para un docente sin cuenta: se selecciona el docente y el rol (DOCENTE o ADMIN). El nombre y el correo se toman automáticamente del docente, y el sistema genera una contraseña temporal con el formato `Sgpa7-XXXXXXXX` que se muestra una sola vez.
- Asignar una clave temporal a un usuario existente mediante el botón **"Asignar clave temporal"**: se genera una nueva contraseña temporal y el usuario deberá cambiarla al ingresar. Este botón también debe utilizarse cuando se reactiva una cuenta que estaba inactiva, porque la reactivación no muestra ninguna clave.

### Restricciones al crear cuentas

- Solo se aceptan correos institucionales que terminen en `@areandina.edu.co`. Los docentes con correos genéricos (por ejemplo `@sgpa.local`) no pueden recibir cuenta hasta que el administrador actualice su correo en el módulo Docentes.
- Un docente no puede tener más de una cuenta.
- No se crea una cuenta DOCENTE para un docente inactivo: primero debe reactivarse en el módulo Docentes.
- Un docente inactivo no puede iniciar sesión, aunque tenga cuenta.

La interfaz muestra avisos cuando el docente seleccionado no cumple alguna de estas condiciones.

## Recuperación de contraseña

La pantalla de inicio de sesión incluye el enlace **"¿Olvidaste tu contraseña?"**, que lleva a la página pública `/recuperar`. El flujo funciona completamente dentro del sistema, sin envío de correos electrónicos:

1. **Verificar identidad:** el usuario ingresa su correo institucional y su número de cédula. Ambos datos deben coincidir con la cuenta y con el docente asociado.
2. **Definir la nueva contraseña:** si los datos son correctos, el sistema genera un token interno válido por 30 minutos y habilita el segundo paso, donde se define una nueva contraseña con las mismas reglas de complejidad del sistema (mínimo 8 caracteres, mayúscula, minúscula y número).
3. **Iniciar sesión:** la contraseña queda actualizada y se puede ingresar de inmediato.

Por seguridad, los intentos de recuperación están limitados a 5 solicitudes cada 15 minutos. Si la cuenta está inactiva o la cédula no corresponde al correo indicado, no se revela esta información al usuario.

## Seguridad

- El token JWT se almacena en la sesión del navegador y se envía en cada solicitud mediante el interceptor de Axios.
- Las rutas protegidas redirigen al inicio de sesión cuando no existe una sesión válida.
- Las rutas administrativas verifican el rol antes de renderizar.

## Despliegue

Para publicar la aplicación:

1. Ejecutar `npm run build` para generar la carpeta `dist`.
2. Servir `dist` desde un servidor estático o un servicio de hosting.
3. Configurar `VITE_API_URL` con la dirección pública de la API.
4. Configurar en el backend el origen del frontend en `CORS_ORIGIN`.

## Pruebas

La documentación detallada de pruebas del sistema se encuentra en:

`sgpa-backend/docs/GUIA_PRUEBAS_Y_SUSTENTACION.md`
