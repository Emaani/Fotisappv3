import { ethers, providers } from 'ethers';
import CommodityTokenABI from '../../contracts/abis/CommodityToken.json';
import TradingEngineABI from '../../contracts/abis/TradingEngine.json';

// Contract addresses - these would be populated after deployment
const CONTRACT_ADDRESSES = {
  tradingEngine: process.env.NEXT_PUBLIC_TRADING_ENGINE_ADDRESS || '',
  commodityTokens: {
    'Coffee-Robusta': process.env.NEXT_PUBLIC_COFFEE_ROBUSTA_TOKEN_ADDRESS || '',
    'Coffee-Arabica': process.env.NEXT_PUBLIC_COFFEE_ARABICA_TOKEN_ADDRESS || '',
    'Cocoa': process.env.NEXT_PUBLIC_COCOA_TOKEN_ADDRESS || '',
    'Sesame': process.env.NEXT_PUBLIC_SESAME_TOKEN_ADDRESS || '',
    'Sunflower': process.env.NEXT_PUBLIC_SUNFLOWER_TOKEN_ADDRESS || '',
  }
};

// Network configuration
const NETWORK_CONFIG = {
  polygon: {
    chainId: '0x89', // 137 in hex
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: [process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com/']
  }
};

/**
 * Initialize Web3 provider
 */
export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  
  // Fallback to a read-only provider
  return new ethers.providers.JsonRpcProvider(NETWORK_CONFIG.polygon.rpcUrls[0]);
};

/**
 * Connect wallet and return signer
 */
export const connectWallet = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not found. Please install MetaMask or another wallet.');
  }
  
  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    return { signer, address };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

/**
 * Switch to Polygon network
 */
export const switchToPolygon = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not found');
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORK_CONFIG.polygon.chainId }]
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [NETWORK_CONFIG.polygon]
        });
      } catch (addError) {
        console.error('Error adding Polygon network:', addError);
        throw addError;
      }
    } else {
      console.error('Error switching to Polygon network:', switchError);
      throw switchError;
    }
  }
};

/**
 * Get CommodityToken contract instance
 */
export const getCommodityTokenContract = async (
  tokenType: keyof typeof CONTRACT_ADDRESSES.commodityTokens,
  signerOrProvider?: ethers.Signer | providers.Provider
) => {
  const provider = signerOrProvider || getProvider();
  const tokenAddress = CONTRACT_ADDRESSES.commodityTokens[tokenType];
  
  if (!tokenAddress) {
    throw new Error(`Contract address not found for ${tokenType}`);
  }
  
  return new ethers.Contract(tokenAddress, CommodityTokenABI, provider);
};

/**
 * Get TradingEngine contract instance
 */
export const getTradingEngineContract = async (
  signerOrProvider?: ethers.Signer | providers.Provider
) => {
  const provider = signerOrProvider || getProvider();
  const contractAddress = CONTRACT_ADDRESSES.tradingEngine;
  
  if (!contractAddress) {
    throw new Error('Trading Engine contract address not found');
  }
  
  return new ethers.Contract(contractAddress, TradingEngineABI, provider);
};

/**
 * Create a buy order
 */
export const createBuyOrder = async (
  tokenType: keyof typeof CONTRACT_ADDRESSES.commodityTokens,
  amount: string,
  price: string,
  signer: ethers.Signer
) => {
  const tradingEngine = await getTradingEngineContract(signer);
  const tokenAddress = CONTRACT_ADDRESSES.commodityTokens[tokenType];
  
  if (!tokenAddress) {
    throw new Error(`Contract address not found for ${tokenType}`);
  }
  
  const amountWei = ethers.utils.parseUnits(amount, 18);
  const priceWei = ethers.utils.parseUnits(price, 8); // 8 decimals for price
  
  const tx = await tradingEngine.createBuyOrder(tokenAddress, amountWei, priceWei);
  return await tx.wait();
};

