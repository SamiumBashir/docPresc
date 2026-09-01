import * as cheerio from 'cheerio';

export interface IMedexBrandRecord {
  brandName: string | null;
  strength: string | null;
  genericName: string | null;
  manufacturer: string | null;
  dosageForm?: string | null;
  sourcePage: number;
  sourceUrl: string;
  detailUrl?: string | null;
}

/**
 * Decodes common HTML entities and normalizes multiple spaces/newlines
 */
export function cleanText(raw?: string | null): string | null {
  if (!raw) return null;
  const decoded = raw
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return decoded.length > 0 ? decoded : null;
}

/**
 * Parses a single MedEx brands HTML page and extracts all medicine brand cards
 */
export function parseMedexHtml(html: string, pageNum: number): IMedexBrandRecord[] {
  if (!html || typeof html !== 'string') return [];

  const $ = cheerio.load(html);
  const records: IMedexBrandRecord[] = [];

  $('.brand-card').each((_, elem) => {
    const $card = $(elem);

    // 1. Detail link
    const href = $card.attr('href') || null;
    const detailUrl = href
      ? href.startsWith('http')
        ? href
        : `https://medex.com.bd${href.startsWith('/') ? '' : '/'}${href}`
      : null;

    // 2. Brand Name
    const rawBrandName = $card.find('.brand-card__name').text();
    const brandName = cleanText(rawBrandName);

    // 3. Strength
    const rawStrength = $card.find('.brand-card__strength').text();
    const strength = cleanText(rawStrength);

    // 4. Generic Name
    const rawGeneric = $card.find('.brand-card__generic').text();
    const genericName = cleanText(rawGeneric);

    // 5. Manufacturer
    const rawCompany = $card.find('.brand-card__company').text();
    const manufacturer = cleanText(rawCompany);

    // 6. Dosage Form (from dosage-icon image alt/title or slug fallback)
    const $dosageImg = $card.find('.dosage-icon, .brand-card__name-row img');
    let rawDosageForm = $dosageImg.attr('alt') || $dosageImg.attr('title') || null;
    
    // Fallback: extract dosage form from end of detailUrl slug if not on icon
    if (!rawDosageForm && href) {
      const parts = href.split('/');
      const slug = parts[parts.length - 1] || '';
      const slugParts = slug.split('-');
      if (slugParts.length > 0) {
        const lastWord = slugParts[slugParts.length - 1];
        if (['tablet', 'capsule', 'syrup', 'suspension', 'injection', 'drop', 'cream', 'ointment', 'gel', 'inhaler'].includes(lastWord.toLowerCase())) {
          rawDosageForm = lastWord.charAt(0).toUpperCase() + lastWord.slice(1);
        }
      }
    }
    const dosageForm = cleanText(rawDosageForm);

    if (brandName) {
      records.push({
        brandName,
        strength: strength || null,
        genericName: genericName || null,
        manufacturer: manufacturer || null,
        dosageForm: dosageForm || 'Tablet',
        sourcePage: pageNum,
        sourceUrl: `https://medex.com.bd/brands?page=${pageNum}`,
        detailUrl,
      });
    }
  });

  return records;
}
