import { Request, Response } from 'express';
import { medicineService, MedicineService } from './medicine.service';
import { AuthRequest } from '../../shared/types';
import { logAuditEvent } from '../../middleware/audit';
import { MedicineSchema } from './medicine.validation';

export class MedicineController {
  constructor(private service: MedicineService = medicineService) {}

  searchMedicines = async (req: Request, res: Response): Promise<void> => {
    const { q, limit, medicineType } = req.query;
    const medicines = await this.service.searchMedicines({
      q: q as string,
      limit: limit ? parseInt(limit as string, 10) : 15,
      medicineType: medicineType as string,
    });
    res.json({ success: true, data: medicines });
  };

  getMedicines = async (req: Request, res: Response): Promise<void> => {
    const { search, category, dosageForm, manufacturer, medicineType, page, limit } = req.query;
    const result = await this.service.listMedicines({
      search: search as string,
      category: category as string,
      dosageForm: dosageForm as string,
      manufacturer: manufacturer as string,
      medicineType: medicineType as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });
    res.json({ success: true, data: result });
  };

  getMedicineTypes = async (_req: Request, res: Response): Promise<void> => {
    const types = await this.service.getMedicineTypes();
    res.json({ success: true, data: types });
  };

  getFavoriteMedicines = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }
    const favorites = await this.service.getFavoriteMedicines(req.doctor._id);
    res.json({ success: true, data: favorites });
  };

  toggleFavoriteMedicine = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }
    const { medicineId } = req.params;
    const result = await this.service.toggleFavoriteMedicine(req.doctor._id, medicineId);
    res.json({
      success: true,
      message: result.isFavorite ? 'Medicine marked as favorite.' : 'Medicine removed from favorites.',
      data: result,
    });
  };

  createMedicine = async (req: AuthRequest, res: Response): Promise<void> => {
    const normalized = {
      brandName: req.body.brandName?.trim(),
      genericName: req.body.genericName?.trim(),
      strength: req.body.strength?.trim(),
      dosageForm: (req.body.dosageForm || req.body.form || 'Tablet').trim(),
      manufacturer: (req.body.manufacturer || req.body.manufacture || 'General').trim(),
      category: (req.body.category || 'General').trim(),
      medicineType: req.body.medicineType || req.body.type || 'Allopathic',
      unit: req.body.unit?.trim() || 'mg',
      price: req.body.price ? Number(req.body.price) : undefined,
      status: req.body.status || 'active',
    };

    const validated = MedicineSchema.parse(normalized);
    const medicine = await this.service.createMedicine(validated as any);

    await logAuditEvent(req, {
      action: 'MEDICINE_CREATE',
      resource: 'Medicine',
      resourceId: medicine._id.toString(),
      details: { brandName: medicine.brandName, genericName: medicine.genericName },
    });

    res.status(201).json({
      success: true,
      message: 'Medicine added to database successfully.',
      data: medicine,
    });
  };

  updateMedicine = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const normalized = {
      brandName: req.body.brandName?.trim(),
      genericName: req.body.genericName?.trim(),
      strength: req.body.strength?.trim(),
      dosageForm: (req.body.dosageForm || req.body.form || 'Tablet').trim(),
      manufacturer: (req.body.manufacturer || req.body.manufacture || 'General').trim(),
      category: (req.body.category || 'General').trim(),
      medicineType: req.body.medicineType || req.body.type || 'Allopathic',
      unit: req.body.unit?.trim() || 'mg',
      price: req.body.price ? Number(req.body.price) : undefined,
      status: req.body.status || 'active',
    };

    const validated = MedicineSchema.parse(normalized);
    const updated = await this.service.updateMedicine(id, validated as any);

    await logAuditEvent(req, {
      action: 'MEDICINE_UPDATE',
      resource: 'Medicine',
      resourceId: updated._id.toString(),
    });

    res.json({
      success: true,
      message: 'Medicine updated successfully.',
      data: updated,
    });
  };

  deleteMedicine = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const deleted = await this.service.deleteMedicine(id);

    await logAuditEvent(req, {
      action: 'MEDICINE_DELETE',
      resource: 'Medicine',
      resourceId: id,
      details: { brandName: deleted.brandName },
    });

    res.json({
      success: true,
      message: 'Medicine deleted successfully.',
    });
  };

  importMedicinesCsv = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Please upload a CSV file.' });
      return;
    }

    const importedCount = await this.service.importCsv(req.file.path);

    await logAuditEvent(req, {
      action: 'MEDICINE_CSV_IMPORT',
      resource: 'Medicine',
      details: { importedCount },
    });

    res.json({
      success: true,
      message: `Successfully processed ${importedCount} medicines from CSV.`,
      data: { importedCount },
    });
  };
}

export const medicineController = new MedicineController();
export const {
  searchMedicines,
  getMedicines,
  getMedicineTypes,
  getFavoriteMedicines,
  toggleFavoriteMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  importMedicinesCsv,
} = medicineController;
