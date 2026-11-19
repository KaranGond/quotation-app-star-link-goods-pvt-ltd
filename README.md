# ☀️ Arpit Solar Shop — Executive Solar Quotation System

Enterprise-grade, single-tenant, self-hosted solar and structure quotation platform designed for rooftop residential, commercial solar systems, mounting structure sales (B2B), and solar Operation & Maintenance (O&M) service proposals.

---

## 🚀 Key Features

- **Strict Single-Tenant Architecture**: Dedicated to **Arpit Solar Shop** (GSTIN: `09APKPM6299L1ZW`), eliminating multi-tenant switcher overhead while providing full administrative customization via `/admin/company`.
- **Single Official Rubber Stamp Seal with Signature**: Unified official seal and signatory upload box directly synced to Supabase Storage bucket `company-assets`.
- **Pixel-Perfect 1-Page A4 PDF Engine**: Optimized Puppeteer + Chromium serverless PDF generator producing guaranteed single-page A4 executive quotations with balanced 10mm margins, clean tabular specifications, payment QR code, and official rubber seal.
- **Dual WhatsApp Sharing**:
  - **1-Click Direct WhatsApp**: Instant direct chat launch prefilled with quote summary, pricing breakdown, and cloud PDF download link (requires zero API credentials).
  - **Automated DoubleTick API**: Background template and document delivery via official WhatsApp Business API with webhook delivery lifecycle tracking.
- **Accurate Financial & Subsidy Engine**:
  - Central Subsidy (PM Surya Ghar: ₹60,000 for < 3 kW, ₹78,000 for ≥ 3 kW).
  - State Subsidy (UP / State standard: ₹30,000).
  - Indian Composite GST (70% Supply @ 5% + 30% Service @ 18% = **8.9%**).
  - Real-time annual generation, net cost, savings, and ROI payback period calculations.
- **Structure & B2B Commercial Mode**: Full catalog of 41 Apollo & Tata G.I. mounting structures, clamps, fasteners, and DC cables with automated HSN/SAC, GST, and Indian currency words conversion (`numberToWordsINR`).
- **Full Administrative Suite**:
  - Company Profile, Bank Details, and Asset Customizer (`/admin/company`).
  - Bill of Materials & System Components Customizer (`/admin/components`).
  - Saved Quotation Manager with Status Tracking (`/admin/quotations`).
  - Structure & Hardware Catalog Editor (`/admin/structure-catalog`).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15.5.9 (App Router) |
| **Language** | TypeScript 5 (Strict Mode) |
| **UI Library** | Material-UI (MUI v7), Emotion, Framer Motion |
| **PDF Generation** | Puppeteer-core, Chromium (`@sparticuz/chromium`) |
| **Database & Storage**| Supabase PostgreSQL, Supabase Storage (`quotes`, `company-assets`) |
| **Validation** | Zod Schema Validation |
| **Testing** | Built-in Enterprise Test Suite (`npm test`) |
| **Containerization**| Docker multi-stage build, Docker Compose |

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js 20+ (or Docker)
- PostgreSQL database or Supabase project

### 2. Installation
```bash
git clone <repo-url>
cd "QuatationApp with Customisation for Client - Self Hosting"
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase project credentials:
```bash
cp .env.example .env
```

### 4. Database Setup
Run the SQL schema provided in `supabase_schema.sql` in your Supabase SQL Editor:
- Creates `quotations`, `company_settings`, `components`, `system_types`, `structure_catalog`, `products`, `integrated_products`, and `internal_quotes` tables.
- Seeds default system types, components, and Arpit Solar Shop initial settings.

### 5. Running the Application
```bash
# Start development server
npm run dev

# Run full enterprise test suite
npm test

# Run ESLint verification
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

---

## 🐳 Self-Hosting with Docker

To deploy the entire standalone container with integrated Chromium and headless PDF printing:

```bash
docker compose up -d --build
```

The application will be accessible on `http://localhost:3000`.

---

## 🛡️ Enterprise Verification & Quality Gates

This repository adheres to strict production verification standards:
- `npx tsc --noEmit`: 0 errors.
- `npm run lint`: 0 errors, 0 warnings.
- `npm run build`: 30/30 pages statically and dynamically compiled with standalone output.
- `npm test`: 23 automated tests verifying solar calculations, subsidy curves, Indian rupee word formatting, URL resolution, and WhatsApp sanitization.

---

## 📄 License & Attribution

Designed and maintained for **Arpit Solar Shop** (Varanasi & Ballia, Uttar Pradesh). All rights reserved.
