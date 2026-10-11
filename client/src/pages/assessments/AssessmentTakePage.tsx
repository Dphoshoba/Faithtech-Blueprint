import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Skeleton,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface QuestionOption {
  text: string;
  value: number;
  weight?: number;
}

interface Question {
  _id: string;
  text: string;
  type: 'multiple-choice' | 'likert' | 'open-ended' | 'boolean';
  options?: QuestionOption[];
  category?: string;
  required?: boolean;
}

interface Assessment {
  _id: string;
  title: string;
  description: string;
  questions: Question[];
  metadata?: { estimatedTime?: number };
}

export default function AssessmentTakePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get<Assessment>(`/assessments/${id}`); const data = res as unknown as Assessment;
        if (mounted) {
          setAssessment(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          pushToast({ variant: 'error', title: 'Failed to load assessment', message: (err as Error).message });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, pushToast]);

  const handleAnswer = (questionId: string, value: number | string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    setActiveStep((s) => Math.min(s + 1, (assessment?.questions.length ?? 1) - 1));
  };

  const handleBack = () => {
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
      };
      const data = await api.post<{ _id: string; responseId?: string }>(
        `/assessments/${assessment._id}/submit`,
        payload
      );
      const responseId = (data as { _id?: string; responseId?: string })._id
        || (data as { _id?: string; responseId?: string }).responseId;
      pushToast({ variant: 'success', title: 'Assessment submitted', message: 'Great work!' });
      navigate(`/assessments/results/${responseId}`);
    } catch (err) {
      pushToast({ variant: 'error', title: 'Submission failed', message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton height={60} sx={{ mb: 2 }} />
        <Skeleton height={200} />
      </Box>
    );
  }

  if (error || !assessment) {
    return (
      <Box>
        <Alert severity="error">{error || 'Assessment not found'}</Alert>
      </Box>
    );
  }

  const questions = assessment.questions;
  const current = questions[activeStep];
  const progress = ((activeStep + 1) / questions.length) * 100;

  return (
    <Box maxWidth="md" mx="auto">
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/assessments')} sx={{ mb: 2 }}>
        Back to Assessments
      </Button>

      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
            {assessment.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {assessment.description}
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {questions.map((_, i) => (
              <Step key={i}>
                <StepLabel>Question {i + 1}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, mb: 3 }} />

          <Box sx={{ minHeight: 200 }}>
            <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
              {activeStep + 1}. {current.text}
            </Typography>

            {current.type === 'open-ended' ? (
              <TextField
                fullWidth
                multiline
                rows={3}
                value={(answers[current._id] as string) || ''}
                onChange={(e) => handleAnswer(current._id, e.target.value)}
                placeholder="Type your answer…"
              />
            ) : current.type === 'boolean' ? (
              <RadioGroup
                value={(answers[current._id] as string) ?? ''}
                onChange={(e) => handleAnswer(current._id, e.target.value)}
              >
                <FormControlLabel value="true" control={<Radio />} label="Yes" />
                <FormControlLabel value="false" control={<Radio />} label="No" />
              </RadioGroup>
            ) : (
              <RadioGroup
                value={(answers[current._id] as number) ?? ''}
                onChange={(e) => handleAnswer(current._id, Number(e.target.value))}
              >
                {(current.options || []).map((opt, i) => (
                  <FormControlLabel key={i} value={opt.value} control={<Radio />} label={opt.text} />
                ))}
              </RadioGroup>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button onClick={handleBack} disabled={activeStep === 0} startIcon={<ArrowBackIcon />}>
              Back
            </Button>
            {activeStep === questions.length - 1 ? (
              <Button
                variant="contained"
                endIcon={<CheckCircleIcon />}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit Assessment'}
              </Button>
            ) : (
              <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
