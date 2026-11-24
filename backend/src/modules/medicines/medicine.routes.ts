import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { medicineController } from './medicine.controller';
import { authenticate, requireRole, requireDoctor } from '../../middleware/auth';
import { asyncHandler } from '../../shared/utils/asyncHandler';

// Secure CSV upload configuration with file size limit and MIME-type verification
const csvUpload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.csv', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowedMime = [
      'text/csv',
      'text/plain',
      'application/vnd.ms-excel',
      'text/x-csv',
      'application/csv',
    ].includes(file.mimetype);

    if (allowedExtensions.includes(ext) || isAllowedMime) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only CSV files (.csv) are allowed for formulary import.'));
    }
  },
});

const router = Router();

// Fast public/authenticated search autocomplete & catalogs
router.get('/search', asyncHandler(medicineController.searchMedicines));
router.get('/types', asyncHandler(medicineController.getMedicineTypes));
router.get('/', asyncHandler(medicineController.getMedicines));

// Doctor favorite medicines
router.get('/favorites', authenticate, requireDoctor, asyncHandler(medicineController.getFavoriteMedicines));
router.post('/favorites/:medicineId', authenticate, requireDoctor, asyncHandler(medicineController.toggleFavoriteMedicine));

// Admin & Doctor creation
router.post('/', authenticate, requireRole(['admin', 'doctor']), asyncHandler(medicineController.createMedicine));
router.put('/:id', authenticate, requireRole(['admin', 'doctor']), asyncHandler(medicineController.updateMedicine));
router.delete('/:id', authenticate, requireRole(['admin']), asyncHandler(medicineController.deleteMedicine));

// CSV Bulk Import - support both /import and /import-csv
router.post(
  '/import-csv',
  authenticate,
  requireRole(['admin']),
  csvUpload.single('file'),
  asyncHandler(medicineController.importMedicinesCsv)
);
router.post(
  '/import',
  authenticate,
  requireRole(['admin']),
  csvUpload.single('file'),
  asyncHandler(medicineController.importMedicinesCsv)
);

export default router;
