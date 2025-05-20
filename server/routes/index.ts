import express from 'express';
import userRoutes from './userRoutes';
import commodityRoutes from './commodityRoutes';
import orderRoutes from './orderRoutes';
import marketDataRoutes from './marketDataRoutes';
import blockchainRoutes from './blockchainRoutes';

const router = express.Router();

// API routes
router.use('/users', userRoutes);
router.use('/commodities', commodityRoutes);
router.use('/orders', orderRoutes);
router.use('/market', marketDataRoutes);
router.use('/blockchain', blockchainRoutes);

export default router;
