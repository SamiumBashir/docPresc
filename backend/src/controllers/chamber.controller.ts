import { chamberController } from '../modules/chambers/chamber.controller';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

export const getChambers = (req: AuthRequest, res: Response) => chamberController.getChambers(req, res);
export const createChamber = (req: AuthRequest, res: Response) => chamberController.createChamber(req, res);
export const updateChamber = (req: AuthRequest, res: Response) => chamberController.updateChamber(req, res);
export const deleteChamber = (req: AuthRequest, res: Response) => chamberController.deleteChamber(req, res);
