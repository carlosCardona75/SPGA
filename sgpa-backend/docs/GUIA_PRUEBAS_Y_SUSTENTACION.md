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

## Lista de control al finalizar una sesión

- [ ] Todos los valores temporales fueron restaurados.
- [ ] Los registros de prueba fueron eliminados.
- [ ] Las respuestas esperadas coinciden con los códigos HTTP.
- [ ] La base conserva sus registros académicos originales.
- [ ] El servidor inicia sin errores.
- [ ] `git diff --check` no reporta problemas de formato.
- [ ] `git status` contiene únicamente archivos relacionados con el módulo trabajado.
