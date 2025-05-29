import React from 'react';
import { useLeadForm } from '../hooks/useLeadForm';

const LeadForm = () => {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    isSuccess,
    isError,
    error,
  } = useLeadForm();

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Thank you for your interest!
        </h3>
        <p className="text-green-600">
          We'll be in touch with you shortly to discuss how Faithtech can help your church.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error || 'Something went wrong. Please try again.'}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          {...register('name', { required: 'Name is required' })}
          className="mt-1 input-field"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          className="mt-1 input-field"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="churchName" className="block text-sm font-medium text-gray-700">
          Church Name
        </label>
        <input
          type="text"
          id="churchName"
          {...register('churchName', { required: 'Church name is required' })}
          className="mt-1 input-field"
        />
        {errors.churchName && (
          <p className="mt-1 text-sm text-red-600">{errors.churchName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="churchSize" className="block text-sm font-medium text-gray-700">
          Church Size
        </label>
        <select
          id="churchSize"
          {...register('churchSize', { required: 'Church size is required' })}
          className="mt-1 input-field"
        >
          <option value="">Select size</option>
          <option value="1-50">1-50 members</option>
          <option value="51-200">51-200 members</option>
          <option value="201-500">201-500 members</option>
          <option value="501+">501+ members</option>
        </select>
        {errors.churchSize && (
          <p className="mt-1 text-sm text-red-600">{errors.churchSize.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message (Optional)
        </label>
        <textarea
          id="message"
          {...register('message')}
          rows={4}
          className="mt-1 input-field"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Request Demo'}
      </button>
    </form>
  );
};

export default LeadForm; 