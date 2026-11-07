import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Evita valores compuestos solo por espacios
export function sinSoloEspacios(c: AbstractControl): ValidationErrors | null {
  const v = c.value;
  return typeof v === 'string' && v.length > 0 && v.trim().length === 0
    ? { custom: 'No puede contener solo espacios' }
    : null;
}

// Valida un patrón y muestra el mensaje que le pasemos
export function patronConMensaje(regex: RegExp, mensaje: string): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const v = c.value;
    if (!v) return null;
    return regex.test(v) ? null : { custom: mensaje };
  };
}

// Fecha de nacimiento: válida, no futura, edad entre 15 y 100
export function fechaNacimientoValida(c: AbstractControl): ValidationErrors | null {
  const v = c.value as string;
  if (!v) return null;

  const f = new Date(v + 'T00:00:00');
  if (isNaN(f.getTime())) return { custom: 'Fecha no válida' };

  const hoy = new Date();
  if (f > hoy) return { custom: 'La fecha no puede ser futura' };

  let edad = hoy.getFullYear() - f.getFullYear();
  const cumple = new Date(hoy.getFullYear(), f.getMonth(), f.getDate());
  if (hoy < cumple) edad--;

  if (edad < 15) return { custom: 'El estudiante debe tener al menos 15 años' };
  if (edad > 100) return { custom: 'Fecha no válida' };
  return null;
}