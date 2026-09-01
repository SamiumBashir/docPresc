# MedEx Medicine Scraper, Cleaner & Importer for DocPresc

This subsystem collects, parses, cleans, deduplicates, and imports Bangladesh national pharmaceutical brand records from MedEx (`https://medex.com.bd/brands`, pages 1 to 846) directly into the DocPresc MongoDB database.

---

## 🏗️ Architecture & Directory Structure

```text
backend/
├── scripts/
│   └── medex/
│       ├── parse-medex.ts     # Core HTML extraction with Cheerio & entity decoders
│       ├── scrape-medex.ts    # Multi-worker async scraper with retries & checkpointing
│       ├── clean-medex.ts     # Aggregation, whitespace cleanup & composite deduplication
│       ├── import-medex.ts    # MongoDB bulk upsert importer with safety checks
│       └── README.md          # Complete documentation (this file)
└── data/
    └── medex/
        ├── raw/               # Checkpoint state and page_<N>.json cache
        ├── processed/
        │   ├── medex_brands.json # Final clean JSON array
        │   └── medex_brands.csv  # Final clean CSV export
        └── reports/
            ├── scraping_report.json # Summary stats of scrape & clean
            └── failed_pages.json    # Permanently failed pages tracker
```

---

## 🚀 Quick Start Commands

Run from the `backend/` directory (or via root package scripts):

### 1. Test Scraper with Sample Pages
Fetches pages 1–3 plus sample checkpoints (pages 10, 100, 500, 846):
```bash
npm run test:medex
```

### 2. Full Scrape (Pages 1 to 846)
Runs multi-worker asynchronous scraper with automatic retries and checkpoint saves:
```bash
npm run scrape:medex
```

#### Custom Page Range & Options
```bash
# Scrape specific page range:
npx tsx scripts/medex/scrape-medex.ts --start=1 --end=50

# Adjust concurrency and request delay:
npx tsx scripts/medex/scrape-medex.ts --concurrency=6 --delay=150

# Force re-scrape existing cached pages:
npx tsx scripts/medex/scrape-medex.ts --force
```

### 3. Clean & Deduplicate Data
Aggregates all cached raw page files, deduplicates using `(brandName, strength, genericName, manufacturer)`, and creates `medex_brands.json` + `medex_brands.csv`:
```bash
npm run clean:medex
```

### 4. Import Data into DocPresc MongoDB Database
Safely imports and upserts all unique medicines into the MongoDB database:
```bash
# Test with a 50-record sample first:
npx tsx scripts/medex/import-medex.ts --sample

# Run dry-run (validates without writing to database):
npx tsx scripts/medex/import-medex.ts --dry-run

# Run full database import:
npm run import:medex
```

---

## 📊 Extracted Data Fields

Every record extracted adheres to the schema:

| Field | Description | Example |
|---|---|---|
| `brandName` | Commercial Brand name in Bangladesh | `Napa Extra` / `3 Bion` |
| `strength` | Dosage strength / concentration | `500 mg+65 mg` / `100 mg/5 ml` |
| `genericName` | Active pharmaceutical ingredient(s) | `Paracetamol + Caffeine` |
| `manufacturer` | Registered pharmaceutical company | `Beximco Pharmaceuticals Ltd.` |
| `dosageForm` | Dosage formulation | `Tablet` / `Syrup` / `Capsule` |
| `sourcePage` | MedEx pagination page number | `1` |
| `sourceUrl` | Source URL of the catalog page | `https://medex.com.bd/brands?page=1` |
| `detailUrl` | Direct link to MedEx detail page | `https://medex.com.bd/brands/13717/...` |

---

## 🛡️ Reliability & Safety Features

- **Resume Support**: If interrupted, the scraper automatically reads `checkpoint.json` and skips already completed pages.
- **Rate-Limiting Protection**: Detects HTTP 429 and applies exponential backoff delays.
- **Preserves Legitimate Strength Variations**: `Napa 500 mg` and `Napa 250 mg` are kept as distinct records.
- **Safe Upserts**: The importer uses MongoDB `bulkWrite` with unique filters so re-running never creates duplicate records.
