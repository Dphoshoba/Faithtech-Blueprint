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

interface Template {
  _id: string;
  title: string;
  category: string;
  isPublic?: boolean;
  downloads?: number;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { pushToast } = useToast();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await api.get<Template[]>('/templates');
        if (mounted) setTemplates(data);
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          pushToast({ variant: 'error', title: 'Failed to load templates', message: (err as Error).message });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [pushToast]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      setTemplates((t) => t.filter((x) => x._id !== id));
      pushToast({ variant: 'success', title: 'Template deleted', message: 'The template has been removed.' });
    } catch (err) {
      pushToast({ variant: 'error', title: 'Delete failed', message: (err as Error).message });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Manage Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create, edit, and delete document templates
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/templates/build')}>
          New Template
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
                  <TableCell>Visibility</TableCell>
                  <TableCell>Downloads</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.disabled" sx={{ py: 3 }}>
                        No templates yet. Create the first one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell>{t.title}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell>
                        <Chip size="small" label={t.isPublic ? 'Public' : 'Private'} color={t.isPublic ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell>{t.downloads ?? 0}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => navigate(`/templates/build/${t._id}`)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDelete(t._id)}>
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

      <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={() => navigate('/templates/build')}>
        <AddIcon />
      </Fab>
    </Box>
  );
}
