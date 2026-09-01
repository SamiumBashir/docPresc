export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'doctor' | 'admin';
  phone?: string;
  status: 'active' | 'pending' | 'suspended';
  bmdcRegNumber?: string;
  specialization?: string;
  degrees?: string[];
  createdAt: string;
}

export interface Medicine {
  _id: string;
  brandName: string;
  genericName: string;
  medicineType: 'Allopathic' | 'Unani' | 'Ayurvedic';
  form: string;
  strength: string;
  manufacturer: string;
  systemNameBangla?: string;
  defaultDose?: string;
  defaultDuration?: string;
  defaultInstruction?: string;
  sideEffects?: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AdminStats {
  totalDoctors: number;
  activeDoctors: number;
  pendingDoctors: number;
  totalPrescriptions: number;
  totalPatients: number;
  totalMedicines: number;
  totalChambers: number;
  recentAuditLogs: AuditLog[];
}
