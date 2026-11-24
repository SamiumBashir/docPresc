import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { chamberService } from './chamber.service';
import { ChamberSchema } from '../../validators/schemas';
import { logAuditEvent } from '../../middleware/audit';

export class ChamberController {
  async getChambers(req: AuthRequest, res: Response): Promise<void> {
    const doctorId = req.doctor?._id;
    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const chambers = await chamberService.getChambers(doctorId);
    res.json({ success: true, data: chambers });
  }

  async createChamber(req: AuthRequest, res: Response): Promise<void> {
    const doctorId = req.doctor?._id;
    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = ChamberSchema.parse(req.body);
    const chamber = await chamberService.createChamber(doctorId, validated);

    await logAuditEvent(req, {
      action: 'CHAMBER_CREATE',
      resource: 'Chamber',
      resourceId: chamber._id.toString(),
      details: { name: chamber.name, isDefault: chamber.isDefault },
    });

    res.status(201).json({
      success: true,
      message: 'Chamber added successfully.',
      data: chamber,
    });
  }

  async updateChamber(req: AuthRequest, res: Response): Promise<void> {
    const doctorId = req.doctor?._id;
    const { id } = req.params;

    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = ChamberSchema.parse(req.body);
    const chamber = await chamberService.updateChamber(id, doctorId, validated);

    await logAuditEvent(req, {
      action: 'CHAMBER_UPDATE',
      resource: 'Chamber',
      resourceId: id,
      details: { name: chamber.name, isDefault: chamber.isDefault },
    });

    res.json({
      success: true,
      message: 'Chamber details updated.',
      data: chamber,
    });
  }

  async deleteChamber(req: AuthRequest, res: Response): Promise<void> {
    const doctorId = req.doctor?._id;
    const { id } = req.params;

    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    await chamberService.deleteChamber(id, doctorId);

    await logAuditEvent(req, {
      action: 'CHAMBER_DELETE',
      resource: 'Chamber',
      resourceId: id,
    });

    res.json({
      success: true,
      message: 'Chamber deleted successfully.',
    });
  }
}

export const chamberController = new ChamberController();
