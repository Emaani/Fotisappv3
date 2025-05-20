import { Request, Response } from 'express';
import marketDataService from '../services/marketDataService';
import { logger } from '../utils/logger';
import { CommodityType } from '@prisma/client';

/**
 * Get market data for all commodities
 */
export const getAllMarketData = async (_req: Request, res: Response) => {
  try {
    const result = await marketDataService.getAllMarketData();

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getAllMarketData controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching market data'
    });
  }
};

/**
 * Get market data for a specific commodity
 */
export const getCommodityMarketData = async (req: Request, res: Response) => {
  try {
    const { commodityType } = req.params;

    if (!commodityType) {
      return res.status(400).json({
        success: false,
        message: 'Commodity type is required'
      });
    }

    // Validate commodity type
    if (!Object.values(CommodityType).includes(commodityType as CommodityType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid commodity type. Must be one of: ${Object.values(CommodityType).join(', ')}`
      });
    }

    const result = await marketDataService.getCommodityMarketData(commodityType as CommodityType);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getCommodityMarketData controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching commodity market data'
    });
  }
};

/**
 * Update market data (admin only)
 */
export const updateMarketData = async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required'
      });
    }

    const result = await marketDataService.updateMarketData();

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in updateMarketData controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while updating market data'
    });
  }
};

export default {
  getAllMarketData,
  getCommodityMarketData,
  updateMarketData
};
