export interface IDosageFormItem {
  name: string;
  slug?: string;
  category?: string;
  status?: string;
}

export const DOSAGE_FORMS: IDosageFormItem[] = [
  { name: "Tablet", slug: "tablet", category: "Solid Oral", status: "active" },
  { name: "Chewable Tablet", slug: "chewable-tablet", category: "Solid Oral", status: "active" },
  { name: "Dispersible Tablet", slug: "dispersible-tablet", category: "Solid Oral", status: "active" },
  { name: "Effervescent Tablet", slug: "effervescent-tablet", category: "Solid Oral", status: "active" },
  { name: "Orally Disintegrating Tablet", slug: "orally-disintegrating-tablet", category: "Solid Oral", status: "active" },
  { name: "Sublingual Tablet", slug: "sublingual-tablet", category: "Solid Oral", status: "active" },
  { name: "Buccal Tablet", slug: "buccal-tablet", category: "Solid Oral", status: "active" },
  { name: "Extended Release Tablet", slug: "extended-release-tablet", category: "Solid Oral", status: "active" },
  { name: "Delayed Release Tablet", slug: "delayed-release-tablet", category: "Solid Oral", status: "active" },
  { name: "Capsule", slug: "capsule", category: "Solid Oral", status: "active" },
  { name: "Softgel Capsule", slug: "softgel-capsule", category: "Solid Oral", status: "active" },
  { name: "Granules", slug: "granules", category: "Solid Oral", status: "active" },
  { name: "Powder", slug: "powder", category: "Solid Oral", status: "active" },
  { name: "Oral Powder", slug: "oral-powder", category: "Solid Oral", status: "active" },
  { name: "Sachet", slug: "sachet", category: "Solid Oral", status: "active" },
  { name: "Lozenge", slug: "lozenge", category: "Solid Oral", status: "active" },
  { name: "Syrup", slug: "syrup", category: "Liquid Oral", status: "active" },
  { name: "Suspension", slug: "suspension", category: "Liquid Oral", status: "active" },
  { name: "Oral Solution", slug: "oral-solution", category: "Liquid Oral", status: "active" },
  { name: "Oral Emulsion", slug: "oral-emulsion", category: "Liquid Oral", status: "active" },
  { name: "Elixir", slug: "elixir", category: "Liquid Oral", status: "active" },
  { name: "Oral Drops", slug: "oral-drops", category: "Liquid Oral", status: "active" },
  { name: "Injection", slug: "injection", category: "Parenteral", status: "active" },
  { name: "Infusion", slug: "infusion", category: "Parenteral", status: "active" },
  { name: "Eye Drops", slug: "eye-drops", category: "Ophthalmic", status: "active" },
  { name: "Eye Ointment", slug: "eye-ointment", category: "Ophthalmic", status: "active" },
  { name: "Eye Gel", slug: "eye-gel", category: "Ophthalmic", status: "active" },
  { name: "Ear Drops", slug: "ear-drops", category: "Otic", status: "active" },
  { name: "Nasal Drops", slug: "nasal-drops", category: "Nasal", status: "active" },
  { name: "Nasal Spray", slug: "nasal-spray", category: "Nasal", status: "active" },
  { name: "Nasal Solution", slug: "nasal-solution", category: "Nasal", status: "active" },
  { name: "Inhaler", slug: "inhaler", category: "Respiratory", status: "active" },
  { name: "Nebulizer Solution", slug: "nebulizer-solution", category: "Respiratory", status: "active" },
  { name: "Respiratory Solution", slug: "respiratory-solution", category: "Respiratory", status: "active" },
  { name: "Cream", slug: "cream", category: "Topical", status: "active" },
  { name: "Ointment", slug: "ointment", category: "Topical", status: "active" },
  { name: "Gel", slug: "gel", category: "Topical", status: "active" },
  { name: "Lotion", slug: "lotion", category: "Topical", status: "active" },
  { name: "Topical Solution", slug: "topical-solution", category: "Topical", status: "active" },
  { name: "Topical Suspension", slug: "topical-suspension", category: "Topical", status: "active" },
  { name: "Foam", slug: "foam", category: "Topical", status: "active" },
  { name: "Medicated Shampoo", slug: "medicated-shampoo", category: "Topical", status: "active" },
  { name: "Paste", slug: "paste", category: "Topical", status: "active" },
  { name: "Spray", slug: "spray", category: "Topical", status: "active" },
  { name: "Transdermal Patch", slug: "transdermal-patch", category: "Transdermal", status: "active" },
  { name: "Suppository", slug: "suppository", category: "Rectal", status: "active" },
  { name: "Rectal Cream", slug: "rectal-cream", category: "Rectal", status: "active" },
  { name: "Pessary", slug: "pessary", category: "Vaginal", status: "active" },
  { name: "Vaginal Cream", slug: "vaginal-cream", category: "Vaginal", status: "active" },
  { name: "Vaginal Tablet", slug: "vaginal-tablet", category: "Vaginal", status: "active" },
  { name: "Mouthwash", slug: "mouthwash", category: "Oral Topical", status: "active" },
  { name: "Gargle", slug: "gargle", category: "Oral Topical", status: "active" },
  { name: "Dental Gel", slug: "dental-gel", category: "Oral Topical", status: "active" },
  { name: "Toothpaste", slug: "toothpaste", category: "Oral Topical", status: "active" },
  { name: "Tincture", slug: "tincture", category: "Other", status: "active" },
  { name: "Other", slug: "other", category: "Other", status: "active" },
];

export const DOSAGE_FORM_NAMES: string[] = Array.from(
  new Set(DOSAGE_FORMS.map((d) => d.name.trim()).filter(Boolean))
);
