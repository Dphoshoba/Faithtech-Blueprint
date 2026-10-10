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
  Fab,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface TemplateBlock {
  id: string;
  type: 'heading' | 'text' | 'image' | 'list';
  content: string;
}

export default function TemplateBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('worship');
  const [tags, setTags] = useState('');
  const [blocks, setBlocks] = useState<TemplateBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addBlock = (type: TemplateBlock['type']) => {
    setBlocks((b) => [
      ...b,
      { id: `block-${Date.now()}`, type, content: type === 'heading' ? 'New Heading' : 'New text block' },
    ]);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks((b) => b.map((blk) => (blk.id === id ? { ...blk, content } : blk)));
  };

  const removeBlock = (id: string) => {
    setBlocks((b) => b.filter((blk) => blk.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        description,
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        blocks,
      };
      if (id) {
        await api.put(`/templates/${id}`, payload);
        pushToast({ variant: 'success', title: 'Template updated', message: 'Your changes have been saved.' });
      } else {
        const { data } = await api.post<{ _id: string }>('/templates', payload);
        pushToast({ variant: 'success', title: 'Template created', message: 'Your template has been saved.' });
        navigate(`/templates/build/${data._id}`);
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
            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ minWidth: 200 }}
              >
                <option value="worship">Worship</option>
                <option value="outreach">Outreach</option>
                <option value="discipleship">Discipleship</option>
                <option value="administration">Administration</option>
                <option value="other">Other</option>
              </TextField>
              <TextField label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} fullWidth sx={{ minWidth: 240 }} />
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" sx={{ mb: 1.5 }}>Template Blocks</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {(['heading', 'text', 'list'] as const).map((type) => (
              <Button key={type} variant="outlined" size="small" onClick={() => addBlock(type)}>
                Add {type}
              </Button>
            ))}
          </Stack>

          {blocks.length === 0 ? (
            <Alert severity="info">No blocks yet. Add a heading or text block to get started.</Alert>
          ) : (
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {blocks.map((block) => (
                <Card key={block.id} variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip label={block.type} size="small" />
                      <TextField
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                        fullWidth
                        size="small"
                      />
                      <Button color="error" size="small" onClick={() => removeBlock(block.id)}>
                        Remove
                      </Button>
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

      <Tooltip title="Add block" placement="left">
        <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={() => addBlock('text')}>
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}
