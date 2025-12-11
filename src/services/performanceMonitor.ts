/**
 * Performance Monitoring Service
 * Herramientas para medir y optimizar el rendimiento de la app
 */

import { InteractionManager, Platform } from 'react-native';
import { logger } from './loggerService';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = __DEV__; // Solo en desarrollo por defecto

  /**
   * Iniciar medición de performance
   */
  startMeasure(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    this.metrics.set(name, {
      name,
      startTime: Date.now(),
      metadata,
    });
  }

  /**
   * Finalizar medición y reportar
   */
  endMeasure(name: string): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn(`⚠️ Metric "${name}" not started`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log si es muy lento (> 1 segundo)
    if (duration > 1000) {
      logger.warn(`⚠️ Slow operation: ${name} took ${duration}ms`, metric.metadata);
    } else {
      logger.info(`⏱️ ${name}: ${duration}ms`, metric.metadata);
    }

    this.metrics.delete(name);
    return duration;
  }

  /**
   * Medir tiempo de una función async
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startMeasure(name, metadata);
    try {
      const result = await fn();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Medir tiempo de una función sync
   */
  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.startMeasure(name, metadata);
    try {
      const result = fn();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Medir tiempo hasta que las interacciones terminen
   */
  measureInteraction(name: string): void {
    if (!this.enabled) return;

    const startTime = Date.now();
    InteractionManager.runAfterInteractions(() => {
      const duration = Date.now() - startTime;
      logger.info(`🎯 Interaction complete: ${name} took ${duration}ms`);
    });
  }

  /**
   * Obtener todas las métricas actuales
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Limpiar todas las métricas
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Habilitar/deshabilitar monitoreo
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Reportar estadísticas de memoria (solo desarrollo)
   */
  logMemoryUsage(): void {
    if (!this.enabled) return;

    if (Platform.OS === 'web' && (global as any).performance?.memory) {
      const memory = (global as any).performance.memory;
      logger.info('💾 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      });
    }
  }
}

// Exportar instancia singleton
export const performanceMonitor = new PerformanceMonitor();

// Hook para medir renders
export const useRenderPerformance = (componentName: string) => {
  if (__DEV__) {
    const renderCount = React.useRef(0);
    renderCount.current += 1;

    React.useEffect(() => {
      if (renderCount.current > 10) {
        logger.warn(
          `⚠️ Component "${componentName}" rendered ${renderCount.current} times`
        );
      }
    });

    return renderCount.current;
  }
  return 0;
};

// Decorator para medir funciones
export function measurePerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measureAsync(
        methodName,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

export default performanceMonitor;
