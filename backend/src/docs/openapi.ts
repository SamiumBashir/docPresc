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
  },
};
