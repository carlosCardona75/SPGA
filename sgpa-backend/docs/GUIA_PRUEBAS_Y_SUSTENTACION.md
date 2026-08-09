# Guía de pruebas y sustentación del SGPA

## Propósito

Este documento registra las validaciones importantes del backend, la forma de demostrarlas y las precauciones necesarias cuando una prueba requiere modificar temporalmente información de la base de datos.

## Regla para pruebas que alteran datos

Antes de cambiar temporalmente un campo:

1. Consultar y anotar el valor original.
2. Usar únicamente registros de prueba claramente identificados.
3. Aplicar el cambio mínimo necesario.
4. Ejecutar una sola prueba y guardar la evidencia.
5. Restaurar inmediatamente el valor original, incluso si la prueba falla.
6. Ejecutar un `SELECT` final que demuestre la restauración.
7. Eliminar los registros temporales creados durante las pruebas.

No se deben modificar docentes, grupos, períodos, aulas u horarios académicos reales cuando exista una alternativa temporal.

## Evidencia de una prueba

Para cada caso conviene guardar:

- Nombre y objetivo de la prueba.
- Estado inicial de los datos.
- Método HTTP, URL y cuerpo JSON.
- Código HTTP y respuesta obtenida.
- Consulta de verificación posterior.
- Procedimiento de limpieza o restauración.

## Validaciones comprobadas

### CRUD básicos

- Consultas generales y por ID.
- Respuesta `404 Not Found` cuando el registro no existe.
- Campos obligatorios: `400 Bad Request`.
- Estado diferente de `0` o `1`: `400 Bad Request`.
- Relaciones inexistentes: `404 Not Found`.
- Registros duplicados: `409 Conflict`.
- Eliminación bloqueada por relaciones existentes: `409 Conflict`.

### Asignaciones

- Una asignación relaciona docente, grupo y período.
- Se impide repetir la misma combinación docente-grupo-período.
- No se puede eliminar una asignación que tenga detalles de horario.
- Los datos temporales creados para probar el CRUD deben eliminarse al finalizar.

### Horarios

- Días permitidos: `LUNES`, `MARTES`, `MIERCOLES`, `JUEVES`, `VIERNES` y `SABADO`.
- Las horas deben usar `HH:MM` o `HH:MM:SS`.
- La hora inicial debe ser menor que la final.
- La asignación debe existir y estar activa.
- El aula es opcional; `null` significa que está pendiente.
- Si se indica un aula, debe existir y estar activa.
- Se detectan cruces de docente, grupo y aula.
- Se impide superar `max_horas` del docente.

## Prueba controlada del máximo de horas

Esta prueba se realizó exclusivamente con el docente temporal:

```text
id_docente: 199
cedula: TEMP-CED-001
```

### 1. Consultar el estado inicial

```sql
SELECT
    d.id_docente,
    d.cedula,
    d.max_horas,
    COALESCE(
        SUM(
            TIME_TO_SEC(
                TIMEDIFF(dh.hora_fin, dh.hora_inicio)
            ) / 3600
        ),
        0
    ) AS total_horas
FROM docente d
LEFT JOIN asignacion a
    ON d.id_docente = a.id_docente
LEFT JOIN detalle_horario dh
    ON a.id_asignacion = dh.id_asignacion
    AND dh.estado = 1
WHERE d.id_docente = 199
GROUP BY
    d.id_docente,
    d.cedula,
    d.max_horas;
```

Valores observados:

```text
max_horas original: 40
total_horas: 4.75
```

### 2. Reducir temporalmente el límite

```sql
UPDATE docente
SET max_horas = 5
WHERE id_docente = 199;
```

### 3. Ejecutar la prueba

```http
POST /api/horarios
```

```json
{
  "id_asignacion": 1,
  "id_aula": null,
  "dia_semana": "SABADO",
  "hora_inicio": "22:00",
  "hora_fin": "23:00",
  "estado": 1
}
```

Resultado esperado y obtenido:

```text
409 Conflict
El docente superaría el máximo permitido de 5 horas
```

La operación fue rechazada porque `4.75 + 1 = 5.75`, valor superior al límite temporal de `5`.

### 4. Restaurar obligatoriamente el valor original

```sql
UPDATE docente
SET max_horas = 40
WHERE id_docente = 199;
```

### 5. Verificar la restauración

```sql
SELECT id_docente, cedula, max_horas
FROM docente
WHERE id_docente = 199;
```

