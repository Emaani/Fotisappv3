import { PrismaClient, CommodityType } from '@prisma/client';
import { logger } from '../utils/logger';
import blockchainService from './blockchainService';

const prisma = new PrismaClient();

/**
 * Get current market data for all commodities
 */
export const getAllMarketData = async () => {
  try {
    const commodityTypes = Object.values(CommodityType);
    
    // Get latest market data for each commodity type
    const marketDataPromises = commodityTypes.map(async (type) => {
      try {
        // Get data from blockchain
        const blockchainData = await blockchainService.getMarketData(type);
        
        // Get latest data from database
        const latestData = await prisma.marketData.findFirst({
          where: { commodityType: type },
          orderBy: { timestamp: 'desc' }
        });
        
        return {
          type,
          price: parseFloat(blockchainData.price),
          quality: parseInt(blockchainData.quality),
          change24h: blockchainData.change24h,
          volume24h: latestData?.volume24h || 0
        };
      } catch (err) {
        logger.warn(`Failed to get market data for ${type}:`, err);
        
        // Fallback to database if blockchain call fails
        const latestData = await prisma.marketData.findFirst({
          where: { commodityType: type },
          orderBy: { timestamp: 'desc' }
        });
        
        return {
          type,
          price: latestData?.price || 0,
          quality: 0,
          change24h: latestData?.change24h || 0,
          volume24h: latestData?.volume24h || 0
        };
      }
    });
    
    const marketData = await Promise.all(marketDataPromises);
    
    return {
      success: true,
      marketData
    };
  } catch (error) {
    logger.error('Error getting all market data:', error);
    throw error;
  }
};

/**
 * Get market data for a specific commodity
 */
export const getCommodityMarketData = async (commodityType: CommodityType) => {
  try {
    // Get data from blockchain
    const blockchainData = await blockchainService.getMarketData(commodityType);
    
    // Get historical data from database
    const historicalData = await prisma.marketData.findMany({
      where: { commodityType },
      orderBy: { timestamp: 'desc' },
      take: 30 // Last 30 data points
    });
    
    // Get order book data
    const orders = await prisma.order.findMany({
      where: {
        commodity: { type: commodityType },
        status: 'OPEN'
      },
      include: {
        commodity: true
      }
    });
    
    // Separate buy and sell orders
    const buyOrders = orders
      .filter(order => order.type === 'BUY')
      .sort((a, b) => b.price - a.price); // Sort by price descending
    
    const sellOrders = orders
      .filter(order => order.type === 'SELL')
      .sort((a, b) => a.price - b.price); // Sort by price ascending
    
    // Calculate market price (midpoint between highest buy and lowest sell)
    let marketPrice = parseFloat(blockchainData.price);
    if (buyOrders.length > 0 && sellOrders.length > 0) {
      const highestBuy = buyOrders[0].price;
      const lowestSell = sellOrders[0].price;
      marketPrice = (highestBuy + lowestSell) / 2;
    }
    
    // Calculate trading volume
    const volume24h = historicalData.length > 0 ? historicalData[0].volume24h : 0;
    
    return {
      success: true,
      marketData: {
        type: commodityType,
        price: marketPrice,
        blockchainPrice: parseFloat(blockchainData.price),
        quality: parseInt(blockchainData.quality),
        change24h: blockchainData.change24h,
        volume24h,
        historicalData: historicalData.map(data => ({
          price: data.price,
          timestamp: data.timestamp,
          volume: data.volume24h,
          change: data.change24h
        })),
        orderBook: {
          buyOrders,
          sellOrders
        }
      }
    };
  } catch (error) {
    logger.error(`Error getting market data for ${commodityType}:`, error);
    throw error;
  }
};

/**
 * Update market data (for internal use)
 */
export const updateMarketData = async () => {
  try {
    // This function would be called by a scheduled job
    const commodityTypes = Object.values(CommodityType);
    
    // Update market data for each commodity type
    const updatePromises = commodityTypes.map(async (type) => {
      try {
        // Get data from blockchain
        const blockchainData = await blockchainService.getMarketData(type);
        
        // Get latest data from database
        const latestData = await prisma.marketData.findFirst({
          where: { commodityType: type },
          orderBy: { timestamp: 'desc' }
        });
        
        // Calculate 24h change
        let change24h = 0;
        if (latestData) {
          const currentPrice = parseFloat(blockchainData.price);
          const previousPrice = latestData.price;
          change24h = ((currentPrice - previousPrice) / previousPrice) * 100;
        }
        
        // Calculate trading volume (in a real system, this would be based on actual trades)
        // For now, we'll use a random value
        const volume24h = Math.random() * 1000;
        
        // Store current price in database
        await prisma.marketData.create({
          data: {
            commodityType: type,
            price: parseFloat(blockchainData.price),
            volume24h,
            change24h,
            timestamp: new Date(),
            source: 'blockchain'
          }
        });
        
        return {
          type,
          updated: true
        };
      } catch (err) {
        logger.warn(`Failed to update market data for ${type}:`, err);
        return {
          type,
          updated: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    });
    
    const results = await Promise.all(updatePromises);
    
    return {
      success: true,
      results
    };
  } catch (error) {
    logger.error('Error updating market data:', error);
    throw error;
  }
};

export default {
  getAllMarketData,
  getCommodityMarketData,
  updateMarketData
};
