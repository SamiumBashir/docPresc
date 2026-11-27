import { ITherapy } from '../types';

export const DEFAULT_MAIN_THERAPIES_FALLBACK: Array<{
  numLabel: string;
  key: string;
  name: string;
}> = [
  { numLabel: '01', key: 'main-01', name: 'Scalp Acupuncture' },
  { numLabel: '02', key: 'main-02', name: 'Tongue Acupuncture' },
  { numLabel: '03', key: 'main-03', name: 'Ear Acupuncture' },
  { numLabel: '04', key: 'main-04', name: 'Face Acupuncture' },
  { numLabel: '05', key: 'main-05', name: 'Abdomen Acupuncture' },
  { numLabel: '06', key: 'main-06', name: 'Body Acupuncture' },
  { numLabel: '07', key: 'main-07', name: 'Manual Physiotherapy' },
  { numLabel: '08', key: 'main-08', name: 'Electronic Physiotherapy' },
  { numLabel: '09', key: 'main-09', name: 'Chinese Therapy' },
  { numLabel: '10', key: 'main-10', name: 'CVFT (Transcranial Magnetic Stimulator)' },
  { numLabel: '11', key: 'main-11', name: 'Brain Stimulator' },
  { numLabel: '12', key: 'main-12', name: 'Chest Therapy' },
  { numLabel: '13', key: 'main-13', name: 'Hair PRP' },
  { numLabel: '14', key: 'main-14', name: 'Occupational Therapy' },
  { numLabel: '15', key: 'main-15', name: 'Psychotherapy' },
  { numLabel: '16', key: 'main-16', name: 'Speech and Language Therapy' },
  { numLabel: '17', key: 'main-17', name: 'Acupressure' },
  { numLabel: '18', key: 'main-18', name: 'CFT (Chinese Foot Treatment)' },
  { numLabel: '19', key: 'main-19', name: 'Touliao' },
  { numLabel: '20', key: 'main-20', name: 'Ionic Foot Detox' },
  { numLabel: '21', key: 'main-21', name: 'Cupping Therapy' },
  { numLabel: '22', key: 'main-22', name: 'OT (Occupational) Device' },
  { numLabel: '23', key: 'main-23', name: 'Ozone Therapy' },
  { numLabel: '24', key: 'main-24', name: 'Far Infrared Radiation Therapy' },
  { numLabel: '25', key: 'main-25', name: 'Autism Device' },
  { numLabel: '26', key: 'main-26', name: 'Counseling' },
  { numLabel: '—', key: 'main-27', name: 'Others' },
];

export const formatTherapyIndexLabel = (item: Pick<ITherapy, 'key' | 'name' | 'isEdTreatment' | 'sortOrder'>): string => {
  if (!item.isEdTreatment) {
    if (item.key === 'main-27' || item.name === 'Others') return '—';
    const match = /^main-(\d+)$/.exec(item.key);
    if (match) return match[1].padStart(2, '0');
    if (item.sortOrder >= 1 && item.sortOrder <= 26) {
      return String(item.sortOrder).padStart(2, '0');
    }
  }
  if (item.sortOrder > 0) {
    return String(item.sortOrder).padStart(2, '0');
  }
  return '•';
};
