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

interface Question {
  _id: string;
  id?: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'scale' | 'boolean' | 'rating';
  options?: string[];
  required?: boolean;
}

interface Assessment {
  _id: string;
  id?: string;
  title: string;
  description: string;
  questions: Question[];
}

export default function AssessmentTakePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await api.get<Assessment>(`/assessments/${id}`);
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

  const handleAnswer = (questionId: string, value: string) => {
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
        assessmentId: assessment._id,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
      };
      const { data } = await api.post<{ responseId: string }>(
        `/assessments/${assessment._id}/submit`,
        payload
      );
      pushToast({ variant: 'success', title: 'Assessment submitted', message: 'Great work!' });
      navigate(`/assessments/results/${data.responseId}`);
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

            {current.type === 'text' || current.type === 'rating' ? (
              <TextField
                fullWidth
                multiline
                rows={3}
                value={answers[current._id] || ''}
                onChange={(e) => handleAnswer(current._id, e.target.value)}
                placeholder={
                  current.type === 'rating'
                    ? 'Enter a number 1-10'
                    : 'Type your answer…'
                }
              />
            ) : (
              <RadioGroup
                value={answers[current._id] || ''}
                onChange={(e) => handleAnswer(current._id, e.target.value)}
              >
                {current.options?.map((opt, i) => (
                  <FormControlLabel key={i} value={opt} control={<Radio />} label={opt} />
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
