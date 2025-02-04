'use client';

import { useState,  useCallback, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  date: string;
  // Add additional fields as needed
}

interface WalletProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  balance: {
    amount: number;
    currency: string;
  };
  transactions: Transaction[];
}

interface WalletData {
  balance: number;
  currency: {
    code: string;
    symbol: string;
  };
  userName: string;
}

export default function Wallet({ userId }: WalletProps) {
  const router = useRouter();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchWalletData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await axios.get(`/api/wallet/${userId}`);
      if (response.data.success) {
        setWalletData(response.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch wallet data');
      }
    } catch (error: any) {
      console.error('Wallet fetch error:', error);
      setError(error.response?.data?.message || 'Failed to load wallet data');
      if (error.response?.status === 401) {
        router.push('/Login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, router]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const response = await axios.get<{ transactions: Transaction[] }>(`/api/transactions/${userId}`);
        setTransactions(response.data.transactions);
      } catch (error) {
        console.error('Error loading transactions:', error instanceof Error ? error.message : 'Unknown error');
      }
    };
    loadTransactions();
  }, [userId]);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/api/wallet/add-funds', {
        userId,
        amount: parseFloat(amount),
        paymentMethod
      });

      if (response.data.success) {
        await fetchWalletData();
        setShowAddFunds(false);
        setAmount('');
      } else {
        throw new Error(response.data.message || 'Failed to add funds');
      }
    } catch (error: any) {
      console.error('Add funds error:', error);
      setError(error.response?.data?.message || 'Failed to add funds');
    }
  };

  const formatCurrency = (amount: number, currency: { code: string; symbol: string }) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      currencyDisplay: 'narrowSymbol',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <button 
            onClick={fetchWalletData}
            className="mt-4 text-blue-500 hover:text-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Welcome, {walletData?.userName}
        </h2>
        <button
          onClick={() => setShowAddFunds(!showAddFunds)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Add Funds
        </button>
      </div>

      <div className="mb-6">
        <p className="text-sm font-medium text-gray-600 mb-1">Available Balance</p>
        <p className="text-3xl font-bold text-gray-900">
          {walletData && formatCurrency(walletData.balance, walletData.currency)}
        </p>
      </div>

      {showAddFunds && (
        <form onSubmit={handleAddFunds} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Amount to Add
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-lg font-medium text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="card" className="py-2">💳 Credit/Debit Card</option>
                <option value="airtel" className="py-2">📱 Airtel Money</option>
                <option value="mtn" className="py-2">📱 MTN Mobile Money</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 text-lg font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Funds
          </button>
        </form>
      )}
    </div>
  );
}