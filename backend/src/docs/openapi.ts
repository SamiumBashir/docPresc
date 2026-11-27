export const openApiSpec: Record<string, any> = {
  openapi: '3.0.3',
  info: {
    title: 'docPresc API',
    version: '1.0.0',
    description: 'Enterprise Medical Prescription Management Platform API (Modular Monolith with Clean Layered Architecture)',
    contact: {
      name: 'docPresc Engineering Team',
      url: 'https://github.com/SamiumBashir/docPresc',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 (Current)',
    },
    {
      url: '/api',
      description: 'Legacy API base',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Short-lived JWT access token issued at login or refreshed via /auth/refresh',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'HttpOnly SameSite refresh token cookie',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['doctor', 'admin'] },
          status: { type: 'string', enum: ['active', 'pending', 'suspended'] },
        },
      },
      Doctor: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          qualification: { type: 'string' },
          specialization: { type: 'string' },
          bmdcNumber: { type: 'string' },
          workplace: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
        },
      },
      Patient: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          doctorId: { type: 'string' },
          patientId: { type: 'string', example: 'P-1001' },
          name: { type: 'string' },
          age: { type: 'integer' },
          gender: { type: 'string', enum: ['male', 'female', 'other'] },
          phone: { type: 'string' },
          email: { type: 'string' },
          bloodGroup: { type: 'string' },
        },
      },
      Prescription: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          prescriptionId: { type: 'string', example: 'RX-1001' },
          doctorId: { type: 'string' },
          patientId: { type: 'string' },
          attachedFoodChartId: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['DRAFT', 'FINALIZED'] },
          chiefComplaints: { type: 'array', items: { type: 'object' } },
          diagnosis: { type: 'array', items: { type: 'object' } },
          medicines: { type: 'array', items: { type: 'object' } },
          investigations: { type: 'array', items: { type: 'string' } },
          advice: { type: 'array', items: { type: 'string' } },
          shareToken: { type: 'string' },
          shareExpiresAt: { type: 'string', format: 'date-time' },
        },
      },
      FoodChart: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          chartNumber: { type: 'string', example: 'FC-2026-000001' },
          doctorId: { type: 'string' },
          patientId: { type: 'string' },
          status: { type: 'string', enum: ['DRAFT', 'FINALIZED'] },
          version: { type: 'integer', example: 1 },
          allowedFoods: { type: 'array', items: { type: 'object' } },
          avoidedFoods: { type: 'array', items: { type: 'object' } },
          supplements: { type: 'array', items: { type: 'object' } },
          dietaryInstructions: { type: 'string' },
          additionalNotes: { type: 'string' },
        },
      },
      Medicine: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          brandName: { type: 'string' },
          genericName: { type: 'string' },
          dosageForm: { type: 'string' },
          strength: { type: 'string' },
          manufacturer: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          code: { type: 'string' },
          errors: { type: 'object' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new doctor account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { 201: { description: 'Registered successfully' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate with email & password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { 200: { description: 'Authenticated successfully' } },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Rotate refresh token and issue fresh access token',
        tags: ['Authentication'],
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'Token refreshed' } },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Revoke active session and clear authentication cookies',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: { 200: { description: 'Logged out successfully' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get currently authenticated user & doctor profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Profile returned' } },
      },
    },
    '/patients': {
      get: {
        summary: 'List doctor-scoped patients with search & pagination',
        tags: ['Patients'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of patients' } },
      },
      post: {
        summary: 'Create a new doctor-scoped patient',
        tags: ['Patients'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Patient created' } },
      },
    },
    '/patients/{id}': {
      get: {
        summary: 'Get patient by ID (scoped to requesting doctor)',
        tags: ['Patients'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Patient details' } },
      },
      put: {
        summary: 'Update patient (scoped to requesting doctor)',
        tags: ['Patients'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Patient updated' } },
      },
      delete: {
        summary: 'Soft-delete patient (scoped to requesting doctor)',
        tags: ['Patients'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Patient deleted' } },
      },
    },
    '/prescriptions': {
      get: {
        summary: 'List doctor-scoped prescriptions with filters & pagination',
        tags: ['Prescriptions'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of prescriptions' } },
      },
      post: {
        summary: 'Create a new doctor-scoped prescription',
        tags: ['Prescriptions'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Prescription created' } },
      },
    },
    '/prescriptions/{id}': {
      get: {
        summary: 'Get prescription details (scoped to doctor)',
        tags: ['Prescriptions'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Prescription details' } },
      },
      put: {
        summary: 'Update prescription (scoped to doctor)',
        tags: ['Prescriptions'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Prescription updated' } },
      },
      delete: {
        summary: 'Delete prescription (scoped to doctor)',
        tags: ['Prescriptions'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Prescription deleted' } },
      },
    },
    '/prescriptions/{id}/finalize': {
      post: {
        summary: 'Finalize prescription (locks DRAFT into immutable state)',
        tags: ['Prescriptions'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Prescription finalized' } },
      },
    },
    '/prescriptions/{id}/duplicate': {
      post: {
        summary: 'Clone prescription into a fresh draft',
        tags: ['Prescriptions'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Prescription duplicated' } },
      },
    },
    '/prescriptions/{id}/share': {
      post: {
        summary: 'Generate cryptographically secure public share token (finalized prescriptions only)',
        tags: ['Prescriptions'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Share token generated' } },
      },
      delete: {
        summary: 'Revoke active public share token',
        tags: ['Prescriptions'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Share token revoked' } },
      },
    },
    '/public/prescriptions/{token}': {
      get: {
        summary: 'View public prescription by secure share token (PII redacted, finalized only)',
        tags: ['Public'],
        responses: { 200: { description: 'Public prescription DTO' } },
      },
    },
    '/medicines': {
      get: {
        summary: 'Search medicines catalog with pagination',
        tags: ['Medicines'],
        responses: { 200: { description: 'Medicines search results' } },
      },
      post: {
        summary: 'Create custom medicine entry',
        tags: ['Medicines'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Medicine created' } },
      },
    },
    '/chambers': {
      get: {
        summary: 'Get doctor chambers',
        tags: ['Chambers'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of chambers' } },
      },
      post: {
        summary: 'Add a new consultation chamber',
        tags: ['Chambers'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Chamber created' } },
      },
    },
    '/templates': {
      get: {
        summary: 'Get doctor prescription templates',
        tags: ['Templates'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of templates' } },
      },
      post: {
        summary: 'Create a prescription template',
        tags: ['Templates'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Template created' } },
      },
    },
    '/upload/signature': {
      post: {
        summary: 'Upload doctor signature image (Cloudinary with local fallback)',
        tags: ['Uploads'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Signature uploaded' } },
      },
    },
    '/admin/stats': {
      get: {
        summary: 'System metrics and KPIs',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Admin statistics' } },
      },
    },
    '/food-charts/catalog': {
      get: {
        summary: 'List seeded Bengali allowed and avoided food catalog items',
        tags: ['FoodCharts'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Food catalog items' } },
      },
    },
    '/food-charts': {
      get: {
        summary: 'List doctor-scoped patient food charts with search, status, and pagination',
        tags: ['FoodCharts'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Paginated food charts' } },
      },
      post: {
        summary: 'Create a new patient food chart (draft or finalized)',
        tags: ['FoodCharts'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Food chart created' } },
      },
    },
    '/food-charts/{id}/finalize': {
      post: {
        summary: 'Finalize and lock food chart',
        tags: ['FoodCharts'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Food chart finalized' } },
      },
    },
    '/food-charts/{id}/revise': {
      post: {
        summary: 'Create a numbered draft revision (v2, v3...) from a finalized chart',
        tags: ['FoodCharts'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'New draft revision created' } },
      },
    },
    '/food-charts/{id}/pdf': {
      get: {
        summary: 'Generate selectable-text A4 portrait PDF for food chart',
        tags: ['FoodCharts'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Binary A4 PDF' } },
      },
    },
    '/patients/{patientId}/food-charts': {
      get: {
        summary: 'List food charts belonging to a specific patient under the authenticated doctor',
        tags: ['FoodCharts'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Patient food charts' } },
      },
    },
    '/therapies/overview': {
      get: {
        summary: 'Get role-scoped therapy overview metrics and queues',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Therapy overview metrics' } },
      },
    },
    '/therapies/categories': {
      get: {
        summary: 'List therapy service categories including Main & ED Treatments',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Categories list' } },
      },
      post: {
        summary: 'Create a custom therapy category (Admin only)',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Category created' }, 403: { description: 'Admin role required' } },
      },
    },
    '/therapies/catalog': {
      get: {
        summary: 'Search and filter therapy services catalog',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Paginated therapies catalog' } },
      },
      post: {
        summary: 'Add therapy service to catalog (Admin only, starts unapproved)',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Therapy created' }, 403: { description: 'Admin role required' } },
      },
    },
    '/therapies/catalog/{id}': {
      get: {
        summary: 'Get therapy catalog entry details',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Therapy detail' } },
      },
      put: {
        summary: 'Update therapy catalog metadata (Admin only)',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Therapy updated' } },
      },
    },
    '/therapies/catalog/{id}/status': {
      patch: {
        summary: 'Enable or disable therapy service (Admin only)',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Status updated' } },
      },
    },
    '/therapies/catalog/{id}/verify': {
      post: {
        summary: 'Approve, reject, or flag therapy clinical/terminology verification (Admin only)',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Verification status updated' } },
      },
    },
    '/therapies/practitioners': {
      get: {
        summary: 'List active authorized therapy practitioners',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Practitioners list' } },
      },
      post: {
        summary: 'Create authorized staff therapy practitioner account (Admin only)',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Practitioner created' } },
      },
    },
    '/therapies/plans': {
      get: {
        summary: 'List role-scoped treatment plans',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Treatment plans list' } },
      },
      post: {
        summary: 'Create patient treatment plan for verified active therapy (Doctor only)',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Treatment plan created' } },
      },
    },
    '/therapies/plans/{id}': {
      get: {
        summary: 'Get treatment plan detail and scheduled sessions (Owning doctor or assigned practitioner)',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Treatment plan detail' } },
      },
      put: {
        summary: 'Update treatment plan details or status (Doctor only)',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Treatment plan updated' } },
      },
    },
    '/therapies/plans/{id}/finalize': {
      post: {
        summary: 'Finalize treatment plan after clinician approval & required consent (Doctor only)',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Treatment plan finalized' } },
      },
    },
    '/therapies/plans/{id}/pdf': {
      get: {
        summary: 'Download selectable-text A4 Patient Treatment Plan PDF',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'PDF binary stream' } },
      },
    },
    '/therapies/plans/{planId}/sessions': {
      post: {
        summary: 'Schedule therapy sessions for treatment plan (Doctor only)',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Sessions scheduled' } },
      },
    },
    '/therapies/sessions': {
      get: {
        summary: 'List role-scoped therapy sessions',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Sessions list' } },
      },
    },
    '/therapies/sessions/{id}': {
      patch: {
        summary: 'Update therapy session status/notes with optimistic concurrency version lock',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Session updated' }, 409: { description: 'Concurrent version conflict' } },
      },
      delete: {
        summary: 'Delete a non-completed therapy session (Doctor only)',
        tags: ['Therapies'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Session deleted' } },
      },
    },
  },
};
