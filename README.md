# UMES: Sistema de gestión de inscripciones universitarias

Proyecto final del curso **Programación WEB** · Facultad de Ingeniería · Universidad Mesoamericana.

**Integrantes:** Yoselin Asencio · Nefi Vivar

Aplicación web para registrar estudiantes y gestionar sus inscripciones a cursos por período
académico. No utiliza backend ni base de datos remota: los catálogos se leen de archivos JSON y
los registros se conservan en el `localStorage` del navegador, con opción de exportar e importar
respaldos en formato JSON.

## Tecnologías

- Angular 20 (componentes standalone, signals y control flow `@if` / `@for`)
- Angular Material (tablas, formularios, diálogos, tarjetas, barra de navegación)
- Reactive Forms (`FormBuilder`, `FormArray` y validadores personalizados)
- TypeScript y RxJS
- `localStorage`, accedido únicamente desde servicios

## Requisitos

- Node.js `^20.19.0`, `^22.12.0` o `>=24`
- npm (incluido con Node.js)

## Instalación y ejecución

```bash
git clone https://github.com/asencio12/angular_proyecto_final_yoselin_nefi
cd angular_proyecto_final_yoselin_nefi
npm install
npm start
```

Abrir `http://localhost:4200/` en el navegador. La aplicación se recarga sola al guardar cambios.

Para generar la versión de producción:

```bash
npm run build
```

## Funcionalidades

### Estudiantes
- Listado en tabla con filtros de búsqueda: texto (carnet, nombre o correo), carrera y semestre.
- Registrar y editar estudiantes con Reactive Forms.
- Consultar los datos completos de un estudiante en un diálogo.
- Eliminar con diálogo de confirmación.
- Datos personales (carnet, nombres, apellidos, fecha de nacimiento, género, correo), residencia
  (departamento y dirección) y datos académicos (carrera y semestre).
- Contactos almacenados como **arreglo de objetos** `{ numero, tipo, activo }`: se pueden agregar,
  quitar y marcar individualmente como activos o inactivos.
- El carnet es único: no se permiten registros duplicados.

### Inscripciones
- Registrar y editar una inscripción: estudiante, período, jornada, modalidad, estado y cursos.
- Los cursos disponibles dependen de la carrera del estudiante seleccionado, y se muestra el
  total de créditos.
- Listado con filtros por estudiante, período y estado.
- Consultar (diálogo con datos del estudiante, cursos y créditos), editar y cancelar con confirmación.

### Respaldo de datos
- Exportar todos los estudiantes e inscripciones a un único archivo JSON.
- Importar un respaldo con validación completa y confirmación antes de reemplazar los datos.

### Interfaz
- Barra de navegación con acceso a Estudiantes, Inscripciones y Respaldo.
- Diseño adaptable a computadora, tableta y teléfono.
- Validación en tiempo real: los mensajes de error aparecen junto a cada campo, los campos
  obligatorios se marcan con asterisco rojo y el botón "Guardar" permanece deshabilitado mientras
  el formulario sea inválido.

## Catálogos

Los catálogos se leen desde `public/data/` y no se modifican desde el navegador.

| Catálogo | Archivo | Valores | Uso |
|---|---|---|---|
| Género | `catalogo.json` | Masculino, Femenino, Otro, Prefiero no indicar | Botones de radio (estudiante) |
| Jornada | `catalogo.json` | Matutina, Vespertina, Nocturna, Fin de semana | Lista desplegable (inscripción) |
| Modalidad | `catalogo.json` | Presencial, Virtual, Híbrida | Botones de radio (inscripción) |
| Estado | `catalogo.json` | Borrador, Registrada, En revisión, Aprobada, Rechazada, Cancelada | Lista desplegable y filtro (inscripción) |
| Período | `catalogo.json` | 2026-1, 2026-2 | Lista desplegable y filtro (inscripción) |
| Carrera | `catalogo.json` | Ingeniería en Sistemas, Ingeniería Industrial, Administración de Empresas | Lista desplegable (estudiante) y filtro de cursos |
| Departamento | `catalogo.json` | Departamentos de Guatemala | Lista desplegable (estudiante) |
| Cursos | `cursos.json` | id, código, nombre, créditos y `carreraId` | Casillas de verificación (inscripción) |

