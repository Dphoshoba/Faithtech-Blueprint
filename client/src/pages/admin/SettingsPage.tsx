import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'FaithTech Blueprint',
    supportEmail: 'support@faithtech.com',
    allowRegistration: true,
    maintenanceMode: false,
  });
  const { pushToast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.put('/admin/settings', settings);
      setSuccess(true);
      pushToast({ variant: 'success', title: 'Settings saved', message: 'Your changes have been applied.' });
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      pushToast({ variant: 'error', title: 'Save failed', message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box maxWidth="md" mx="auto">
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
        Settings
      </Typography>

      <Card>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Settings saved successfully.</Alert>}

          <Stack spacing={2.5}>
            <TextField
              label="Site Name"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Support Email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              fullWidth
            />
            <Divider />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowRegistration}
                  onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                />
              }
              label="Allow new user registration"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                />
              }
              label="Maintenance mode"
            />
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Settings'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
