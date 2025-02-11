'use client';

import React, { useState } from 'react';

interface CommodityData {
  name: string;
  price: number;
  change: number;
  changePercentage: number;
  availableStock: number;
}

interface CommodityListProps {
  commodities?: CommodityData[];
  walletBalance: number;
  currency: string;
  onBuy: (commodity: string, quantity: number, totalCost: number) => void;
  onSell: (commodity: string, quantity: number, totalValue: number) => void;
}

export default function CommodityList({ 
  commodities = [], 
  walletBalance = 0,
  currency = 'USD',
  onBuy,
  onSell
}: CommodityListProps) {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);

  const formatNumber = (value: number): string => {
    try {
      return value.toLocaleString() || '0';
    } catch {
      return '0';
    }
  };

  const formatCurrency = (amount: number): string => {
    try {
      if (!currency) {
        return `$${formatNumber(amount)}`;
      }
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'narrowSymbol',
      }).format(amount);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return `$${formatNumber(amount)}`;
    }
  };

  const handleQuantityChange = (commodity: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [commodity]: quantity }));
    setError(null);
  };

  const handleBuy = (commodity: CommodityData) => {
    const quantity = quantities[commodity.name] || 0;
    const totalCost = quantity * commodity.price;

    if (totalCost > walletBalance) {
      setError("Sorry, Transaction failed. Insufficient funds in wallet.");
      return;
    }

    if (quantity > commodity.availableStock) {
      setError("Sorry, Transaction failed. Insufficient stock available.");
      return;
    }

    onBuy(commodity.name, quantity, totalCost);
    setQuantities(prev => ({ ...prev, [commodity.name]: 0 }));
  };

  const handleSell = (commodity: CommodityData) => {
    const quantity = quantities[commodity.name] || 0;
    const totalValue = quantity * commodity.price;
    onSell(commodity.name, quantity, totalValue);
    setQuantities(prev => ({ ...prev, [commodity.name]: 0 }));
  };

  const renderQuantitySelector = (commodity: CommodityData) => {
    const quantity = quantities[commodity.name] || 0;
    const maxQuantity = Math.min(commodity.availableStock, 100); // Limit to 100 for better UX

    return (
      <div className="flex items-center space-x-2">
        <input
          type="number"
          min="0"
          max={maxQuantity}
          value={quantity}
          onChange={(e) => {
            const value = Math.min(parseInt(e.target.value) || 0, maxQuantity);
            handleQuantityChange(commodity.name, value);
          }}
          className="w-20 px-2 py-1 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <span className="text-sm text-gray-500">
          / {maxQuantity}
        </span>
      </div>
    );
  };

  if (!Array.isArray(commodities) || commodities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <p className="text-gray-500 mt-4">Loading commodities...</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
          <p className="font-medium">{error}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commodity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {commodities.map((commodity) => {
              const quantity = quantities[commodity.name] || 0;
              const totalCost = (quantity || 0) * (commodity.price || 0);
              
              return (
                <tr key={commodity.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {commodity.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(commodity.price || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatNumber(commodity.availableStock || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderQuantitySelector(commodity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      ${totalCost.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBuy(commodity)}
                        disabled={quantity === 0 || totalCost > walletBalance}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => handleSell(commodity)}
                        disabled={quantity === 0}
                        className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sell
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}