import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAdminAuth from '../../hooks/useAdminAuth';

export default function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithAdminAuth: React.FC<P> = (props) => {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAdminAuth();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/admin/login');
      }
    }, [isLoading, isAuthenticated, router]);

    // Show loading state while checking authentication
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading...</p>
          </div>
        </div>
      );
    }

    // If not authenticated, don't render the component
    if (!isAuthenticated) {
      return null;
    }

    // If authenticated, render the wrapped component
    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithAdminAuth.displayName = `withAdminAuth(${displayName})`;

  return WithAdminAuth;
}
