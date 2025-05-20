import { Request, Response } from 'express';
import userService from '../services/userService';
import { logger } from '../utils/logger';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await userService.registerUser({
      email,
      password,
      name
    });

    return res.status(201).json(result);
  } catch (error) {
    logger.error('Error in register controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred during registration'
    });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await userService.loginUser({
      email,
      password
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in login controller:', error);
    return res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invalid credentials'
    });
  }
};

/**
 * Get user profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await userService.getUserProfile(userId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getProfile controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching profile'
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { name, profile } = req.body;

    const result = await userService.updateUserProfile(userId, {
      name,
      profile
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in updateProfile controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while updating profile'
    });
  }
};

/**
 * Submit KYC information
 */
export const submitKyc = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { documentType, documentId } = req.body;

    if (!documentType || !documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document type and ID are required'
      });
    }

    const result = await userService.submitKyc(userId, {
      documentType,
      documentId
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in submitKyc controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while submitting KYC'
    });
  }
};

/**
 * Verify KYC (admin only)
 */
export const verifyKyc = async (req: Request, res: Response) => {
  try {
    const { userId, approved, rejectionReason } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (typeof approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Approved status is required'
      });
    }

    const result = await userService.verifyKyc(userId, approved, rejectionReason);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in verifyKyc controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while verifying KYC'
    });
  }
};

/**
 * Add funds to user wallet
 */
export const addFunds = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { amount, paymentMethod, paymentId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    const result = await userService.addFunds(userId, amount, paymentMethod, paymentId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in addFunds controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while adding funds'
    });
  }
};

/**
 * Withdraw funds from user wallet
 */
export const withdrawFunds = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { amount, withdrawalMethod, withdrawalDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    if (!withdrawalMethod) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal method is required'
      });
    }

    const result = await userService.withdrawFunds(userId, amount, withdrawalMethod, withdrawalDetails);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in withdrawFunds controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while withdrawing funds'
    });
  }
};

/**
 * Get user wallet
 */
export const getWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await userService.getUserWallet(userId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getWallet controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching wallet'
    });
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  submitKyc,
  verifyKyc,
  addFunds,
  withdrawFunds,
  getWallet
};
