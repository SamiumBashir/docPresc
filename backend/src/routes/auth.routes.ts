import { Router } from 'express';
import {
  registerDoctor,
  login,
  getMe,
  logout,
  updateDoctorProfile,
  updateDoctorSettings,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
  deleteAccount,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', registerDoctor);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/reset-password', resetPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.delete('/account', authenticate, deleteAccount);
router.put('/profile', authenticate, updateDoctorProfile);
router.put('/settings', authenticate, updateDoctorSettings);

export default router;
