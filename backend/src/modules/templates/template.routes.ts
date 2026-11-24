import { Router } from 'express';
import { templateController } from './template.controller';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler((req, res) => templateController.getTemplates(req, res)));
router.post('/', asyncHandler((req, res) => templateController.createTemplate(req, res)));
router.put('/:id', asyncHandler((req, res) => templateController.updateTemplate(req, res)));
router.delete('/:id', asyncHandler((req, res) => templateController.deleteTemplate(req, res)));

export default router;
