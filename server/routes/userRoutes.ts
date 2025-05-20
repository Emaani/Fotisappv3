import express from 'express';
import userController from '../controllers/userController';
import { protect, adminProtect } from '../middlewares/authMiddleware';

const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes (require authentication)
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/kyc', protect, userController.submitKyc);
router.get('/wallet', protect, userController.getWallet);
router.post('/wallet/add-funds', protect, userController.addFunds);
router.post('/wallet/withdraw', protect, userController.withdrawFunds);

// Admin routes
router.post('/kyc/verify', adminProtect, userController.verifyKyc);

export default router;
