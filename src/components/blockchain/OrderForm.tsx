import React, { useState, useEffect } from 'react';

interface OrderFormProps {
  onBuy: (amount: string, price: string) => Promise<void>;
  onSell: (amount: string, price: string) => Promise<void>;
  currentPrice: string;
  maxSellAmount: string;
  isLoading: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({
  onBuy,
  onSell,
  currentPrice,
  maxSellAmount,
  isLoading
}) => {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [totalCost, setTotalCost] = useState('0');
  
  // Update price when currentPrice changes
  useEffect(() => {
    setPrice(currentPrice);
  }, [currentPrice]);
  
  // Calculate total cost when amount or price changes
  useEffect(() => {
    if (amount && price) {
      const total = parseFloat(amount) * parseFloat(price);
      setTotalCost(total.toFixed(2));
    } else {
      setTotalCost('0');
    }
  }, [amount, price]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !price) {
      return;
    }
    
    try {
      if (orderType === 'buy') {
        await onBuy(amount, price);
      } else {
        await onSell(amount, price);
      }
      
      // Reset form after successful submission
      setAmount('');
    } catch (error) {
      console.error('Order submission failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-4">
        <button
          type="button"
          className={`flex-1 py-2 px-4 rounded-md ${
            orderType === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setOrderType('buy')}
        >
          Buy
        </button>
        <button
          type="button"
          className={`flex-1 py-2 px-4 rounded-md ${
            orderType === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setOrderType('sell')}
        >
          Sell
        </button>
      </div>
      
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <div className="relative">
          <input
            id="amount"
            type="number"
            min="0.000001"
            step="0.000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          {orderType === 'sell' && (
            <button
              type="button"
              className="absolute right-2 top-2 text-xs bg-gray-200 px-2 py-1 rounded"
              onClick={() => setAmount(maxSellAmount)}
            >
              Max
            </button>
          )}
        </div>
        {orderType === 'sell' && (
          <p className="text-xs text-gray-500 mt-1">
            Available: {maxSellAmount}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
          Price (USD)
        </label>
        <input
          id="price"
          type="number"
          min="0.01"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Current market price: ${currentPrice}
        </p>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-md">
        <div className="flex justify-between">
          <span className="font-medium">Total:</span>
          <span className="font-bold">${totalCost} USD</span>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading || !amount || !price}
        className={`w-full py-2 px-4 rounded-md ${
          orderType === 'buy'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        } text-white font-medium transition-colors ${
          isLoading ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {isLoading
          ? 'Processing...'
          : orderType === 'buy'
          ? 'Place Buy Order'
          : 'Place Sell Order'}
      </button>
    </form>
  );
};

export default OrderForm;
