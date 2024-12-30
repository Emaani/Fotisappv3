'use client';

import React from 'react';

interface AlertProps {
  variant?: 'default' | 'success' | 'error' | 'warning';
  children: React.ReactNode;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
}

export function Alert({ variant = 'default', children }: AlertProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
    success: 'bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-100',
    error: 'bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-100',
    warning: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100',
  };

  return (
    <div
      role="alert"
      className={`rounded-lg p-4 mb-4 ${variantClasses[variant]} transition-colors duration-200`}
    >
      {children}
    </div>
  );
}

export function AlertDescription({ children }: AlertDescriptionProps) {
  return (
    <div className="mt-1 text-sm font-medium">
      {children}
    </div>
  );
} 