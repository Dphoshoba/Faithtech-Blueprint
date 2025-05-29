import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { submitLead } from '../utils/api';

type LeadFormData = {
  name: string;
  email: string;
  churchName: string;
  churchSize: string;
  message?: string;
};

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export function useLeadForm() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>();

  const onSubmit = async (data: LeadFormData) => {
    setStatus('submitting');
    setError(null);

    try {
      const response = await submitLead(data);

      if (response.error) {
        throw new Error(response.error);
      }

      setStatus('success');
      reset();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    status,
    error,
    isSubmitting: status === 'submitting',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
} 