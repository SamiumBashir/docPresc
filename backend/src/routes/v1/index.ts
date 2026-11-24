import { Router } from 'express';
import { authRoutes } from '../../modules/auth';
import { patientRoutes } from '../../modules/patients';
import { prescriptionRoutes } from '../../modules/prescriptions';
import { medicineRoutes } from '../../modules/medicines';
import { chamberRoutes } from '../../modules/chambers';
import { templateRoutes } from '../../modules/templates';
import { adminRoutes } from '../../modules/admin';
import { uploadRoutes } from '../../modules/uploads';
import publicRoutes from '../public.routes';
import { openApiSpec } from '../../docs/openapi';

const router = Router();

// Versioned API Routes (v1)
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/medicines', medicineRoutes);
router.use('/chambers', chamberRoutes);
router.use('/templates', templateRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/uploads', uploadRoutes);
router.use('/public', publicRoutes);

// OpenAPI Documentation Endpoints
router.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

router.get('/docs', (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>docPresc API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>
  `);
});

export default router;
