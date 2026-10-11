import React, { useEffect, useState } from 'react';
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
  Fab,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface Component {
  id: string;
  name: string;
  type: 'header' | 'footer' | 'navigation' | 'content' | 'form' | 'section';
  content: { html?: string; css?: string; js?: string };
  isCustomizable?: boolean;
}

export default function TemplateBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('church');
  const [type, setType] = useState('website');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [components, setComponents] = useState<Component[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      try {
        const t = await api.get<Record<string, unknown>>(`/templates/${id}`);
        if (mounted && t) {
          setName((t.name as string) || '');
          setDescription((t.description as string) || '');
          setCategory((t.category as string) || 'church');
          setType((t.type as string) || 'website');
          setTags(((t.tags as string[]) || []).join(', '));
          setIsPublic((t.isPublic as boolean) || false);
          setComponents(
            ((t.components as Component[]) || []).map((c) => ({
              ...c,
              id: (c as { id?: string }).id || `comp-${Date.now()}`,
            }))
          );
        }
      } catch (err) {
        if (mounted) setError((err as Error).message);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const addComponent = (compType: Component['type']) => {
    setComponents((c) => [
      ...c,
      {
        id: `comp-${Date.now()}`,
        name: `New ${compType}`,
        type: compType,
        content: {},
        isCustomizable: true,
      },
    ]);
  };

  const updateComponent = (id: string, patch: Partial<Component>) => {
    setComponents((c) => c.map((comp) => (comp.id === id ? { ...comp, ...patch } : comp)));
  };

  const removeComponent = (id: string) => {
    setComponents((c) => c.filter((comp) => comp.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        description,
        category,
        type,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        isPublic,
        components: components.map((c) => {
          const { id: _omit, ...rest } = c;
          return rest;
        }),
      };
      if (id) {
        await api.put(`/templates/${id}`, payload);
        pushToast({ variant: 'success', title: 'Template updated', message: 'Your changes have been saved.' });
      } else {
        const data = await api.post<{ _id: string }>('/templates', payload);
        pushToast({ variant: 'success', title: 'Template created', message: 'Your template has been saved.' });
        navigate(`/templates/build/${(data as { _id: string })._id}`);
      }
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      pushToast({ variant: 'error', title: 'Save failed', message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box maxWidth="lg" mx="auto">
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/templates')} sx={{ mb: 2 }}>
        Back to Templates
      </Button>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            {id ? 'Edit Template' : 'Create Template'}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mb: 3 }}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} required />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ minWidth: 200 }}
              >
                <option value="church">Church</option>
                <option value="ministry">Ministry</option>
                <option value="nonprofit">Nonprofit</option>
                <option value="event">Event</option>
                <option value="landing-page">Landing Page</option>
              </TextField>
              <TextField
                select
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ minWidth: 200 }}
              >
                <option value="website">Website</option>
                <option value="email">Email</option>
                <option value="social-media">Social Media</option>
                <option value="print">Print</option>
              </TextField>
              <TextField label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} fullWidth sx={{ minWidth: 240 }} />
            </Box>
            <Box>
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <label htmlFor="isPublic" style={{ marginLeft: 8, fontSize: 14 }}>
                Make this template public
              </label>
            </Box>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" sx={{ mb: 1.5 }}>Components</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {(['header', 'footer', 'navigation', 'content', 'form', 'section'] as const).map((t) => (
              <Button key={t} variant="outlined" size="small" onClick={() => addComponent(t)}>
                + {t}
              </Button>
            ))}
          </Stack>
          {components.length === 0 ? (
            <Alert severity="info">No components yet. Add a header, content, or form to get started.</Alert>
          ) : (
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {components.map((comp) => (
                <Card key={comp.id} variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip label={comp.type} size="small" />
                      <TextField
                        label="Name"
                        value={comp.name}
                        onChange={(e) => updateComponent(comp.id, { name: e.target.value })}
                        size="small"
                        sx={{ minWidth: 180 }}
                      />
                      <TextField
                        label="HTML"
                        value={comp.content.html || ''}
                        onChange={(e) => updateComponent(comp.id, { content: { ...comp.content, html: e.target.value } })}
                        size="small"
                        sx={{ minWidth: 180 }}
                      />
                      <IconButton color="error" onClick={() => removeComponent(comp.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button variant="outlined" onClick={() => navigate('/templates')}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Template'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Tooltip title="Add component" placement="left">
        <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={() => addComponent('content')}>
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}
