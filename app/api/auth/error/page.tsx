"use client";

import { Suspense } from 'react';
import ErrorDisplay from "../../../components/ErrorDisplay";

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorDisplay />
    </Suspense>
  );
} 