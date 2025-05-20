import { PrismaClient, CommodityType, CommodityStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import blockchainService from './blockchainService';

const prisma = new PrismaClient();

/**
 * Create a new commodity
 */
export const createCommodity = async (
  userId: string,
  data: {
    name: string;
    type: CommodityType;
    quantity: number;
    quality?: number;
    location?: string;
    harvestDate?: Date;
    expiryDate?: Date;
  }
) => {
  try {
    // Create commodity in database
    const commodity = await prisma.commodity.create({
      data: {
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        quality: data.quality || 0,
        location: data.location,
        harvestDate: data.harvestDate,
        expiryDate: data.expiryDate,
        ownerId: userId,
        status: CommodityStatus.PENDING
      }
    });

    return {
      success: true,
      commodity
    };
  } catch (error) {
    logger.error('Error creating commodity:', error);
    throw error;
  }
};

/**
 * Get commodities owned by a user
 */
export const getUserCommodities = async (userId: string) => {
  try {
    const commodities = await prisma.commodity.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      commodities
    };
  } catch (error) {
    logger.error('Error getting user commodities:', error);
    throw error;
  }
};

/**
 * Get commodity by ID
 */
export const getCommodityById = async (commodityId: string) => {
  try {
    const commodity = await prisma.commodity.findUnique({
      where: { id: commodityId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            profile: true
          }
        },
        inspection: true
      }
    });

    if (!commodity) {
      throw new Error(`Commodity with ID ${commodityId} not found`);
    }

    return {
      success: true,
      commodity
    };
  } catch (error) {
    logger.error('Error getting commodity by ID:', error);
    throw error;
  }
};

/**
 * Update commodity details
 */
export const updateCommodity = async (
  userId: string,
  commodityId: string,
  data: {
    name?: string;
    quantity?: number;
    quality?: number;
    location?: string;
    harvestDate?: Date;
    expiryDate?: Date;
  }
) => {
  try {
    // Check if commodity exists and belongs to user
    const commodity = await prisma.commodity.findUnique({
      where: { id: commodityId }
    });

    if (!commodity) {
      throw new Error(`Commodity with ID ${commodityId} not found`);
    }

    if (commodity.ownerId !== userId) {
      throw new Error(`User ${userId} does not own commodity ${commodityId}`);
    }

    // Don't allow updating tokenized commodities
    if (commodity.isTokenized) {
      throw new Error(`Cannot update tokenized commodity ${commodityId}`);
    }

    // Update commodity
    const updatedCommodity = await prisma.commodity.update({
      where: { id: commodityId },
      data
    });

    return {
      success: true,
      commodity: updatedCommodity
    };
  } catch (error) {
    logger.error('Error updating commodity:', error);
    throw error;
  }
};

/**
 * Request inspection for a commodity
 */
export const requestInspection = async (
  userId: string,
  commodityId: string,
  inspectionData: {
    inspectorName: string;
    date: Date;
    location: string;
    notes?: string;
  }
) => {
  try {
    // Check if commodity exists and belongs to user
    const commodity = await prisma.commodity.findUnique({
      where: { id: commodityId }
    });

    if (!commodity) {
      throw new Error(`Commodity with ID ${commodityId} not found`);
    }

    if (commodity.ownerId !== userId) {
      throw new Error(`User ${userId} does not own commodity ${commodityId}`);
    }

    // Don't allow inspection for already tokenized commodities
    if (commodity.isTokenized) {
      throw new Error(`Cannot request inspection for tokenized commodity ${commodityId}`);
    }

    // Create inspection
    const inspection = await prisma.inspection.create({
      data: {
        inspectorName: inspectionData.inspectorName,
        date: inspectionData.date,
        location: inspectionData.location,
        notes: inspectionData.notes,
        qualityScore: 0, // Will be updated after inspection
        status: 'PENDING',
        commodities: {
          connect: { id: commodityId }
        }
      }
    });

    // Update commodity status
    await prisma.commodity.update({
      where: { id: commodityId },
      data: {
        status: CommodityStatus.PENDING,
        inspectionId: inspection.id
      }
    });

    return {
      success: true,
      inspection
    };
  } catch (error) {
    logger.error('Error requesting inspection:', error);
    throw error;
  }
};

/**
 * Complete inspection for a commodity
 */
export const completeInspection = async (
  inspectionId: string,
  inspectionResult: {
    qualityScore: number;
    moistureContent?: number;
    impurities?: number;
    notes?: string;
    documents?: Array<{
      documentType: string;
      documentUrl: string;
    }>;
  }
) => {
  try {
    // Check if inspection exists
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { commodities: true }
    });

    if (!inspection) {
      throw new Error(`Inspection with ID ${inspectionId} not found`);
    }

    if (inspection.status !== 'PENDING') {
      throw new Error(`Inspection with ID ${inspectionId} is already completed`);
    }

    // Update inspection
    const updatedInspection = await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        qualityScore: inspectionResult.qualityScore,
        moistureContent: inspectionResult.moistureContent,
        impurities: inspectionResult.impurities,
        notes: inspectionResult.notes,
        status: 'COMPLETED',
        documents: {
          create: inspectionResult.documents || []
        }
      },
      include: { commodities: true }
    });

    // Update all commodities associated with this inspection
    for (const commodity of updatedInspection.commodities) {
      await prisma.commodity.update({
        where: { id: commodity.id },
        data: {
          quality: inspectionResult.qualityScore,
          status: CommodityStatus.INSPECTED
        }
      });
    }

    return {
      success: true,
      inspection: updatedInspection
    };
  } catch (error) {
    logger.error('Error completing inspection:', error);
    throw error;
  }
};

