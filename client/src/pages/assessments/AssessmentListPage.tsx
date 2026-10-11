import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Skeleton,
  TextField,
  InputAdornment,
  Pagination,
} from '@mui/material';
import { Search as SearchIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface Assessment {
  _id: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  estimatedTime?: number;
  questionCount?: number;
  status?: string;
}

export default function AssessmentListPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filtered, setFiltered] = useState<Assessment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 9;

  const { pushToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await api.get<Assessment[]>('/assessments');
        if (mounted) {
          setAssessments(data);
          setFiltered(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          pushToast({ variant: 'error', title: 'Failed to load assessments', message: (err as Error).message });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [pushToast]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(
      assessments.filter(
        (a) =>
          !q ||
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      )
    );
    setPage(1);
  }, [search, assessments]);

  const startAssessment = (id: string) => {
    navigate(`/assessments/${id}`);
  };

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Assessments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Find and start a ministry health assessment
          </Typography>
        </Box>
      </Box>

      <TextField
        placeholder="Search assessments…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 3, maxWidth: 520 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} lg={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton height={28} width="60%" sx={{ mb: 1 }} />
                  <Skeleton height={20} width="90%" sx={{ mb: 1 }} />
                  <Skeleton height={20} width="70%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : paginated.length === 0 ? (
        <Alert severity="info">No assessments found. Check back later.</Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginated.map((a) => (
              <Grid item xs={12} sm={6} lg={4} key={a._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Chip label={a.category} size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
                    <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                      {a.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {a.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                      {a.estimatedTime && (
                        <Typography variant="caption" color="text.secondary">
                          ⏱ {a.estimatedTime} min
                        </Typography>
                      )}
                      {a.questionCount && (
                        <Typography variant="caption" color="text.secondary">
                          ❓ {a.questionCount} questions
                        </Typography>
                      )}
                      {a.status && (
                        <Chip
                          size="small"
                          label={a.status}
                          color={a.status === 'published' ? 'success' : 'default'}
                        />
                      )}
                    </Box>
                  </CardContent>
                  <CardContent sx={{ pt: 0 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<AssignmentIcon />}
                      onClick={() => startAssessment(a._id)}
                    >
                      Start Assessment
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination count={pages} page={page} onChange={(_, p) => setPage(p)} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
