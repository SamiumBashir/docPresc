export interface AdminStatsDTO {
  totalDoctors: number;
  activeDoctors: number;
  pendingDoctors: number;
  totalPatients: number;
  totalPrescriptions: number;
  todayPrescriptions: number;
  totalMedicines: number;
  totalChambers: number;
}

export interface DoctorReportsDTO {
  stats: {
    totalPatients: number;
    todayPatients: number;
    totalPrescriptions: number;
    todayPrescriptions: number;
    monthPrescriptions: number;
  };
  topMedicines: Array<{ name: string; count: number }>;
  topDiagnoses: Array<{ name: string; count: number }>;
}
