import { Request } from 'express';
import { IUser } from '../../models/User';
import { IDoctor } from '../../models/Doctor';

export interface AuthRequest extends Request {
  user?: IUser;
  doctor?: IDoctor;
  correlationId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  errors?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
