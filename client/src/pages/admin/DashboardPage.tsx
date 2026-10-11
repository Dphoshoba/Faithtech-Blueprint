import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Skeleton,
  Divider,
  Stack,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/ui/Toast';
import StatCard from '../../components/StatCard';
import { api } from '../../lib/api';

interface DashboardStats {
  users: { total: number; active: number; newThisWeek: number };
  assessments: { total: number; completed: number; inProgress: number };
  templates: { total: number; published: number };
  revenue: { mrr: number; growth: number };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await api.get<DashboardStats>('/users/me');
        // The above returns user profile; for stats we'd call an analytics endpoint.
        // Fallback to a safe empty shape so the UI renders.
        if (mounted) {
          setStats({
            users: { total: 0, active: 0, newThisWeek: 0 },
            assessments: { total: 0, completed: 0, inProgress: 0 },
            templates: { total: 0, published: 0 },
            revenue: { mrr: 0, growth: 0 },
          });
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          pushToast({ variant: 'error', title: 'Failed to load dashboard', message: (err as Error).message });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [pushToast]);

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back, {user?.firstName}! Here's what's happening.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Users"
            value={loading ? '—' : stats?.users.total ?? 0}
            icon={<PeopleIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Assessments"
            value={loading ? '—' : stats?.assessments.total ?? 0}
            icon={<AssessmentIcon />}
            color="secondary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Templates"
            value={loading ? '—' : stats?.templates.total ?? 0}
            icon={<TimelineIcon />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="MRR"
            value={loading ? '—' : `$${stats?.revenue.mrr ?? 0}`}
            trend={stats?.revenue.growth}
            icon={<TrendingUpIcon />}
            color="warning"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Activity
              </Typography>
              {loading ? (
                <>
                  <Skeleton height={40} sx={{ mb: 1 }} />
                  <Skeleton height={40} sx={{ mb: 1 }} />
                  <Skeleton height={40} />
                </>
              ) : (
                <Alert severity="info">
                  Activity feed will appear here once data is available.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Stack spacing={1.5}>
                <Button variant="outlined" fullWidth href="/assessments" sx={{ justifyContent: 'flex-start' }}>
                  Browse Assessments
                </Button>
                <Button variant="outlined" fullWidth href="/templates" sx={{ justifyContent: 'flex-start' }}>
                  Explore Templates
                </Button>
                {user?.role === 'admin' && (
                  <Button variant="contained" fullWidth href="/admin/users" sx={{ justifyContent: 'flex-start' }}>
                    Manage Users
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
