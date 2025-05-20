import { Request, Response } from 'express';
import orderService from '../services/orderService';
import { logger } from '../utils/logger';
import { OrderType } from '@prisma/client';

/**
 * Get orders for the authenticated user
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

    const result = await orderService.getUserOrders(userId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getUserOrders controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching orders'
    });
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const result = await orderService.getOrderById(id);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getOrderById controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching order'
    });
  }
};

/**
 * Create a new order
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { commodityId, type, quantity, price } = req.body;

    if (!commodityId || !type || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Commodity ID, type, quantity, and price are required'
      });
    }

    // Validate order type
    if (!Object.values(OrderType).includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order type. Must be one of: ${Object.values(OrderType).join(', ')}`
      });
    }

    const result = await orderService.createOrder(userId, {
      commodityId,
      type,
      quantity,
      price
    });

    return res.status(201).json(result);
  } catch (error) {
    logger.error('Error in createOrder controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while creating order'
    });
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (req: Request, res: Response) => {
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
        message: 'Order ID is required'
      });
    }

    const result = await orderService.cancelOrder(userId, id);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in cancelOrder controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while cancelling order'
    });
  }
};

/**
 * Get order book for a commodity
 */
export const getOrderBook = async (req: Request, res: Response) => {
  try {
    const { commodityType } = req.params;

    if (!commodityType) {
      return res.status(400).json({
        success: false,
        message: 'Commodity type is required'
      });
    }

    const result = await orderService.getOrderBook(commodityType);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getOrderBook controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching order book'
    });
  }
};

export default {
  getUserOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  getOrderBook
};
