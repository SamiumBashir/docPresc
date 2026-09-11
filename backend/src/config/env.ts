import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default(''),
  JWT_SECRET: z.string().default('doctor_prescription_super_secret_jwt_key_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('cookie_secret_prescription_2026'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('DocPresc <onboarding@resend.dev>'),
  OTP_EXPIRES_IN: z.coerce.number().default(300),
  OTP_RESEND_COOLDOWN: z.coerce.number().default(60),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  console.error('[Config] Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
}

export const ENV = parsedEnv.success ? parsedEnv.data : {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: (process.env.NODE_ENV as any) || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'doctor_prescription_super_secret_jwt_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'cookie_secret_prescription_2026',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'DocPresc <onboarding@resend.dev>',
  OTP_EXPIRES_IN: Number(process.env.OTP_EXPIRES_IN) || 300,
  OTP_RESEND_COOLDOWN: Number(process.env.OTP_RESEND_COOLDOWN) || 60,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};

