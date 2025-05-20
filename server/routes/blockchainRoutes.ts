import express from 'express';
import blockchainController from '../controllers/blockchainController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Protected routes (require authentication)
router.post('/wallet', protect, blockchainController.createWallet);
router.get('/balance/:commodityType', protect, blockchainController.getTokenBalance);
router.get('/orders', protect, blockchainController.getUserOrders);

// Public routes
router.get('/market/:commodityType', blockchainController.getMarketData);

export default router;
