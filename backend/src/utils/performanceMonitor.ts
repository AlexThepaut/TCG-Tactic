/**
 * Performance Monitor
 * Comprehensive performance monitoring for Task 1.3B requirements
 * Tracks <50ms validation and <100ms database operation requirements
 */

import { logger } from './logger';

/**
 * Performance metrics collection
 */
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  metadata?: any;
}

/**
 * Performance thresholds for different operations
 */
export const PERFORMANCE_THRESHOLDS = {
  VALIDATION: 50, // <50ms for placement validation
  DATABASE: 100,  // <100ms for database operations
  SOCKET: 100,    // <100ms for socket synchronization
  TOTAL_REQUEST: 200 // <200ms for total request processing
} as const;

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics
  private slowOperationCount = 0;
  private totalOperationCount = 0;

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Monitor database operation with <100ms threshold
   */
  async monitorDatabaseOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    metadata?: any
  ): Promise<T> {
    const startTime = performance.now();
    let success = false;
    let result: T;

    try {
      result = await operation();
      success = true;
      return result;
    } catch (error) {
      logger.error('Database operation failed', {
        operation: operationName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric(operationName, duration, success, metadata);

      // Alert if over threshold
      if (duration > PERFORMANCE_THRESHOLDS.DATABASE) {
        this.handleSlowOperation('database', operationName, duration, PERFORMANCE_THRESHOLDS.DATABASE);
      }

      this.totalOperationCount++;
    }
  }

  /**
   * Monitor validation operation with <50ms threshold
   */
  async monitorValidationOperation<T>(
    operation: () => Promise<T> | T,
    operationName: string,
    metadata?: any
  ): Promise<T> {
    const startTime = performance.now();
    let success = false;
    let result: T;

    try {
      result = await operation();
      success = true;
      return result;
    } catch (error) {
      logger.error('Validation operation failed', {
        operation: operationName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric(`validation_${operationName}`, duration, success, metadata);

      // Alert if over threshold
      if (duration > PERFORMANCE_THRESHOLDS.VALIDATION) {
        this.handleSlowOperation('validation', operationName, duration, PERFORMANCE_THRESHOLDS.VALIDATION);
      }

      this.totalOperationCount++;
    }
  }

  /**
   * Monitor Socket.io operation with <100ms threshold
   */
  async monitorSocketOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    metadata?: any
  ): Promise<T> {
    const startTime = performance.now();
    let success = false;
    let result: T;

    try {
      result = await operation();
      success = true;
      return result;
    } catch (error) {
      logger.error('Socket operation failed', {
        operation: operationName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric(`socket_${operationName}`, duration, success, metadata);

      // Alert if over threshold
      if (duration > PERFORMANCE_THRESHOLDS.SOCKET) {
        this.handleSlowOperation('socket', operationName, duration, PERFORMANCE_THRESHOLDS.SOCKET);
      }

      this.totalOperationCount++;
    }
  }

  /**
   * Monitor complete request processing with <200ms threshold
   */
  async monitorRequestOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    metadata?: any
  ): Promise<T> {
    const startTime = performance.now();
    let success = false;
    let result: T;

    try {
      result = await operation();
      success = true;
      return result;
    } catch (error) {
      logger.error('Request operation failed', {
        operation: operationName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric(`request_${operationName}`, duration, success, metadata);

      // Alert if over threshold
      if (duration > PERFORMANCE_THRESHOLDS.TOTAL_REQUEST) {
        this.handleSlowOperation('request', operationName, duration, PERFORMANCE_THRESHOLDS.TOTAL_REQUEST);
      }

      this.totalOperationCount++;
    }
  }

  /**
   * Time a synchronous operation
   */
  timeOperation<T>(
    operation: () => T,
    operationName: string,
    threshold?: number,
    metadata?: any
  ): T {
    const startTime = performance.now();
    let success = false;
    let result: T;

    try {
      result = operation();
      success = true;
      return result;
    } catch (error) {
      logger.error('Operation failed', {
        operation: operationName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric(operationName, duration, success, metadata);

      // Alert if over custom threshold
      if (threshold && duration > threshold) {
        this.handleSlowOperation('custom', operationName, duration, threshold);
      }

      this.totalOperationCount++;
    }
  }

  /**
   * Start a timer for manual timing
   */
  startTimer(operationName: string): () => void {
    const startTime = performance.now();

    return (success: boolean = true, metadata?: any) => {
      const duration = performance.now() - startTime;
      this.recordMetric(operationName, duration, success, metadata);
      this.totalOperationCount++;
    };
  }

  /**
   * Get performance statistics
   */
  getStatistics(): {
    totalOperations: number;
    slowOperations: number;
    slowOperationRate: number;
    averageDuration: number;
    operationsByType: Record<string, number>;
    recentSlowOperations: PerformanceMetrics[];
  } {
    const recentMetrics = this.metrics.slice(-100); // Last 100 operations
    const averageDuration = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      : 0;

    const operationsByType: Record<string, number> = {};
    for (const metric of recentMetrics) {
      const type = metric.operation?.split('_')[0] || 'unknown';
      operationsByType[type] = (operationsByType[type] || 0) + 1;
    }

    const recentSlowOperations = recentMetrics
      .filter(m => this.isSlowOperation(m))
      .slice(-10); // Last 10 slow operations

    return {
      totalOperations: this.totalOperationCount,
      slowOperations: this.slowOperationCount,
      slowOperationRate: this.totalOperationCount > 0 ? this.slowOperationCount / this.totalOperationCount : 0,
      averageDuration,
      operationsByType,
      recentSlowOperations
    };
  }

  /**
   * Get metrics for specific operation type
   */
  getMetricsForOperation(operationPrefix: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.operation.startsWith(operationPrefix));
  }

  /**
   * Clear metrics (for testing or memory management)
   */
  clearMetrics(): void {
    this.metrics = [];
    this.slowOperationCount = 0;
    this.totalOperationCount = 0;
    logger.info('Performance metrics cleared');
  }

  /**
   * Check if system is performing within thresholds
   */
  isPerformingWell(): boolean {
    const stats = this.getStatistics();
    return stats.slowOperationRate < 0.1; // Less than 10% slow operations
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getStatistics();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check slow operation rate
    if (stats.slowOperationRate > 0.2) {
      issues.push(`High slow operation rate: ${(stats.slowOperationRate * 100).toFixed(1)}%`);
      recommendations.push('Review database query optimization');
      recommendations.push('Check system resource usage');
    }

    // Check average duration
    if (stats.averageDuration > 50) {
      issues.push(`High average operation duration: ${stats.averageDuration.toFixed(2)}ms`);
      recommendations.push('Optimize critical operation paths');
    }

    // Check for patterns in recent slow operations
    const recentSlowOps = stats.recentSlowOperations;
    if (recentSlowOps.length > 5) {
      const operationTypes = recentSlowOps.map(op => op.operation?.split('_')[0] || 'unknown');
      const dominantType = this.getMostFrequent(operationTypes);
      issues.push(`Frequent slow operations in: ${dominantType}`);
      recommendations.push(`Focus optimization on ${dominantType} operations`);
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 2 || stats.slowOperationRate > 0.3) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    return { status, issues, recommendations };
  }

  /**
   * Record performance metric
   */
  private recordMetric(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: any
  ): void {
    const metric: PerformanceMetrics = {
      operation,
      duration,
      timestamp: new Date(),
      success,
      metadata
    };

    this.metrics.push(metric);

    // Keep only recent metrics to prevent memory issues
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log detailed performance info
    logger.debug('Performance metric recorded', {
      operation,
      duration: `${duration.toFixed(2)}ms`,
      success
    });
  }

  /**
   * Handle slow operation detection
   */
  private handleSlowOperation(
    category: string,
    operationName: string,
    duration: number,
    threshold: number
  ): void {
    this.slowOperationCount++;

    logger.warn('Slow operation detected', {
      category,
      operation: operationName,
      duration: `${duration.toFixed(2)}ms`,
      threshold: `${threshold}ms`,
      exceedance: `${(duration - threshold).toFixed(2)}ms`
    });

    // Could trigger alerts, metrics collection, etc.
    // For now, just log the warning
  }

  /**
   * Check if operation is considered slow
   */
  private isSlowOperation(metric: PerformanceMetrics): boolean {
    if (metric.operation.startsWith('validation')) {
      return metric.duration > PERFORMANCE_THRESHOLDS.VALIDATION;
    }
    if (metric.operation.startsWith('database') || metric.operation.includes('db')) {
      return metric.duration > PERFORMANCE_THRESHOLDS.DATABASE;
    }
    if (metric.operation.startsWith('socket')) {
      return metric.duration > PERFORMANCE_THRESHOLDS.SOCKET;
    }
    if (metric.operation.startsWith('request')) {
      return metric.duration > PERFORMANCE_THRESHOLDS.TOTAL_REQUEST;
    }
    return false;
  }

  /**
   * Get most frequent item in array
   */
  private getMostFrequent(arr: string[]): string {
    if (arr.length === 0) {
      return 'unknown';
    }

    const frequency: Record<string, number> = {};
    let maxCount = 0;
    let mostFrequent: string = arr[0]!;

    for (const item of arr) {
      frequency[item] = (frequency[item] || 0) + 1;
      if (frequency[item] > maxCount) {
        maxCount = frequency[item];
        mostFrequent = item;
      }
    }

    return mostFrequent;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Decorator for automatic performance monitoring
 */
export function MonitorPerformance(
  category: 'validation' | 'database' | 'socket' | 'request' = 'database'
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const operationName = `${target.constructor.name}.${propertyName}`;

      switch (category) {
        case 'validation':
          return performanceMonitor.monitorValidationOperation(
            () => method.apply(this, args),
            operationName
          );
        case 'database':
          return performanceMonitor.monitorDatabaseOperation(
            () => method.apply(this, args),
            operationName
          );
        case 'socket':
          return performanceMonitor.monitorSocketOperation(
            () => method.apply(this, args),
            operationName
          );
        case 'request':
          return performanceMonitor.monitorRequestOperation(
            () => method.apply(this, args),
            operationName
          );
        default:
          return method.apply(this, args);
      }
    };

    return descriptor;
  };
}