/**
 * Tokenize a commodity
 */
export const tokenizeCommodity = async (
  userId: string,
  commodityId: string
) => {
  try {
    // Check if commodity exists and belongs to user
    const commodity = await prisma.commodity.findUnique({
      where: { id: commodityId },
      include: { inspection: true }
    });

    if (!commodity) {
      throw new Error(`Commodity with ID ${commodityId} not found`);
    }

    if (commodity.ownerId !== userId) {
      throw new Error(`User ${userId} does not own commodity ${commodityId}`);
    }

    // Check if commodity has been inspected
    if (commodity.status !== CommodityStatus.INSPECTED) {
      throw new Error(`Commodity with ID ${commodityId} has not been inspected`);
    }

    if (!commodity.inspection) {
      throw new Error(`Commodity with ID ${commodityId} has no inspection record`);
    }

    // Check if user has a blockchain wallet
    const wallet = await prisma.blockchainWallet.findFirst({
      where: {
        userId,
        isPrimary: true
      }
    });

    if (!wallet) {
      // Create a wallet for the user
      await blockchainService.createBlockchainWallet(userId);
    }

    // Tokenize the commodity on the blockchain
    const result = await blockchainService.tokenizeCommodity(
      commodityId,
      commodity.quantity,
      commodity.quality
    );

    return result;
  } catch (error) {
    logger.error('Error tokenizing commodity:', error);
    throw error;
  }
};

/**
 * List commodity for sale
 */
export const listCommodityForSale = async (
  userId: string,
  commodityId: string,
  price: number
) => {
  try {
    // Check if commodity exists and belongs to user
    const commodity = await prisma.commodity.findUnique({
      where: { id: commodityId }
    });

    if (!commodity) {
      throw new Error(`Commodity with ID ${commodityId} not found`);
    }

    if (commodity.ownerId !== userId) {
      throw new Error(`User ${userId} does not own commodity ${commodityId}`);
    }

    // Check if commodity is tokenized
    if (!commodity.isTokenized) {
      throw new Error(`Commodity with ID ${commodityId} is not tokenized`);
    }

    // Create sell order on blockchain
    const result = await blockchainService.createSellOrder(
      userId,
      commodityId,
      commodity.quantity,
      price
    );

    return result;
  } catch (error) {
    logger.error('Error listing commodity for sale:', error);
    throw error;
  }
};

/**
 * Get all available commodities for purchase
 */
export const getAvailableCommodities = async () => {
  try {
    const commodities = await prisma.commodity.findMany({
      where: {
        status: CommodityStatus.LISTED,
        isTokenized: true
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            profile: true
          }
        },
        orders: {
          where: {
            status: 'OPEN',
            type: 'SELL'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    // Add price information from orders
    const commoditiesWithPrice = commodities.map(commodity => {
      const activeOrder = commodity.orders[0];
      return {
        ...commodity,
        price: activeOrder ? activeOrder.price : null,
        orderId: activeOrder ? activeOrder.id : null
      };
    });

    return {
      success: true,
      commodities: commoditiesWithPrice
    };
  } catch (error) {
    logger.error('Error getting available commodities:', error);
    throw error;
  }
};

/**
 * Buy a commodity
 */
export const buyCommodity = async (
  userId: string,
  orderId: string
) => {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        commodity: true,
        user: true
      }
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    if (order.type !== 'SELL') {
      throw new Error(`Order with ID ${orderId} is not a sell order`);
    }

    if (order.status !== 'OPEN') {
      throw new Error(`Order with ID ${orderId} is not open`);
    }

    // Check if buyer has enough funds in wallet
    const userWallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!userWallet) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    if (userWallet.balance < order.totalAmount) {
      throw new Error(`Insufficient funds to buy commodity. Required: ${order.totalAmount}, Available: ${userWallet.balance}`);
    }

    // Create buy order on blockchain
    const result = await blockchainService.createBuyOrder(
      userId,
      order.commodity.type,
      order.quantity,
      order.price
    );

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        orderId,
        buyerId: userId,
        amount: order.totalAmount,
        fee: order.totalAmount * 0.01, // 1% fee
        status: 'PENDING',
        blockchainTxHash: result.transaction.txHash
      }
    });

    // Deduct funds from buyer's wallet
    await prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          decrement: order.totalAmount
        }
      }
    });

    return {
      success: true,
      transaction,
      blockchainOrderId: result.blockchainOrderId
    };
  } catch (error) {
    logger.error('Error buying commodity:', error);
    throw error;
  }
};

export default {
  createCommodity,
  getUserCommodities,
  getCommodityById,
  updateCommodity,
  requestInspection,
  completeInspection,
  tokenizeCommodity,
  listCommodityForSale,
  getAvailableCommodities,
  buyCommodity
};
