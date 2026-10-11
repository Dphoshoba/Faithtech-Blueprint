import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Fab,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface Assessment {
  _id: string;
  title: string;
  category: string;
  status: string;
  questionCount?: number;
  createdAt?: string;
}

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { pushToast } = useToast();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await api.get<Assessment[]>('/assessments');
        if (mounted) setAssessments(data);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assessment?')) return;
    try {
      await api.delete(`/assessments/${id}`);
      setAssessments((a) => a.filter((x) => x._id !== id));
      pushToast({ variant: 'success', title: 'Assessment deleted', message: 'The assessment has been removed.' });
    } catch (err) {
      pushToast({ variant: 'error', title: 'Delete failed', message: (err as Error).message });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Manage Assessments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create, edit, and delete ministry health assessments
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/assessments/build')}>
          New Assessment
        </Button>
      </Box>

      <Card>
        <TableContainer>
          {loading ? (
            <CardContent>
              <Skeleton height={40} sx={{ mb: 1 }} />
              <Skeleton height={40} sx={{ mb: 1 }} />
              <Skeleton height={40} />
            </CardContent>
          ) : error ? (
            <CardContent><Alert severity="error">{error}</Alert></CardContent>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assessments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.disabled" sx={{ py: 3 }}>
                        No assessments yet. Create the first one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  assessments.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell>{a.title}</TableCell>
                      <TableCell>{a.category}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={a.status}
                          color={a.status === 'published' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{a.questionCount ?? 0}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => navigate(`/assessments/build/${a._id}`)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDelete(a._id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Card>

      <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={() => navigate('/assessments/build')}>
        <AddIcon />
      </Fab>
    </Box>
  );
}
