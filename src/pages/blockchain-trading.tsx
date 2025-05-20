import React from 'react';
import Head from 'next/head';
import WalletConnect from '../components/blockchain/WalletConnect';
import CommodityTrading from '../components/blockchain/CommodityTrading';

const BlockchainTradingPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Blockchain Trading | Agricultural Commodities Platform</title>
        <meta name="description" content="Trade agricultural commodities securely using blockchain technology" />
      </Head>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Blockchain Trading Platform</h1>
          <WalletConnect />
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">About Blockchain Trading</h2>
          <p className="mb-4">
            Our blockchain-based trading platform provides secure, transparent, and efficient trading of agricultural commodities.
            Built on Ethereum with Polygon L2 scaling, it offers high performance with low transaction costs.
          </p>
          <p className="mb-4">
            Key features:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>Secure trading with smart contracts</li>
            <li>Real-time price feeds via Chainlink oracles</li>
            <li>Regulatory compliance built-in</li>
            <li>Quality verification for commodities</li>
            <li>High performance (1000+ TPS)</li>
            <li>Low latency (max 2-second)</li>
          </ul>
          <p>
            Connect your wallet to start trading agricultural commodities on the blockchain.
          </p>
        </div>
        
        <CommodityTrading />
      </div>
    </>
  );
};

export default BlockchainTradingPage;
