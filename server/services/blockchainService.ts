import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import CommodityTokenABI from '../../contracts/abis/CommodityToken.json';
import TradingEngineABI from '../../contracts/abis/TradingEngine.json';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Contract addresses - these would be populated from environment variables
const CONTRACT_ADDRESSES = {
  tradingEngine: process.env.TRADING_ENGINE_ADDRESS || '',
  commodityTokens: {
    'COFFEE_ROBUSTA': process.env.COFFEE_ROBUSTA_TOKEN_ADDRESS || '',
    'COFFEE_ARABICA': process.env.COFFEE_ARABICA_TOKEN_ADDRESS || '',
    'COCOA': process.env.COCOA_TOKEN_ADDRESS || '',
    'SESAME': process.env.SESAME_TOKEN_ADDRESS || '',
    'SUNFLOWER': process.env.SUNFLOWER_TOKEN_ADDRESS || '',
  }
};

// Network configuration
const NETWORK_CONFIG = {
  polygon: {
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    blockExplorerUrl: 'https://polygonscan.com/'
  }
};

/**
 * Initialize provider for server-side blockchain interactions
 */
const getProvider = (network = 'polygon') => {
  const config = NETWORK_CONFIG[network as keyof typeof NETWORK_CONFIG];
  if (!config) {
    throw new Error(`Network ${network} not supported`);
  }
  
  return new ethers.JsonRpcProvider(config.rpcUrl);
};

/**
 * Get signer for server-side blockchain interactions
 */
const getSigner = (network = 'polygon') => {
  const provider = getProvider(network);
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('BLOCKCHAIN_PRIVATE_KEY environment variable not set');
  }
  
  return new ethers.Wallet(privateKey, provider);
};

/**
 * Get CommodityToken contract instance
 */
