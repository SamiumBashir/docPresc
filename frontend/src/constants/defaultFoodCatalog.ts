import { IFoodCatalogItem } from '../types';

export const DEFAULT_ALLOWED_CATALOG_FALLBACK: IFoodCatalogItem[] = [
  { _id: 'fallback-allowed-01', key: 'allowed-01', section: 'allowed', category: 'Protein & Eggs', labelBn: 'ভিটামিন ও মিনারেল সমৃদ্ধ ডিম', isCustomAllowed: false, sortOrder: 1, isActive: true },
  { _id: 'fallback-allowed-02', key: 'allowed-02', section: 'allowed', category: 'Grains', labelBn: 'ঢেঁকি ছাঁটা চাল', isCustomAllowed: false, sortOrder: 2, isActive: true },
  { _id: 'fallback-allowed-03', key: 'allowed-03', section: 'allowed', category: 'Dairy', labelBn: 'দুধ (ফ্যাটলেস)', isCustomAllowed: false, sortOrder: 3, isActive: true },
  { _id: 'fallback-allowed-04', key: 'allowed-04', section: 'allowed', category: 'Dairy', labelBn: 'দুধ (ফুল ক্রিম যুক্ত)', isCustomAllowed: false, sortOrder: 4, isActive: true },
  { _id: 'fallback-allowed-05', key: 'allowed-05', section: 'allowed', category: 'Dairy', labelBn: 'দই', isCustomAllowed: false, sortOrder: 5, isActive: true },
  { _id: 'fallback-allowed-06', key: 'allowed-06', section: 'allowed', category: 'Healthy Oils', labelBn: 'অলিভ অয়েল', isCustomAllowed: false, sortOrder: 6, isActive: true },
  { _id: 'fallback-allowed-07', key: 'allowed-07', section: 'allowed', category: 'Healthy Oils', labelBn: 'সিসাম অয়েল (তিলের তেল)', isCustomAllowed: false, sortOrder: 7, isActive: true },
  { _id: 'fallback-allowed-08', key: 'allowed-08', section: 'allowed', category: 'Protein & Meat', labelBn: 'চিকেন (ফ্যাটলেস ও হেভি মেটাললেস)', isCustomAllowed: false, sortOrder: 8, isActive: true },
  { _id: 'fallback-allowed-09', key: 'allowed-09', section: 'allowed', category: 'Nuts & Spreads', labelBn: 'নাট বাটার', isCustomAllowed: false, sortOrder: 9, isActive: true },
  { _id: 'fallback-allowed-10', key: 'allowed-10', section: 'allowed', category: 'Spices & Herbs', labelBn: 'হলুদ / টারমারিক', isCustomAllowed: false, sortOrder: 10, isActive: true },
  { _id: 'fallback-allowed-11', key: 'allowed-11', section: 'allowed', category: 'Vegetables & Greens', labelBn: 'শাক-সবজি', isCustomAllowed: false, sortOrder: 11, isActive: true },
  { _id: 'fallback-allowed-12', key: 'allowed-12', section: 'allowed', category: 'Vegetables & Greens', labelBn: 'লিক (ভেজিটেবল)', isCustomAllowed: false, sortOrder: 12, isActive: true },
  { _id: 'fallback-allowed-13', key: 'allowed-13', section: 'allowed', category: 'Fruits & Vitamins', labelBn: 'ভিটামিন-সি', isCustomAllowed: false, sortOrder: 13, isActive: true },
  { _id: 'fallback-allowed-14', key: 'allowed-14', section: 'allowed', category: 'Natural Sweeteners', labelBn: 'মধু', isCustomAllowed: false, sortOrder: 14, isActive: true },
  { _id: 'fallback-allowed-15', key: 'allowed-15', section: 'allowed', category: 'Herbal Beverages', labelBn: 'মরিঙ্গা চা', isCustomAllowed: false, sortOrder: 15, isActive: true },
  { _id: 'fallback-allowed-16', key: 'allowed-16', section: 'allowed', category: 'Protein & Fish', labelBn: 'সামুদ্রিক মাছ', isCustomAllowed: false, sortOrder: 16, isActive: true },
  { _id: 'fallback-allowed-17', key: 'allowed-17', section: 'allowed', category: 'Vegetables & Greens', labelBn: 'বিটরুট', isCustomAllowed: false, sortOrder: 17, isActive: true },
  { _id: 'fallback-allowed-18', key: 'allowed-18', section: 'allowed', category: 'Fruits & Vitamins', labelBn: 'ফল', isCustomAllowed: false, sortOrder: 18, isActive: true },
  { _id: 'fallback-allowed-19', key: 'allowed-19', section: 'allowed', category: 'Healthy Oils', labelBn: 'কাঠের ঘানিতে ভাঙানো খাঁটি সরিষার তেল', isCustomAllowed: false, sortOrder: 19, isActive: true },
  { _id: 'fallback-allowed-20', key: 'allowed-20', section: 'allowed', category: 'Other', labelBn: 'অন্যান্য', isCustomAllowed: true, sortOrder: 20, isActive: true },
];

