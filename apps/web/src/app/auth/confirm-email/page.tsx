'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ConfirmEmailPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user, resendConfirmationEmail } = useAuth();
  const router = useRouter();

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    setError(null);
    try {
      await resendConfirmationEmail(user.email);
      setSuccess(true);
    } catch (err) {
      setError('Failed to send confirmation email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Confirm Your Email</h2>
        <p className="text-gray-600 mb-4">
          We've sent a confirmation email to {user?.email}. Please check your inbox and click the confirmation link.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            Confirmation email sent successfully! Please check your inbox.
          </div>
        )}
        
        <button
          onClick={handleResendEmail}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Resend Confirmation Email'}
        </button>
        
        <button
          onClick={() => router.push('/auth/login')}
          className="mt-4 w-full text-blue-500 hover:text-blue-600"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
} 