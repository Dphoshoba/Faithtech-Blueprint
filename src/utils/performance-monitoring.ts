/**
 * Performance monitoring utilities for the FaithTech Blueprint client.
 *
 * Provides a lightweight, dependency-free way to measure component render
 * performance and user-interaction latency. Data is collected in-memory and
 * optionally reported to the console (dev) or a remote analytics endpoint.
 *
 * @module performance-monitoring
 */

import * as React from 'react';

export interface PerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  marks: PerformanceMark[];
  summary: {
    totalMarks: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
  };
}

type ReportSink = (report: PerformanceReport) => void;

class PerformanceMonitor {
  private marks: PerformanceMark[] = [];
  private maxMarks: number;
  private sinks: ReportSink[] = [];

  constructor(maxMarks = 100) {
    this.maxMarks = maxMarks;
  }

  /**
   * Start a named performance mark. Returns a function that, when called,
   * finalizes the mark and records the duration.
   */
  startMark(name: string, metadata?: Record<string, unknown>): () => PerformanceMark {
    const mark: PerformanceMark = {
      name,
      startTime: typeof performance !== 'undefined' ? performance.now() : Date.now(),
      metadata,
    };

    const end = (): PerformanceMark => {
      mark.endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      mark.duration = mark.endTime - mark.startTime;
      this.recordMark(mark);
      return mark;
    };

    return end;
  }

  /**
   * Synchronously measure a function's execution time.
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
    const end = this.startMark(name, metadata);
    try {
      return fn();
    } finally {
      end();
    }
  }

  /**
   * Asynchronously measure an async function's execution time.
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const end = this.startMark(name, metadata);
    try {
      return await fn();
    } finally {
      end();
    }
  }

  private recordMark(mark: PerformanceMark): void {
    this.marks.push(mark);
    if (this.marks.length > this.maxMarks) {
      this.marks.shift();
    }
  }

  /**
   * Get a report of all recorded marks.
   */
  getReport(): PerformanceReport {
    const durations = this.marks
      .map((m) => m.duration)
      .filter((d): d is number => d !== undefined);

    return {
      marks: [...this.marks],
      summary: {
        totalMarks: this.marks.length,
        avgDuration: durations.length
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0,
        maxDuration: durations.length ? Math.max(...durations) : 0,
        minDuration: durations.length ? Math.min(...durations) : 0,
      },
    };
  }

  /**
   * Clear all recorded marks.
   */
  clear(): void {
    this.marks = [];
  }

  /**
   * Register a sink that receives a full report whenever marks are flushed.
   */
  addReportSink(sink: ReportSink): void {
    this.sinks.push(sink);
  }

  /**
   * Flush current marks to all registered sinks and clear the buffer.
   */
  flush(): PerformanceReport {
    const report = this.getReport();
    for (const sink of this.sinks) {
      try {
        sink(report);
      } catch {
        // Sinks must never break the monitored code path.
      }
    }
    this.clear();
    return report;
  }
}

// Singleton instance for app-wide use.
const performanceMonitor = new PerformanceMonitor();

/**
 * React component wrapper that measures the render time of its children.
 *
 * Usage:
 *   <PerformanceProfiler id="MyComponent">
 *     <MyComponent />
 *   </PerformanceProfiler>
 */
export const PerformanceProfiler: React.FC<{ id: string; children: React.ReactNode }> = ({
  id,
  children,
}) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const end = performanceMonitor.startMark(`${id}:mount`);
    return () => end();
    // We intentionally only want to measure the initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
};

export default performanceMonitor;