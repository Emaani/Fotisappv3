import React, { useState, useEffect } from 'react';
import { useBlockchain, CommodityType } from '../../hooks/useBlockchain';
import OrderForm from './OrderForm';
import OrderList from './OrderList';
import CommodityInfo from './CommodityInfo';

const COMMODITY_TYPES: CommodityType[] = [
  'Coffee-Robusta',
  'Coffee-Arabica',
  'Cocoa',
  'Sesame',
  'Sunflower'
];

const CommodityTrading: React.FC = () => {
  const {
    isConnected,
    walletAddress,
    isLoading,
    error,
    fetchTokenBalance,
    fetchTokenPrice,
    fetchTokenQuality,
    fetchUserOrders,
    createBuy,
    createSell,
    cancelOrder
  } = useBlockchain();

  const [selectedCommodity, setSelectedCommodity] = useState<CommodityType>('Coffee-Robusta');
  const [balance, setBalance] = useState('0');
  const [price, setPrice] = useState('0');
  const [quality, setQuality] = useState('0');
  const [orders, setOrders] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch data when selected commodity changes or after actions
  useEffect(() => {
    const fetchData = async () => {
      if (isConnected && walletAddress) {
        try {
          const [balanceData, priceData, qualityData, ordersData] = await Promise.all([
            fetchTokenBalance(selectedCommodity),
            fetchTokenPrice(selectedCommodity),
            fetchTokenQuality(selectedCommodity),
            fetchUserOrders()
          ]);
          
          setBalance(balanceData);
          setPrice(priceData);
          setQuality(qualityData);
          setOrders(ordersData);
        } catch (err) {
          console.error('Error fetching blockchain data:', err);
        }
      }
    };
    
    fetchData();
  }, [
    isConnected,
    walletAddress,
    selectedCommodity,
    refreshTrigger,
    fetchTokenBalance,
    fetchTokenPrice,
    fetchTokenQuality,
    fetchUserOrders
  ]);

  // Handle buy order
  const handleBuy = async (amount: string, price: string) => {
    try {
      await createBuy(selectedCommodity, amount, price);
      // Refresh data after successful transaction
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Buy order failed:', err);
    }
  };

  // Handle sell order
  const handleSell = async (amount: string, price: string) => {
    try {
      await createSell(selectedCommodity, amount, price);
      // Refresh data after successful transaction
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Sell order failed:', err);
    }
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      // Refresh data after successful transaction
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Cancel order failed:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Agricultural Commodities Trading</h1>
      
      {!isConnected ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>Please connect your wallet to start trading.</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label htmlFor="commodity-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Commodity
            </label>
            <select
              id="commodity-select"
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value as CommodityType)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {COMMODITY_TYPES.map((commodity) => (
                <option key={commodity} value={commodity}>
                  {commodity}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <CommodityInfo
              commodity={selectedCommodity}
              balance={balance}
              price={price}
              quality={quality}
            />
            
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Place Order</h2>
                <OrderForm
                  onBuy={handleBuy}
                  onSell={handleSell}
                  currentPrice={price}
                  maxSellAmount={balance}
                  isLoading={isLoading}
                />
                
                {error && (
                  <div className="mt-4 text-red-500 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Orders</h2>
            <OrderList
              orders={orders}
              onCancelOrder={handleCancelOrder}
              isLoading={isLoading}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CommodityTrading;
