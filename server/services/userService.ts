import { PrismaClient, KycStatusType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import blockchainService from './blockchainService';

const prisma = new PrismaClient();

/**
 * Register a new user
 */
export const registerUser = async (
  data: {
    email: string;
    password: string;
    name?: string;
  }
) => {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error(`User with email ${data.email} already exists`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user with profile and wallet
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'user',
        profile: {
          create: {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            currency: 'USD',
          }
        },
        wallet: {
          create: {
            balance: 0.0,
            currency: 'USD',
          }
        },
        kycStatus: {
          create: {
            status: KycStatusType.NOT_SUBMITTED
          }
        }
      },
      include: {
        profile: true,
        wallet: true,
        kycStatus: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    // Create a blockchain wallet for the user
    await blockchainService.createBlockchainWallet(user.id);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
        wallet: user.wallet,
        kycStatus: user.kycStatus
      },
      token
    };
  } catch (error) {
    logger.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Login user
 */
export const loginUser = async (
  data: {
    email: string;
    password: string;
  }
) => {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        profile: true,
        wallet: true,
        kycStatus: true
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
        wallet: user.wallet,
        kycStatus: user.kycStatus
      },
      token
    };
  } catch (error) {
    logger.error('Error logging in user:', error);
    throw error;
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wallet: true,
        kycStatus: true,
        blockchainWallets: {
          where: { isPrimary: true }
        }
      }
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Get blockchain token balances
    const tokenBalances: Record<string, string> = {};
    if (user.blockchainWallets.length > 0) {
      try {
        const commodityTypes = ['COFFEE_ROBUSTA', 'COFFEE_ARABICA', 'COCOA', 'SESAME', 'SUNFLOWER'];
        
        for (const type of commodityTypes) {
          const result = await blockchainService.getTokenBalance(userId, type);
          tokenBalances[type] = result.balance;
        }
      } catch (err) {
        logger.warn(`Failed to get token balances for user ${userId}:`, err);
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
        wallet: user.wallet,
        kycStatus: user.kycStatus,
        blockchainWallet: user.blockchainWallets[0] || null,
        tokenBalances
      }
    };
  } catch (error) {
    logger.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  data: {
    name?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      address?: string;
      city?: string;
      country?: string;
      currency?: string;
      profilePicture?: string;
    }
  }
) => {
  try {
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        profile: data.profile ? {
          update: data.profile
        } : undefined
      },
      include: {
        profile: true,
        wallet: true,
        kycStatus: true
      }
    });

    return {
      success: true,
      user: updatedUser
    };
  } catch (error) {
    logger.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Submit KYC information
 */
export const submitKyc = async (
  userId: string,
  data: {
    documentType: string;
    documentId: string;
  }
) => {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { kycStatus: true }
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    if (!user.kycStatus) {
      // Create KYC status if it doesn't exist
      await prisma.kycStatus.create({
        data: {
          userId,
          status: KycStatusType.PENDING,
          documentType: data.documentType,
          documentId: data.documentId
        }
      });
    } else {
      // Update existing KYC status
      await prisma.kycStatus.update({
        where: { userId },
        data: {
          status: KycStatusType.PENDING,
          documentType: data.documentType,
          documentId: data.documentId
        }
      });
    }

    return {
      success: true,
      message: 'KYC information submitted successfully'
    };
  } catch (error) {
    logger.error('Error submitting KYC information:', error);
    throw error;
  }
};

/**
 * Verify KYC (admin only)
 */
export const verifyKyc = async (
  userId: string,
  approved: boolean,
  rejectionReason?: string
) => {
  try {
    // Update KYC status
    const updatedKyc = await prisma.kycStatus.update({
      where: { userId },
      data: {
        status: approved ? KycStatusType.APPROVED : KycStatusType.REJECTED,
        verificationDate: new Date(),
        rejectionReason: approved ? null : rejectionReason
      }
    });

    // If approved, set compliance status on blockchain
    if (approved) {
      try {
        const wallet = await prisma.blockchainWallet.findFirst({
          where: { userId, isPrimary: true }
        });

        if (wallet) {
          // Set compliance status for all token contracts
          const commodityTypes = ['COFFEE_ROBUSTA', 'COFFEE_ARABICA', 'COCOA', 'SESAME', 'SUNFLOWER'];
          const signer = blockchainService.getSigner();
          
          for (const type of commodityTypes) {
            const tokenContract = await blockchainService.getCommodityTokenContract(type, signer);
            await tokenContract.setComplianceStatus(wallet.address, true);
          }
        }
      } catch (err) {
        logger.warn(`Failed to set compliance status for user ${userId}:`, err);
      }
    }

    return {
      success: true,
      kycStatus: updatedKyc
    };
  } catch (error) {
    logger.error('Error verifying KYC:', error);
    throw error;
  }
};

/**
 * Add funds to user wallet
 */
export const addFunds = async (
  userId: string,
  amount: number,
  paymentMethod: string,
  paymentId?: string
) => {
  try {
    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    // Record transaction
    // In a real system, this would integrate with a payment processor
    const transaction = {
      userId,
      amount,
      paymentMethod,
      paymentId,
      status: 'completed',
      timestamp: new Date()
    };

    return {
      success: true,
      wallet: updatedWallet,
      transaction
    };
  } catch (error) {
    logger.error('Error adding funds:', error);
    throw error;
  }
};

/**
 * Withdraw funds from user wallet
 */
export const withdrawFunds = async (
  userId: string,
  amount: number,
  withdrawalMethod: string,
  withdrawalDetails: any
) => {
  try {
    // Check if user has enough funds
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    if (wallet.balance < amount) {
      throw new Error(`Insufficient funds. Available: ${wallet.balance}, Requested: ${amount}`);
    }

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          decrement: amount
        }
      }
    });

    // Record withdrawal
    // In a real system, this would integrate with a payment processor
    const withdrawal = {
      userId,
      amount,
      withdrawalMethod,
      withdrawalDetails,
      status: 'pending',
      timestamp: new Date()
    };

    return {
      success: true,
      wallet: updatedWallet,
      withdrawal
    };
  } catch (error) {
    logger.error('Error withdrawing funds:', error);
    throw error;
  }
};

/**
 * Get user wallet
 */
export const getUserWallet = async (userId: string) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    // Get blockchain wallets
    const blockchainWallets = await prisma.blockchainWallet.findMany({
      where: { userId }
    });

    // Get token balances
    const tokenBalances: Record<string, string> = {};
    if (blockchainWallets.length > 0) {
      try {
        const commodityTypes = ['COFFEE_ROBUSTA', 'COFFEE_ARABICA', 'COCOA', 'SESAME', 'SUNFLOWER'];
        
        for (const type of commodityTypes) {
          const result = await blockchainService.getTokenBalance(userId, type);
          tokenBalances[type] = result.balance;
        }
      } catch (err) {
        logger.warn(`Failed to get token balances for user ${userId}:`, err);
      }
    }

    return {
      success: true,
      wallet,
      blockchainWallets,
      tokenBalances
    };
  } catch (error) {
    logger.error('Error getting user wallet:', error);
    throw error;
  }
};

export default {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  submitKyc,
  verifyKyc,
  addFunds,
  withdrawFunds,
  getUserWallet
};