const getCommodityTokenContract = async (
  tokenType: keyof typeof CONTRACT_ADDRESSES.commodityTokens,
  signerOrProvider?: ethers.Signer | ethers.Provider
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
const getTradingEngineContract = async (
  signerOrProvider?: ethers.Signer | ethers.Provider
) => {
  const provider = signerOrProvider || getProvider();
  const contractAddress = CONTRACT_ADDRESSES.tradingEngine;
  
  if (!contractAddress) {
    throw new Error('Trading Engine contract address not found');
  }
  
  return new ethers.Contract(contractAddress, TradingEngineABI, provider);
};

/**
 * Tokenize a commodity
 * @param commodityId The ID of the commodity to tokenize
 * @param quantity The quantity to tokenize
 * @param qualityScore The quality score (0-100)
 */
export const tokenizeCommodity = async (
  commodityId: string,
  quantity: number,
  qualityScore: number
) => {
  try {
    // Get commodity details from database
    const commodity = await prisma.commodity.findUnique({
      where: { id: commodityId },
      include: { owner: true }
    });

    if (!commodity) {
      throw new Error(`Commodity with ID ${commodityId} not found`);
    }

    if (commodity.isTokenized) {
      throw new Error(`Commodity with ID ${commodityId} is already tokenized`);
    }

    // Get the appropriate token contract based on commodity type
    const tokenType = commodity.type as keyof typeof CONTRACT_ADDRESSES.commodityTokens;
    const signer = getSigner();
    const tokenContract = await getCommodityTokenContract(tokenType, signer);

    // Find or create blockchain wallet for the owner
    const ownerWallet = await prisma.blockchainWallet.findFirst({
      where: { 
        userId: commodity.ownerId,
        isPrimary: true
      }
    });

    if (!ownerWallet) {
      throw new Error(`No primary blockchain wallet found for user ${commodity.ownerId}`);
    }

    // Convert quantity to token amount (with 18 decimals)
    const tokenAmount = ethers.parseUnits(quantity.toString(), 18);

    // Set compliance status for the owner's wallet address
    const setComplianceTx = await tokenContract.setComplianceStatus(ownerWallet.address, true);
    await setComplianceTx.wait();

    // Update quality score
    const updateQualityTx = await tokenContract.validateQuality(qualityScore);
    await updateQualityTx.wait();

    // Mint tokens to the owner's wallet
    const mintTx = await tokenContract.restrictedMint(ownerWallet.address, tokenAmount);
    const receipt = await mintTx.wait();

    // Record the transaction in the database
    const blockchainTx = await prisma.blockchainTransaction.create({
      data: {
        txHash: receipt.hash,
        network: 'polygon',
        fromAddress: await signer.getAddress(),
        toAddress: ownerWallet.address,
        value: tokenAmount.toString(),
        status: 'CONFIRMED',
        blockNumber: receipt.blockNumber,
        timestamp: new Date(),
        functionName: 'restrictedMint',
        functionArgs: {
          to: ownerWallet.address,
          amount: tokenAmount.toString(),
          commodityId
        }
      }
    });

    // Update commodity in database
    const updatedCommodity = await prisma.commodity.update({
      where: { id: commodityId },
      data: {
        isTokenized: true,
        tokenAddress: await tokenContract.getAddress(),
        quality: qualityScore,
        status: 'TOKENIZED'
      }
    });

    return {
      success: true,
      commodity: updatedCommodity,
      transaction: blockchainTx
    };
  } catch (error) {
    logger.error('Error tokenizing commodity:', error);
    throw error;
  }
};

/**
 * Create a buy order on the blockchain
 */
export const createBuyOrder = async (
  userId: string,
  commodityType: string,
  quantity: number,
  price: number
) => {
  try {
    // Get user's blockchain wallet
    const userWallet = await prisma.blockchainWallet.findFirst({
      where: { 
        userId,
        isPrimary: true
      }
    });

    if (!userWallet) {
      throw new Error(`No primary blockchain wallet found for user ${userId}`);
    }

    // Get the appropriate token contract based on commodity type
    const tokenType = commodityType as keyof typeof CONTRACT_ADDRESSES.commodityTokens;
    const signer = getSigner();
    const tokenContract = await getCommodityTokenContract(tokenType, signer);
    const tradingEngine = await getTradingEngineContract(signer);

    // Convert quantity and price to blockchain format
    const amountWei = ethers.parseUnits(quantity.toString(), 18);
    const priceWei = ethers.parseUnits(price.toString(), 8); // 8 decimals for price

    // Create buy order
    const tx = await tradingEngine.createBuyOrder(
      await tokenContract.getAddress(),
      amountWei,
      priceWei
    );
    const receipt = await tx.wait();

    // Extract order ID from event logs
    const orderCreatedEvent = receipt.logs
      .filter((log: any) => log.fragment?.name === 'OrderCreated')
      .map((log: any) => tradingEngine.interface.parseLog(log))[0];

    const blockchainOrderId = orderCreatedEvent.args.orderId.toString();

    // Record the transaction in the database
    const blockchainTx = await prisma.blockchainTransaction.create({
      data: {
        txHash: receipt.hash,
        network: 'polygon',
        fromAddress: await signer.getAddress(),
        toAddress: await tradingEngine.getAddress(),
        value: '0',
        status: 'CONFIRMED',
        blockNumber: receipt.blockNumber,
        timestamp: new Date(),
        functionName: 'createBuyOrder',
        functionArgs: {
          tokenAddress: await tokenContract.getAddress(),
          amount: amountWei.toString(),
          price: priceWei.toString()
        }
      }
    });

    // Create a commodity placeholder for the buy order
    const commodity = await prisma.commodity.create({
      data: {
        name: `${commodityType} Buy Order`,
        type: commodityType as any,
        quantity,
        ownerId: userId,
        status: 'PENDING',
        tokenAddress: await tokenContract.getAddress()
      }
    });

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderId: blockchainOrderId,
        userId,
        commodityId: commodity.id,
        type: 'BUY',
        quantity,
        price,
        totalAmount: quantity * price,
        status: 'OPEN',
        blockchainTxHash: receipt.hash
      }
    });

    return {
      success: true,
      order,
      blockchainOrderId,
      transaction: blockchainTx
    };
  } catch (error) {
    logger.error('Error creating buy order:', error);
    throw error;
  }
};

/**
 * Create a sell order on the blockchain
 */
