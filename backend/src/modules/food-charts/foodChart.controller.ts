import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { logAuditEvent } from '../../middleware/audit';
import { foodChartService, FoodChartService } from './foodChart.service';
import { CreateFoodChartSchema, UpdateFoodChartSchema } from './foodChart.validation';
import { CreateFoodChartDTO, UpdateFoodChartDTO } from './foodChart.types';
import { renderFoodChartPdf } from './foodChart.pdf';

const sanitizeFilenamePart = (val?: string): string =>
  (val || 'PATIENT')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'PATIENT';

const buildSafeAuditDetails = (chart: { chartNumber: string; version: number; status: string }) => ({
  chartNumber: chart.chartNumber,
  version: chart.version,
  status: chart.status,
});

export class FoodChartController {
  constructor(private service: FoodChartService = foodChartService) {}

  getCatalog = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.doctor?._id) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const catalog = await this.service.getCatalog();
    res.json({
      success: true,
      data: catalog,
    });
  };

  getFoodCharts = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const { patientId, status, search, page, limit } = req.query;
    const result = await this.service.listFoodCharts({
      doctorId,
      patientId: typeof patientId === 'string' && patientId ? patientId : undefined,
      status: typeof status === 'string' && status ? status : undefined,
      search: typeof search === 'string' ? search : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 20,
    });

    res.json({
      success: true,
      data: result,
    });
  };

  getPatientFoodCharts = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const patientId = req.params.patientId || req.params.id;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const charts = await this.service.listPatientFoodCharts(patientId, doctorId, status);

    res.json({
      success: true,
      data: charts,
    });
  };

  getFoodChartById = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const chart = await this.service.getFoodChartById(req.params.id, doctorId);

    await logAuditEvent(req, {
      action: 'FOOD_CHART_VIEW',
      resource: 'FoodChart',
      resourceId: chart._id.toString(),
      details: buildSafeAuditDetails(chart),
    });

    res.json({
      success: true,
      data: chart,
    });
  };

  getFoodChartVersions = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const versions = await this.service.getVersionHistory(req.params.id, doctorId);
    res.json({
      success: true,
      data: versions,
    });
  };

  createFoodChart = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctor = req.doctor;
    if (!doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = CreateFoodChartSchema.parse(req.body) as CreateFoodChartDTO;
    const created = await this.service.createFoodChart(doctor, validated);

    await logAuditEvent(req, {
      action: created.status === 'FINALIZED' ? 'FOOD_CHART_FINALIZE' : 'FOOD_CHART_CREATE',
      resource: 'FoodChart',
      resourceId: created._id.toString(),
      details: buildSafeAuditDetails(created),
    });

    res.status(201).json({
      success: true,
      message:
        created.status === 'FINALIZED'
          ? 'Food chart created and finalized.'
          : 'Food chart draft saved.',
      data: created,
    });
  };

  updateFoodChart = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctor = req.doctor;
    if (!doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = UpdateFoodChartSchema.parse(req.body) as UpdateFoodChartDTO;
    const updated = await this.service.updateFoodChart(req.params.id, doctor, validated);

    await logAuditEvent(req, {
      action: updated.status === 'FINALIZED' ? 'FOOD_CHART_FINALIZE' : 'FOOD_CHART_UPDATE',
      resource: 'FoodChart',
      resourceId: updated._id.toString(),
      details: buildSafeAuditDetails(updated),
    });

    res.json({
      success: true,
      message:
        updated.status === 'FINALIZED'
          ? 'Food chart finalized successfully.'
          : 'Food chart draft updated.',
      data: updated,
    });
  };

  finalizeFoodChart = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctor = req.doctor;
    if (!doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const finalized = await this.service.finalizeFoodChart(req.params.id, doctor);

    await logAuditEvent(req, {
      action: 'FOOD_CHART_FINALIZE',
      resource: 'FoodChart',
      resourceId: finalized._id.toString(),
      details: buildSafeAuditDetails(finalized),
    });

    res.json({
      success: true,
      message: 'Food chart finalized and locked against direct edits.',
      data: finalized,
    });
  };

  reviseFoodChart = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctor = req.doctor;
    if (!doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const revised = await this.service.reviseFoodChart(req.params.id, doctor);

    await logAuditEvent(req, {
      action: 'FOOD_CHART_REVISE',
      resource: 'FoodChart',
      resourceId: revised._id.toString(),
      details: buildSafeAuditDetails(revised),
    });

    res.status(201).json({
      success: true,
      message: `Created editable revision v${revised.version}.`,
      data: revised,
    });
  };

  deleteFoodChart = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const deleted = await this.service.deleteDraftFoodChart(req.params.id, doctorId);

    await logAuditEvent(req, {
      action: 'FOOD_CHART_DELETE',
      resource: 'FoodChart',
      resourceId: deleted._id.toString(),
      details: buildSafeAuditDetails(deleted),
    });

    res.json({
      success: true,
      message: 'Food chart draft deleted.',
    });
  };

  downloadFoodChartPdf = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const chart = await this.service.getFoodChartById(req.params.id, doctorId);
    const pdfBuffer = await renderFoodChartPdf(chart);

    await logAuditEvent(req, {
      action: 'FOOD_CHART_PDF',
      resource: 'FoodChart',
      resourceId: chart._id.toString(),
      details: buildSafeAuditDetails(chart),
    });

    const patientCode = sanitizeFilenamePart(chart.patientSnapshot?.patientId || chart.chartNumber);
    const datePart = new Date(chart.finalizedAt || chart.createdAt || Date.now())
      .toISOString()
      .slice(0, 10);
    const filename = `Food-Chart-${patientCode}-${datePart}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Cache-Control',
      'private, no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  };
}

export const foodChartController = new FoodChartController();
