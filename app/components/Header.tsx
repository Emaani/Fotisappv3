'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '../providers/ThemeProvider';
import Link from 'next/link';

export default function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className={`w-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Main Navigation */}
      <div className="bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            {/* Logo with Link */}
            <Link 
              href="/" 
              className="transform hover:scale-105 transition-transform duration-200 py-1"
            >
              <Image
                src="/images/logo.png"
                alt="Fotis Agro Logo"
                width={100}
                height={100}
                className="object-contain hover:brightness-110 transition-all duration-200"
                priority
                style={{ maxHeight: '60px' }}
              />
            </Link>

            {/* Navigation Links and Actions */}
            <div className="flex items-center space-x-6">
              <Link
                href="/TradeCommodities"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Trade Commodities
              </Link>
              <Link
                href="/signup"
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="bg-transparent hover:bg-gray-700 px-4 py-2 rounded-lg text-gray-300 hover:text-white text-sm font-medium transition-colors"
              >
                Log In
              </Link>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}