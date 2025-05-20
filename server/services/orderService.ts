import { PrismaClient, OrderType, OrderStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import blockchainService from './blockchainService';

const prisma = new PrismaClient();

/**
 * Get orders for a user
 */
export const getUserOrders = async (userId: string) => {
  try {
    // Get orders from database
    const dbOrders = await prisma.order.findMany({
      where: { userId },
      include: {
        commodity: true,
        transactions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get orders from blockchain
    const blockchainResult = await blockchainService.getUserOrders(userId);
    const blockchainOrders = blockchainResult.orders;

    // Merge blockchain data with database data
    const orders = dbOrders.map(dbOrder => {
      const blockchainOrder = blockchainOrders.find(
        bo => bo.dbId === dbOrder.id || bo.id === dbOrder.orderId
      );

      return {
        ...dbOrder,
        blockchainData: blockchainOrder || null
      };
    });

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
 * Get order by ID
 */
export const getOrderById = async (orderId: string) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        commodity: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            profile: true
          }
        },
        transactions: {
          include: {
            buyer: {
              select: {
                id: true,
                email: true,
                name: true,
                profile: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Get blockchain order data if available
    let blockchainData = null;
    if (order.orderId) {
      try {
        const tradingEngine = await blockchainService.getTradingEngineContract();
        const [
          trader,
          tokenAddress,
          orderType,
          amount,
          price,
          timestamp,
          status,
          filledAmount
        ] = await tradingEngine.getOrderDetails(order.orderId);

        blockchainData = {
          trader,
          tokenAddress,
          orderType: orderType === 0 ? 'BUY' : 'SELL',
          amount: ethers.formatUnits(amount, 18),
          price: ethers.formatUnits(price, 8),
          timestamp: new Date(Number(timestamp) * 1000),
          status: ['OPEN', 'FILLED', 'CANCELLED', 'EXPIRED'][Number(status)],
          filledAmount: ethers.formatUnits(filledAmount, 18)
        };
      } catch (err) {
        logger.warn(`Failed to get blockchain data for order ${orderId}:`, err);
      }
    }

    return {
      success: true,
      order: {
        ...order,
        blockchainData
      }
    };
  } catch (error) {
    logger.error('Error getting order by ID:', error);
    throw error;
  }
};

/**
 * Create a new order
 */
export const createOrder = async (
  userId: string,
  data: {
    commodityId: string;
    type: OrderType;
    quantity: number;
    price: number;
  }
) => {
  try {
    // Calculate total amount
    const totalAmount = data.quantity * data.price;

    // Get commodity details
    const commodity = await prisma.commodity.findUnique({
      where: { id: data.commodityId }
    });

    if (!commodity) {
      throw new Error(`Commodity with ID ${data.commodityId} not found`);
    }

    // For sell orders, check if user owns the commodity
    if (data.type === OrderType.SELL) {
      if (commodity.ownerId !== userId) {
        throw new Error(`User ${userId} does not own commodity ${data.commodityId}`);
      }

      if (!commodity.isTokenized) {
        throw new Error(`Commodity ${data.commodityId} is not tokenized`);
      }

      // Create sell order on blockchain
      const result = await blockchainService.createSellOrder(
        userId,
        data.commodityId,
        data.quantity,
        data.price
      );

      return result;
    } 
    // For buy orders
    else {
      // Check if user has enough funds in wallet
      const userWallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!userWallet) {
        throw new Error(`Wallet not found for user ${userId}`);
      }

      if (userWallet.balance < totalAmount) {
        throw new Error(`Insufficient funds to place buy order. Required: ${totalAmount}, Available: ${userWallet.balance}`);
      }

      // Create buy order on blockchain
      const result = await blockchainService.createBuyOrder(
        userId,
        commodity.type,
        data.quantity,
        data.price
      );

      // Deduct funds from user's wallet
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: totalAmount
          }
        }
      });

      return result;
    }
  } catch (error) {
    logger.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (
  userId: string,
  orderId: string
) => {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    if (order.userId !== userId) {
      throw new Error(`User ${userId} does not own order ${orderId}`);
    }

    if (order.status !== OrderStatus.OPEN && order.status !== OrderStatus.PENDING) {
      throw new Error(`Order with ID ${orderId} cannot be cancelled (status: ${order.status})`);
    }

    // Cancel order on blockchain
    const result = await blockchainService.cancelOrder(userId, orderId);

    // If it was a buy order, refund the user's wallet
    if (order.type === OrderType.BUY) {
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: order.totalAmount
          }
        }
      });
    }

    return result;
  } catch (error) {
    logger.error('Error cancelling order:', error);
    throw error;
  }
};

