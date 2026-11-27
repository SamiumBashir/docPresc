import { connectDatabase, closeDatabase } from '../config/db';
import { TherapyCategory } from '../models/TherapyCategory';
import { Therapy } from '../models/Therapy';

export interface SeedTherapyEntry {
  key: string;
  name: string;
  englishName: string;
  bengaliName?: string;
  categoryKey: 'main-treatments' | 'ed-treatments';
  categoryName: 'Main Treatments' | 'ED Treatments';
  isEdTreatment: boolean;
  description: string;
  terminologyReviewRequired: boolean;
  specialReviewFlags: string[];
  governanceNotice: string;
  requiredProviderQualifications: string;
  requiredEquipment: string;
  consentRequired: boolean;
  sortOrder: number;
}

export const DEFAULT_THERAPY_CATEGORIES = [
  {
    key: 'main-treatments',
    name: 'Main Treatments',
    nameBn: 'মূল থেরাপি ও চিকিৎসা সমূহ',
    description: 'General rehabilitation, acupuncture, physiotherapy, and supportive modalities.',
    isProtected: true,
    isSensitiveClinicalGroup: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    key: 'ed-treatments',
    name: 'ED Treatments',
    nameBn: 'ইডি চিকিৎসা সমূহ',
    description: 'Dedicated category requiring privacy protection and clinician verification.',
    isProtected: true,
    isSensitiveClinicalGroup: true,
    isActive: true,
    sortOrder: 2,
  },
] as const;

/**
 * Initial catalog preserving exact source labels from the hospital treatment list.
 * All entries start strictly as PENDING_CLINICAL_REVIEW with no auto-recommendations,
 * no default session protocols, and no unverified efficacy claims.
 */
