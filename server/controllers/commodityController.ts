import { Request, Response } from 'express';
import commodityService from '../services/commodityService';
import { logger } from '../utils/logger';
import { CommodityType } from '@prisma/client';

/**
 * Create a new commodity
 */
export const createCommodity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { name, type, quantity, quality, location, harvestDate, expiryDate } = req.body;

    if (!name || !type || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and quantity are required'
      });
    }

    // Validate commodity type
    if (!Object.values(CommodityType).includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid commodity type. Must be one of: ${Object.values(CommodityType).join(', ')}`
      });
    }

    const result = await commodityService.createCommodity(userId, {
      name,
      type,
      quantity,
      quality,
      location,
      harvestDate: harvestDate ? new Date(harvestDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined
    });

    return res.status(201).json(result);
  } catch (error) {
    logger.error('Error in createCommodity controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while creating commodity'
    });
  }
};

/**
 * Get commodities owned by the user
 */
export const getUserCommodities = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await commodityService.getUserCommodities(userId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getUserCommodities controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching commodities'
    });
  }
};

/**
 * Get commodity by ID
 */
export const getCommodityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Commodity ID is required'
      });
    }

    const result = await commodityService.getCommodityById(id);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getCommodityById controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching commodity'
    });
  }
};

/**
 * Update commodity details
 */
export const updateCommodity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Commodity ID is required'
      });
    }

    const { name, quantity, quality, location, harvestDate, expiryDate } = req.body;

    const result = await commodityService.updateCommodity(userId, id, {
      name,
      quantity,
      quality,
      location,
      harvestDate: harvestDate ? new Date(harvestDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in updateCommodity controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while updating commodity'
    });
  }
};

/**
 * Request inspection for a commodity
 */
export const requestInspection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { commodityId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!commodityId) {
      return res.status(400).json({
        success: false,
        message: 'Commodity ID is required'
      });
    }

    const { inspectorName, date, location, notes } = req.body;

    if (!inspectorName || !date || !location) {
      return res.status(400).json({
        success: false,
        message: 'Inspector name, date, and location are required'
      });
    }

    const result = await commodityService.requestInspection(userId, commodityId, {
      inspectorName,
      date: new Date(date),
      location,
      notes
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in requestInspection controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while requesting inspection'
    });
  }
};

/**
 * Complete inspection for a commodity (inspector only)
 */
export const completeInspection = async (req: Request, res: Response) => {
  try {
    const { inspectionId } = req.params;

    if (!inspectionId) {
      return res.status(400).json({
        success: false,
        message: 'Inspection ID is required'
      });
    }

    const { qualityScore, moistureContent, impurities, notes, documents } = req.body;

    if (typeof qualityScore !== 'number' || qualityScore < 0 || qualityScore > 100) {
      return res.status(400).json({
        success: false,
        message: 'Quality score must be a number between 0 and 100'
      });
    }

    const result = await commodityService.completeInspection(inspectionId, {
      qualityScore,
      moistureContent,
      impurities,
      notes,
      documents
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in completeInspection controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while completing inspection'
    });
  }
};

/**
 * Tokenize a commodity
 */
export const tokenizeCommodity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { commodityId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!commodityId) {
      return res.status(400).json({
        success: false,
        message: 'Commodity ID is required'
      });
    }

    const result = await commodityService.tokenizeCommodity(userId, commodityId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in tokenizeCommodity controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while tokenizing commodity'
    });
  }
};

/**
 * List commodity for sale
 */
export const listCommodityForSale = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { commodityId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!commodityId) {
      return res.status(400).json({
        success: false,
        message: 'Commodity ID is required'
      });
    }

    const { price } = req.body;

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    const result = await commodityService.listCommodityForSale(userId, commodityId, price);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in listCommodityForSale controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while listing commodity for sale'
    });
  }
};

/**
 * Get all available commodities for purchase
 */
export const getAvailableCommodities = async (_req: Request, res: Response) => {
  try {
    const result = await commodityService.getAvailableCommodities();

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getAvailableCommodities controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching available commodities'
    });
  }
};

/**
 * Buy a commodity
 */
export const buyCommodity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const result = await commodityService.buyCommodity(userId, orderId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in buyCommodity controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while buying commodity'
    });
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
