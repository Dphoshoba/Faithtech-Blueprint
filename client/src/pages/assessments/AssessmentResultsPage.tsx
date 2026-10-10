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
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Lightbulb as LightbulbIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface Results {
  responseId: string;
  assessment: { title: string; description: string };
  score: number;
  categoryScores?: Record<string, number>;
  recommendations?: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  completedAt: string;
}

export default function AssessmentResultsPage() {
  const { responseId } = useParams<{ responseId: string }>();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await api.get<Results>(`/assessments/results/${responseId}`);
        if (mounted) setResults(data);
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          pushToast({ variant: 'error', title: 'Failed to load results', message: (err as Error).message });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [responseId, pushToast]);

  if (loading) {
    return (
      <Box maxWidth="md" mx="auto">
        <Skeleton height={60} sx={{ mb: 2 }} />
        <Skeleton height={200} />
      </Box>
    );
  }

  if (error || !results) {
    return (
      <Box maxWidth="md" mx="auto">
        <Alert severity="error">{error || 'Results not found'}</Alert>
      </Box>
    );
  }

  const scoreColor =
    results.score >= 80 ? 'success' : results.score >= 50 ? 'warning' : 'error';

  return (
    <Box maxWidth="md" mx="auto">
      <Button onClick={() => navigate('/assessments')} sx={{ mb: 2 }}>
        Back to Assessments
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
            {results.assessment.title} — Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {results.assessment.description}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h3" component="div" color={scoreColor}>
                {results.score}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overall Score
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                <ScheduleIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 16 }} />
                Completed {new Date(results.completedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {results.categoryScores && Object.keys(results.categoryScores).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Category Breakdown
            </Typography>
            {Object.entries(results.categoryScores).map(([cat, score]) => (
              <Box key={cat} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{cat}</Typography>
                  <Typography variant="body2" color="text.secondary">{score}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={score} />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {results.recommendations && results.recommendations.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recommendations
            </Typography>
            <List>
              {results.recommendations.map((rec, i) => (
                <ListItem key={i}>
                  <ListItemIcon>
                    <LightbulbIcon color={rec.priority === 'high' ? 'warning' : 'action'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {rec.title}
                        <Chip
                          size="small"
                          label={rec.priority}
                          color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                        />
                      </Box>
                    }
                    secondary={rec.description}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