export const DEFAULT_THERAPY_CATALOG_ITEMS: readonly SeedTherapyEntry[] = [
  // A. Main Treatment List (27 items)
  {
    key: 'main-01',
    name: 'Scalp Acupuncture',
    englishName: 'Scalp Acupuncture',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['PROVIDER_QUALIFICATION_REQUIRED', 'SAFETY_DOCUMENTATION_REQUIRED'],
    governanceNotice:
      'Acupuncture and needling procedures require credentialed practitioners and safety documentation.',
    requiredProviderQualifications: 'To be verified by clinical administrator',
    requiredEquipment: '',
    consentRequired: true,
    sortOrder: 1,
  },
  {
    key: 'main-02',
    name: 'Tongue Acupuncture',
    englishName: 'Tongue Acupuncture',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['PROVIDER_QUALIFICATION_REQUIRED', 'SAFETY_DOCUMENTATION_REQUIRED'],
    governanceNotice:
      'Acupuncture procedures require appropriately qualified practitioners and relevant safety documentation.',
    requiredProviderQualifications: 'To be verified by clinical administrator',
    requiredEquipment: '',
    consentRequired: true,
    sortOrder: 2,
  },
  {
    key: 'main-03',
    name: 'Ear Acupuncture',
    englishName: 'Ear Acupuncture',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['PROVIDER_QUALIFICATION_REQUIRED', 'SAFETY_DOCUMENTATION_REQUIRED'],
    governanceNotice:
      'Acupuncture procedures require appropriately qualified practitioners and relevant safety documentation.',
    requiredProviderQualifications: 'To be verified by clinical administrator',
    requiredEquipment: '',
    consentRequired: true,
    sortOrder: 3,
  },
  {
    key: 'main-04',
    name: 'Face Acupuncture',
    englishName: 'Face Acupuncture',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['PROVIDER_QUALIFICATION_REQUIRED', 'SAFETY_DOCUMENTATION_REQUIRED'],
    governanceNotice:
      'Acupuncture procedures require appropriately qualified practitioners and relevant safety documentation.',
    requiredProviderQualifications: 'To be verified by clinical administrator',
    requiredEquipment: '',
    consentRequired: true,
    sortOrder: 4,
  },
  {
    key: 'main-05',
    name: 'Abdomen Acupuncture',
    englishName: 'Abdomen Acupuncture',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['PROVIDER_QUALIFICATION_REQUIRED', 'SAFETY_DOCUMENTATION_REQUIRED'],
    governanceNotice:
      'Acupuncture procedures require appropriately qualified practitioners and relevant safety documentation.',
    requiredProviderQualifications: 'To be verified by clinical administrator',
    requiredEquipment: '',
    consentRequired: true,
    sortOrder: 5,
  },
  {
    key: 'main-06',
    name: 'Body Acupuncture',
    englishName: 'Body Acupuncture',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['PROVIDER_QUALIFICATION_REQUIRED', 'SAFETY_DOCUMENTATION_REQUIRED'],
    governanceNotice:
      'Acupuncture procedures require appropriately qualified practitioners and relevant safety documentation.',
    requiredProviderQualifications: 'To be verified by clinical administrator',
    requiredEquipment: '',
    consentRequired: true,
    sortOrder: 6,
  },
  {
    key: 'main-07',
    name: 'Manual Physiotherapy',
    englishName: 'Manual Physiotherapy',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: [],
    governanceNotice: '',
    requiredProviderQualifications: 'Licensed physiotherapist',
    requiredEquipment: '',
    consentRequired: false,
    sortOrder: 7,
  },
  {
    key: 'main-08',
    name: 'Electronic Physiotherapy',
    englishName: 'Electronic Physiotherapy',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['DEVICE_SPECIFICATION_REQUIRED'],
    governanceNotice: '',
    requiredProviderQualifications: 'Licensed physiotherapist',
    requiredEquipment: 'To be specified during verification',
    consentRequired: false,
    sortOrder: 8,
  },
  {
    key: 'main-09',
    name: 'Chinese Therapy',
    englishName: 'Chinese Therapy',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['EVIDENCE_GOVERNANCE_REVIEW'],
    governanceNotice: 'Scope and modality details must be reviewed prior to approval.',
    requiredProviderQualifications: '',
    requiredEquipment: '',
    consentRequired: false,
    sortOrder: 9,
  },
  {
    key: 'main-10',
    name: 'CVFT (Transcranial Magnetic Stimulator)',
    englishName: 'CVFT (Transcranial Magnetic Stimulator)',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — flagged for terminology and device verification.',
    terminologyReviewRequired: true,
    specialReviewFlags: ['TERMINOLOGY_VERIFICATION', 'DEVICE_SPECIFICATION_REQUIRED'],
    governanceNotice:
      'Terminology verification required for "CVFT" and exact transcranial magnetic stimulation device model.',
    requiredProviderQualifications: 'Specialist clinician supervision required',
    requiredEquipment: 'Verify exact device specification',
    consentRequired: true,
    sortOrder: 10,
  },
  {
    key: 'main-11',
    name: 'Brain Stimulator',
    englishName: 'Brain Stimulator',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — flagged for device and clinical review.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['DEVICE_SPECIFICATION_REQUIRED', 'EVIDENCE_GOVERNANCE_REVIEW'],
    governanceNotice:
      'Exact stimulation device, approved clinical indication, and regulatory status must be verified.',
    requiredProviderQualifications: '',
    requiredEquipment: 'Verify exact device specification',
    consentRequired: true,
    sortOrder: 11,
  },
  {
    key: 'main-12',
    name: 'Chest Therapy',
    englishName: 'Chest Therapy',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: [],
    governanceNotice: '',
    requiredProviderQualifications: '',
    requiredEquipment: '',
    consentRequired: false,
    sortOrder: 12,
  },
  {
    key: 'main-13',
    name: 'Hair PRP',
    englishName: 'Hair PRP',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — procedure-specific consent and credential review required.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['PROVIDER_QUALIFICATION_REQUIRED', 'PROCEDURE_CONSENT_REQUIRED'],
    governanceNotice:
      'Requires appropriately qualified provider verification and procedure-specific patient consent.',
    requiredProviderQualifications: 'Qualified procedural clinician required',
    requiredEquipment: '',
    consentRequired: true,
    sortOrder: 13,
  },
  {
    key: 'main-14',
    name: 'Occupational Therapy',
    englishName: 'Occupational Therapy',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: [],
    governanceNotice: '',
    requiredProviderQualifications: 'Qualified occupational therapist',
    requiredEquipment: '',
    consentRequired: false,
    sortOrder: 14,
  },
  {
    key: 'main-15',
    name: 'Psychotherapy',
    englishName: 'Psychotherapy',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['PROVIDER_QUALIFICATION_REQUIRED'],
    governanceNotice: '',
    requiredProviderQualifications: 'Credentialed mental health clinician',
    requiredEquipment: '',
    consentRequired: true,
    sortOrder: 15,
  },
  {
    key: 'main-16',
    name: 'Speech and Language Therapy',
    englishName: 'Speech and Language Therapy',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: [],
    governanceNotice: '',
    requiredProviderQualifications: 'Speech and language therapist',
    requiredEquipment: '',
    consentRequired: false,
    sortOrder: 16,
  },
  {
    key: 'main-17',
    name: 'Acupressure',
    englishName: 'Acupressure',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: [],
    governanceNotice: '',
    requiredProviderQualifications: '',
    requiredEquipment: '',
    consentRequired: false,
    sortOrder: 17,
  },
  {
    key: 'main-18',
    name: 'CFT (Chinese Foot Treatment)',
    englishName: 'CFT (Chinese Foot Treatment)',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — flagged for terminology verification.',
    terminologyReviewRequired: true,
    specialReviewFlags: ['TERMINOLOGY_VERIFICATION'],
    governanceNotice:
      'Terminology verification required by an authorized clinical reviewer before activation.',
    requiredProviderQualifications: '',
    requiredEquipment: '',
    consentRequired: false,
    sortOrder: 18,
  },
  {
    key: 'main-19',
    name: 'Touliao',
    englishName: 'Touliao',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — flagged for terminology verification.',
    terminologyReviewRequired: true,
    specialReviewFlags: ['TERMINOLOGY_VERIFICATION'],
    governanceNotice:
      'Terminology verification required by an authorized clinical reviewer before activation.',
    requiredProviderQualifications: '',
    requiredEquipment: '',
    consentRequired: false,
    sortOrder: 19,
  },
  {
    key: 'main-20',
    name: 'Ionic Foot Detox',
    englishName: 'Ionic Foot Detox',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — flagged for clinical evidence and governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['EVIDENCE_GOVERNANCE_REVIEW', 'NO_UNVERIFIED_CLAIMS'],
    governanceNotice:
      'Requires clinical evidence and governance review; detoxification claims must not be presented as established clinical facts.',
    requiredProviderQualifications: '',
    requiredEquipment: '',
    consentRequired: false,
    sortOrder: 20,
  },
  {
    key: 'main-21',
    name: 'Cupping Therapy',
    englishName: 'Cupping Therapy',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — practitioner qualification and safety documentation required.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['PROVIDER_QUALIFICATION_REQUIRED', 'SAFETY_DOCUMENTATION_REQUIRED'],
    governanceNotice:
      'Requires appropriately qualified practitioners, infection-control protocol, and safety documentation.',
    requiredProviderQualifications: 'Qualified practitioner required',
    requiredEquipment: '',
    consentRequired: true,
    sortOrder: 21,
  },
  {
    key: 'main-22',
    name: 'OT (Occupational) Device',
    englishName: 'OT (Occupational) Device',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — device specification review pending.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['DEVICE_SPECIFICATION_REQUIRED'],
    governanceNotice: '',
    requiredProviderQualifications: 'Occupational therapist',
    requiredEquipment: 'Verify exact device model',
    consentRequired: false,
    sortOrder: 22,
  },
  {
    key: 'main-23',
    name: 'Ozone Therapy',
    englishName: 'Ozone Therapy',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — clinical and legal authorization review required.',
    terminologyReviewRequired: false,
    specialReviewFlags: [
      'LEGAL_AUTHORIZATION_REVIEW',
      'EVIDENCE_GOVERNANCE_REVIEW',
      'NO_UNVERIFIED_CLAIMS',
    ],
    governanceNotice:
      'Requires specific clinical and legal authorization review; no system-generated dosage, route, or efficacy claims are permitted.',
    requiredProviderQualifications: 'Authorized clinician verification required',
    requiredEquipment: '',
    consentRequired: true,
    sortOrder: 23,
  },
  {
    key: 'main-24',
    name: 'Far Infrared Radiation Therapy',
    englishName: 'Far Infrared Radiation Therapy',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — device specification review pending.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['DEVICE_SPECIFICATION_REQUIRED'],
    governanceNotice: '',
    requiredProviderQualifications: '',
    requiredEquipment: 'Verify device specification',
    consentRequired: false,
    sortOrder: 24,
  },
  {
    key: 'main-25',
    name: 'Autism Device',
    englishName: 'Autism Device',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — requires device, intended use, and evidence review.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['DEVICE_SPECIFICATION_REQUIRED', 'EVIDENCE_GOVERNANCE_REVIEW'],
    governanceNotice:
      'Requires clinical review of the exact device identity, intended use, safety profile, and supporting evidence.',
    requiredProviderQualifications: '',
    requiredEquipment: 'Verify exact device and intended use',
    consentRequired: true,
    sortOrder: 25,
  },
  {
    key: 'main-26',
    name: 'Counseling',
    englishName: 'Counseling',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog entry — pending clinical governance review.',
    terminologyReviewRequired: false,
    specialReviewFlags: [],
    governanceNotice: '',
    requiredProviderQualifications: 'Qualified counselor or clinician',
    requiredEquipment: '',
    consentRequired: false,
    sortOrder: 26,
  },
  {
    key: 'main-27',
    name: 'Others',
    englishName: 'Others',
    categoryKey: 'main-treatments',
    categoryName: 'Main Treatments',
    isEdTreatment: false,
    description: 'Hospital catalog catch-all entry — specify modality in clinician documentation.',
    terminologyReviewRequired: false,
    specialReviewFlags: [],
    governanceNotice: '',
    requiredProviderQualifications: '',
    requiredEquipment: '',
    consentRequired: false,
    sortOrder: 27,
  },

  // B. ED Treatment List (5 items)
  {
    key: 'ed-01',
    name: 'Linear Shockwave Therapy',
    englishName: 'Linear Shockwave Therapy',
    categoryKey: 'ed-treatments',
    categoryName: 'ED Treatments',
    isEdTreatment: true,
    description: 'ED catalog entry — requires device and clinical indication verification.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['DEVICE_SPECIFICATION_REQUIRED', 'INDICATION_VERIFICATION'],
    governanceNotice:
      'Requires verification of the exact shockwave device, clinical indication, and clinician authorization.',
    requiredProviderQualifications: 'Authorized urology or trained clinician',
    requiredEquipment: 'Verify shockwave generator specifications',
    consentRequired: true,
    sortOrder: 1,
  },
  {
    key: 'ed-02',
    name: 'Double Channel Electromagnetic Shockwave',
    englishName: 'Double Channel Electromagnetic Shockwave',
    categoryKey: 'ed-treatments',
    categoryName: 'ED Treatments',
    isEdTreatment: true,
    description: 'ED catalog entry — requires device and clinical indication verification.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['DEVICE_SPECIFICATION_REQUIRED', 'INDICATION_VERIFICATION'],
    governanceNotice:
      'Requires verification of the exact double-channel electromagnetic shockwave device and clinical indication.',
    requiredProviderQualifications: 'Authorized urology or trained clinician',
    requiredEquipment: 'Verify shockwave generator specifications',
    consentRequired: true,
    sortOrder: 2,
  },
  {
    key: 'ed-03',
    name: 'Acupuncture',
    englishName: 'Acupuncture',
    categoryKey: 'ed-treatments',
    categoryName: 'ED Treatments',
    isEdTreatment: true,
    description: 'ED catalog entry — qualified practitioner and safety documentation required.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['PROVIDER_QUALIFICATION_REQUIRED', 'SAFETY_DOCUMENTATION_REQUIRED'],
    governanceNotice:
      'Requires appropriately qualified practitioners and relevant safety documentation.',
    requiredProviderQualifications: 'Credentialed practitioner required',
    requiredEquipment: '',
    consentRequired: true,
    sortOrder: 3,
  },
  {
    key: 'ed-04',
    name: 'Hydrogen Rich Water',
    englishName: 'Hydrogen Rich Water',
    categoryKey: 'ed-treatments',
    categoryName: 'ED Treatments',
    isEdTreatment: true,
    description: 'ED catalog entry — clinical evidence review required; no unverified therapeutic claims.',
    terminologyReviewRequired: false,
    specialReviewFlags: ['EVIDENCE_GOVERNANCE_REVIEW', 'NO_UNVERIFIED_CLAIMS'],
    governanceNotice:
      'Clinical governance review required; do not present unverified therapeutic claims.',
    requiredProviderQualifications: '',
    requiredEquipment: '',
    consentRequired: false,
    sortOrder: 4,
  },
  {
    key: 'ed-05',
    name: 'Ozone Therapy',
    englishName: 'Ozone Therapy',
    categoryKey: 'ed-treatments',
    categoryName: 'ED Treatments',
    isEdTreatment: true,
    description: 'ED catalog entry — clinical and legal authorization review required.',
    terminologyReviewRequired: false,
    specialReviewFlags: [
      'LEGAL_AUTHORIZATION_REVIEW',
      'EVIDENCE_GOVERNANCE_REVIEW',
      'NO_UNVERIFIED_CLAIMS',
    ],
    governanceNotice:
      'Requires specific clinical and legal authorization review; no auto-populated dosage or efficacy claims permitted.',
    requiredProviderQualifications: 'Authorized clinician verification required',
    requiredEquipment: '',
    consentRequired: true,
    sortOrder: 5,
  },
];

