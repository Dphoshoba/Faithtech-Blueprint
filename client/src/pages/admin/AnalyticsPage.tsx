import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  Skeleton,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import StatCard from '../../components/StatCard';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface Analytics {
  users: { total: number; active: number; newThisWeek: number };
  assessments: { total: number; completed: number; inProgress: number };
  revenue: { mrr: number; growth: number };
  eventsByType?: Record<string, number>;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await api.get<Analytics>('/users/me');
        if (mounted) {
          setAnalytics({
            users: { total: 0, active: 0, newThisWeek: 0 },
            assessments: { total: 0, completed: 0, inProgress: 0 },
            revenue: { mrr: 0, growth: 0 },
            eventsByType: {},
          });
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          pushToast({ variant: 'error', title: 'Failed to load analytics', message: (err as Error).message });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [pushToast]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Platform-wide insights and performance metrics
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Users" value={loading ? '—' : analytics?.users.total ?? 0} icon={<PeopleIcon />} color="primary" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Assessments" value={loading ? '—' : analytics?.assessments.total ?? 0} icon={<AssessmentIcon />} color="secondary" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="MRR" value={loading ? '—' : `$${analytics?.revenue.mrr ?? 0}`} trend={analytics?.revenue.growth} icon={<TrendingUpIcon />} color="success" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Active Users" value={loading ? '—' : analytics?.users.active ?? 0} icon={<TimelineIcon />} color="warning" loading={loading} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Assessment Completion</Typography>
              {loading ? (
                <>
                  <Skeleton height={24} sx={{ mb: 1 }} />
                  <Skeleton height={24} sx={{ mb: 1 }} />
                  <Skeleton height={24} />
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Completed</Typography>
                    <Typography variant="body2" color="text.secondary">{analytics?.assessments.completed ?? 0}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={analytics?.assessments.total ? (analytics.assessments.completed / analytics.assessments.total) * 100 : 0} sx={{ mb: 1.5, height: 8, borderRadius: 4 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">In Progress</Typography>
                    <Typography variant="body2" color="text.secondary">{analytics?.assessments.inProgress ?? 0}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={analytics?.assessments.total ? (analytics.assessments.inProgress / analytics.assessments.total) * 100 : 0} sx={{ height: 8, borderRadius: 4 }} />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Event Types</Typography>
              {loading ? (
                <>
                  <Skeleton height={24} sx={{ mb: 1 }} />
                  <Skeleton height={24} sx={{ mb: 1 }} />
                  <Skeleton height={24} />
                </>
              ) : analytics?.eventsByType && Object.keys(analytics.eventsByType).length > 0 ? (
                Object.entries(analytics.eventsByType).map(([type, count]) => (
                  <Box key={type} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{type}</Typography>
                      <Typography variant="body2" color="text.secondary">{count}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={100} sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                ))
              ) : (
                <Alert severity="info">No events recorded yet.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
