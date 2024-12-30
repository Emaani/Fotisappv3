'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '../components/ui/alert';
import axios from 'axios';
import Link from 'next/link';
import { useTheme } from '../providers/ThemeProvider';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      setStatus('success');
      setMessage('Password reset instructions have been sent to your email.');
    } catch (error) {
      setStatus('error');
      setMessage('Failed to send reset instructions. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full space-y-8 p-8 rounded-xl shadow-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Reset your password
          </h2>
          <p className={`mt-2 text-center text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {status !== 'idle' && (
          <Alert variant={status === 'success' ? 'success' : 'error'}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/login"
              className={`text-sm font-medium hover:underline ${
                theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Back to login
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
                status === 'loading' ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {status === 'loading' ? 'Sending...' : 'Send reset instructions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
