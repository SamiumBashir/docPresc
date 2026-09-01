import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { User, IUser } from '../models/User';
import { Doctor, IDoctor } from '../models/Doctor';

export interface AuthRequest extends Request {
  user?: IUser;
  doctor?: IDoctor;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; role: string };
    const user = await User.findById(decoded.id);

    if (!user || user.status !== 'active') {
      res.status(401).json({
        success: false,
        message: 'User account not found or suspended.',
      });
      return;
    }

    req.user = user;

    if (user.role === 'doctor') {
      let doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) {
        doctor = await Doctor.create({
          userId: user._id,
          name: user.name,
          email: user.email,
          bmdcNumber: 'A-PENDING',
          qualification: 'MBBS',
          specialization: 'General Physician',
          status: 'approved',
        });
      }
      req.doctor = doctor;
    } else if (user.role === 'admin') {
      let doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) {
        doctor = await Doctor.findOne();
      }
      if (doctor) {
        req.doctor = doctor;
      }
    }

    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'admin')) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to perform this action.',
      });
      return;
    }
    next();
  };
};

export const requireDoctor = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || (req.user.role !== 'doctor' && req.user.role !== 'admin') || !req.doctor) {
    res.status(403).json({
      success: false,
      message: 'Access restricted to authorized doctors only.',
    });
    return;
  }
  next();
};
