import { IUser } from '../../models/User';
import { IDoctor } from '../../models/Doctor';
import { IChamber } from '../../models/Chamber';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

export interface LoginResult {
  user: {
    id: any;
    name: string;
    email: string;
    role: string;
  };
  doctor: IDoctor | null;
  chambers: IChamber[];
  token: string; // compatibility accessToken
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
