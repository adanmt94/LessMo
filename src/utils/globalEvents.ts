/**
 * Global Event System - FUERZA actualizaciones en TODA la app
 * Usa EventEmitter para garantizar que los cambios se propaguen
 */

import EventEmitter from 'eventemitter3';

// Evento emitter global
export const globalEmitter = new EventEmitter();

// Eventos disponibles
export const GlobalEvents = {
  LANGUAGE_CHANGED: 'language_changed',
  CURRENCY_CHANGED: 'currency_changed',
  THEME_CHANGED: 'theme_changed',
  FORCE_UPDATE: 'force_update',
} as const;

// Función helper para emitir actualización global
export const emitGlobalUpdate = (event: keyof typeof GlobalEvents) => {
  
  globalEmitter.emit(GlobalEvents[event]);
  // También emitir un force_update general
  globalEmitter.emit(GlobalEvents.FORCE_UPDATE);
};

// Hook para forzar re-render cuando cambien cosas globales
import { useEffect, useReducer } from 'react';

export const useForceUpdate = () => {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  
  useEffect(() => {
    const handleUpdate = () => {
      
      forceUpdate();
    };
    
    // Escuchar TODOS los eventos de cambio
    globalEmitter.on(GlobalEvents.LANGUAGE_CHANGED, handleUpdate);
    globalEmitter.on(GlobalEvents.CURRENCY_CHANGED, handleUpdate);
    globalEmitter.on(GlobalEvents.THEME_CHANGED, handleUpdate);
    globalEmitter.on(GlobalEvents.FORCE_UPDATE, handleUpdate);
    
    return () => {
      globalEmitter.off(GlobalEvents.LANGUAGE_CHANGED, handleUpdate);
      globalEmitter.off(GlobalEvents.CURRENCY_CHANGED, handleUpdate);
      globalEmitter.off(GlobalEvents.THEME_CHANGED, handleUpdate);
      globalEmitter.off(GlobalEvents.FORCE_UPDATE, handleUpdate);
    };
  }, []);
  
  return forceUpdate;
};
