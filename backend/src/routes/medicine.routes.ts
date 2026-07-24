import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import {
  searchMedicines,
  getMedicines,
  getMedicineTypes,
  getFavoriteMedicines,
  toggleFavoriteMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  importMedicinesCsv,
} from '../controllers/medicine.controller';
import { authenticate, requireRole, requireDoctor } from '../middleware/auth';

const upload = multer({ dest: os.tmpdir() });
const router = Router();

// Fast public/authenticated search autocomplete & catalogs
router.get('/search', searchMedicines);
router.get('/types', getMedicineTypes);
router.get('/', getMedicines);

// Doctor favorite medicines
router.get('/favorites', authenticate, requireDoctor, getFavoriteMedicines);
router.post('/favorites/:medicineId', authenticate, requireDoctor, toggleFavoriteMedicine);

// Admin & Doctor creation
router.post('/', authenticate, requireRole(['admin', 'doctor']), createMedicine);
router.put('/:id', authenticate, requireRole(['admin', 'doctor']), updateMedicine);
router.delete('/:id', authenticate, requireRole(['admin']), deleteMedicine);
router.post('/import-csv', authenticate, requireRole(['admin']), upload.single('file'), importMedicinesCsv);

export default router;