Resultado final comprobado:

```text
199 | TEMP-CED-001 | 40
```

## Guion breve para explicar esta prueba

> Primero consulté y registré el valor original. Después utilicé un docente temporal y reduje su límite únicamente para forzar el escenario de error. El API calculó la carga acumulada, sumó la duración propuesta y respondió `409 Conflict` antes del `INSERT`. Finalmente restauré el valor original y lo confirmé mediante una consulta. De esta manera se prueba la regla sin dejar datos de producción alterados.

## Filtros de consulta de horarios

El endpoint `GET /api/horarios` admite filtros opcionales mediante parámetros de consulta. Los filtros pueden usarse individualmente o combinarse, y la consulta SQL se construye con parámetros preparados para conservar la seguridad de los datos.

Filtros implementados:

- `id_docente`: horarios de un docente.
- `id_grupo`: horarios de un grupo.
- `id_periodo`: horarios de un período académico.
- `id_aula`: horarios asignados a un aula concreta.
- `dia_semana`: horarios de un día válido.
- `estado`: horarios activos (`1`) o inactivos (`0`).
- `aula_pendiente`: horarios sin aula (`true`) o con aula (`false`).

### Casos comprobados en Postman

| Caso | Solicitud | Resultado comprobado |
|---|---|---|
| Consulta general | `GET /api/horarios` | `200 OK`, 213 registros |
| Horarios sin aula | `GET /api/horarios?aula_pendiente=true` | `200 OK`, 181 registros |
| Horarios con aula | `GET /api/horarios?aula_pendiente=false` | `200 OK`, 32 registros |
| Horarios del docente 199 | `GET /api/horarios?id_docente=199` | `200 OK`, 1 registro |
| Período 1 y martes | `GET /api/horarios?id_periodo=1&dia_semana=MARTES` | `200 OK`, 47 registros |
| Horarios activos | `GET /api/horarios?estado=1` | `200 OK`, 213 registros |
| Día no permitido | `GET /api/horarios?dia_semana=DOMINGO` | `400 Bad Request` |
| Valor booleano inválido | `GET /api/horarios?aula_pendiente=si` | `400 Bad Request` |
| Estado inválido | `GET /api/horarios?estado=2` | `400 Bad Request` |
| Filtros contradictorios | `GET /api/horarios?id_aula=1&aula_pendiente=true` | `400 Bad Request` |

La consistencia de los datos también fue comprobada con la siguiente suma:

```text
181 horarios sin aula + 32 horarios con aula = 213 horarios totales
```

### Guion breve para explicar los filtros

> La consulta general conserva su comportamiento original y devuelve los 213 horarios. Los parámetros son opcionales y cada uno agrega una condición a la consulta preparada. Cuando se combinan, el sistema exige que se cumplan todas las condiciones. Además, el controlador rechaza valores inválidos y filtros contradictorios antes de consultar la base de datos. Un ejemplo importante es aula_pendiente, que permite identificar 181 horarios todavía sin aula y distinguirlos de los 32 que ya cuentan con una asignación.

## Exportación de horarios a Excel

El endpoint `GET /api/horarios/exportar` genera un archivo `.xlsx` en memoria y lo envía como descarga. La hoja se denomina `Horarios` e incluye docente, materia, grupo, período, aula, día, horas y estado. Cuando el horario todavía no tiene aula, el reporte muestra `PENDIENTE`.

La exportación admite los filtros `id_docente`, `id_grupo` e `id_periodo`. Estos filtros usan parámetros preparados en la consulta SQL y pueden combinarse. Los identificadores deben ser números enteros positivos.

### Casos comprobados en Postman y Excel

| Caso | Solicitud | Resultado comprobado |
|---|---|---|
| Exportación general | `GET /api/horarios/exportar` | `200 OK`, archivo con 213 registros |
| Exportación por docente | `GET /api/horarios/exportar?id_docente=199` | `200 OK`, archivo con 1 registro |
| Exportación por grupo | `GET /api/horarios/exportar?id_grupo=116` | `200 OK`, archivo con 16 registros del grupo 801 |
| Exportación por período | `GET /api/horarios/exportar?id_periodo=1` | `200 OK`, archivo con 213 registros del período 202660 |
| Período sin horarios | `GET /api/horarios/exportar?id_periodo=999999` | `404 Not Found`, no genera un archivo vacío |
| Identificador inválido | `GET /api/horarios/exportar?id_docente=abc` | `400 Bad Request` |

