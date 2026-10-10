import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await api.get<User[]>('/users');
        if (mounted) setUsers(data);
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          pushToast({ variant: 'error', title: 'Failed to load users', message: (err as Error).message });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [pushToast]);

  const toggleRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/users/${user._id}`, { role: newRole });
      setUsers((u) => u.map((x) => (x._id === user._id ? { ...x, role: newRole } : x)));
      pushToast({ variant: 'success', title: 'Role updated', message: `${user.email} is now ${newRole}.` });
    } catch (err) {
      pushToast({ variant: 'error', title: 'Update failed', message: (err as Error).message });
    }
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Delete ${user.email}?`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      setUsers((u) => u.filter((x) => x._id !== user._id));
      pushToast({ variant: 'success', title: 'User deleted', message: 'The user has been removed.' });
    } catch (err) {
      pushToast({ variant: 'error', title: 'Delete failed', message: (err as Error).message });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Manage Users
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View, promote, and manage user accounts
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
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.disabled" sx={{ py: 3 }}>
                        No users yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.firstName} {u.lastName}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={u.role === 'admin' ? <AdminIcon /> : undefined}
                          label={u.role}
                          color={u.role === 'admin' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}>
                          <IconButton onClick={() => toggleRole(u)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => deleteUser(u)}>
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
    </Box>
  );
}
