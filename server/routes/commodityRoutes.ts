import express from 'express';
import commodityController from '../controllers/commodityController';
import { protect, inspectorProtect } from '../middlewares/authMiddleware';

const router = express.Router();

// Public routes
router.get('/available', commodityController.getAvailableCommodities);
router.get('/:id', commodityController.getCommodityById);

// Protected routes (require authentication)
router.post('/', protect, commodityController.createCommodity);
router.get('/user/commodities', protect, commodityController.getUserCommodities);
router.put('/:id', protect, commodityController.updateCommodity);
router.post('/:commodityId/inspection', protect, commodityController.requestInspection);
router.post('/:commodityId/tokenize', protect, commodityController.tokenizeCommodity);
router.post('/:commodityId/list', protect, commodityController.listCommodityForSale);
router.post('/buy/:orderId', protect, commodityController.buyCommodity);

// Inspector routes
router.post('/inspection/:inspectionId/complete', inspectorProtect, commodityController.completeInspection);

export default router;
