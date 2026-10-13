import { api } from '../api-client';

export interface LoginPayload {
  email: string;
  password?: string;
  role?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  bmdcNumber?: string;
  specialization?: string;
  phone?: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  register: (payload: RegisterPayload) =>
    api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getProfile: () => api('/auth/me'),

  logout: () =>
    api('/auth/logout', {
      method: 'POST',
    }),

  forgotPassword: (email: string) =>
    api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyResetOtp: (email: string, otp: string) =>
    api('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  resendResetOtp: (email: string) =>
    api('/auth/resend-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { email: string; resetToken: string; newPassword: string }) =>
    api('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
