'use client';

import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Get the token from the URL query parameters
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('token');

      if (!token) {
        setError('Reset token is missing');
        return;
      }

      const response = await axios.post('/api/auth/reset-password', {
        token,
        password,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  if (success) {
    return (
      <div className="text-center p-4">
        <p className="text-green-600">Password reset successful! Redirecting to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          New Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
          minLength={8}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Reset Password
      </button>
    </form>
  );
}
