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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'scale' | 'boolean' | 'rating';
  options: string[];
  required: boolean;
}

export default function AssessmentBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('worship');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addQuestion = (type: Question['type']) => {
    setQuestions((q) => [
      ...q,
      {
        id: `q-${Date.now()}`,
        text: type === 'multiple_choice' ? 'New question' : 'New question',
        type,
        options: type === 'multiple_choice' ? ['Option 1', 'Option 2'] : [],
        required: false,
      },
    ]);
  };

  const updateQuestion = (id: string, patch: Partial<Question>) => {
    setQuestions((q) => q.map((question) => (question.id === id ? { ...question, ...patch } : question)));
  };

  const removeQuestion = (id: string) => {
    setQuestions((q) => q.filter((question) => question.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { title, description, category, questions };
      if (id) {
        await api.put(`/assessments/${id}`, payload);
        pushToast({ variant: 'success', title: 'Assessment updated', message: 'Your changes have been saved.' });
      } else {
        const { data } = await api.post<{ _id: string }>('/assessments', payload);
        pushToast({ variant: 'success', title: 'Assessment created', message: 'Your assessment has been saved.' });
        navigate(`/assessments/build/${data._id}`);
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
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/assessments')} sx={{ mb: 2 }}>
        Back to Assessments
      </Button>

      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            {id ? 'Edit Assessment' : 'Create Assessment'}
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
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" sx={{ mb: 1.5 }}>Questions</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {(['text', 'multiple_choice', 'scale', 'boolean', 'rating'] as const).map((type) => (
              <Button key={type} variant="outlined" size="small" onClick={() => addQuestion(type)}>
                + {type.replace('_', ' ')}
              </Button>
            ))}
          </Stack>

          {questions.length === 0 ? (
            <Alert severity="info">No questions yet. Add a question to get started.</Alert>
          ) : (
            <List>
              {questions.map((q, idx) => (
                <ListItem key={q.id} divider>
                  <DragIndicatorIcon sx={{ color: 'text.disabled', mr: 1 }} />
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.disabled">#{idx + 1}</Typography>
                        <Chip size="small" label={q.type.replace('_', ' ')} variant="outlined" />
                        <Typography variant="body2">{q.text}</Typography>
                      </Box>
                    }
                    secondary={
                      q.type === 'multiple_choice' && q.options.length > 0
                        ? `Options: ${q.options.join(', ')}`
                        : undefined
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => removeQuestion(q.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate('/assessments')}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Assessment'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Tooltip title="Add question" placement="left">
        <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={() => addQuestion('text')}>
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}
