import React, { useState, useCallback, useMemo } from 'react';
import { PerformanceProfiler } from '../../utils/performance-monitoring';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';

interface DashboardProps {
  data: any[];
  onRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onRefresh }) => {
  const { trackInteraction } = usePerformanceMonitoring('Dashboard');
  const [filter, setFilter] = useState('');

  // Example of tracking user interaction
  const handleRefresh = useCallback(() => {
    const endTracking = trackInteraction('refresh');
    onRefresh();
    endTracking();
  }, [onRefresh, trackInteraction]);

  // Example of memoizing expensive computation
  const filteredData = useMemo(() => {
    const endTracking = trackInteraction('filterData');
    const result = data.filter(item => 
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
    endTracking();
    return result;
  }, [data, filter, trackInteraction]);

  // Example of preventing unnecessary re-renders
  const DataItem = React.memo(({ item }: { item: any }) => (
    <div className="dashboard-item">
      <h3>{item.name}</h3>
      <p>{item.description}</p>
    </div>
  ));

  return (
    <PerformanceProfiler id="Dashboard">
      <div className="dashboard">
        <div className="dashboard-header">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter items..."
          />
          <button onClick={handleRefresh}>Refresh</button>
        </div>

        <div className="dashboard-content">
          {filteredData.map(item => (
            <DataItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </PerformanceProfiler>
  );
};

// Prevent unnecessary re-renders of the entire component
export default React.memo(Dashboard); 