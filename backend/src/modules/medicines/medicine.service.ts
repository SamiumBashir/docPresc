import fs from 'fs';
import csvParser from 'csv-parser';
import mongoose, { Types } from 'mongoose';
import { medicineRepository, MedicineRepository } from './medicine.repository';
import { Doctor } from '../../models/Doctor';
import { NotFoundError, AppError } from '../../shared/errors';
import { CreateMedicineDTO, UpdateMedicineDTO, MedicineSearchOptions, MedicineFilterOptions } from './medicine.types';

interface FacetCache {
  timestamp: number;
  data: {
    categories: string[];
    dosageForms: string[];
    manufacturers: string[];
    medicineTypes: string[];
  };
}

const facetCache = new Map<string, FacetCache>();
const FACET_TTL_MS = 10 * 60 * 1000;

export class MedicineService {
  constructor(private repo: MedicineRepository = medicineRepository) {}

  clearFacetCache() {
    facetCache.clear();
  }

  async getCachedFacets(medicineType?: string) {
    const cacheKey = medicineType && medicineType !== 'all' ? medicineType : 'all';
    const cached = facetCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < FACET_TTL_MS) {
      return cached.data;
    }

    const filter = medicineType && medicineType !== 'all' ? { medicineType } : {};
    const [categories, dosageForms, manufacturers, medicineTypes] = await Promise.all([
      this.repo.distinct('category', filter),
      this.repo.distinct('dosageForm', filter),
      this.repo.distinct('manufacturer', filter),
      this.repo.distinct('medicineType'),
    ]);

