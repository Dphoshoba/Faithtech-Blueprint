#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting Performance Audit...${NC}\n"

# Create performance reports directory
mkdir -p reports/performance

# 1. Lighthouse Audit
echo -e "${YELLOW}Running Lighthouse Audits...${NC}"

# List of key pages to audit
declare -a pages=(
  "http://localhost:3000"                  # Home
  "http://localhost:3000/login"            # Login
  "http://localhost:3000/dashboard"        # Dashboard
  "http://localhost:3000/assessments"      # Assessments
  "http://localhost:3000/profile"          # Profile
)

# Run Lighthouse for each page
for page in "${pages[@]}"; do
  pageName=$(echo $page | awk -F'/' '{print $NF}')
  if [ -z "$pageName" ]; then
    pageName="home"
  fi
  
  echo "Auditing $pageName..."
  lighthouse "$page" \
    --output json,html \
    --output-path "./reports/performance/lighthouse-$pageName" \
    --chrome-flags="--headless --disable-gpu --no-sandbox" \
    --preset=desktop \
    --quiet

  # Extract key metrics
  jq -r '.audits["first-contentful-paint"].numericValue,
         .audits["largest-contentful-paint"].numericValue,
         .audits["total-blocking-time"].numericValue,
         .audits["cumulative-layout-shift"].numericValue' \
    "./reports/performance/lighthouse-$pageName.report.json" > "./reports/performance/metrics-$pageName.txt"
done

# 2. Bundle Analysis
echo -e "\n${YELLOW}Analyzing Bundle Size...${NC}"

# Build with source maps
GENERATE_SOURCEMAP=true npm run build

# Run source-map-explorer
npx source-map-explorer 'build/static/js/*.js' \
  --gzip \
  --output reports/performance/bundle-analysis.html

# 3. React Performance Analysis
echo -e "\n${YELLOW}Setting up React Performance Monitoring...${NC}"

# Create React performance monitoring configuration
cat << EOF > src/utils/performance-monitoring.ts
import { Profiler, ProfilerOnRenderCallback, ProfilerProps } from 'react';

interface PerformanceMetric {
  componentName: string;
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100;

  onRenderCallback: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions
  ) => {
    this.metrics.push({
      componentName: id,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      interactions
    });

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow renders (over 16ms)
    if (actualDuration > 16) {
      console.warn(
        \`Slow render detected in \${id}: \${Math.round(actualDuration)}ms\`
      );
    }

    // Log significant re-renders
    if (actualDuration > baseDuration * 1.5) {
      console.warn(
        \`Significant re-render in \${id}: \${Math.round(
          actualDuration - baseDuration
        )}ms longer than base render\`
      );
    }
  };

  getMetrics() {
    return this.metrics;
  }

  getAverageRenderTime(componentName: string) {
    const componentMetrics = this.metrics.filter(
      m => m.componentName === componentName
    );
    if (!componentMetrics.length) return 0;

    const total = componentMetrics.reduce(
      (sum, metric) => sum + metric.actualDuration,
      0
    );
    return total / componentMetrics.length;
  }

  getSlowComponents(threshold = 16) {
    const componentStats = new Map<
      string,
      { count: number; totalDuration: number }
    >();

    this.metrics.forEach(metric => {
      if (metric.actualDuration > threshold) {
        const stats = componentStats.get(metric.componentName) || {
          count: 0,
          totalDuration: 0
        };
        stats.count++;
        stats.totalDuration += metric.actualDuration;
        componentStats.set(metric.componentName, stats);
      }
    });

    return Array.from(componentStats.entries())
      .map(([name, stats]) => ({
        name,
        averageDuration: stats.totalDuration / stats.count,
        renderCount: stats.count
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration);
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

export const PerformanceProfiler: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => (
  <Profiler id={id} onRender={performanceMonitor.onRenderCallback}>
    {children}
  </Profiler>
);
EOF

# Create performance monitoring hooks
cat << EOF > src/hooks/usePerformanceMonitoring.ts
import { useEffect, useCallback } from 'react';
import { performanceMonitor } from '../utils/performance-monitoring';

export const usePerformanceMonitoring = (componentName: string) => {
  useEffect(() => {
    // Track component mount
    const startTime = performance.now();
    
    return () => {
      // Track component unmount
      const duration = performance.now() - startTime;
      console.log(\`\${componentName} lifecycle duration: \${duration}ms\`);
    };
  }, [componentName]);

  const trackInteraction = useCallback((interactionName: string) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      console.log(
        \`\${componentName} - \${interactionName} duration: \${duration}ms\`
      );
    };
  }, [componentName]);

  return { trackInteraction };
};
EOF

# Create performance report generator
cat << EOF > scripts/generate-performance-report.js
const fs = require('fs');
const path = require('path');

// Read Lighthouse metrics
const reportsDir = path.join(__dirname, '../reports/performance');
const pages = ['home', 'login', 'dashboard', 'assessments', 'profile'];

const report = {
  timestamp: new Date().toISOString(),
  lighthouse: {},
  bundleSize: {},
  recommendations: []
};

// Process Lighthouse results
pages.forEach(page => {
  const metricsFile = path.join(reportsDir, \`metrics-\${page}.txt\`);
  if (fs.existsSync(metricsFile)) {
    const metrics = fs.readFileSync(metricsFile, 'utf8').split('\n');
    report.lighthouse[page] = {
      FCP: parseFloat(metrics[0]),
      LCP: parseFloat(metrics[1]),
      TBT: parseFloat(metrics[2]),
      CLS: parseFloat(metrics[3])
    };
  }
});

// Generate recommendations
Object.entries(report.lighthouse).forEach(([page, metrics]) => {
  if (metrics.LCP > 2500) {
    report.recommendations.push(
      \`Improve Largest Contentful Paint on \${page} page (current: \${Math.round(metrics.LCP)}ms)\`
    );
  }
  if (metrics.TBT > 300) {
    report.recommendations.push(
      \`Reduce Total Blocking Time on \${page} page (current: \${Math.round(metrics.TBT)}ms)\`
    );
  }
  if (metrics.CLS > 0.1) {
    report.recommendations.push(
      \`Fix layout shifts on \${page} page (current CLS: \${metrics.CLS})\`
    );
  }
});

// Save report
fs.writeFileSync(
  path.join(reportsDir, 'performance-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('Performance report generated:', path.join(reportsDir, 'performance-report.json'));
EOF

# Make scripts executable
chmod +x scripts/generate-performance-report.js

echo -e "\n${GREEN}Performance audit setup completed!${NC}"
echo -e "To monitor component performance, wrap components with <PerformanceProfiler> and use usePerformanceMonitoring hook"
echo -e "Check reports/performance directory for detailed analysis" 