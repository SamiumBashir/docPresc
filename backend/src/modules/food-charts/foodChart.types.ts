import { Types } from 'mongoose';
import {
  FoodChartStatus,
  IFoodChartEntry,
  IFoodChartSupplement,
} from '../../models/FoodChart';

export interface CreateFoodChartDTO {
  patientId: string;
  chamberId?: string | null;
  allowedFoods?: IFoodChartEntry[];
  avoidedFoods?: IFoodChartEntry[];
  supplements?: IFoodChartSupplement[];
  dietaryInstructions?: string | null;
  additionalNotes?: string | null;
  status?: FoodChartStatus;
}

export interface UpdateFoodChartDTO {
  chamberId?: string | null;
  allowedFoods?: IFoodChartEntry[];
  avoidedFoods?: IFoodChartEntry[];
  supplements?: IFoodChartSupplement[];
  dietaryInstructions?: string | null;
  additionalNotes?: string | null;
  status?: FoodChartStatus;
}

export interface FoodChartFilterOptions {
  doctorId: Types.ObjectId | string;
  patientId?: string;
  status?: FoodChartStatus | string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FoodChartListResult {
  charts: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
