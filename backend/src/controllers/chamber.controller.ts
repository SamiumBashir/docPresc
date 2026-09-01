import { Response } from 'express';
import { Chamber } from '../models/Chamber';
import { Doctor } from '../models/Doctor';
import { AuthRequest } from '../middleware/auth';
import { ChamberSchema } from '../validators/schemas';

export const getChambers = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.doctor?._id;
  if (!doctorId) {
    res.status(403).json({ success: false, message: 'Doctor scope required.' });
    return;
  }

  const chambers = await Chamber.find({ doctorId, status: 'active' }).sort({ isDefault: -1, createdAt: 1 });
  res.json({ success: true, data: chambers });
};

export const createChamber = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.doctor?._id;
  if (!doctorId) {
    res.status(403).json({ success: false, message: 'Doctor scope required.' });
    return;
  }

  const validated = ChamberSchema.parse(req.body);

  const activeChambersCount = await Chamber.countDocuments({ doctorId, status: 'active' });
  const isFirstChamber = activeChambersCount === 0;
  const shouldBeDefault = validated.isDefault || isFirstChamber;

  if (shouldBeDefault) {
    await Chamber.updateMany({ doctorId }, { $set: { isDefault: false } });
  }

  const chamber = await Chamber.create({
    ...validated,
    isDefault: shouldBeDefault,
    doctorId,
  });

  if (shouldBeDefault) {
    await Doctor.findByIdAndUpdate(doctorId, { defaultChamberId: chamber._id });
  }

  res.status(201).json({
    success: true,
    message: 'Chamber added successfully.',
    data: chamber,
  });
};

export const updateChamber = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.doctor?._id;
  const { id } = req.params;

  if (!doctorId) {
    res.status(403).json({ success: false, message: 'Doctor scope required.' });
    return;
  }

  const validated = ChamberSchema.parse(req.body);

  if (validated.isDefault) {
    await Chamber.updateMany({ doctorId }, { $set: { isDefault: false } });
    await Doctor.findByIdAndUpdate(doctorId, { defaultChamberId: id });
  }

  const chamber = await Chamber.findOneAndUpdate(
    { _id: id, doctorId },
    { $set: validated },
    { new: true }
  );

  if (!chamber) {
    res.status(404).json({ success: false, message: 'Chamber not found.' });
    return;
  }

  res.json({
    success: true,
    message: 'Chamber details updated.',
    data: chamber,
  });
};

export const deleteChamber = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.doctor?._id;
  const { id } = req.params;

  const chamber = await Chamber.findOneAndUpdate(
    { _id: id, doctorId },
    { $set: { status: 'inactive' } },
    { new: true }
  );

  if (!chamber) {
    res.status(404).json({ success: false, message: 'Chamber not found.' });
    return;
  }

  res.json({
    success: true,
    message: 'Chamber deactivated successfully.',
  });
};
