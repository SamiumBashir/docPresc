export interface ChiefComplaintItem {
  name: string;
  category: string;
  aliases?: string[];
}

export const CHIEF_COMPLAINT_CATEGORIES = [
  'General Symptoms',
  'Head and Neurological Symptoms',
  'Eye Symptoms',
  'Ear, Nose and Throat Symptoms',
  'Respiratory Symptoms',
  'Cardiovascular Symptoms',
  'Gastrointestinal Symptoms',
] as const;

export const CHIEF_COMPLAINTS_DATA: ChiefComplaintItem[] = [
  // 1. General Symptoms (Page 1)
  { name: 'Fever', category: 'General Symptoms', aliases: ['জ্বর', 'Pyrexia', 'Temperature', 'Febrile'] },
  { name: 'Low-Grade Fever', category: 'General Symptoms', aliases: ['অল্প জ্বর', 'Mild Fever'] },
  { name: 'High Fever', category: 'General Symptoms', aliases: ['তীব্র জ্বর', 'High Grade Fever'] },
  { name: 'Recurrent Fever', category: 'General Symptoms', aliases: ['বারবার জ্বর', 'Intermittent Fever'] },
  { name: 'Chills', category: 'General Symptoms', aliases: ['কাঁপুনি', 'Rigor', 'Shivering'] },
  { name: 'Fatigue', category: 'General Symptoms', aliases: ['ক্লান্তি', 'Tiredness', 'Exhaustion'] },
  { name: 'Weakness', category: 'General Symptoms', aliases: ['দুর্বলতা', 'Asthenia', 'Debility'] },
  { name: 'Generalized Body Ache', category: 'General Symptoms', aliases: ['শরীর ব্যথা', 'Body Pain', 'Myalgia'] },
  { name: 'Malaise', category: 'General Symptoms', aliases: ['অস্বস্তি', 'Uneasiness'] },
  { name: 'Loss of Appetite', category: 'General Symptoms', aliases: ['ক্ষুধামন্দা', 'অরুচি', 'Anorexia', 'Poor Appetite'] },
  { name: 'Increased Appetite', category: 'General Symptoms', aliases: ['বেশি ক্ষুধা', 'Polyphagia'] },
  { name: 'Weight Loss', category: 'General Symptoms', aliases: ['ওজন হ্রাস', 'Weight Reduction'] },
  { name: 'Weight Gain', category: 'General Symptoms', aliases: ['ওজন বৃদ্ধি'] },
  { name: 'Night Sweats', category: 'General Symptoms', aliases: ['রাতে ঘাম', 'Nocturnal Diaphoresis'] },
  { name: 'Excessive Sweating', category: 'General Symptoms', aliases: ['অতিরিক্ত ঘাম', 'Hyperhidrosis', 'Diaphoresis'] },
  { name: 'Dehydration', category: 'General Symptoms', aliases: ['পানিশূন্যতা', 'Fluid Depletion'] },
  { name: 'Dizziness', category: 'General Symptoms', aliases: ['মাথা ঘোরা', 'Lightheadedness', 'Giddiness'] },
  { name: 'Fainting', category: 'General Symptoms', aliases: ['অজ্ঞান হওয়া', 'Syncope', 'Blackout'] },
  { name: 'Swelling', category: 'General Symptoms', aliases: ['ফোলা', 'Edema'] },
  { name: 'Generalized Itching', category: 'General Symptoms', aliases: ['গা চুলকানি', 'Pruritus'] },

  // 2. Head and Neurological Symptoms (Page 1 & 2)
  { name: 'Headache', category: 'Head and Neurological Symptoms', aliases: ['মাথাব্যথা', 'Cephalea', 'Head Pain'] },
  { name: 'Migraine', category: 'Head and Neurological Symptoms', aliases: ['মাইগ্রেন', 'Hemicrania'] },
  { name: 'Vertigo', category: 'Head and Neurological Symptoms', aliases: ['ঘূর্ণন', 'Dizziness'] },
  { name: 'Loss of Consciousness', category: 'Head and Neurological Symptoms', aliases: ['জ্ঞান হারানো', 'Syncope', 'Unconscious'] },
  { name: 'Seizures', category: 'Head and Neurological Symptoms', aliases: ['খিঁচুনি', 'Convulsions', 'Epilepsy', 'Fits'] },
  { name: 'Tremor', category: 'Head and Neurological Symptoms', aliases: ['হাত কাঁপা', 'Shaking'] },
  { name: 'Numbness', category: 'Head and Neurological Symptoms', aliases: ['অবশ ভাব', 'Paresthesia'] },
  { name: 'Tingling Sensation', category: 'Head and Neurological Symptoms', aliases: ['ঝিমঝিম করা', 'Pins and Needles'] },
  { name: 'Weakness of Limbs', category: 'Head and Neurological Symptoms', aliases: ['হাত-পা দুর্বলতা', 'Extremity Weakness'] },
  { name: 'Paralysis', category: 'Head and Neurological Symptoms', aliases: ['প্যারালাইসিস', 'Hemiplegia', 'Paresis'] },
  { name: 'Difficulty Walking', category: 'Head and Neurological Symptoms', aliases: ['হাঁটতে সমস্যা', 'Gait Disturbance'] },
  { name: 'Loss of Balance', category: 'Head and Neurological Symptoms', aliases: ['ভারসাম্যহীনতা', 'Ataxia'] },
  { name: 'Memory Loss', category: 'Head and Neurological Symptoms', aliases: ['স্মৃতিভ্রম', 'Amnesia', 'Forgetfulness'] },
  { name: 'Confusion', category: 'Head and Neurological Symptoms', aliases: ['বিভ্রান্তি', 'Altered Mental State'] },
  { name: 'Difficulty Concentrating', category: 'Head and Neurological Symptoms', aliases: ['মনোযোগে সমস্যা'] },
  { name: 'Insomnia', category: 'Head and Neurological Symptoms', aliases: ['ঘুম না হওয়া', 'Sleeplessness'] },
  { name: 'Excessive Sleepiness', category: 'Head and Neurological Symptoms', aliases: ['অতিরিক্ত ঘুম', 'Somnolence', 'Hypersomnia'] },
  { name: 'Facial Pain', category: 'Head and Neurological Symptoms', aliases: ['মুখে ব্যথা', 'Trigeminal Pain'] },
  { name: 'Neck Stiffness', category: 'Head and Neurological Symptoms', aliases: ['ঘাড় শক্ত হওয়া', 'Nuchal Rigidity'] },

  // 3. Eye Symptoms (Page 2)
  { name: 'Blurred Vision', category: 'Eye Symptoms', aliases: ['ঝাপসা দৃষ্টি', 'Hazy Vision'] },
  { name: 'Loss of Vision', category: 'Eye Symptoms', aliases: ['দৃষ্টিহীনতা', 'Visual Loss', 'Blindness'] },
  { name: 'Eye Pain', category: 'Eye Symptoms', aliases: ['চোখে ব্যথা', 'Ocular Pain'] },
  { name: 'Red Eye', category: 'Eye Symptoms', aliases: ['চোখ লাল', 'Conjunctival Congestion', 'Pink Eye'] },
  { name: 'Watery Eyes', category: 'Eye Symptoms', aliases: ['চোখে পানি পড়া', 'Epiphora'] },
  { name: 'Dry Eyes', category: 'Eye Symptoms', aliases: ['চোখ শুকিয়ে যাওয়া'] },
  { name: 'Itching of Eyes', category: 'Eye Symptoms', aliases: ['চোখ চুলকানি'] },
  { name: 'Burning Sensation in Eyes', category: 'Eye Symptoms', aliases: ['চোখ জ্বালাপোড়া'] },
  { name: 'Eye Discharge', category: 'Eye Symptoms', aliases: ['চোখ দিয়ে পুঁজ পড়া', 'Eye Pus'] },
  { name: 'Swelling of Eyelids', category: 'Eye Symptoms', aliases: ['চোখের পাতা ফোলা', 'Blepharitis'] },
  { name: 'Double Vision', category: 'Eye Symptoms', aliases: ['ডাবল ভিশন', 'Diplopia'] },
  { name: 'Sensitivity to Light', category: 'Eye Symptoms', aliases: ['আলোর প্রতি সংবেদনশীলতা', 'Photophobia'] },
  { name: 'Foreign Body Sensation', category: 'Eye Symptoms', aliases: ['চোখে কিছু পড়ার অনুভূতি'] },
  { name: 'Floaters', category: 'Eye Symptoms', aliases: ['আই ফ্লোটার'] },
  { name: 'Excessive Tearing', category: 'Eye Symptoms', aliases: ['Lacrimation'] },

  // 4. Ear, Nose and Throat Symptoms (Page 2 & 3)
  { name: 'Earache', category: 'Ear, Nose and Throat Symptoms', aliases: ['কান ব্যথা', 'Otalgia'] },
  { name: 'Ear Discharge', category: 'Ear, Nose and Throat Symptoms', aliases: ['কান দিয়ে পুঁজ পড়া', 'Otorrhea'] },
  { name: 'Hearing Loss', category: 'Ear, Nose and Throat Symptoms', aliases: ['কানে কম শোনা', 'Deafness'] },
  { name: 'Ringing in Ears', category: 'Ear, Nose and Throat Symptoms', aliases: ['কানে বাঁশির আওয়াজ', 'Tinnitus'] },
  { name: 'Ear Itching', category: 'Ear, Nose and Throat Symptoms', aliases: ['কান চুলকানি'] },
  { name: 'Nasal Congestion', category: 'Ear, Nose and Throat Symptoms', aliases: ['নাক বন্ধ', 'Blocked Nose'] },
  { name: 'Runny Nose', category: 'Ear, Nose and Throat Symptoms', aliases: ['সর্দি', 'Rhinorrhea', 'Cold'] },
  { name: 'Sneezing', category: 'Ear, Nose and Throat Symptoms', aliases: ['হাঁচি'] },
  { name: 'Nosebleed', category: 'Ear, Nose and Throat Symptoms', aliases: ['নাক দিয়ে রক্ত পড়া', 'Epistaxis'] },
  { name: 'Loss of Smell', category: 'Ear, Nose and Throat Symptoms', aliases: ['ঘ্রাণশক্তি হারানো', 'Anosmia'] },
  { name: 'Sore Throat', category: 'Ear, Nose and Throat Symptoms', aliases: ['গলা ব্যথা', 'Pharyngitis'] },
  { name: 'Throat Pain', category: 'Ear, Nose and Throat Symptoms', aliases: ['গলায় ব্যথা'] },
  { name: 'Difficulty Swallowing', category: 'Ear, Nose and Throat Symptoms', aliases: ['গিলতে সমস্যা', 'Dysphagia'] },
  { name: 'Painful Swallowing', category: 'Ear, Nose and Throat Symptoms', aliases: ['গিলতে ব্যথা', 'Odynophagia'] },
  { name: 'Hoarseness of Voice', category: 'Ear, Nose and Throat Symptoms', aliases: ['কণ্ঠস্বর ভেঙে যাওয়া', 'Dysphonia'] },
  { name: 'Loss of Voice', category: 'Ear, Nose and Throat Symptoms', aliases: ['স্বরভঙ্গ', 'Aphonia'] },
  { name: 'Tonsillar Pain', category: 'Ear, Nose and Throat Symptoms', aliases: ['টনসিল ব্যথা', 'Tonsillitis'] },
  { name: 'Enlarged Tonsils', category: 'Ear, Nose and Throat Symptoms', aliases: ['টনসিল ফোলা', 'Tonsil Swelling'] },
  { name: 'Mouth Breathing', category: 'Ear, Nose and Throat Symptoms', aliases: ['মুখ দিয়ে শ্বাস নেওয়া'] },
  { name: 'Snoring', category: 'Ear, Nose and Throat Symptoms', aliases: ['নাক ডাকা', 'Stertor'] },

  // 5. Respiratory Symptoms (Page 3 & 4)
  { name: 'Cough', category: 'Respiratory Symptoms', aliases: ['কাশি', 'Tussis'] },
  { name: 'Dry Cough', category: 'Respiratory Symptoms', aliases: ['শুকনো কাশি', 'Non-productive Cough'] },
  { name: 'Productive Cough', category: 'Respiratory Symptoms', aliases: ['কফ কাশি', 'Wet Cough'] },
  { name: 'Chronic Cough', category: 'Respiratory Symptoms', aliases: ['দীর্ঘস্থায়ী কাশি'] },
  { name: 'Shortness of Breath', category: 'Respiratory Symptoms', aliases: ['শ্বাসকষ্ট', 'Dyspnea', 'SOB'] },
  { name: 'Difficulty Breathing', category: 'Respiratory Symptoms', aliases: ['শ্বাস নিতে কষ্ট', 'Breathlessness'] },
  { name: 'Wheezing', category: 'Respiratory Symptoms', aliases: ['বুকে সাঁই-সাঁই আওয়াজ', 'Asthma'] },
  { name: 'Chest Tightness', category: 'Respiratory Symptoms', aliases: ['বুক চেপে আসা'] },
  { name: 'Chest Pain', category: 'Respiratory Symptoms', aliases: ['বুকে ব্যথা', 'Pleuritic Chest Pain'] },
  { name: 'Coughing Up Blood', category: 'Respiratory Symptoms', aliases: ['কাশি দিয়ে রক্ত পড়া', 'Hemoptysis'] },
  { name: 'Excessive Sputum Production', category: 'Respiratory Symptoms', aliases: ['অতিরিক্ত কফ', 'Phlegm'] },
  { name: 'Noisy Breathing', category: 'Respiratory Symptoms', aliases: ['শব্দযুক্ত শ্বাস', 'Stridor'] },
  { name: 'Rapid Breathing', category: 'Respiratory Symptoms', aliases: ['দ্রুত শ্বাস', 'Tachypnea'] },
  { name: 'Painful Breathing', category: 'Respiratory Symptoms', aliases: ['শ্বাস নিতে ব্যথা'] },
  { name: 'Breathlessness on Exertion', category: 'Respiratory Symptoms', aliases: ['পরিশ্রমে শ্বাসকষ্ট', 'DOE', 'Exertional Dyspnea'] },

  // 6. Cardiovascular Symptoms (Page 4)
  { name: 'Chest Pain (Cardiovascular)', category: 'Cardiovascular Symptoms', aliases: ['বুকে ব্যথা', 'Angina', 'Heart Pain', 'Chest Discomfort'] },
  { name: 'Palpitations', category: 'Cardiovascular Symptoms', aliases: ['বুক ধড়ফড়', 'Heart Racing', 'Arrhythmia'] },
  { name: 'Shortness of Breath (Cardiovascular)', category: 'Cardiovascular Symptoms', aliases: ['কার্ডিয়াক শ্বাসকষ্ট', 'Cardiac Dyspnea'] },
  { name: 'Orthopnea', category: 'Cardiovascular Symptoms', aliases: ['শুয়ে থাকলে শ্বাসকষ্ট'] },
  { name: 'Paroxysmal Nocturnal Dyspnea', category: 'Cardiovascular Symptoms', aliases: ['PND', 'রাতে হঠাৎ শ্বাসকষ্ট'] },
  { name: 'Leg Swelling', category: 'Cardiovascular Symptoms', aliases: ['পা ফোলা', 'Pedal Edema'] },
  { name: 'Ankle Swelling', category: 'Cardiovascular Symptoms', aliases: ['গোড়ালি ফোলা'] },
  { name: 'Fainting (Cardiovascular)', category: 'Cardiovascular Symptoms', aliases: ['অজ্ঞান হওয়া', 'Syncope'] },
  { name: 'Dizziness (Cardiovascular)', category: 'Cardiovascular Symptoms', aliases: ['মাথা ঘোরা'] },
  { name: 'Exercise Intolerance', category: 'Cardiovascular Symptoms', aliases: ['পরিশ্রম সহ্য না হওয়া'] },
  { name: 'Cold Extremities', category: 'Cardiovascular Symptoms', aliases: ['হাত-পা ঠান্ডা হওয়া'] },
  { name: 'Pain in Legs While Walking', category: 'Cardiovascular Symptoms', aliases: ['হাঁটার সময় পায়ে ব্যথা', 'Claudication'] },

  // 7. Gastrointestinal Symptoms (Page 4 & 5)
  { name: 'Abdominal Pain', category: 'Gastrointestinal Symptoms', aliases: ['পেটে ব্যথা', 'Stomach Ache', 'Tummy Ache'] },
  { name: 'Upper Abdominal Pain', category: 'Gastrointestinal Symptoms', aliases: ['উপর পেটে ব্যথা'] },
  { name: 'Lower Abdominal Pain', category: 'Gastrointestinal Symptoms', aliases: ['তলপেটে ব্যথা'] },
  { name: 'Right Upper Quadrant Pain', category: 'Gastrointestinal Symptoms', aliases: ['RUQ Pain', 'ডান পাঁজরে ব্যথা'] },
  { name: 'Left Upper Quadrant Pain', category: 'Gastrointestinal Symptoms', aliases: ['LUQ Pain'] },
  { name: 'Right Lower Quadrant Pain', category: 'Gastrointestinal Symptoms', aliases: ['RLQ Pain', 'অ্যাপেন্ডিক্স ব্যথা'] },
  { name: 'Left Lower Quadrant Pain', category: 'Gastrointestinal Symptoms', aliases: ['LLQ Pain'] },
  { name: 'Epigastric Pain', category: 'Gastrointestinal Symptoms', aliases: ['বুকের নিচে পেটে ব্যথা', 'গ্যাস্ট্রিক ব্যথা', 'Gastric Pain'] },
  { name: 'Heartburn', category: 'Gastrointestinal Symptoms', aliases: ['বুক জ্বালাপোড়া', 'Pyrosis', 'Acidity'] },
  { name: 'Acid Reflux', category: 'Gastrointestinal Symptoms', aliases: ['অম্বল', 'Hyperacidity', 'GERD'] },
  { name: 'Indigestion', category: 'Gastrointestinal Symptoms', aliases: ['বদহজম', 'Dyspepsia'] },
  { name: 'Bloating', category: 'Gastrointestinal Symptoms', aliases: ['পেট ফাঁপা', 'Gas in Stomach'] },
  { name: 'Abdominal Distension', category: 'Gastrointestinal Symptoms', aliases: ['পেট ফুলে যাওয়া'] },
  { name: 'Nausea', category: 'Gastrointestinal Symptoms', aliases: ['বমি বমি ভাব', 'Feeling Sick'] },
  { name: 'Vomiting', category: 'Gastrointestinal Symptoms', aliases: ['বমি', 'Emesis'] },
  { name: 'Blood in Vomit', category: 'Gastrointestinal Symptoms', aliases: ['বমির সাথে রক্ত', 'Hematemesis'] },
  { name: 'Diarrhea', category: 'Gastrointestinal Symptoms', aliases: ['ডায়রিয়া', 'Loose Motions', 'Watery Stool'] },
  { name: 'Acute Diarrhea', category: 'Gastrointestinal Symptoms', aliases: ['তীব্র ডায়রিয়া'] },
  { name: 'Chronic Diarrhea', category: 'Gastrointestinal Symptoms', aliases: ['দীর্ঘমেয়াদী ডায়রিয়া'] },
  { name: 'Constipation', category: 'Gastrointestinal Symptoms', aliases: ['কোষ্ঠকাঠিন্য', 'Hard Stool'] },
  { name: 'Alternating Diarrhea and Constipation', category: 'Gastrointestinal Symptoms', aliases: ['IBS'] },
  { name: 'Blood in Stool', category: 'Gastrointestinal Symptoms', aliases: ['পায়খানার সাথে রক্ত', 'Melena', 'Hematochezia'] },
  { name: 'Black Stool', category: 'Gastrointestinal Symptoms', aliases: ['কালো পায়খানা', 'Melena'] },
  { name: 'Mucus in Stool', category: 'Gastrointestinal Symptoms', aliases: ['পায়খানার সাথে আম/শ্লেষ্মা', 'Dysentery'] },
  { name: 'Painful Defecation', category: 'Gastrointestinal Symptoms', aliases: ['মলত্যাগে ব্যথা', 'Dyschezia'] },
  { name: 'Rectal Bleeding', category: 'Gastrointestinal Symptoms', aliases: ['পায়ুপথে রক্তপাত', 'Piles Bleeding', 'Hemorrhoids'] },
  { name: 'Anal Pain', category: 'Gastrointestinal Symptoms', aliases: ['পায়ুপথে ব্যথা', 'Anal Fissure'] },
  { name: 'Anal Itching', category: 'Gastrointestinal Symptoms', aliases: ['পায়ুপথ চুলকানি', 'Pruritus Ani'] },
  { name: 'Excessive Gas', category: 'Gastrointestinal Symptoms', aliases: ['অতিরিক্ত গ্যাস', 'Flatulence'] },
  { name: 'Jaundice', category: 'Gastrointestinal Symptoms', aliases: ['জন্ডিস', 'Yellow Eyes', 'Yellow Urine'] },
  { name: 'Abdominal Lump', category: 'Gastrointestinal Symptoms', aliases: ['পেটে চাকা'] },
  { name: 'Tenesmus', category: 'Gastrointestinal Symptoms', aliases: ['মলত্যাগের মিথ্যা বেগ'] },
];

