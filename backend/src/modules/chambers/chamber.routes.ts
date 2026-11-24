import { Router } from 'express';
import { chamberController } from './chamber.controller';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler((req, res) => chamberController.getChambers(req, res)));
router.post('/', asyncHandler((req, res) => chamberController.createChamber(req, res)));
router.put('/:id', asyncHandler((req, res) => chamberController.updateChamber(req, res)));
router.delete('/:id', asyncHandler((req, res) => chamberController.deleteChamber(req, res)));

export default router;
