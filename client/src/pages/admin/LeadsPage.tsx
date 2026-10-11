import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
} from '@mui/material';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface Lead {
  _id: string;
  name: string;
  email: string;
  churchName: string;
  churchSize: string;
  message?: string;
  status?: string;
  createdAt?: string;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const { pushToast } = useToast();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await api.get<Lead[]>('/admin/leads');
        if (mounted) setLeads(data);
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          pushToast({ variant: 'error', title: 'Failed to load leads', message: (err as Error).message });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [pushToast]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/admin/leads/${id}`, { status });
      setLeads((l) => l.map((x) => (x._id === id ? { ...x, status } : x)));
      pushToast({ variant: 'success', title: 'Lead updated', message: `Status set to ${status}.` });
    } catch (err) {
      pushToast({ variant: 'error', title: 'Update failed', message: (err as Error).message });
    }
  };

  const paginated = leads.slice((page - 1) * perPage, page * perPage);
  const pages = Math.max(1, Math.ceil(leads.length / perPage));

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Lead Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and manage inbound leads from the marketing site
        </Typography>
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
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Church</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.disabled" sx={{ py: 3 }}>
                        No leads yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((lead) => (
                    <TableRow key={lead._id}>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.churchName}</TableCell>
                      <TableCell>{lead.churchSize}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={lead.status || 'new'}
                          color={lead.status === 'contacted' ? 'primary' : lead.status === 'converted' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Card>

      {pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={pages} page={page} onChange={(_, p) => setPage(p)} />
        </Box>
      )}
    </Box>
  );
}