/**
 * Create a sell order
 */
export const createSellOrder = async (
  tokenType: keyof typeof CONTRACT_ADDRESSES.commodityTokens,
  amount: string,
  price: string,
  signer: ethers.Signer
) => {
  const tradingEngine = await getTradingEngineContract(signer);
  const tokenAddress = CONTRACT_ADDRESSES.commodityTokens[tokenType];
  
  if (!tokenAddress) {
    throw new Error(`Contract address not found for ${tokenType}`);
  }
  
  // First approve the trading engine to transfer tokens
  const token = await getCommodityTokenContract(tokenType, signer);
  const amountWei = ethers.utils.parseUnits(amount, 18);
  const priceWei = ethers.utils.parseUnits(price, 8); // 8 decimals for price
  
  const approveTx = await token.approve(await tradingEngine.getAddress(), amountWei);
  await approveTx.wait();
  
  const tx = await tradingEngine.createSellOrder(tokenAddress, amountWei, priceWei);
  return await tx.wait();
};

/**
 * Cancel an order
 */
export const cancelOrder = async (
  orderId: string,
  signer: ethers.Signer
) => {
  const tradingEngine = await getTradingEngineContract(signer);
  
  const tx = await tradingEngine.cancelOrder(orderId);
  return await tx.wait();
};

/**
 * Get user orders
 */
export const getUserOrders = async (
  userAddress: string,
  signerOrProvider?: ethers.Signer | ethers.providers.Provider
) => {
  const tradingEngine = await getTradingEngineContract(signerOrProvider);
  
  const orderIds = await tradingEngine.getUserOrders(userAddress);
  
  const orders = await Promise.all(
    orderIds.map(async (id: bigint) => {
      const [
        trader,
        tokenAddress,
        orderType,
        amount,
        price,
        timestamp,
        status,
        filledAmount
      ] = await tradingEngine.getOrderDetails(id);
      
      return {
        id: id.toString(),
        trader,
        tokenAddress,
        orderType: orderType === 0 ? 'BUY' : 'SELL',
        amount: ethers.utils.formatUnits(amount, 18),
        price: ethers.utils.formatUnits(price, 8),
        timestamp: new Date(Number(timestamp) * 1000),
        status: ['OPEN', 'FILLED', 'CANCELLED', 'EXPIRED'][Number(status)],
        filledAmount: ethers.utils.formatUnits(filledAmount, 18)
      };
    })
  );
  
  return orders;
};

/**
 * Get token balance
 */
export const getTokenBalance = async (
  tokenType: keyof typeof CONTRACT_ADDRESSES.commodityTokens,
  userAddress: string,
  signerOrProvider?: ethers.Signer | providers.Provider
) => {
  const token = await getCommodityTokenContract(tokenType, signerOrProvider);
  const balance = await token.balanceOf(userAddress);
  return ethers.utils.formatUnits(balance, 18);
};

/**
 * Get token price
 */
export const getTokenPrice = async (
  tokenType: keyof typeof CONTRACT_ADDRESSES.commodityTokens,
  signerOrProvider?: ethers.Signer | providers.Provider
) => {
  const tradingEngine = await getTradingEngineContract(signerOrProvider);
  const tokenAddress = CONTRACT_ADDRESSES.commodityTokens[tokenType];
  
  if (!tokenAddress) {
    throw new Error(`Contract address not found for ${tokenType}`);
  }
  
  const price = await tradingEngine.getCommodityPrice(tokenAddress);
  return ethers.utils.formatUnits(price, 8);
};

/**
 * Get token quality score
 */
export const getTokenQuality = async (
  tokenType: keyof typeof CONTRACT_ADDRESSES.commodityTokens,
  signerOrProvider?: ethers.Signer | providers.Provider
) => {
  const token = await getCommodityTokenContract(tokenType, signerOrProvider);
  
  const quality = await token.qualityScore();
  return quality.toString();
};
