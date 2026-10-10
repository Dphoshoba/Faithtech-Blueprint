import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Skeleton } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: number;
  loading?: boolean;
}

const colorMap: Record<string, string> = {
  primary: '#2b6cb0',
  secondary: '#d69e2e',
  success: '#38a169',
  warning: '#d69e2e',
  error: '#e53e3e',
  info: '#3182ce',
};

export default function StatCard({ title, value, icon, color = 'primary', trend, loading = false }: StatCardProps) {
  const accent = colorMap[color] || colorMap.primary;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton height={28} width="60%" sx={{ mb: 1 }} />
          <Skeleton height={40} width="40%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderLeft: `4px solid ${accent}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
            {trend !== undefined && (
              <Chip
                size="small"
                label={`${trend > 0 ? '+' : ''}${trend}%`}
                color={trend >= 0 ? 'success' : 'error'}
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: `${accent}15`,
              color: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
