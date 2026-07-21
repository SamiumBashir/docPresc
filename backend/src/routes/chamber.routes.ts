import { Router } from 'express';
import {
  getChambers,
  createChamber,
  updateChamber,
  deleteChamber,
} from '../controllers/chamber.controller';
import { authenticate, requireDoctor } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireDoctor);

router.get('/', getChambers);
router.post('/', createChamber);
router.put('/:id', updateChamber);
router.delete('/:id', deleteChamber);

export default router;
