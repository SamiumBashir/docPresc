import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

// Public auth routes
router.post('/register', asyncHandler((req, res) => authController.register(req, res)));
router.post('/login', asyncHandler((req, res) => authController.login(req, res)));
router.post('/refresh', asyncHandler((req, res) => authController.refresh(req, res)));
router.post('/forgot-password', asyncHandler((req, res) => authController.forgotPassword(req, res)));
router.post('/verify-reset-otp', asyncHandler((req, res) => authController.verifyOtp(req, res)));
router.post('/verify-otp', asyncHandler((req, res) => authController.verifyOtp(req, res)));
router.post('/resend-reset-otp', asyncHandler((req, res) => authController.resendOtp(req, res)));
router.post('/resend-otp', asyncHandler((req, res) => authController.resendOtp(req, res)));
router.post('/reset-password', asyncHandler((req, res) => authController.resetPassword(req, res)));
router.post('/reset-password/:token', asyncHandler((req, res) => authController.resetPassword(req, res)));

// Protected auth routes
router.get('/me', authenticate, asyncHandler((req, res) => authController.getMe(req, res)));
router.get('/profile', authenticate, asyncHandler((req, res) => authController.getMe(req, res)));
router.post('/logout', authenticate, asyncHandler((req, res) => authController.logout(req, res)));
router.put('/profile', authenticate, asyncHandler((req, res) => authController.updateDoctorProfile(req, res)));
router.put('/settings', authenticate, asyncHandler((req, res) => authController.updateDoctorSettings(req, res)));
router.delete('/account', authenticate, asyncHandler((req, res) => authController.deleteAccount(req, res)));

export default router;
