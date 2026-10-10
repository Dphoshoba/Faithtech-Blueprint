/**
 * React hook for tracking component-level performance metrics.
 *
 * @module hooks/usePerformanceMonitoring
 *
 * @example
 * const { trackInteraction, markRender } = usePerformanceMonitoring('MyComponent');
 *
 * const handleClick = () => {
 *   const end = trackInteraction('submit');
 *   doWork();
 *   end();
 * };
 */

import { useEffect, useRef } from 'react';
import performanceMonitor, { PerformanceMark } from '../utils/performance-monitoring';

export interface UsePerformanceMonitoringResult {
  /**
   * Start tracking a named interaction. Returns a finalize function that,
   * when called, records the elapsed duration.
   */
  trackInteraction: (name: string, metadata?: Record<string, unknown>) => () => PerformanceMark;

  /**
   * Record a component render cycle.
   */
  markRender: (metadata?: Record<string, unknown>) => void;

  /**
   * Access the underlying monitor instance.
   */
  monitor: typeof performanceMonitor;
}

/**
 * @param componentName - Name of the component using the hook (used as a prefix).
 */
export function usePerformanceMonitoring(componentName: string): UsePerformanceMonitoringResult {
  const renderCount = useRef(0);

  const trackInteraction = (
    name: string,
    metadata?: Record<string, unknown>
  ): (() => PerformanceMark) => {
    const full_name = `${componentName}:${name}`;
    return performanceMonitor.startMark(full_name, metadata);
  };

  const markRender = (metadata?: Record<string, unknown>): void => {
    renderCount.current += 1;
    performanceMonitor.startMark(`${componentName}:render#${renderCount.current}`, metadata)();
  };

  // Measure the initial mount/render.
  useEffect(() => {
    markRender({ phase: 'mount' });
    // We intentionally only want to measure the initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    trackInteraction,
    markRender,
    monitor: performanceMonitor,
  };
}

export default usePerformanceMonitoring;