export const createSellOrder = async (
  userId: string,
  commodityId: string,
  quantity: number,
  price: number
) => {
  try {
    // Get commodity details
    const commodity = await prisma.commodity.findUnique({
      where: { id: commodityId }
    });

    if (!commodity) {
      throw new Error(`Commodity with ID ${commodityId} not found`);
    }

    if (!commodity.isTokenized) {
      throw new Error(`Commodity with ID ${commodityId} is not tokenized`);
    }

    if (commodity.ownerId !== userId) {
      throw new Error(`User ${userId} does not own commodity ${commodityId}`);
    }

    // Get user's blockchain wallet
    const userWallet = await prisma.blockchainWallet.findFirst({
      where: { 
        userId,
        isPrimary: true
      }
    });

    if (!userWallet) {
      throw new Error(`No primary blockchain wallet found for user ${userId}`);
    }

    // Get the token contract
    const tokenType = commodity.type as keyof typeof CONTRACT_ADDRESSES.commodityTokens;
    const signer = getSigner();
    const tokenContract = await getCommodityTokenContract(tokenType, signer);
    const tradingEngine = await getTradingEngineContract(signer);

    // Convert quantity and price to blockchain format
    const amountWei = ethers.parseUnits(quantity.toString(), 18);
    const priceWei = ethers.parseUnits(price.toString(), 8); // 8 decimals for price

    // Approve trading engine to transfer tokens
    const approveTx = await tokenContract.connect(signer).approve(
      await tradingEngine.getAddress(),
      amountWei
    );
    await approveTx.wait();

    // Create sell order
    const tx = await tradingEngine.createSellOrder(
      await tokenContract.getAddress(),
      amountWei,
      priceWei
    );
    const receipt = await tx.wait();

    // Extract order ID from event logs
    const orderCreatedEvent = receipt.logs
      .filter((log: any) => log.fragment?.name === 'OrderCreated')
      .map((log: any) => tradingEngine.interface.parseLog(log))[0];

    const blockchainOrderId = orderCreatedEvent.args.orderId.toString();

    // Record the transaction in the database
    const blockchainTx = await prisma.blockchainTransaction.create({
      data: {
        txHash: receipt.hash,
        network: 'polygon',
        fromAddress: await signer.getAddress(),
        toAddress: await tradingEngine.getAddress(),
        value: '0',
        status: 'CONFIRMED',
        blockNumber: receipt.blockNumber,
        timestamp: new Date(),
        functionName: 'createSellOrder',
        functionArgs: {
          tokenAddress: await tokenContract.getAddress(),
          amount: amountWei.toString(),
          price: priceWei.toString()
        }
      }
    });

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderId: blockchainOrderId,
        userId,
        commodityId,
        type: 'SELL',
        quantity,
        price,
        totalAmount: quantity * price,
        status: 'OPEN',
        blockchainTxHash: receipt.hash
      }
    });

    // Update commodity status
    await prisma.commodity.update({
      where: { id: commodityId },
      data: {
        status: 'LISTED'
      }
    });

    return {
      success: true,
      order,
      blockchainOrderId,
      transaction: blockchainTx
    };
  } catch (error) {
    logger.error('Error creating sell order:', error);
    throw error;
  }
};

/**
 * Cancel an order on the blockchain
 */
export const cancelOrder = async (
  userId: string,
  orderId: string
) => {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { commodity: true }
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    if (order.userId !== userId) {
      throw new Error(`User ${userId} does not own order ${orderId}`);
    }

    if (order.status !== 'OPEN' && order.status !== 'PARTIALLY_FILLED') {
      throw new Error(`Order with ID ${orderId} cannot be cancelled (status: ${order.status})`);
    }

    // Get blockchain order ID
    if (!order.orderId) {
      throw new Error(`Order with ID ${orderId} does not have a blockchain order ID`);
    }

    // Get trading engine contract
    const signer = getSigner();
    const tradingEngine = await getTradingEngineContract(signer);

    // Cancel order on blockchain
    const tx = await tradingEngine.cancelOrder(order.orderId);
    const receipt = await tx.wait();

    // Record the transaction in the database
    const blockchainTx = await prisma.blockchainTransaction.create({
      data: {
        txHash: receipt.hash,
        network: 'polygon',
        fromAddress: await signer.getAddress(),
        toAddress: await tradingEngine.getAddress(),
        value: '0',
        status: 'CONFIRMED',
        blockNumber: receipt.blockNumber,
        timestamp: new Date(),
        functionName: 'cancelOrder',
        functionArgs: {
          orderId: order.orderId
        }
      }
    });

    // Update order status in database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED'
      }
    });

    // If it was a sell order, update commodity status
    if (order.type === 'SELL') {
      await prisma.commodity.update({
        where: { id: order.commodityId },
        data: {
          status: 'TOKENIZED' // Reset to tokenized state
        }
      });
    }

    return {
      success: true,
      order: updatedOrder,
      transaction: blockchainTx
    };
  } catch (error) {
    logger.error('Error cancelling order:', error);
    throw error;
  }
};

/**
 * Get token balance for a user
 */
export const getTokenBalance = async (
  userId: string,
  commodityType: string
) => {
  try {
    // Get user's blockchain wallet
    const userWallet = await prisma.blockchainWallet.findFirst({
      where: { 
        userId,
        isPrimary: true
      }
    });

    if (!userWallet) {
      throw new Error(`No primary blockchain wallet found for user ${userId}`);
    }

    // Get the token contract
    const tokenType = commodityType as keyof typeof CONTRACT_ADDRESSES.commodityTokens;
    const provider = getProvider();
    const tokenContract = await getCommodityTokenContract(tokenType, provider);

    // Get balance
    const balance = await tokenContract.balanceOf(userWallet.address);
    
    return {
      success: true,
      balance: ethers.formatUnits(balance, 18),
      tokenType: commodityType
    };
  } catch (error) {
    logger.error('Error getting token balance:', error);
    throw error;
  }
};

