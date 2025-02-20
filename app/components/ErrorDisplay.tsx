'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';

export default function ErrorDisplay() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Authentication Error
        </h1>
        <p className="text-gray-600">
          {error || "An error occurred during authentication"}
        </p>
      </div>
    </div>
  );
} 