Nombres de archivo comprobados:

```text
Sin filtros       -> horarios_sgpa.xlsx
id_docente=199    -> horario_docente_199.xlsx
id_grupo=116      -> horario_grupo_116.xlsx
id_periodo=1      -> horarios_periodo_1.xlsx
```

### Guion breve para explicar la exportación

> El backend consulta los horarios usando filtros opcionales y parámetros preparados. Después convierte los registros a una hoja de Excel, ajusta el ancho de sus columnas y genera el archivo en memoria, sin dejar archivos temporales en el servidor. El nombre de la descarga identifica el filtro utilizado. Si la consulta no tiene resultados, responde 404 en lugar de generar una hoja vacía; y si un identificador tiene un formato inválido, responde 400 antes de consultar MySQL.

## Importación de un plan de estudios (plantilla Excel)

El cliente envió el nuevo plan de estudios de Fisioterapia (`nuevo ecap.pdf`, formato EAC-AP-I01-F01, proceso de ampliación de cupos). Para no cargar las materias una por una, el backend incluye una plantilla Excel reutilizable y un script de importación.

### Flujo

1. `node scripts/generarPlantillaPlanEstudios.js` genera `plantillas/PLANTILLA_PLAN_ESTUDIOS.xlsx`.
2. En la hoja `CONFIG` se indican `PROGRAMA`, `PERIODO` (p. ej. `202670`), `FECHA INICIO` y `FECHA FINAL`.
3. En la hoja `PENSUM ACADÉMICO` se pega el pensum. El campo `COD MATERIA` es opcional: si se deja vacío, el script lo genera (`FIS001`, ...).
4. `node scripts/importarPlanEstudios.js` crea el período (si no existe), las materias y un grupo inicial por materia (código `semestre + 01`, p. ej. `101`), todo en una sola transacción.

### Resultado comprobado con el nuevo plan de Fisioterapia

| Concepto | Resultado |
|---|---|
| Asignaturas leídas desde el PDF/plantilla | 65 |
| Período creado | `202670` (15/01/2027 – 30/06/2027) |
| Materias nuevas creadas | 54 (códigos `FIS001` a `FIS065`) |
| Materias omitidas por nombre ya existente | 11 (reutilizadas del plan anterior) |
| Grupos iniciales creados | 54 (códigos `101` a `801`, uno por semestre) |
| Transacción | Confirmada (rollback automático ante cualquier error) |

Las 11 materias omitidas son las que ya estaban registradas en el plan anterior y se reutilizan sin duplicar: FISIOLOGÍA DEL EJERCICIO, PRÁCTICA FISIOTERAPÉUTICA II y III, BIOESTADÍSTICA, BIOFÍSICA, EPIDEMIOLOGÍA, INVESTIGACIÓN I y II, BIOÉTICA, ELECTIVA I y II.

### Listado de materias del plan 2026 (con origen)

Para mostrar las 65 materias del nuevo plan diferenciando las nuevas de las reutilizadas se genera un Excel con `node scripts/generarListadoPlan2026.js`:

`plantillas/PLAN_FISIOTERAPIA_2026_LISTADO_MATERIAS.xlsx`

Las columnas incluyen área de formación, período académico, semestre, código, nombre, tipología, créditos, origen y código existente. El script consulta la base de datos y marca cada fila como `NUEVA (plan 2026)` o `REUTILIZADA (plan 202660)`, indicando en esta última el código del plan anterior. Resultado comprobado: 54 nuevas y 11 reutilizadas.

### Guion breve para explicar la importación

> El cliente entregó el nuevo plan de estudios en PDF. Como el pensum está estructurado por área de formación, período académico, tipología, créditos y horas, lo convertimos en una plantilla Excel reutilizable con una hoja de configuración y una hoja de pensum. El script lee la plantilla, crea el período académico si no existe, inserta las materias nuevas y genera un grupo inicial por semestre. Si una materia ya existe por código o por nombre, la omite y lo reporta para evitar duplicados. Todo se ejecuta dentro de una transacción: si algo falla, no se confirma ningún cambio.

## Autenticación y prueba de escritorio (ingreso al sistema)

### Administradores

Los administradores ingresan con su correo institucional y la contraseña que definieron. El sistema no permite volver a registrar el administrador inicial cuando ya existe un usuario.

