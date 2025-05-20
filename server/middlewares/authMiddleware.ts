import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to protect routes - requires authentication
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as jwt.JwtPayload;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
      });
    }

    // Set user in request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'user'
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

/**
 * Middleware to protect admin routes - requires admin role
 */
export const adminProtect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First check if user is authenticated
    await protect(req, res, () => {
      // Check if user has admin role
      if (req.user && req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({
          success: false,
          message: 'Not authorized as an admin'
        });
      }
    });
  } catch (error) {
    logger.error('Admin auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

/**
 * Middleware to protect inspector routes - requires inspector role
 */
export const inspectorProtect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First check if user is authenticated
    await protect(req, res, () => {
      // Check if user has inspector role
      if (req.user && (req.user.role === 'inspector' || req.user.role === 'admin')) {
        next();
      } else {
        res.status(403).json({
          success: false,
          message: 'Not authorized as an inspector'
        });
      }
    });
  } catch (error) {
    logger.error('Inspector auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};
