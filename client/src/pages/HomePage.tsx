import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Stack,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/ui/Toast';

export default function HomePage() {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organization, setOrganization] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, register, loading, error } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setOrganization('');
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);

    try {
      if (tab === 0) {
        await login(email, password);
        pushToast({ variant: 'success', title: 'Welcome back', message: 'You are now signed in.' });
        navigate('/dashboard');
      } else {
        await register({ email, password, firstName, lastName, organization });
        pushToast({ variant: 'success', title: 'Account created', message: 'Welcome to FaithTech Blueprint!' });
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = (err as Error).message;
      setLocalError(msg);
      pushToast({ variant: 'error', title: 'Authentication failed', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth={false} sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
      <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              mb: 1.5,
            }}
          >
            &#9829;
          </Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            FaithTech Blueprint
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Church management platform
          </Typography>
        </Box>

        <Card elevation={3}>
          <CardContent sx={{ p: 3 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => { setTab(v); resetForm(); }}
              centered
              sx={{ mb: 2 }}
            >
              <Tab label="Sign in" />
              <Tab label="Create account" />
            </Tabs>

            {localError && (
              <Alert severity="error" sx={{ mb: 2 }}>{localError}</Alert>
            )}
            {error && !localError && (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {tab === 1 && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      fullWidth
                      disabled={submitting}
                    />
                    <TextField
                      label="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      fullWidth
                      disabled={submitting}
                    />
                  </Box>
                )}

                <TextField
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  disabled={submitting}
                />

                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  disabled={submitting}
                  helperText={tab === 1 ? 'At least 8 characters with uppercase, lowercase, number, and symbol' : undefined}
                />

                {tab === 1 && (
                  <TextField
                    label="Organization (optional)"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    fullWidth
                    disabled={submitting}
                  />
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={submitting || loading}
                  sx={{ py: 1.5, mt: 1 }}
                >
                  {submitting ? 'Please wait…' : tab === 0 ? 'Sign in' : 'Create account'}
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Typography variant="body2" color="text.secondary" align="center">
              {tab === 0 ? (
                <>
                  Don't have an account?{' '}
                  <Link component="button" onClick={() => { setTab(1); resetForm(); }}>Create one</Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link component="button" onClick={() => { setTab(0); resetForm(); }}>Sign in</Link>
                </>
              )}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
