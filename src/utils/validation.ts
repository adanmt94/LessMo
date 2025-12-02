/**
 * Sistema centralizado de validación para formularios
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validar un valor contra un conjunto de reglas
 */
export function validate(value: any, rules: ValidationRule[]): ValidationResult {
  for (const rule of rules) {
    // Requerido
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return { isValid: false, error: rule.message };
    }

    // Si el valor está vacío y no es requerido, es válido
    if (!value && !rule.required) {
      continue;
    }

    // Longitud mínima (strings)
    if (rule.minLength !== undefined && typeof value === 'string' && value.length < rule.minLength) {
      return { isValid: false, error: rule.message };
    }

    // Longitud máxima (strings)
    if (rule.maxLength !== undefined && typeof value === 'string' && value.length > rule.maxLength) {
      return { isValid: false, error: rule.message };
    }

    // Valor mínimo (números)
    if (rule.min !== undefined) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue) || numValue < rule.min) {
        return { isValid: false, error: rule.message };
      }
    }

    // Valor máximo (números)
    if (rule.max !== undefined) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue) || numValue > rule.max) {
        return { isValid: false, error: rule.message };
      }
    }

    // Patrón regex
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return { isValid: false, error: rule.message };
    }

    // Validación personalizada
    if (rule.custom && !rule.custom(value)) {
      return { isValid: false, error: rule.message };
    }
  }

  return { isValid: true };
}

/**
 * Validaciones predefinidas comunes
 */
export const commonValidations = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email inválido',
  },
  
  password: {
    minLength: 6,
    message: 'La contraseña debe tener al menos 6 caracteres',
  },
  
  amount: {
    min: 0.01,
    max: 1000000,
    message: 'Monto inválido',
  },
  
  required: {
    required: true,
    message: 'Este campo es requerido',
  },
  
  name: {
    minLength: 2,
    maxLength: 50,
    message: 'El nombre debe tener entre 2 y 50 caracteres',
  },
  
  description: {
    maxLength: 500,
    message: 'La descripción no puede superar los 500 caracteres',
  },
};

/**
 * Validar un objeto completo con múltiples campos
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, ValidationRule[]>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const field in schema) {
    const result = validate(data[field], schema[field]);
    if (!result.isValid) {
      errors[field] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Sanitizar entrada de texto
 */
export function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Validar y parsear monto numérico
 */
export function parseAmount(value: string): number | null {
  const sanitized = value.trim().replace(/,/g, '.');
  const parsed = parseFloat(sanitized);
  
  if (isNaN(parsed) || parsed < 0) {
    return null;
  }
  
  return Math.round(parsed * 100) / 100; // Redondear a 2 decimales
}

/**
 * Validar código de invitación
 */
export function validateInviteCode(code: string): boolean {
  // Formato: 6 caracteres alfanuméricos en mayúsculas
  return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Validar URL de imagen
 */
export function validateImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
