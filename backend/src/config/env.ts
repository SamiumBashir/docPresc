import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'doctor_prescription_super_secret_jwt_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'cookie_secret_prescription_2026',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'DocPresc <onboarding@resend.dev>',
  OTP_EXPIRES_IN: Number(process.env.OTP_EXPIRES_IN) || 300, // 5 minutes in seconds
  OTP_RESEND_COOLDOWN: Number(process.env.OTP_RESEND_COOLDOWN) || 60, // 60 seconds
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};
