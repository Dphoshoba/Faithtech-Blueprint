import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FaChurch, FaUsers, FaHandshake, FaChartLine } from 'react-icons/fa';
import FeatureCard from '../components/FeatureCard';

interface LeadFormData {
  name: string;
  email: string;
  churchName: string;
  churchSize: string;
  message: string;
}

export default function Home() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LeadFormData>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const onSubmit = async (data: LeadFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitStatus({ type: null, message: '' });
      
      // Send lead data to API
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit form');
      }
      
      // Show success message
      setSubmitStatus({
        type: 'success',
        message: 'Thank you for your interest! We will contact you soon.'
      });
      
      // Reset form
      reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error 
          ? error.message 
          : 'There was an error submitting your request. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Empowering Churches with Modern Technology
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Streamline your church operations, engage your community, and grow your ministry with our comprehensive church management platform.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:bg-blue-700 transition-colors"
          >
            Start Your Free Trial
          </motion.button>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<FaChurch className="w-12 h-12 text-blue-600" />}
              title="Church Management"
              description="Streamline administrative tasks, manage members, and organize events with ease."
            />
            <FeatureCard
              icon={<FaUsers className="w-12 h-12 text-blue-600" />}
              title="Community Engagement"
              description="Build stronger connections with your congregation through our engagement tools."
            />
            <FeatureCard
              icon={<FaHandshake className="w-12 h-12 text-blue-600" />}
              title="Volunteer Management"
              description="Coordinate volunteers, schedule services, and track participation."
            />
            <FeatureCard
              icon={<FaChartLine className="w-12 h-12 text-blue-600" />}
              title="Growth Analytics"
              description="Track attendance, giving, and engagement metrics to measure your ministry's impact."
            />
          </div>
        </div>
      </section>

      {/* Lead Capture Form */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8">Request a Demo</h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            See how Faithtech can help your church thrive in the digital age.
          </p>
          <form id="lead-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">Name</label>
              <input
                {...register('name', { required: true })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && <span className="text-red-500">Name is required</span>}
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                {...register('email', { required: true, pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <span className="text-red-500">Valid email is required</span>}
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Church Name</label>
              <input
                {...register('churchName', { required: true })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.churchName && <span className="text-red-500">Church name is required</span>}
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Church Size</label>
              <select
                {...register('churchSize', { required: true })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select size</option>
                <option value="1-50">1-50 members</option>
                <option value="51-200">51-200 members</option>
                <option value="201-500">201-500 members</option>
                <option value="501+">501+ members</option>
              </select>
              {errors.churchSize && <span className="text-red-500">Church size is required</span>}
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Message (Optional)</label>
              <textarea
                {...register('message')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            {submitStatus.type && (
              <div className={`p-4 mb-4 rounded-lg ${
                submitStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {submitStatus.message}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-600 text-white py-3 rounded-lg font-semibold 
                ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'} 
                transition-colors`}
            >
              {isSubmitting ? 'Submitting...' : 'Request Demo'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