/**
 * Get order book for a commodity
 */
export const getOrderBook = async (commodityType: string) => {
  try {
    // Get all open orders for this commodity type
    const orders = await prisma.order.findMany({
      where: {
        status: OrderStatus.OPEN,
        commodity: {
          type: commodityType as any
        }
      },
      include: {
        commodity: true
      },
      orderBy: [
        {
          type: 'asc'
        },
        {
          price: 'asc'
        }
      ]
    });

    // Separate buy and sell orders
    const buyOrders = orders
      .filter(order => order.type === OrderType.BUY)
      .sort((a, b) => b.price - a.price); // Sort buy orders by price descending

    const sellOrders = orders
      .filter(order => order.type === OrderType.SELL)
      .sort((a, b) => a.price - b.price); // Sort sell orders by price ascending

    // Calculate market price (midpoint between highest buy and lowest sell)
    let marketPrice = 0;
    if (buyOrders.length > 0 && sellOrders.length > 0) {
      const highestBuy = buyOrders[0].price;
      const lowestSell = sellOrders[0].price;
      marketPrice = (highestBuy + lowestSell) / 2;
    } else if (buyOrders.length > 0) {
      marketPrice = buyOrders[0].price;
    } else if (sellOrders.length > 0) {
      marketPrice = sellOrders[0].price;
    }

    // Get market data from blockchain
    const marketData = await blockchainService.getMarketData(commodityType);

    return {
      success: true,
      buyOrders,
      sellOrders,
      marketPrice,
      blockchainPrice: parseFloat(marketData.price),
      change24h: marketData.change24h
    };
  } catch (error) {
    logger.error('Error getting order book:', error);
    throw error;
  }
};

/**
 * Match orders (for internal use)
 */
export const matchOrders = async () => {
  try {
    // This function would be called by a scheduled job
    // It would check for matching orders and execute trades
    // In our case, the blockchain handles order matching automatically
    // This function could be used to sync the database with blockchain state
    
    // Get all open orders
    const openOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.OPEN
      },
      include: {
        commodity: true
      }
    });

    // For each order, check its status on the blockchain
    for (const order of openOrders) {
      if (!order.orderId) continue;

      try {
        const tradingEngine = await blockchainService.getTradingEngineContract();
        const [
          trader,
          tokenAddress,
          orderType,
          amount,
          price,
          timestamp,
          status,
          filledAmount
        ] = await tradingEngine.getOrderDetails(order.orderId);

        const blockchainStatus = ['OPEN', 'FILLED', 'CANCELLED', 'EXPIRED'][Number(status)];
        
        // Update order status in database if it has changed
        if (
          (blockchainStatus === 'FILLED' && order.status !== OrderStatus.FILLED) ||
          (blockchainStatus === 'CANCELLED' && order.status !== OrderStatus.CANCELLED) ||
          (blockchainStatus === 'EXPIRED' && order.status !== OrderStatus.EXPIRED)
        ) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: blockchainStatus as any
            }
          });

          // If order was filled, update commodity ownership
          if (blockchainStatus === 'FILLED' && order.type === OrderType.BUY) {
            // Find the corresponding sell order
            const sellOrder = await prisma.order.findFirst({
              where: {
                commodityId: order.commodityId,
                type: OrderType.SELL,
                status: OrderStatus.OPEN
              }
            });

            if (sellOrder) {
              // Update commodity ownership
              await prisma.commodity.update({
                where: { id: order.commodityId },
                data: {
                  ownerId: order.userId,
                  status: 'SOLD'
                }
              });

              // Update sell order status
              await prisma.order.update({
                where: { id: sellOrder.id },
                data: {
                  status: OrderStatus.FILLED
                }
              });

              // Create transaction record
              await prisma.transaction.create({
                data: {
                  orderId: sellOrder.id,
                  buyerId: order.userId,
                  amount: order.totalAmount,
                  fee: order.totalAmount * 0.01, // 1% fee
                  status: 'COMPLETED',
                  blockchainTxHash: order.blockchainTxHash
                }
              });
            }
          }
        }
      } catch (err) {
        logger.warn(`Failed to check blockchain status for order ${order.id}:`, err);
      }
    }

    return {
      success: true,
      message: 'Order matching completed'
    };
  } catch (error) {
    logger.error('Error matching orders:', error);
    throw error;
  }
};

export default {
  getUserOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  getOrderBook,
  matchOrders
};