```text
POST /api/auth/login
{ "correo": "alasso3@areandina.edu.co", "password": "..." }
```

Respuesta: `200 OK` con el token JWT y el perfil del usuario (`rol: ADMIN`).

### Docentes y contraseñas temporales

Los docentes **no eligen su contraseña**: el administrador crea la cuenta en el módulo **Usuarios** y el sistema genera automáticamente una contraseña temporal con el formato `Sgpa7-XXXXXXXX` (16 caracteres con mayúscula, minúscula y número). Esta contraseña se muestra **una sola vez** en pantalla y el administrador debe entregarla al docente.

Al ingresar con una contraseña temporal, el sistema:

1. Autentica al docente (`200 OK`, `rol: DOCENTE`, `debe_cambiar_password: 1`).
2. Redirige al perfil y exige el cambio de contraseña.
3. Mientras `debe_cambiar_password = 1`, **todos** los demás endpoints responden `403` con el mensaje "Debe cambiar la contraseña temporal antes de continuar".
4. Después del cambio (`PATCH /api/auth/cambiar-password`) el docente ya puede usar su horario y consultar sus módulos de lectura.

Si el docente olvida la contraseña, el administrador usa `PATCH /api/usuarios/:id/restablecer-password`; el sistema genera una nueva contraseña temporal y vuelve a exigir el cambio.

### Restricciones para crear cuentas (módulo Usuarios)

- Solo se aceptan correos institucionales que terminen en `@areandina.edu.co`. Un docente con correo genérico (por ejemplo `andres.bayer@sgpa.local`) **no puede recibir cuenta** hasta que el administrador actualice su correo real en el módulo Docentes.
- Un docente no puede tener dos cuentas.
- No se crea una cuenta DOCENTE para un docente inactivo (`estado = 0`): la creación responde `409`.
- Un docente inactivo no puede iniciar sesión, aunque ya tenga cuenta: `403 "El usuario se encuentra inactivo"`.

### Ejemplos de prueba de escritorio

| Caso | Resultado esperado |
|---|---|
| Ingreso con credenciales de un ADMIN | `200 OK`, menú completo |
| Ingreso de un docente con contraseña temporal | `200 OK` y redirección al perfil; todo bloqueado hasta cambiarla |
| Ingreso de un docente inactivo | `403 "El usuario se encuentra inactivo"` |
| Crear cuenta para docente con correo `@sgpa.local` | `400 "El docente no tiene un correo institucional autorizado"` |
| Crear cuenta DOCENTE para docente inactivo | `409` (debe reactivarse primero en Docentes) |

## Pruebas funcionales ejecutadas (frontend + backend)

Resultados obtenidos el día del cierre del frontend:

| Prueba | Resultado |
|---|---|
| Login ADMIN `alasso3` y `lobando13` | `200 OK` |
| Lectura de aulas, períodos, asignaciones, horarios, docentes, grupos y materias | `200 OK` |
| Aula con código duplicado | `409` |
| Período con `fecha_final` anterior a `fecha_inicio` | `400` |
| Período con nombre duplicado | `409` |
| Asignación duplicada (docente+grupo+período) | `409` |
| Horario duplicado o cruzado | `409` |
| Horario que supera `max_horas` (35 h + 6 h = 41 h > 40 h) | `409 "El docente superaría el máximo permitido de 40 horas"` |
| Filtro `estado` inválido | `400` |
| Cambio de contraseña con contraseña actual incorrecta | `401` |
| Exportación a Excel | `200 OK`, archivo de 19 940 bytes |
| Flujo DOCENTE: login temporal → cambio de contraseña → `mi-horario` y `mi-perfil` | Correcto |
| DOCENTE intenta crear aula o exportar horarios | `403` |
| Crear cuenta y restablecer contraseña (módulo Usuarios) | `201` y `200`, contraseña temporal generada |

Los registros temporales creados durante estas pruebas (aula, horario, docente y usuario de prueba) fueron eliminados y se verificó que la base quedó con los datos originales.

## Lista de control al finalizar una sesión

- [ ] Todos los valores temporales fueron restaurados.
- [ ] Los registros de prueba fueron eliminados.
- [ ] Las respuestas esperadas coinciden con los códigos HTTP.
- [ ] La base conserva sus registros académicos originales.
- [ ] El servidor inicia sin errores.
- [ ] `git diff --check` no reporta problemas de formato.
- [ ] `git status` contiene únicamente archivos relacionados con el módulo trabajado.
