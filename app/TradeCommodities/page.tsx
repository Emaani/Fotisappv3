'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CommoditySelection from '../components/CommoditySelection';
import CommodityDetails from '../components/TradeCommodityDetails';
import Wallet from '../components/Wallet';
import { useCommodityPrice } from '../hooks/useCommodityPrice';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { useTokenPurchase } from '../hooks/useTokenPurchase';
import { purchaseTokens, cashOutTokens } from '../api/MobileMoneyAPI/MobileMoneyAPI';
import CommodityList from '../components/CommodityList';
import axios from 'axios';

interface CommodityData {
  name: string;
  price: number;
  change: number;
  changePercentage: number;
  availableStock: number;
}

interface WalletData {
  balance: number;
  currency: {
    code: string;
    symbol: string;
  };
}

const TradeCommoditiesPage: React.FC = () => {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    currency: {
      code: 'USD',
      symbol: '$'
    }
  });
  const [commodities] = useState<CommodityData[]>([
    { name: 'Soybeans', price: 2500, change: -0.14, changePercentage: -1.32, availableStock: 100 },
    { name: 'Coffee', price: 13000, change: 1.27, changePercentage: 0.52, availableStock: 50 },
    { name: 'Maize', price: 900, change: -0.02, changePercentage: -0.41, availableStock: 200 },
    { name: 'Sesame', price: 6000, change: 0.05, changePercentage: 0.52, availableStock: 75 },
    { name: 'Sunflower', price: 1300, change: 0.01, changePercentage: 0.52, availableStock: 150 },
  ]);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenAmount, setTokenAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const storedUserId = localStorage.getItem('userId');
        if (!storedUserId) {
          router.push('/Login');
          return;
        }
        setUserId(storedUserId);
        await fetchWalletData(storedUserId);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router]);

  const fetchWalletData = async (userId: string) => {
    try {
      const response = await axios.get(`/api/wallet/${userId}`);
      if (response.data.success) {
        setWalletData({
          balance: response.data.balance,
          currency: {
            code: response.data.currency.code,
            symbol: response.data.currency.symbol
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  const handleBuyCommodity = async (commodity: string, quantity: number, totalCost: number) => {
    try {
      const response = await axios.post('/api/trade/buy', {
        userId,
        commodity,
        quantity,
        totalCost
      });

      if (response.data.success) {
        setWalletData(prev => ({
          ...prev,
          balance: prev.balance - totalCost
        }));
      }
    } catch (error) {
      console.error('Failed to buy commodity:', error);
    }
  };

  const handleSellCommodity = async (commodity: string, quantity: number, totalValue: number) => {
    try {
      const response = await axios.post('/api/trade/sell', {
        userId,
        commodity,
        quantity,
        totalValue
      });

      if (response.data.success) {
        setWalletData(prev => ({
          ...prev,
          balance: prev.balance + totalValue
        }));
      }
    } catch (error) {
      console.error('Failed to sell commodity:', error);
    }
  };

  const handleBuyTokens = async () => {
    const amount = parseFloat(tokenAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const response = await axios.post('/api/wallet/buy-tokens', {
        userId,
        amount
      });

      if (response.data.success) {
        setWalletData(prev => ({
          ...prev,
          balance: prev.balance + amount
        }));
        setShowTokenModal(false);
        setTokenAmount('');
      }
    } catch (error) {
      console.error('Failed to buy tokens:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Trade Commodities</h2>
              <button
                onClick={() => setShowTokenModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Buy Tokens
              </button>
            </div>
            <CommodityList 
              commodities={commodities}
              walletBalance={walletData.balance}
              currency={walletData.currency}
              onBuy={handleBuyCommodity}
              onSell={handleSellCommodity}
            />
          </div>
        </div>
        <div>
          <Wallet userId={userId} />
        </div>
      </div>

      {/* Updated Token Purchase Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Buy Tokens</h3>
              <button
                onClick={() => setShowTokenModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Token Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 text-lg">$</span>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-lg font-medium text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Enter the amount of tokens you want to purchase
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleBuyTokens}
                disabled={!tokenAmount || parseFloat(tokenAmount) <= 0}
                className="w-full bg-blue-600 text-white py-3 px-4 text-lg font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Purchase Tokens
              </button>
              <button
                onClick={() => {
                  setShowTokenModal(false);
                  setTokenAmount('');
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 text-lg font-medium rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>

            {/* Optional: Add current wallet balance display */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Current Balance: <span className="font-medium text-gray-900">${walletData.balance.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeCommoditiesPage;