Los cursos se relacionan con las carreras mediante `carreraId`: al elegir un estudiante, solo se
ofrecen los cursos de su carrera.

## Estructura del proyecto

```
public/data/
  catalogo.json            Catálogos generales (género, jornada, modalidad, estado, período, carrera, departamento)
  cursos.json              Catálogo de cursos

src/app/
  models/                  Interfaces TypeScript: Student, Course, Enrollment, Catalogo, BackupFile
  services/
    storage.service.ts         Único punto de acceso a localStorage
    catalog.service.ts         Lectura de los catálogos JSON (HttpClient)
    student.service.ts         Operaciones sobre estudiantes y control de carnet duplicado
    enrollment.service.ts      Operaciones sobre inscripciones y reglas de negocio
    backup.service.ts          Exportar, validar e importar respaldos
  validators/              Validadores reutilizables de formularios
  shared/
    confirm-dialog/        Diálogo de confirmación reutilizable
  pages/
    students/              student-list, student-form, student-detail-dialog
    enrollments/           enrollment-list, enrollment-form, enrollment-detail-dialog
    backup/                Página de exportar e importar
  app.routes.ts            Rutas (carga diferida de cada página)
```

**Organización por capas:** los componentes (`pages`) solo se ocupan de la presentación y de los
formularios; toda la lógica de acceso a datos está en los servicios, y ningún componente accede
directamente a `localStorage`.

## Modelo de datos

Se guardan dos colecciones en `localStorage`:

| Clave | Contenido |
|---|---|
| `umes_students` | Lista de estudiantes |
| `umes_enrollments` | Lista de inscripciones |

**Estudiante**

```json
{
  "carnet": "EST-001",
  "nombres": "María",
  "apellidos": "López",
  "fechaNacimiento": "2002-05-10",
  "genero": { "id": 2, "value": "Femenino" },
  "email": "maria@correo.com",
  "direccion": "6a avenida 3-45, zona 1",
  "departamento": { "id": 1, "value": "Guatemala" },
  "carrera": { "id": 1, "value": "Ingeniería en Sistemas" },
  "semestre": 5,
  "contactos": [
    { "numero": "5555 1234", "tipo": "movil", "activo": true },
    { "numero": "2222 3344", "tipo": "casa", "activo": false }
  ]
}
```

**Inscripción**

```json
{
  "id": "INS-001",
  "estudianteId": "EST-001",
  "periodoId": "2026-2",
  "cursoIds": ["WEB101", "BD101"],
  "estado": "Registrada",
  "jornada": "Matutina",
  "modalidad": "Presencial",
  "fechaCreacion": "2026-11-06T10:00:00.000Z"
}
```

**Relaciones.** Un estudiante puede tener varias inscripciones; cada inscripción pertenece a un
solo estudiante y a un período, e incluye uno o varios cursos. La inscripción **no duplica** los
datos del estudiante ni de los cursos: guarda solo identificadores (`estudianteId` es el carnet y
`cursoIds` son los ids del catálogo de cursos), y la información completa se consulta en sus
respectivos registros o catálogos.

## Reglas de negocio

### Estudiantes
- El carnet es único (sin distinguir mayúsculas) y tiene de 4 a 15 caracteres: letras, números y guiones.
- Nombres y apellidos: solo letras y espacios, de 2 a 50 caracteres; no se aceptan valores formados únicamente por espacios.
- El correo debe tener un formato válido (máximo 100 caracteres).
- La fecha de nacimiento debe ser válida y no futura, con edad entre 15 y 100 años.
- La dirección tiene de 5 a 150 caracteres.
- Debe haber al menos un contacto; cada número tiene de 8 a 15 dígitos (puede incluir `+`, espacios o guiones).
- Género, departamento y carrera se eligen de los catálogos, y el semestre es un número del 1 al 10.
- No se puede eliminar un estudiante que tenga inscripciones.

### Inscripciones
1. Debe incluir al menos un curso, sin repetidos.
2. Los cursos deben pertenecer a la carrera del estudiante.
3. Un estudiante no puede tener dos inscripciones activas en el mismo período (las canceladas no cuentan).
4. El estudiante, el período, el estado, la jornada, la modalidad y los cursos deben existir en los registros o catálogos.
5. Una inscripción cancelada no se puede modificar. Cancelar cambia el estado a `Cancelada` y conserva el registro.

