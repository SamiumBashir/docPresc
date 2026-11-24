import { Types } from 'mongoose';

export interface ChamberDTO {
  name: string;
  address: string;
  phone?: string;
  appointmentPhone?: string;
  visitingDays?: string[];
  visitingHours?: string;
  roomNo?: string;
  website?: string;
  signature?: string;
  isDefault?: boolean;
}
