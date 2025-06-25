import React, { useState } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  Select,
  VStack,
  HStack,
  Button,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BetaMetrics } from '../types/BetaChurch';

interface AnalyticsDashboardProps {
  metrics: BetaMetrics;
  timeRange: 'day' | 'week' | 'month' | 'year';
  onTimeRangeChange: (range: 'day' | 'week' | 'month' | 'year') => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  metrics,
  timeRange,
  onTimeRangeChange,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('activeUsers');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Sample data for charts
  const userActivityData = [
    { name: 'Mon', users: 120 },
    { name: 'Tue', users: 150 },
    { name: 'Wed', users: 180 },
    { name: 'Thu', users: 160 },
    { name: 'Fri', users: 200 },
    { name: 'Sat', users: 250 },
    { name: 'Sun', users: 300 },
  ];

  const featureUsageData = [
    { name: 'Member Management', value: 400 },
    { name: 'Event Planning', value: 300 },
    { name: 'Contributions', value: 200 },
    { name: 'Reporting', value: 100 },
  ];

  const performanceData = [
    { name: 'Response Time', value: 150 },
    { name: 'Error Rate', value: 2.5 },
    { name: 'Uptime', value: 99.9 },
    { name: 'User Satisfaction', value: 4.5 },
  ];

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Analytics Dashboard</Heading>
          <HStack>
            <Select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value as any)}
              w="200px"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
            </Select>
            <Button colorScheme="blue">Export Report</Button>
          </HStack>
        </HStack>

        {/* Key Metrics */}
        <Grid templateColumns="repeat(4, 1fr)" gap={6}>
          <Stat
            px={4}
            py={5}
            bg={bgColor}
            shadow="base"
            rounded="lg"
            border="1px"
            borderColor={borderColor}
          >
            <StatLabel>Active Users</StatLabel>
            <StatNumber>{metrics.activeUsers}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              23.36%
            </StatHelpText>
          </Stat>
          <Stat
            px={4}
            py={5}
            bg={bgColor}
            shadow="base"
            rounded="lg"
            border="1px"
            borderColor={borderColor}
          >
            <StatLabel>Error Rate</StatLabel>
            <StatNumber>{metrics.errorRate}%</StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              9.05%
            </StatHelpText>
          </Stat>
          <Stat
            px={4}
            py={5}
            bg={bgColor}
            shadow="base"
            rounded="lg"
            border="1px"
            borderColor={borderColor}
          >
            <StatLabel>Response Time</StatLabel>
            <StatNumber>{metrics.responseTime}ms</StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              12.5%
            </StatHelpText>
          </Stat>
          <Stat
            px={4}
            py={5}
            bg={bgColor}
            shadow="base"
            rounded="lg"
            border="1px"
            borderColor={borderColor}
          >
            <StatLabel>User Satisfaction</StatLabel>
            <StatNumber>{metrics.userSatisfaction}/5</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              5.2%
            </StatHelpText>
          </Stat>
        </Grid>

        {/* Charts */}
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          {/* User Activity Chart */}
          <Box
            p={4}
            bg={bgColor}
            shadow="base"
            rounded="lg"
            border="1px"
            borderColor={borderColor}
          >
            <Heading size="md" mb={4}>User Activity</Heading>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          {/* Feature Usage Chart */}
          <Box
            p={4}
            bg={bgColor}
            shadow="base"
            rounded="lg"
            border="1px"
            borderColor={borderColor}
          >
            <Heading size="md" mb={4}>Feature Usage</Heading>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={featureUsageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {featureUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          {/* Performance Metrics Chart */}
          <Box
            p={4}
            bg={bgColor}
            shadow="base"
            rounded="lg"
            border="1px"
            borderColor={borderColor}
          >
            <Heading size="md" mb={4}>Performance Metrics</Heading>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Custom Report */}
          <Box
            p={4}
            bg={bgColor}
            shadow="base"
            rounded="lg"
            border="1px"
            borderColor={borderColor}
          >
            <Heading size="md" mb={4}>Custom Report</Heading>
            <VStack spacing={4} align="stretch">
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                <option value="activeUsers">Active Users</option>
                <option value="errorRate">Error Rate</option>
                <option value="responseTime">Response Time</option>
                <option value="userSatisfaction">User Satisfaction</option>
              </Select>
              <Button colorScheme="blue">Generate Report</Button>
              <Text color="gray.600" fontSize="sm">
                Select a metric to generate a detailed report with insights and recommendations.
              </Text>
            </VStack>
          </Box>
        </Grid>
      </VStack>
    </Box>
  );
}; 