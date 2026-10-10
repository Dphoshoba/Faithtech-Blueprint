import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Chip,
  Stack,
  Divider,
  Skeleton,
} from '@mui/material';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { pushToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.put(`/users/me`, { firstName, lastName });
      await refreshUser();
      setEditing(false);
      pushToast({ variant: 'success', title: 'Profile updated', message: 'Your changes have been saved.' });
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      pushToast({ variant: 'error', title: 'Update failed', message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Box>
        <Skeleton height={200} />
      </Box>
    );
  }

  return (
    <Box maxWidth="md" mx="auto">
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
        My Profile
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2b6cb0, #1a365d)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {user.firstName.charAt(0)}
            </Box>
            <Box>
              <Typography variant="h6">
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Chip
                size="small"
                label={user.role}
                color={user.role === 'admin' ? 'primary' : 'default'}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={!editing}
                fullWidth
              />
              <TextField
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={!editing}
                fullWidth
              />
            </Box>
            <TextField label="Email" value={user.email} disabled fullWidth />
            <TextField
              label="Organization"
              value={typeof user.organization === 'object' ? user.organization?.name || '' : user.organization || ''}
              disabled
              fullWidth
            />
            <Box>
              <Typography variant="body2" color="text.disabled">
                Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </Typography>
              {user.lastLogin && (
                <Typography variant="body2" color="text.disabled">
                  Last signed in {new Date(user.lastLogin).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="outlined" color="error" onClick={logout}>
              Sign Out
            </Button>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {editing ? (
                <>
                  <Button variant="outlined" onClick={() => { setFirstName(user.firstName); setLastName(user.lastName); setEditing(false); }}>
                    Cancel
                  </Button>
                  <Button variant="contained" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button variant="contained" onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