/**
 * Get market data for a commodity
 */
export const getMarketData = async (commodityType: string) => {
  try {
    // Get the token contract
    const tokenType = commodityType as keyof typeof CONTRACT_ADDRESSES.commodityTokens;
    const provider = getProvider();
    const tokenContract = await getCommodityTokenContract(tokenType, provider);

    // Get price from contract
    const price = await tokenContract.pricePerUnit();
    const formattedPrice = ethers.formatUnits(price, 8);

    // Get quality score
    const quality = await tokenContract.qualityScore();

    // Get latest market data from database
    const latestMarketData = await prisma.marketData.findFirst({
      where: { commodityType: commodityType as any },
      orderBy: { timestamp: 'desc' }
    });

    // Calculate 24h change if we have historical data
    let change24h = 0;
    if (latestMarketData) {
      const currentPrice = parseFloat(formattedPrice);
      const previousPrice = latestMarketData.price;
      change24h = ((currentPrice - previousPrice) / previousPrice) * 100;
    }

    // Store current price in database
    await prisma.marketData.create({
      data: {
        commodityType: commodityType as any,
        price: parseFloat(formattedPrice),
        volume24h: 0, // This would come from actual trading volume
        change24h,
        timestamp: new Date(),
        source: 'blockchain'
      }
    });

    return {
      success: true,
      price: formattedPrice,
      quality: quality.toString(),
      change24h,
      tokenType: commodityType
    };
  } catch (error) {
    logger.error('Error getting market data:', error);
    throw error;
  }
};

/**
 * Get user orders from blockchain
 */
export const getUserOrders = async (userId: string) => {
  try {
    // Get user's blockchain wallet
    const userWallet = await prisma.blockchainWallet.findFirst({
      where: { 
        userId,
        isPrimary: true
      }
    });

    if (!userWallet) {
      throw new Error(`No primary blockchain wallet found for user ${userId}`);
    }

    // Get trading engine contract
    const provider = getProvider();
    const tradingEngine = await getTradingEngineContract(provider);

    // Get order IDs from blockchain
    const orderIds = await tradingEngine.getUserOrders(userWallet.address);

    // Get order details for each ID
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

        // Find corresponding order in database
        const dbOrder = await prisma.order.findFirst({
          where: { orderId: id.toString() },
          include: { commodity: true }
        });

        return {
          id: id.toString(),
          dbId: dbOrder?.id,
          trader,
          tokenAddress,
          orderType: orderType === 0 ? 'BUY' : 'SELL',
          amount: ethers.formatUnits(amount, 18),
          price: ethers.formatUnits(price, 8),
          timestamp: new Date(Number(timestamp) * 1000),
          status: ['OPEN', 'FILLED', 'CANCELLED', 'EXPIRED'][Number(status)],
          filledAmount: ethers.formatUnits(filledAmount, 18),
          commodity: dbOrder?.commodity
        };
      })
    );

    return {
      success: true,
      orders
    };
  } catch (error) {
    logger.error('Error getting user orders:', error);
    throw error;
  }
};

/**
 * Create a blockchain wallet for a user
 */
export const createBlockchainWallet = async (userId: string) => {
  try {
    // Check if user already has a primary wallet
    const existingWallet = await prisma.blockchainWallet.findFirst({
      where: { 
        userId,
        isPrimary: true
      }
    });

    if (existingWallet) {
      return {
        success: true,
        wallet: existingWallet,
        message: 'User already has a primary wallet'
      };
    }

    // Create a new wallet
    const wallet = ethers.Wallet.createRandom();
    
    // Save wallet to database (in a real system, you'd encrypt the private key)
    const dbWallet = await prisma.blockchainWallet.create({
      data: {
        userId,
        address: wallet.address,
        network: 'polygon',
        isVerified: true,
        isPrimary: true
      }
    });

    // Return wallet info (in a real system, you'd securely provide the private key to the user)
    return {
      success: true,
      wallet: dbWallet,
      privateKey: wallet.privateKey // In production, handle this securely!
    };
  } catch (error) {
    logger.error('Error creating blockchain wallet:', error);
    throw error;
  }
};

export default {
  tokenizeCommodity,
  createBuyOrder,
  createSellOrder,
  cancelOrder,
  getTokenBalance,
  getMarketData,
  getUserOrders,
  createBlockchainWallet
};
