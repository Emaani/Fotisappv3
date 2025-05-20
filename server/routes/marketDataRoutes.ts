import express from 'express';
import marketDataController from '../controllers/marketDataController';
import { adminProtect } from '../middlewares/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', marketDataController.getAllMarketData);
router.get('/:commodityType', marketDataController.getCommodityMarketData);

// Admin routes
router.post('/update', adminProtect, marketDataController.updateMarketData);

export default router;