/**
 * 18 Most common quick-prescribing symptoms for 1-click chip buttons
 */
export const COMMON_CHIEF_COMPLAINTS_QUICK: string[] = [
  'Fever',
  'Cough',
  'Headache',
  'Chest Pain',
  'Abdominal Pain',
  'Shortness of Breath',
  'Weakness',
  'Vomiting',
  'Diarrhea',
  'Loss of Appetite',
  'Runny Nose',
  'Sore Throat',
  'Back Pain',
  'Joint Pain',
  'Burning During Urination',
  'Dizziness',
  'Generalized Body Ache',
  'Heartburn',
];

/**
 * Quick duration presets for doctor ease of use
 */
export const DURATION_PRESETS: string[] = [
  '1 day',
  '2 days',
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '2 weeks',
  '1 month',
];

/**
 * Search all chief complaints by symptom name, acronym, category, or Bangla aliases
 */
export const searchChiefComplaints = (query: string): ChiefComplaintItem[] => {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();

  return CHIEF_COMPLAINTS_DATA.filter((item) => {
    if (item.name.toLowerCase().includes(q)) return true;
    if (item.category.toLowerCase().includes(q)) return true;
    if (item.aliases && item.aliases.some((a) => a.toLowerCase().includes(q))) return true;
    return false;
  }).slice(0, 20);
};
