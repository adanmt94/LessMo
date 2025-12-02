/**
 * Hook para gestión de formularios con validación integrada
 */

import { useState, useCallback } from 'react';
import { validate, ValidationRule, validateForm } from '../utils/validation';
import { logger, LogCategory } from '../utils/logger';

interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: Record<keyof T, ValidationRule[]>;
  onSubmit: (values: T) => Promise<void> | void;
}

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
  });

  /**
   * Actualizar valor de un campo
   */
  const setValue = useCallback((field: keyof T, value: any) => {
    setFormState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [field]: value,
      },
    }));
  }, []);

  /**
   * Marcar campo como tocado
   */
  const setTouched = useCallback((field: keyof T, touched: boolean = true) => {
    setFormState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [field]: touched,
      },
    }));
  }, []);

  /**
   * Validar un campo específico
   */
  const validateField = useCallback((field: keyof T): boolean => {
    if (!validationSchema || !validationSchema[field]) {
      return true;
    }

    const result = validate(formState.values[field], validationSchema[field]);
    
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: result.error,
      },
    }));

    return result.isValid;
  }, [formState.values, validationSchema]);

  /**
   * Validar todos los campos
   */
  const validateAll = useCallback((): boolean => {
    if (!validationSchema) {
      return true;
    }

    const result = validateForm(formState.values, validationSchema);
    
    setFormState(prev => ({
      ...prev,
      errors: result.errors,
      isValid: result.isValid,
    }));

    logger.debug(LogCategory.VALIDATION, 'Validación del formulario', { 
      isValid: result.isValid, 
      errors: result.errors 
    });

    return result.isValid;
  }, [formState.values, validationSchema]);

  /**
   * Manejar cambio de campo
   */
  const handleChange = useCallback((field: keyof T) => {
    return (value: any) => {
      setValue(field, value);
      
      // Validar si el campo ya fue tocado
      if (formState.touched[field]) {
        setTimeout(() => validateField(field), 0);
      }
    };
  }, [formState.touched, setValue, validateField]);

  /**
   * Manejar blur de campo
   */
  const handleBlur = useCallback((field: keyof T) => {
    return () => {
      setTouched(field, true);
      validateField(field);
    };
  }, [setTouched, validateField]);

  /**
   * Enviar formulario
   */
  const handleSubmit = useCallback(async () => {
    logger.info(LogCategory.VALIDATION, 'Enviando formulario');
    
    // Marcar todos los campos como tocados
    const allTouched = Object.keys(formState.values).reduce((acc, key) => ({
      ...acc,
      [key]: true,
    }), {});

    setFormState(prev => ({
      ...prev,
      touched: allTouched,
    }));

    // Validar
    if (!validateAll()) {
      logger.warn(LogCategory.VALIDATION, 'Formulario inválido');
      return;
    }

    // Enviar
    setFormState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      await onSubmit(formState.values);
      logger.info(LogCategory.VALIDATION, 'Formulario enviado exitosamente');
    } catch (error) {
      logger.error(LogCategory.VALIDATION, 'Error al enviar formulario', error);
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formState.values, validateAll, onSubmit]);

  /**
   * Resetear formulario
   */
  const reset = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
    });
    logger.debug(LogCategory.VALIDATION, 'Formulario reseteado');
  }, [initialValues]);

  /**
   * Establecer valores del formulario
   */
  const setValues = useCallback((values: Partial<T>) => {
    setFormState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        ...values,
      },
    }));
  }, []);

  /**
   * Establecer errores manualmente
   */
  const setErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    setFormState(prev => ({
      ...prev,
      errors,
    }));
  }, []);

  /**
   * Obtener error de un campo
   */
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return formState.touched[field] ? formState.errors[field] : undefined;
  }, [formState.errors, formState.touched]);

  /**
   * Verificar si un campo tiene error
   */
  const hasError = useCallback((field: keyof T): boolean => {
    return !!getFieldError(field);
  }, [getFieldError]);

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
    setValue,
    setValues,
    setTouched,
    setErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateAll,
    reset,
    getFieldError,
    hasError,
  };
}