export const DEFAULT_AVOIDED_CATALOG_FALLBACK: IFoodCatalogItem[] = [
  { _id: 'fallback-avoided-01', key: 'avoided-01', section: 'avoided', category: 'High Fat', labelBn: 'অতিরিক্ত চর্বিযুক্ত খাবার', isCustomAllowed: false, sortOrder: 1, isActive: true },
  { _id: 'fallback-avoided-02', key: 'avoided-02', section: 'avoided', category: 'Red Meat', labelBn: 'লাল মাংস', isCustomAllowed: false, sortOrder: 2, isActive: true },
  { _id: 'fallback-avoided-03', key: 'avoided-03', section: 'avoided', category: 'Spicy & Irritants', labelBn: 'ঝাল ও মসলাযুক্ত খাবার', isCustomAllowed: false, sortOrder: 3, isActive: true },
  { _id: 'fallback-avoided-04', key: 'avoided-04', section: 'avoided', category: 'Acidic & Gastric', labelBn: 'অ্যাসিডিটি তৈরি করে এমন খাবার (গ্যাস্ট্রিক)', isCustomAllowed: false, sortOrder: 4, isActive: true },
  { _id: 'fallback-avoided-05', key: 'avoided-05', section: 'avoided', category: 'Fast & Processed', labelBn: 'ফাস্টফুড', isCustomAllowed: false, sortOrder: 5, isActive: true },
  { _id: 'fallback-avoided-06', key: 'avoided-06', section: 'avoided', category: 'Root Vegetables', labelBn: 'মাটির নিচের খাবার (মুলা, গাজর, শালগম, আলু, ওলকপি)', isCustomAllowed: false, sortOrder: 6, isActive: true },
  { _id: 'fallback-avoided-07', key: 'avoided-07', section: 'avoided', category: 'Starchy Vegetables', labelBn: 'মিষ্টিকুমড়া', isCustomAllowed: false, sortOrder: 7, isActive: true },
  { _id: 'fallback-avoided-08', key: 'avoided-08', section: 'avoided', category: 'Sugars & Bakery', labelBn: 'মিষ্টি, চকোলেট ও প্যাস্ট্রি', isCustomAllowed: false, sortOrder: 8, isActive: true },
  { _id: 'fallback-avoided-09', key: 'avoided-09', section: 'avoided', category: 'Fast & Processed', labelBn: 'প্রক্রিয়াজাত সংরক্ষিত খাবার', isCustomAllowed: false, sortOrder: 9, isActive: true },
  { _id: 'fallback-avoided-10', key: 'avoided-10', section: 'avoided', category: 'Other', labelBn: 'অন্যান্য', isCustomAllowed: true, sortOrder: 10, isActive: true },
];
