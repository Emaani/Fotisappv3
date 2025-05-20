import express from 'express';
import orderController from '../controllers/orderController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Public routes
router.get('/book/:commodityType', orderController.getOrderBook);
router.get('/:id', orderController.getOrderById);

// Protected routes (require authentication)
router.get('/user/orders', protect, orderController.getUserOrders);
router.post('/', protect, orderController.createOrder);
router.post('/:id/cancel', protect, orderController.cancelOrder);

export default router;
