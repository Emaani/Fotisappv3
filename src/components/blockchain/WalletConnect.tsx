import React from 'react';
import { useBlockchain } from '../../hooks/useBlockchain';

const WalletConnect: React.FC = () => {
  const { 
    isConnected, 
    walletAddress, 
    isLoading, 
    error, 
    connect, 
    disconnect 
  } = useBlockchain();

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="wallet-connect">
      {isConnected && walletAddress ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            {formatAddress(walletAddress)}
          </span>
          <button
            onClick={disconnect}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={isLoading}
          className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
      
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
