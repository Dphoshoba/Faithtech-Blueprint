import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNavbar from '../../components/admin/AdminNavbar';
import withAdminAuth from '../../components/admin/withAdminAuth';

interface AnalyticsData {
  totalLeads: number;
  leadsByStatus: {
    new: number;
    contacted: number;
    qualified: number;
    disqualified: number;
  };
  leadsByMonth: {
    month: string;
    count: number;
  }[];
  conversionRate: number;
  averageResponseTime: number;
  topReferrers: {
    source: string;
    count: number;
  }[];
  churchSizeDistribution: {
    size: string;
    count: number;
  }[];
}

function AnalyticsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('30days');

  // Fetch analytics data when component mounts or date range changes
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // In a real application, this would fetch from an API
      // For demo purposes, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data
      const mockData: AnalyticsData = {
        totalLeads: 127,
        leadsByStatus: {
          new: 45,
          contacted: 38,
          qualified: 29,
          disqualified: 15
        },
        leadsByMonth: [
          { month: 'Jan', count: 12 },
          { month: 'Feb', count: 18 },
          { month: 'Mar', count: 22 },
          { month: 'Apr', count: 15 },
          { month: 'May', count: 24 },
          { month: 'Jun', count: 36 }
        ],
        conversionRate: 22.8,
        averageResponseTime: 4.2,
        topReferrers: [
          { source: 'Google', count: 52 },
          { source: 'Direct', count: 38 },
          { source: 'Facebook', count: 21 },
          { source: 'Twitter', count: 9 },
          { source: 'LinkedIn', count: 7 }
        ],
        churchSizeDistribution: [
          { size: '1-50', count: 32 },
          { size: '51-200', count: 48 },
          { size: '201-500', count: 29 },
          { size: '501+', count: 18 }
        ]
      };
      
      setAnalytics(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Analytics Dashboard | FaithTech Blueprint</title>
      </Head>
      <div className="min-h-screen bg-gray-100">
        <AdminNavbar />

        {/* Main content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="px-4 py-6 sm:px-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
              <div className="mt-4 md:mt-0">
                <select
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="year">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
          </div>

          {analytics && (
            <div className="px-4 sm:px-0">
              {/* Summary cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Leads
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {analytics.totalLeads}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Qualified Leads
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {analytics.leadsByStatus.qualified}
                            </div>
                            <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                              {Math.round((analytics.leadsByStatus.qualified / analytics.totalLeads) * 100)}%
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Avg. Response Time
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {analytics.averageResponseTime}
                            </div>
                            <div className="ml-2 flex items-baseline text-sm font-semibold">
                              hours
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Conversion Rate
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {analytics.conversionRate}%
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts and tables */}
              <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Lead Status Distribution */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Lead Status Distribution</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-500">New</div>
                          <div className="text-sm font-medium text-gray-900">{analytics.leadsByStatus.new}</div>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(analytics.leadsByStatus.new / analytics.totalLeads) * 100}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-500">Contacted</div>
                          <div className="text-sm font-medium text-gray-900">{analytics.leadsByStatus.contacted}</div>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${(analytics.leadsByStatus.contacted / analytics.totalLeads) * 100}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-500">Qualified</div>
                          <div className="text-sm font-medium text-gray-900">{analytics.leadsByStatus.qualified}</div>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(analytics.leadsByStatus.qualified / analytics.totalLeads) * 100}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-500">Disqualified</div>
                          <div className="text-sm font-medium text-gray-900">{analytics.leadsByStatus.disqualified}</div>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${(analytics.leadsByStatus.disqualified / analytics.totalLeads) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Church Size Distribution */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Church Size Distribution</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="space-y-4">
                      {analytics.churchSizeDistribution.map((item) => (
                        <div key={item.size}>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-500">{item.size} members</div>
                            <div className="text-sm font-medium text-gray-900">{item.count}</div>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(item.count / analytics.totalLeads) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Monthly Lead Trend */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Monthly Lead Trend</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="h-64 flex items-end space-x-2">
                      {analytics.leadsByMonth.map((item) => {
                        const maxCount = Math.max(...analytics.leadsByMonth.map(m => m.count));
                        const height = `${(item.count / maxCount) * 100}%`;
                        
                        return (
                          <div key={item.month} className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-blue-100 rounded-t" style={{ height }}>
                              <div className="w-full bg-blue-500 h-full rounded-t"></div>
                            </div>
                            <div className="text-xs font-medium text-gray-500 mt-2">{item.month}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top Referrers */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Top Referrers</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="space-y-4">
                      {analytics.topReferrers.map((item) => (
                        <div key={item.source}>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-500">{item.source}</div>
                            <div className="text-sm font-medium text-gray-900">{item.count}</div>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(item.count / analytics.totalLeads) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Export the component wrapped with authentication
export default withAdminAuth(AnalyticsDashboard);
