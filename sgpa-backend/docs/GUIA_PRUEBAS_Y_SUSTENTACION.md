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

## Lista de control al finalizar una sesión

- [ ] Todos los valores temporales fueron restaurados.
- [ ] Los registros de prueba fueron eliminados.
- [ ] Las respuestas esperadas coinciden con los códigos HTTP.
- [ ] La base conserva sus registros académicos originales.
- [ ] El servidor inicia sin errores.
- [ ] `git diff --check` no reporta problemas de formato.
- [ ] `git status` contiene únicamente archivos relacionados con el módulo trabajado.
