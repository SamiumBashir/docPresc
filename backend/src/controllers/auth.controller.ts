import { authController } from '../modules/auth/auth.controller';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

export const registerDoctor = (req: AuthRequest, res: Response) => authController.register(req, res);
export const login = (req: AuthRequest, res: Response) => authController.login(req, res);
export const refresh = (req: AuthRequest, res: Response) => authController.refresh(req, res);
export const getMe = (req: AuthRequest, res: Response) => authController.getMe(req, res);
export const logout = (req: AuthRequest, res: Response) => authController.logout(req, res);
export const updateDoctorProfile = (req: AuthRequest, res: Response) => authController.updateDoctorProfile(req, res);
export const updateDoctorSettings = (req: AuthRequest, res: Response) => authController.updateDoctorSettings(req, res);
export const forgotPassword = (req: AuthRequest, res: Response) => authController.forgotPassword(req, res);
export const verifyOtp = (req: AuthRequest, res: Response) => authController.verifyOtp(req, res);
export const resendOtp = (req: AuthRequest, res: Response) => authController.resendOtp(req, res);
export const resetPassword = (req: AuthRequest, res: Response) => authController.resetPassword(req, res);
export const deleteAccount = (req: AuthRequest, res: Response) => authController.deleteAccount(req, res);
