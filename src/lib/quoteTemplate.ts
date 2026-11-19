// src/lib/quoteTemplate.ts - Professional quotation PDF template strictly formatted for 1-Page A4 output with well-balanced, readable proportions

import { companyDetails as defaultCompanyDetails } from './companyDetails';

export const generateQuoteHtml = (data: any): string => {
  const {
    customerInfo,
    selectedProduct,
    calculations,
    components = [],
    terms = [],
    logoUrl,
    signatureUrl,
    stampUrl,
    qrCodeUrl,
    upiLink,
    panelWarranty = "25 Years",
    inverterWarranty = "5 Years",
    showInverterWarranty = true,
    batteryWarranty = "5 Years",
  } = data;
  const company = data.companyDetails || defaultCompanyDetails;

  // Safe number extraction & formatting
  const n = (v: any) => (typeof v === 'number' && isFinite(v) ? v : 0);
  const basePrice = n(calculations?.basePrice) || n(calculations?.subtotal);
  const extraCosts = n(calculations?.extraCosts);
  const originalBasePrice = n(calculations?.originalBasePrice) || (basePrice - extraCosts);
  const gstAmount = n(calculations?.gstAmount);
  const total = n(calculations?.total) || n(calculations?.grandTotal);
  const discount = n(calculations?.discount) || n(data?.discount);
  const netPayable = Math.max(0, +(total - discount).toFixed(2));
  const centralSubsidy = n(calculations?.centralSubsidy);
  const stateSubsidy = n(calculations?.stateSubsidy);
  const totalSubsidy = centralSubsidy + stateSubsidy;
  const effectiveCost = n(calculations?.effectiveCost) || Math.max(0, +(netPayable - totalSubsidy).toFixed(2));
  const gstRate = n(data?.taxRate) * 100 || 8.9;

  const annualUnits = n(data.savings?.annualUnits);
  const annualSavings = n(data.savings?.annualSavings);
  const roiYears = n(data.savings?.roiYears);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(val));
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const quoteNumber = `ASS-${(customerInfo?.name || 'X').charAt(0).toUpperCase()}${Date.now().toString().slice(-6)}`;

  // System specs
  const systemSize = selectedProduct?.capacity || 0;
  const phase = selectedProduct?.phase === 1 ? 'Single Phase' : 'Three Phase';
  const panelBrand = selectedProduct?.panelBrand || 'Adani';
  const panelWattage = selectedProduct?.panelWattage ? `${selectedProduct.panelWattage}Wp` : '';
  const panelType = selectedProduct?.panelType || 'Monoperc TopCon';
  const inverterBrand = selectedProduct?.inverterBrand || 'Polycab';
  const rawInverterWarranty = selectedProduct?.inverterWarranty || inverterWarranty || "5 Years";
  const isShowInverterWarranty = selectedProduct?.showInverterWarranty !== undefined
    ? Boolean(selectedProduct.showInverterWarranty)
    : (data?.showInverterWarranty !== undefined ? Boolean(data.showInverterWarranty) : (showInverterWarranty && rawInverterWarranty !== 'None'));
  const isShowRatePerWatt = selectedProduct?.showRatePerWatt !== undefined
    ? Boolean(selectedProduct.showRatePerWatt)
    : (data?.showRatePerWatt !== undefined ? Boolean(data.showRatePerWatt) : true);
  const systemType = selectedProduct?.systemType || 'On-grid';
  const isB2B = systemType.includes('B2B') || systemType.includes('Structure');

  // Support multi-panel or single-panel descriptions
  const panelItems: any[] = selectedProduct?.panelItems || data?.panelItems || [];
  const hasMultiplePanels = Array.isArray(panelItems) && panelItems.length > 1;
  const modulesSummary = hasMultiplePanels
    ? panelItems.map((p: any) => {
        let rateInfo = '';
        if (isShowRatePerWatt) {
          rateInfo = p.ratePerWatt ? ` @ ₹${p.ratePerWatt}/Wp` : (p.ratePerPanel ? ` @ ₹${p.ratePerPanel}/pc` : '');
        }
        return `${(p.brand === 'Other' && p.customBrand) ? p.customBrand : p.brand} ${p.wattage}Wp (${p.quantity} Nos${rateInfo})`;
      }).join(', ')
    : `${panelBrand} ${panelWattage} (${panelType})${isShowRatePerWatt ? (panelItems[0]?.ratePerWatt ? ` @ ₹${panelItems[0].ratePerWatt}/Wp` : (panelItems[0]?.ratePerPanel ? ` @ ₹${panelItems[0].ratePerPanel}/pc` : '')) : ''}`;

  // Unified official rubber stamp seal with signature
  const sealAndSignature = signatureUrl || stampUrl;

  const defaultTermsList = [
    'Payment: 10% Advance on structure installation. 85% Before delivery of kit. 5% Post installation.',
    'Subsidy: Subsidy directly credited to customer bank account post Discom inspection.',
    'Net Metering: Assistance in Net Metering paperwork and Discom net meter installation.',
    'Delivery & Install: Delivery within 3-4 weeks. Installation within 45 days of order confirmation.',
    'Warranty: Solar Modules 25 Years, Inverter 5 Years. External damages not covered.',
    'Consumer Scope: Structure elevation civil material, ladder access & water point on terrace.',
  ];
  const effectiveTerms = (terms && terms.length > 0) ? terms : defaultTermsList;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 10mm 10mm 10mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body, html {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Segoe UI', Arial, -apple-system, sans-serif;
      color: #1e293b;
      font-size: 9.5px;
      line-height: 1.35;
      width: 100%;
    }
    .page {
      width: 100%;
      max-width: 100%;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid ${isB2B ? '#d97706' : '#eab308'};
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      max-height: 52px;
      max-width: 135px;
      object-fit: contain;
    }
    .company-name {
      font-size: 18px;
      font-weight: 900;
      color: #1e3a5f;
      letter-spacing: -0.3px;
      line-height: 1.1;
      text-transform: uppercase;
    }
    .company-tagline {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748b;
      margin-top: 2px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .company-info {
      font-size: 8px;
      color: #64748b;
      margin-top: 3px;
      line-height: 1.4;
    }
    .gstin {
      color: #1d4ed8;
      font-weight: 700;
    }
    .quote-badge-box {
      text-align: right;
    }
    .quote-badge {
      background: ${isB2B ? '#d97706' : '#eab308'};
      color: white;
      padding: 4px 14px;
      font-size: 11px;
      font-weight: 900;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      display: inline-block;
      margin-bottom: 4px;
    }
    .quote-info {
      font-size: 9px;
      color: #64748b;
      line-height: 1.35;
    }
    .quote-number {
      font-size: 8px;
      color: #94a3b8;
    }

    /* 2 Column Customer & System Specs Layout */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 8px 10px;
    }
    .card-title {
      font-size: 8.5px;
      font-weight: 800;
      color: #1e3a5f;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      margin-bottom: 5px;
    }
    .customer-name {
      font-size: 13px;
      font-weight: 900;
      color: #1e40af;
      margin-bottom: 2px;
    }
    .customer-detail {
      font-size: 8.5px;
      color: #475569;
      margin-top: 1px;
    }
    .spec-row {
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      margin-bottom: 2.5px;
      color: #475569;
    }
    .spec-row strong {
      color: #0f172a;
    }

    /* BOM Table */
    .section-heading {
      font-size: 9.5px;
      font-weight: 900;
      color: #1e3a5f;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 4px;
      display: inline-block;
      border-bottom: 2px solid ${isB2B ? '#d97706' : '#eab308'};
      padding-bottom: 2px;
    }
    .table-container {
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
    }
    th {
      background: #f1f5f9;
      color: #1e3a5f;
      font-weight: 800;
      padding: 5px 8px;
      text-align: left;
      border-bottom: 1.5px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 8px;
      letter-spacing: 0.5px;
    }
    td {
      padding: 4.5px 8px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
      color: #334155;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .td-center {
      text-align: center;
    }
    .td-right {
      text-align: right;
    }

    /* Metrics Grid */
    .metrics-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 4px;
      margin-bottom: 6px;
      text-align: center;
    }
    .metric-badge {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 4px;
    }
    .metric-label {
      font-size: 7.5px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
    }
    .metric-val {
      font-size: 10.5px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 1px;
    }

    /* Bank & QR Box */
    .bank-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 5px;
      padding: 6px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .bank-details {
      font-size: 8px;
      color: #334155;
      line-height: 1.45;
    }
    .qr-box {
      text-align: center;
      flex-shrink: 0;
      margin-left: 8px;
    }
    .qr-img {
      width: 50px;
      height: 50px;
      object-fit: contain;
      mix-blend-mode: multiply;
      display: block;
    }

    /* Price Summary & Subsidy Box */
    .price-row {
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #475569;
      margin-bottom: 2.5px;
    }
    .total-amount-row {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      font-weight: 900;
      color: #1e3a5f;
      border-top: 1.5px solid #e2e8f0;
      padding-top: 4px;
      margin-top: 3px;
    }
    .subsidy-benefit-box {
      margin-top: 6px;
      padding: 5px 8px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 4px;
    }
    .subsidy-breakdown {
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #166534;
      font-weight: 600;
    }
    .effective-cost-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 3px;
      padding-top: 3px;
      border-top: 1px dashed #bbf7d0;
    }
    .effective-cost-val {
      font-size: 15px;
      font-weight: 900;
      color: #16a34a;
    }

    /* Terms */
    .terms-section {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-bottom: 8px;
    }
    .terms-title {
      font-size: 8.5px;
      font-weight: 900;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 4px;
    }
    .terms-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.5px 18px;
      font-size: 7.8px;
      color: #64748b;
      padding-left: 10px;
    }
    .term-item {
      line-height: 1.35;
      position: relative;
    }
    .term-item strong {
      color: #334155;
    }

    /* Signature */
    .sig-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 8px;
      padding: 0 6px;
    }
    .sig-box {
      text-align: center;
    }
    .sig-box.right {
      text-align: right;
    }
    .sig-line {
      width: 130px;
      height: 1px;
      background: #cbd5e1;
      margin: 0 auto 3px;
    }
    .sig-box.right .sig-line {
      margin: 0 0 3px auto;
      width: 150px;
    }
    .sig-label {
      font-size: 7.5px;
      color: #94a3b8;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .for-company {
      font-size: 10.5px;
      font-weight: 900;
      color: #1e3a5f;
      margin-bottom: 2px;
      text-decoration: underline;
      text-decoration-color: ${isB2B ? '#d97706' : '#eab308'};
      text-underline-offset: 3px;
    }
    .seal-img {
      max-height: 46px;
      max-width: 150px;
      object-fit: contain;
      margin-left: auto;
      display: block;
      margin-bottom: 2px;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo" />` : ''}
        <div>
          <div class="company-name">${company.name.toUpperCase()}</div>
          <div class="company-tagline">${company.tagline || 'ILLUMINATING YOUR FUTURE WITH CLEAN ENERGY'}</div>
          <div class="company-info">
            <div><span class="gstin">GSTIN: ${company.gstin}</span>${company.cin ? ` | CIN: ${company.cin}` : ''}</div>
            <div><strong>HO:</strong> ${company.headOffice || company.head_office || ''}</div>
            <div>📞 ${company.phone || ''} | ✉️ ${company.email || ''}</div>
          </div>
        </div>
      </div>
      <div class="quote-badge-box">
        <div class="quote-badge">${isB2B ? 'Commercial Quotation' : 'Solar Quotation'}</div>
        <div class="quote-info">
          <div><strong>Date:</strong> ${currentDate}</div>
          <div class="quote-number">Quote No: ${quoteNumber}</div>
        </div>
      </div>
    </div>
    
    <!-- Customer Details & System Overview -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Customer Details</div>
        <div class="customer-name">${customerInfo?.name || 'Valued Customer'}</div>
        ${customerInfo?.address ? `<div class="customer-detail">📍 ${customerInfo.address}</div>` : ''}
        ${customerInfo?.phone ? `<div class="customer-detail">📞 +91 ${customerInfo.phone}</div>` : ''}
        ${customerInfo?.gstin ? `<div class="customer-detail" style="color: #1d4ed8; font-weight: 700;">GSTIN: ${customerInfo.gstin}</div>` : ''}
      </div>
      <div class="card">
        <div class="card-title">System Specifications</div>
        ${!isB2B ? `
          <div class="spec-row"><span>System Size:</span> <strong>${systemSize} KW (${phase})</strong></div>
          <div class="spec-row"><span>Modules:</span> <strong style="text-align: right; max-width: 68%;">${modulesSummary}</strong></div>
          <div class="spec-row"><span>Module Warranty:</span> <strong>${panelWarranty}</strong></div>
          <div class="spec-row"><span>Inverter:</span> <strong>${inverterBrand}</strong></div>
          ${(isShowInverterWarranty && rawInverterWarranty && rawInverterWarranty !== 'None') ? `<div class="spec-row"><span>Inverter Warranty:</span> <strong>${rawInverterWarranty}</strong></div>` : ''}
          ${(systemType === 'Hybrid' || systemType === 'Off-grid') ? `<div class="spec-row"><span>Battery Warranty:</span> <strong>${batteryWarranty}</strong></div>` : ''}
          <div class="spec-row"><span>System Type:</span> <strong>${systemType}</strong></div>
        ` : `
          <div class="spec-row"><span>Proposal Title:</span> <strong>${data.b2bProposalTitle || 'B2B SOLAR MOUNTING STRUCTURE'}</strong></div>
          <div class="spec-row"><span>Structure Make:</span> <strong>${panelBrand}</strong></div>
          <div class="spec-row"><span>Material Grade:</span> <strong>Pre-Galvanized / Hot Dip 80+ Micron</strong></div>
          <div class="spec-row"><span>Warranty:</span> <strong>25 Years Structural Stability</strong></div>
          <div class="spec-row"><span>Scope:</span> <strong>Supply & Fabrication BOS Kit</strong></div>
        `}
      </div>
    </div>
    
    <!-- Components Table -->
    <div>
      <div class="section-heading">Technical Bill of Materials (BOM)</div>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 28px; text-align: center;">S.N</th>
            <th style="width: 25%;">Components</th>
            <th>Description & Specification</th>
            <th style="width: 55px; text-align: center;">Quantity</th>
            <th style="width: 80px; text-align: center;">Make</th>
          </tr>
        </thead>
        <tbody>
          ${components.map((comp: any, i: number) => `
            <tr style="${i < 2 ? 'font-weight: 700;' : ''}">
              <td class="td-center">${i + 1}</td>
              <td style="color: #0f172a;">${comp.name || ''}</td>
              <td style="color: ${i < 2 ? '#0f172a' : '#475569'};">${comp.description || ''}</td>
              <td class="td-center" style="font-weight: 700;">${comp.quantity || ''}</td>
              <td class="td-center" style="color: #1e40af; font-weight: 700;">${comp.make || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Financials & Bank Details Grid -->
    <div class="grid-2">
      <!-- Left Column: Metrics & Bank Account -->
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        ${annualUnits > 0 ? `
        <div>
          <div class="card-title">Energy Generation & Financial Returns</div>
          <div class="metrics-row">
            <div class="metric-badge">
              <div class="metric-label">Generation</div>
              <div class="metric-val">${annualUnits} U/Yr</div>
            </div>
            <div class="metric-badge">
              <div class="metric-label">Annual Savings</div>
              <div class="metric-val" style="color: #16a34a;">₹ ${formatCurrency(annualSavings)}</div>
            </div>
            <div class="metric-badge">
              <div class="metric-label">Payback (ROI)</div>
              <div class="metric-val" style="color: #ea580c;">${roiYears} Yrs</div>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="bank-box">
          <div class="bank-details">
            <div style="font-weight: 800; color: #1e3a5f; text-transform: uppercase; font-size: 8px; margin-bottom: 2px;">Bank & Payment Details</div>
            <div><strong>A/c Name:</strong> ${company.bank?.accountName || company.name}</div>
            <div><strong>Bank:</strong> ${company.bank?.name || ''}${company.bank?.branch ? `, ${company.bank.branch}` : ''}</div>
            <div><strong>A/c No:</strong> ${company.bank?.accountNumber || ''} | <strong>IFSC:</strong> ${company.bank?.ifsc || ''}</div>
            ${company.bank?.upiId ? `<div style="color: #1d4ed8; font-weight: 700;"><strong>UPI:</strong> ${company.bank.upiId}</div>` : ''}
          </div>
          ${qrCodeUrl ? `
          <div class="qr-box">
            <a href="${upiLink || '#'}" style="text-decoration: none;">
              <img src="${qrCodeUrl}" class="qr-img" alt="Payment QR" />
            </a>
            <div style="font-size: 7px; color: #64748b; font-weight: 700; margin-top: 1px;">Scan UPI</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Right Column: Investment Summary & Subsidy Benefit -->
      <div class="card" style="border-color: #bfdbfe; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div class="card-title" style="border-color: #bfdbfe;">Investment & Pricing Summary</div>
          <div class="price-row">
            <span>Base System Price:</span>
            <span>₹ ${formatCurrency(originalBasePrice)}</span>
          </div>
          ${extraCosts > 0 ? `
          <div class="price-row" style="color: #d97706;">
            <span>+ Extra Costs:</span>
            <span>₹ ${formatCurrency(extraCosts)}</span>
          </div>
          ` : ''}
          <div class="price-row">
            <span>GST (@ ${gstRate}%):</span>
            <span>₹ ${formatCurrency(gstAmount)}</span>
          </div>
          <div class="total-amount-row">
            <span style="font-size: 9px; text-transform: uppercase;">Total Amount:</span>
            <span style="color: #1e40af;">₹ ${formatCurrency(total)}</span>
          </div>
          ${discount > 0 ? `
          <div class="price-row" style="color: #dc2626; font-weight: 700; margin-top: 2px;">
            <span>- Special Discount:</span>
            <span>- ₹ ${formatCurrency(discount)}</span>
          </div>
          <div class="total-amount-row" style="border-top: 1px dashed #86efac; color: #166534; padding-top: 2px; margin-top: 2px;">
            <span style="font-size: 9px; text-transform: uppercase;">Final Payable:</span>
            <span>₹ ${formatCurrency(netPayable)}</span>
          </div>
          ` : ''}
        </div>

        ${totalSubsidy > 0 ? `
        <div class="subsidy-benefit-box">
          <div class="subsidy-breakdown">
            <span>Central Subsidy: <strong>₹ ${formatCurrency(centralSubsidy)}</strong></span>
            <span>State Subsidy: <strong>₹ ${formatCurrency(stateSubsidy)}</strong></span>
          </div>
          <div class="effective-cost-row">
            <span style="font-size: 8.5px; color: #166534; font-weight: 900; text-transform: uppercase;">Effective Cost After Subsidy:</span>
            <span class="effective-cost-val">₹ ${formatCurrency(effectiveCost)}*</span>
          </div>
        </div>
        ` : `
        <div style="margin-top: 5px; padding: 4px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; text-align: center;">
          <div style="font-size: 7.5px; color: #1e40af; font-weight: 700; text-transform: uppercase;">Net Investment Payable</div>
          <div style="font-size: 13px; font-weight: 900; color: #1e40af;">₹ ${formatCurrency(discount > 0 ? netPayable : total)}</div>
        </div>
        `}
      </div>
    </div>

    <!-- Terms and Conditions -->
    <div class="terms-section">
      <div class="terms-title">Terms and Conditions</div>
      <div class="terms-grid">
        ${effectiveTerms.map((term: string) => `
          <div class="term-item">• ${term.replace(/^([^:]+):/, '<strong>$1:</strong>')}</div>
        `).join('')}
      </div>
    </div>
    
    <!-- Signatures -->
    <div class="sig-section">
      <div class="sig-box">
        <div style="font-size: 8px; font-weight: 700; color: #1e3a5f; margin-bottom: 2px;">Customer Acceptance</div>
        <div style="height: 30px;"></div>
        <div class="sig-line"></div>
        <div class="sig-label">Customer Signature</div>
        <div style="font-size: 8px; color: #475569; font-weight: 600;">${customerInfo?.name || 'Customer'}</div>
      </div>
      <div class="sig-box right">
        <div class="for-company">For ${company.name}</div>
        ${sealAndSignature ? `
          <img src="${sealAndSignature}" class="seal-img" alt="Official Seal & Signature" />
        ` : '<div style="height: 46px;"></div>'}
        <div class="sig-line"></div>
        <div class="sig-label">${company.authorizedSignatory || company.authorized_signatory || 'Authorized Signatory'}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};