    const facetData = {
      categories,
      dosageForms,
      manufacturers,
      medicineTypes: medicineTypes.length > 0 ? medicineTypes : ['Allopathic', 'Unani', 'Ayurvedic', 'Herbal'],
    };
    facetCache.set(cacheKey, { timestamp: now, data: facetData });
    return facetData;
  }

  async searchMedicines(options: MedicineSearchOptions) {
    const queryStr = (options.q || '').trim();
    const limitNum = Math.min(options.limit || 15, 50);

    const baseFilter: any = { status: 'active' };
    if (options.medicineType && options.medicineType !== 'all') {
      baseFilter.medicineType = options.medicineType;
    }

    const selectFields = 'brandName genericName strength dosageForm manufacturer category medicineType unit price status';

    if (!queryStr) {
      return this.repo.find(baseFilter, {
        limit: limitNum,
        sort: { brandName: 1 },
        select: selectFields,
      });
    }

    const regex = new RegExp(`^${queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    const containsRegex = new RegExp(queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [exactPrefixMatches, generalMatches] = await Promise.all([
      this.repo.find(
        {
          ...baseFilter,
          $or: [{ brandName: regex }, { genericName: regex }],
        },
        { limit: limitNum, select: selectFields }
      ),
      this.repo.find(
        {
          ...baseFilter,
          $or: [
            { brandName: containsRegex },
            { genericName: containsRegex },
            { manufacturer: containsRegex },
            { category: containsRegex },
          ],
        },
        { limit: limitNum, select: selectFields }
      ),
    ]);

    const seen = new Set<string>();
    return [...exactPrefixMatches, ...generalMatches]
      .filter((item) => {
        const id = (item as any)._id.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, limitNum);
  }

  async listMedicines(options: MedicineFilterOptions) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (options.search && typeof options.search === 'string' && options.search.trim()) {
      const sRegex = new RegExp(options.search.trim(), 'i');
      query.$or = [
        { brandName: sRegex },
        { genericName: sRegex },
        { manufacturer: sRegex },
        { category: sRegex },
      ];
    }

    if (options.medicineType && options.medicineType !== 'all') query.medicineType = options.medicineType;
    if (options.category && options.category !== 'all') query.category = options.category;
    if (options.dosageForm && options.dosageForm !== 'all') query.dosageForm = options.dosageForm;
    if (options.manufacturer && options.manufacturer !== 'all') query.manufacturer = options.manufacturer;

    const [medicines, total, facetData] = await Promise.all([
      this.repo.find(query, { skip, limit, sort: { brandName: 1 } }),
      this.repo.count(query),
      this.getCachedFacets(options.medicineType),
    ]);

    return {
      medicines,
      categories: facetData.categories,
      dosageForms: facetData.dosageForms,
      manufacturers: facetData.manufacturers,
      medicineTypes: facetData.medicineTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getMedicineTypes() {
    const counts = await this.repo.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$medicineType', count: { $sum: 1 } } },
    ]);

    return [
      { type: 'Allopathic', nameEn: 'Allopathic', nameBn: 'অ্যালোপ্যাথিক', description: 'Conventional Modern Pharmaceuticals' },
      { type: 'Unani', nameEn: 'Unani Medicine', nameBn: 'ইউনানি চিকিৎসা', description: 'Tibb-e-Unani Herbal & Traditional Formulations' },
      { type: 'Ayurvedic', nameEn: 'Ayurvedic Medicine', nameBn: 'আয়ুর্বেদিক চিকিৎসা', description: 'Classical Ayurvedic & Botanical Remedies' },
      { type: 'Herbal', nameEn: 'Herbal & Natural', nameBn: 'হারবাল ও ভেষজ', description: 'Standardized Botanical Formulations' },
    ].map((sys) => {
      const found = counts.find((c) => c._id === sys.type);
      return { ...sys, count: found ? found.count : 0 };
    });
  }

  async getFavoriteMedicines(doctorId: Types.ObjectId | string) {
    const doctor = await Doctor.findById(doctorId).populate('favoriteMedicines');
    return doctor?.favoriteMedicines || [];
  }

  async toggleFavoriteMedicine(doctorId: Types.ObjectId | string, medicineId: string) {
    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      throw new NotFoundError('Medicine not found.');
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found.');
    }

    const index = doctor.favoriteMedicines.findIndex((id) => id.toString() === medicineId);
    let isFavorite = false;

    if (index > -1) {
      doctor.favoriteMedicines.splice(index, 1);
      isFavorite = false;
    } else {
      doctor.favoriteMedicines.push(new mongoose.Types.ObjectId(medicineId));
      isFavorite = true;
    }

    await doctor.save();
    return { isFavorite, favoriteMedicines: doctor.favoriteMedicines };
  }

  async createMedicine(data: CreateMedicineDTO) {
    const medicine = await this.repo.create(data);
    this.clearFacetCache();
    return medicine;
  }

  async updateMedicine(id: string, data: UpdateMedicineDTO) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Medicine not found.');
    }
    const updated = await this.repo.update(id, data);
    if (!updated) {
      throw new NotFoundError('Medicine not found.');
    }
    this.clearFacetCache();
    return updated;
  }

  async deleteMedicine(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Medicine not found.');
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Medicine not found.');
    }
    await Doctor.updateMany({ favoriteMedicines: id }, { $pull: { favoriteMedicines: id } });
    this.clearFacetCache();
    return deleted;
  }

  async importCsv(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            let importedCount = 0;
            const operations = [];

            for (const row of results) {
              const brandName = (row.brandName || row['Brand Name'] || row.brand || '').trim();
              const genericName = (row.genericName || row['Generic Name'] || row.generic || '').trim();
              const strength = (row.strength || row['Strength'] || '').trim();
              const dosageForm = (row.dosageForm || row['Dosage Form'] || row.form || 'Tablet').trim();
              const manufacturer = (row.manufacturer || row['Manufacturer'] || row.company || 'Generic').trim();
              const category = (row.category || row['Category'] || 'General').trim();
              const medicineType = (row.medicineType || row['Medicine Type'] || row.system || 'Allopathic').trim();

              const validMedicineType = ['Allopathic', 'Unani', 'Ayurvedic', 'Herbal'].includes(medicineType)
                ? (medicineType as 'Allopathic' | 'Unani' | 'Ayurvedic' | 'Herbal')
                : 'Allopathic';

              const finalStrength = strength || 'N/A';

              if (brandName && genericName) {
                operations.push({
                  updateOne: {
                    filter: { brandName, genericName, strength: finalStrength },
                    update: {
                      $set: {
                        brandName,
                        genericName,
                        strength: finalStrength,
                        dosageForm: dosageForm || 'Tablet',
                        manufacturer,
                        category,
                        medicineType: validMedicineType,
                        status: 'active' as const,
                      },
                    },
                    upsert: true,
                  },
                });
                importedCount++;
              }
            }

            if (operations.length > 0) {
              await this.repo.bulkWrite(operations);
            }

            fs.unlink(filePath, () => {});
            this.clearFacetCache();
            resolve(importedCount);
          } catch (err) {
            fs.unlink(filePath, () => {});
            reject(err);
          }
        })
        .on('error', (err) => {
          fs.unlink(filePath, () => {});
          reject(err);
        });
    });
  }
}

export const medicineService = new MedicineService();
