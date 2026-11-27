import { Router } from 'express';
import { authenticate, requireDoctor } from '../../middleware/auth';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { foodChartController } from './foodChart.controller';

const router = Router();

router.use(authenticate, requireDoctor);

router.get('/catalog', asyncHandler(foodChartController.getCatalog));
router.get('/patient/:patientId', asyncHandler(foodChartController.getPatientFoodCharts));
router.get('/', asyncHandler(foodChartController.getFoodCharts));
router.post('/', asyncHandler(foodChartController.createFoodChart));
router.get('/:id', asyncHandler(foodChartController.getFoodChartById));
router.get('/:id/versions', asyncHandler(foodChartController.getFoodChartVersions));
router.get('/:id/pdf', asyncHandler(foodChartController.downloadFoodChartPdf));
router.put('/:id', asyncHandler(foodChartController.updateFoodChart));
router.delete('/:id', asyncHandler(foodChartController.deleteFoodChart));
router.post('/:id/finalize', asyncHandler(foodChartController.finalizeFoodChart));
router.post('/:id/revise', asyncHandler(foodChartController.reviseFoodChart));

export default router;
