import { Request, Response } from 'express';
import blockchainService from '../services/blockchainService';
import { logger } from '../utils/logger';

/**
 * Create a blockchain wallet for the authenticated user
 */
export const createWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await blockchainService.createBlockchainWallet(userId);

    // In a production environment, you would NOT return the private key directly
    // Instead, you would securely provide it to the user or store it encrypted
    const { privateKey, ...safeResult } = result;

    return res.status(201).json(safeResult);
  } catch (error) {
    logger.error('Error in createWallet controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while creating wallet'
    });
  }
};

/**
 * Get token balance for the authenticated user
 */
export const getTokenBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { commodityType } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!commodityType) {
      return res.status(400).json({
        success: false,
        message: 'Commodity type is required'
      });
    }

    const result = await blockchainService.getTokenBalance(userId, commodityType);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getTokenBalance controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching token balance'
    });
  }
};

/**
 * Get market data from blockchain
 */
export const getMarketData = async (req: Request, res: Response) => {
  try {
    const { commodityType } = req.params;

    if (!commodityType) {
      return res.status(400).json({
        success: false,
        message: 'Commodity type is required'
      });
    }

    const result = await blockchainService.getMarketData(commodityType);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getMarketData controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching market data'
    });
  }
};

/**
 * Get user orders from blockchain
 */
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await blockchainService.getUserOrders(userId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getUserOrders controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching user orders'
    });
  }
};

export default {
  createWallet,
  getTokenBalance,
  getMarketData,
  getUserOrders
};
