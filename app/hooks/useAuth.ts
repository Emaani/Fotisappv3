'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Define the shape of the user object
interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/session');
      setState({
        user: response.data.user || null,
        isLoading: false
      });
    } catch (error) {
      setState({
        user: null,
        isLoading: false
      });
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.data.success) {
        await checkAuth();
        return { success: true };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unknown error occurred' };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setState({
        user: null,
        isLoading: false
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user: state.user,
    isLoading: state.isLoading,
    login,
    logout,
    checkAuth
  };
}