Al guardar o importar una inscripción se comprueba que `estudianteId` exista y que todos los
códigos de curso correspondan a cursos válidos; no se aceptan referencias inexistentes.

## Importación y exportación

### Exportar

En **Respaldo → Exportar datos** se descarga el archivo `uniregistro_respaldo.json`, que incluye
la versión del formato y las colecciones de estudiantes e inscripciones. Los catálogos de
`public/data` no se exportan.

```json
{
  "version": "1.0",
  "exportadoEn": "2026-11-08T10:30:00.000Z",
  "estudiantes": [ ],
  "inscripciones": [ ]
}
```

### Importar

En **Respaldo → Importar datos** se selecciona un archivo `.json` exportado previamente.

1. **Validación completa**, sin modificar ningún dato, en este orden:
   - extensión `.json`, tamaño máximo de 5 MB y sintaxis JSON válida;
   - estructura: campo `version` igual a `1.0` y colecciones `estudiantes` e `inscripciones`;
   - cada estudiante: campos obligatorios, tipos, formatos, valores existentes en los catálogos,
     contactos válidos y carnets no repetidos;
   - cada inscripción: campos y tipos, referencia a un estudiante **del mismo archivo**, cursos
     válidos de la carrera del estudiante, valores de catálogo, códigos no repetidos y la regla de
     una inscripción activa por período.
2. Si hay errores, se muestran en pantalla y **los datos actuales permanecen intactos**.
3. Si todo es válido, se muestra una **advertencia con confirmación** que indica cuántos registros
   se eliminarán y cuántos se cargarán.
4. Al confirmar, los datos actuales se **reemplazan** por los del archivo. Si el guardado fallara a
   mitad del proceso, se restauran los datos anteriores.

Después de una importación correcta se muestra un mensaje de éxito y los listados presentan los
datos nuevos.

## Pruebas de importación y exportación

1. **Exportación.** Con estudiantes e inscripciones registrados, ir a Respaldo y pulsar
   "Exportar datos". Se descarga `uniregistro_respaldo.json`.
2. **Importación correcta.** Cancelar una inscripción o modificar un estudiante, importar el archivo
   exportado y confirmar el reemplazo. Los datos vuelven al estado del respaldo.
3. **Importación inválida (referencia inexistente).** Importar un archivo `invalido.json` con este
   contenido, cuya inscripción apunta a un estudiante que no existe:
   ```json
   {"version":"1.0","estudiantes":[],"inscripciones":[{"id":"INS-001","estudianteId":"EST-999","periodoId":"2026-2","cursoIds":["WEB101"],"estado":"Registrada","jornada":"Matutina","modalidad":"Presencial","fechaCreacion":"2026-11-06T10:00:00.000Z"}]}
   ```
   La aplicación muestra el error y los datos existentes no cambian.
4. **Archivo dañado.** Importar un `.json` que contenga solo el texto `{ hola`: se informa que el
   archivo está dañado.
5. **Cancelar la confirmación.** Importar un archivo válido y pulsar "Cancelar": no se modifica nada.
6. **Persistencia.** Recargar la página (F5): los datos siguen disponibles.

## Validaciones de formularios

Los formularios usan Reactive Forms y validan mientras la persona escribe, no solo al guardar:
campos obligatorios, longitudes mínimas y máximas, formato de correo, fechas válidas, formato de
números de contacto, prevención de valores compuestos solo por espacios y detección de carnet
duplicado. Cada error se muestra junto al campo correspondiente, y el botón "Guardar" permanece
deshabilitado mientras haya errores. Los datos de los archivos importados se validan con las
mismas reglas.

## Limitaciones conocidas

- `localStorage` guarda los datos solo en el navegador actual; para trasladarlos a otro equipo se
  usa el respaldo en JSON.
- La importación solo reemplaza los datos; no existe una importación que combine registros y
  detecte duplicados.
- Si se cambia la carrera de un estudiante que ya tiene inscripciones, esas inscripciones conservan
  los cursos de la carrera anterior.
- Las reglas de validación del estudiante están definidas tanto en el formulario como en el
  validador de importación (`backup.service.ts`); al modificar una regla debe actualizarse en ambos.
- Los archivos de `public/data` son de solo lectura: no se modifican desde el navegador.
