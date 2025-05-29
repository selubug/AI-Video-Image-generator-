'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== '/auth/login' && pathname !== '/auth/signup') {
      router.push('/auth/login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user && pathname !== '/auth/login' && pathname !== '/auth/signup') {
    return null;
  }

  // Check if user exists but email is not confirmed
  if (user && !user.email_confirmed_at && pathname !== '/auth/confirm-email') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Email Not Confirmed</h2>
          <p className="text-gray-600 mb-4">
            Please check your email for a confirmation link. If you haven't received it, you can request a new one.
          </p>
          <button
            onClick={() => router.push('/auth/confirm-email')}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            Request New Confirmation Email
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 