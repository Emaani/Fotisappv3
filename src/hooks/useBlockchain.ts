import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  connectWallet,
  switchToPolygon,
  getTokenBalance,
  getTokenPrice,
  getTokenQuality,
  getUserOrders,
  createBuyOrder,
  createSellOrder,
  cancelOrder
} from '../lib/blockchain';

export type CommodityType = 'Coffee-Robusta' | 'Coffee-Arabica' | 'Cocoa' | 'Sesame' | 'Sunflower';

export type Order = {
  id: string;
  trader: string;
  tokenAddress: string;
  orderType: 'BUY' | 'SELL';
  amount: string;
  price: string;
  timestamp: Date;
  status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  filledAmount: string;
};

export const useBlockchain = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect wallet
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Switch to Polygon network first
      await switchToPolygon();
      
      // Connect wallet
      const { signer: connectedSigner, address } = await connectWallet();
      
      setSigner(connectedSigner);
      setWalletAddress(address);
      setIsConnected(true);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setSigner(null);
    setWalletAddress(null);
    setIsConnected(false);
  }, []);

  // Get token balance
  const fetchTokenBalance = useCallback(async (tokenType: CommodityType) => {
    if (!walletAddress) return '0';
    
    try {
      return await getTokenBalance(tokenType, walletAddress);
    } catch (err) {
      console.error(`Error fetching ${tokenType} balance:`, err);
      return '0';
    }
  }, [walletAddress]);

  // Get token price
  const fetchTokenPrice = useCallback(async (tokenType: CommodityType) => {
    try {
      return await getTokenPrice(tokenType);
    } catch (err) {
      console.error(`Error fetching ${tokenType} price:`, err);
      return '0';
    }
  }, []);

  // Get token quality
  const fetchTokenQuality = useCallback(async (tokenType: CommodityType) => {
    try {
      return await getTokenQuality(tokenType);
    } catch (err) {
      console.error(`Error fetching ${tokenType} quality:`, err);
      return '0';
    }
  }, []);

  // Get user orders
  const fetchUserOrders = useCallback(async () => {
    if (!walletAddress) return [];
    
    try {
      return await getUserOrders(walletAddress);
    } catch (err) {
      console.error('Error fetching user orders:', err);
      return [];
    }
  }, [walletAddress]);

  // Create buy order
  const createBuy = useCallback(async (
    tokenType: CommodityType,
    amount: string,
    price: string
  ) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createBuyOrder(tokenType, amount, price, signer);
      return result;
    } catch (err) {
      console.error('Error creating buy order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create buy order');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signer]);

  // Create sell order
  const createSell = useCallback(async (
    tokenType: CommodityType,
    amount: string,
    price: string
  ) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createSellOrder(tokenType, amount, price, signer);
      return result;
    } catch (err) {
      console.error('Error creating sell order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create sell order');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signer]);

  // Cancel order
  const cancelUserOrder = useCallback(async (orderId: string) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await cancelOrder(orderId, signer);
      return result;
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signer]);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            // User is already connected
            connect();
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };
    
    checkConnection();
    
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          disconnect();
        } else {
          // User switched account
          connect();
        }
      });
      
      window.ethereum.on('chainChanged', () => {
        // Reload the page when the chain changes
        window.location.reload();
      });
    }
    
    return () => {
      // Clean up listeners
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    walletAddress,
    isLoading,
    error,
    connect,
    disconnect,
    fetchTokenBalance,
    fetchTokenPrice,
    fetchTokenQuality,
    fetchUserOrders,
    createBuy,
    createSell,
    cancelOrder: cancelUserOrder
  };
};