let seedInFlight: Promise<void> | null = null;

/**
 * Idempotently seeds the initial 2 categories and 32 therapy catalog entries without
 * overwriting existing admin edits, verification approvals, or active toggles.
 */
export const ensureTherapyCatalogSeeded = async (forceInsertMissing = false): Promise<void> => {
  if (!forceInsertMissing) {
    const [catCount, itemCount] = await Promise.all([
      TherapyCategory.countDocuments({
        key: { $in: DEFAULT_THERAPY_CATEGORIES.map((c) => c.key) },
      }),
      Therapy.countDocuments({
        key: { $in: DEFAULT_THERAPY_CATALOG_ITEMS.map((t) => t.key) },
      }),
    ]);
    if (
      catCount === DEFAULT_THERAPY_CATEGORIES.length &&
      itemCount === DEFAULT_THERAPY_CATALOG_ITEMS.length
    ) {
      return;
    }
  }

  if (seedInFlight) {
    return seedInFlight;
  }

  seedInFlight = (async () => {
    try {
      await TherapyCategory.bulkWrite(
        DEFAULT_THERAPY_CATEGORIES.map((cat) => ({
          updateOne: {
            filter: { key: cat.key },
            update: { $setOnInsert: cat },
            upsert: true,
          },
        })),
        { ordered: false }
      );

      const categories = await TherapyCategory.find({
        key: { $in: DEFAULT_THERAPY_CATEGORIES.map((c) => c.key) },
      })
        .select('_id key name')
        .lean()
        .exec();

      const catByKey = new Map(categories.map((c) => [c.key, c._id]));

      const therapyOps = DEFAULT_THERAPY_CATALOG_ITEMS.map((item) => ({
        updateOne: {
          filter: { key: item.key },
          update: {
            $setOnInsert: {
              key: item.key,
              name: item.name,
              englishName: item.englishName,
              bengaliName: item.bengaliName || '',
              categoryId: catByKey.get(item.categoryKey),
              categoryName: item.categoryName,
              isEdTreatment: item.isEdTreatment,
              description: item.description,
              isActive: true,
              isAvailable: true,
              verificationStatus: 'PENDING_CLINICAL_REVIEW' as const,
              terminologyReviewRequired: item.terminologyReviewRequired,
              specialReviewFlags: item.specialReviewFlags,
              governanceNotice: item.governanceNotice,
              requiredProviderQualifications: item.requiredProviderQualifications,
              requiredEquipment: item.requiredEquipment,
              defaultSessionDurationMinutes: null,
              price: null,
              administrativeNotes: '',
              consentRequired: item.consentRequired,
              verifiedByUserId: null,
              verifiedByName: '',
              verifiedAt: null,
              verificationNotes: '',
              sortOrder: item.sortOrder,
            },
          },
          upsert: true,
        },
      }));

      await Therapy.bulkWrite(therapyOps, { ordered: false });
    } finally {
      seedInFlight = null;
    }
  })();

  return seedInFlight;
};

if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();
      await ensureTherapyCatalogSeeded(true);
      const count = await Therapy.countDocuments();
      console.log(`[TherapyCatalog] Ensured initial therapy catalog (${count} entries).`);
      await closeDatabase();
      process.exit(0);
    } catch (err) {
      console.error('[TherapyCatalog] Seed error:', err);
      await closeDatabase().catch(() => {});
      process.exit(1);
    }
  })();
}
