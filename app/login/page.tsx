'use client';

import { Suspense } from 'react';
import LoginForm from '../components/Login';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
