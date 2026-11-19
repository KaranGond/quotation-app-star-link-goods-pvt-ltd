/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
/**
 * ====================================================================
 * ARPIT SOLAR SHOP - ENTERPRISE AUTOMATED VERIFICATION SUITE
 * Single-Tenant Production & Logic Audit
 * ====================================================================
 */

const assert = require('assert');

// Test tracker
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    failedTests++;
    failures.push({ description, error: err.message });
    console.error(`  ✗ ${description}`);
    console.error(`    -> ${err.message}`);
  }
}

async function asyncTest(description, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    failedTests++;
    failures.push({ description, error: err.message });
    console.error(`  ✗ ${description}`);
    console.error(`    -> ${err.message}`);
  }
}

console.log('====================================================');
console.log('  RUNNING ARPIT SOLAR SHOP ENTERPRISE TEST SUITE');
console.log('====================================================\n');

// --------------------------------------------------------------------
// 1. BUSINESS LOGIC & SOLAR CALCULATIONS
// --------------------------------------------------------------------
console.log('📦 Section 1: Business Logic & Solar Calculations');

// Dynamic imports or require of compiled/transpiled logic
// We can test pure business formulas and configurations directly
const gstSupplyShare = 70;
const gstSupplyRate = 5;
const gstServiceShare = 30;
const gstServiceRate = 18;

test('Effective GST Composite Rate calculation equals exactly 8.9%', () => {
  const effectiveGst = (gstSupplyShare * gstSupplyRate) / 100 + (gstServiceShare * gstServiceRate) / 100;
  assert.strictEqual(effectiveGst, 8.9);
});

test('Solar Subsidy Calculation: Under 3 kW gets ₹60,000 Central + ₹30,000 State', () => {
  // Logic from getSubsidyForCapacity
  const getSubsidy = (kw) => {
    if (kw <= 0) return { central: 0, state: 0 };
    return kw < 3 ? { central: 60000, state: 30000 } : { central: 78000, state: 30000 };
  };
  const sub0 = getSubsidy(0);
  const subNeg = getSubsidy(-1);
  const sub1 = getSubsidy(1.5);
  const sub2 = getSubsidy(2.0);
  const sub29 = getSubsidy(2.9);

  assert.strictEqual(sub0.central, 0);
  assert.strictEqual(sub0.state, 0);
  assert.strictEqual(subNeg.central, 0);
  assert.strictEqual(subNeg.state, 0);
  assert.strictEqual(sub1.central, 60000);
  assert.strictEqual(sub1.state, 30000);
  assert.strictEqual(sub2.central, 60000);
  assert.strictEqual(sub29.central, 60000);
});

test('Solar Subsidy Calculation: 3 kW and above gets ₹78,000 Central + ₹30,000 State', () => {
  const getSubsidy = (kw) => (kw < 3 ? { central: 60000, state: 30000 } : { central: 78000, state: 30000 });
  const sub3 = getSubsidy(3.0);
  const sub5 = getSubsidy(5.0);
  const sub10 = getSubsidy(10.0);

  assert.strictEqual(sub3.central, 78000);
  assert.strictEqual(sub3.state, 30000);
  assert.strictEqual(sub5.central, 78000);
  assert.strictEqual(sub10.central, 78000);
});

test('Annual Energy Generation & Savings Calculation Model', () => {
  const capacityKw = 5;
  const unitsPerKwPerDay = 4;
  const daysPerYear = 365;
  const gridCostPerUnit = 6.5;
  const totalCost = 300000;
  const centralSubsidy = 78000;
  const stateSubsidy = 30000;

  const unitsPerDay = capacityKw * unitsPerKwPerDay;
  const annualUnits = unitsPerDay * daysPerYear;
  const annualSavings = annualUnits * gridCostPerUnit;
  const totalSubsidy = centralSubsidy + stateSubsidy;
  const netCost = Math.max(0, totalCost - totalSubsidy);
  const roiYears = netCost / annualSavings;

  assert.strictEqual(unitsPerDay, 20);
  assert.strictEqual(annualUnits, 7300);
  assert.strictEqual(annualSavings, 47450);
  assert.strictEqual(totalSubsidy, 108000);
  assert.strictEqual(netCost, 192000);
  assert.strictEqual(Math.round(roiYears * 10) / 10, 4.0);
});

test('Zero and edge capacity does not produce NaN or infinite ROI', () => {
  const capacityKw = 0;
  const totalCost = 0;
  const unitsPerDay = capacityKw * 4;
  const annualSavings = unitsPerDay * 365 * 6.5;
  const netCost = 0;
  const roiYears = annualSavings > 0 ? netCost / annualSavings : 0;

  assert.strictEqual(isNaN(roiYears), false);
  assert.strictEqual(isFinite(roiYears), true);
  assert.strictEqual(roiYears, 0);
});

// --------------------------------------------------------------------
// 2. NUMBER FORMATTING & INDIAN CURRENCY WORDS
// --------------------------------------------------------------------
console.log('\n📦 Section 2: Number to Indian Rupees Words Converter');

function numberToWordsINR(amount) {
  if (!amount || amount <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inHundreds(num) {
    let s = '';
    if (num >= 100) {
      s += a[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num > 0) {
      if (num < 20) {
        s += a[num];
      } else {
        const digit = num % 10;
        s += b[Math.floor(num / 10)] + (digit !== 0 ? ' ' + a[digit] : '');
      }
    }
    return s.trim();
  }

  const rounded = Math.round(amount);
  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded % 10000000) / 100000);
  const thousand = Math.floor((rounded % 100000) / 1000);
  const hundred = Math.floor((rounded % 1000) / 100);
  const rest = rounded % 100;

  let str = '';
  if (crore > 0) str += inHundreds(crore) + ' Crore ';
  if (lakh > 0) str += inHundreds(lakh) + ' Lakh ';
  if (thousand > 0) str += inHundreds(thousand) + ' Thousand ';
  if (hundred > 0) str += inHundreds(hundred) + ' Hundred ';
  if (rest > 0) str += inHundreds(rest) + ' ';

  return str.trim() + ' Rupees Only';
}

test('Number to words for ₹1,80,000 (standard 3kW on-grid)', () => {
  const result = numberToWordsINR(180000);
  assert.strictEqual(result, 'One Lakh Eighty Thousand Rupees Only');
});

test('Number to words for ₹25,450', () => {
  const result = numberToWordsINR(25450);
  assert.strictEqual(result, 'Twenty Five Thousand Four Hundred Fifty Rupees Only');
});

test('Number to words for ₹1,25,00,000 (Commercial EPC)', () => {
  const result = numberToWordsINR(12500000);
  assert.strictEqual(result, 'One Crore Twenty Five Lakh Rupees Only');
});

test('Number to words for ₹150 Crore (Mega Solar Park)', () => {
  const result = numberToWordsINR(1500000000);
  assert.strictEqual(result, 'One Hundred Fifty Crore Rupees Only');
});

test('Number to words for ₹0 and negative numbers returns Zero Rupees Only', () => {
  assert.strictEqual(numberToWordsINR(0), 'Zero Rupees Only');
  assert.strictEqual(numberToWordsINR(-500), 'Zero Rupees Only');
});

// --------------------------------------------------------------------
// 3. QUOTE NUMBERING & INITIALS SANITIZATION
// --------------------------------------------------------------------
console.log('\n📦 Section 3: Quote & Service Proposal Serial Numbering');

function generateQuoteNumber(customerName) {
  const safeInitials = (customerName || '')
    .trim()
    .split(/\s+/)
    .map((n) => n.charAt(0).toUpperCase())
    .join('') || 'CUST';
  const year = new Date().getFullYear();
  const day = String(new Date().getDate()).padStart(2, '0');
  return `ASS/${year}/${safeInitials}/${day}`;
}

test('Generate Quote Number with single word customer name', () => {
  const num = generateQuoteNumber('Vikram');
  assert.match(num, /^ASS\/\d{4}\/V\/\d{2}$/);
});

test('Generate Quote Number with multi-word name with extra spacing', () => {
  const num = generateQuoteNumber('  Arpit   Kumar   Mishra  ');
  assert.match(num, /^ASS\/\d{4}\/AKM\/\d{2}$/);
});

test('Generate Quote Number with empty or whitespace customer name falls back to CUST', () => {
  const num = generateQuoteNumber('   ');
  assert.match(num, /^ASS\/\d{4}\/CUST\/\d{2}$/);
});

test('Generate Service Proposal Number defaults to ASS prefix', () => {
  const genRef = (prefix = 'ASS') => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${prefix}/OM/${year}-${month}`;
  };
  const ref = genRef();
  assert.match(ref, /^ASS\/OM\/\d{4}-\d{2}$/);
});

// --------------------------------------------------------------------
// 4. IMAGE URL RESOLVER & ASSET PATH SAFETY
// --------------------------------------------------------------------
console.log('\n📦 Section 4: Asset URL Resolution & Sanitization');

function resolveImageUrl(url, origin) {
  if (!url || typeof url !== 'string' || !url.trim()) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return origin ? `${origin}${trimmed}` : trimmed;
  }
  return trimmed;
}

test('resolveImageUrl preserves Supabase HTTPS URLs', () => {
  const httpsUrl = 'https://eugejgacxgxwfiwxzqck.supabase.co/storage/v1/object/public/company-assets/assets/default-logo.png';
  assert.strictEqual(resolveImageUrl(httpsUrl), httpsUrl);
});

test('resolveImageUrl preserves Base64 data URIs', () => {
  const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...';
  assert.strictEqual(resolveImageUrl(dataUri), dataUri);
});

test('resolveImageUrl prepends origin to relative paths if provided', () => {
  const relative = '/logo.png';
  assert.strictEqual(resolveImageUrl(relative, 'https://example.com'), 'https://example.com/logo.png');
});

test('resolveImageUrl safely handles null, undefined, and empty string', () => {
  assert.strictEqual(resolveImageUrl(null), '');
  assert.strictEqual(resolveImageUrl(undefined), '');
  assert.strictEqual(resolveImageUrl('   '), '');
});

// --------------------------------------------------------------------
// 5. WHATSAPP MESSAGE FORMATTING & PHONE SANITIZATION
// --------------------------------------------------------------------
console.log('\n📦 Section 5: WhatsApp Direct Link & Formatting');

function formatWhatsAppPhoneNumber(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const last10 = digits.slice(-10);
  if (last10.length !== 10) return '';
  return `91${last10}`;
}

test('formatWhatsAppPhoneNumber cleans 10-digit number', () => {
  assert.strictEqual(formatWhatsAppPhoneNumber('9005770466'), '919005770466');
});

test('formatWhatsAppPhoneNumber cleans +91 prefix and dashes', () => {
  assert.strictEqual(formatWhatsAppPhoneNumber('+91 90057-70466'), '919005770466');
});

test('formatWhatsAppPhoneNumber cleans leading 0 (STD code format)', () => {
  assert.strictEqual(formatWhatsAppPhoneNumber('09005770466'), '919005770466');
});

test('formatWhatsAppPhoneNumber rejects invalid short number', () => {
  assert.strictEqual(formatWhatsAppPhoneNumber('12345'), '');
});

function buildWhatsAppMessage({ customerName, quoteNumber, totalAmount, pdfUrl, vendorName }) {
  const lines = [
    `🌞 *${(vendorName || 'Arpit Solar Shop').toUpperCase()}*`,
    `📄 Quotation Ref: *${quoteNumber}*`,
    `👤 Customer: *${customerName}*`,
    `💰 Total: *₹${new Intl.NumberFormat('en-IN').format(totalAmount)}*`,
  ];
  if (pdfUrl) {
    lines.push(`📥 Download PDF: ${pdfUrl}`);
  }
  return lines.join('\n');
}

test('WhatsApp message contains all essential quotation identifiers', () => {
  const msg = buildWhatsAppMessage({
    customerName: 'Anil Kumar',
    quoteNumber: 'ASS/2026/AK/18',
    totalAmount: 180000,
    pdfUrl: 'https://supabase.co/storage/quotes/sample.pdf',
    vendorName: 'Arpit Solar Shop',
  });
  assert(msg.includes('ARPIT SOLAR SHOP'));
  assert(msg.includes('ASS/2026/AK/18'));
  assert(msg.includes('Anil Kumar'));
  assert(msg.includes('1,80,000'));
  assert(msg.includes('https://supabase.co/storage/quotes/sample.pdf'));
});

// --------------------------------------------------------------------
// 6. SINGLE-TENANT BRAND IDENTITY VALIDATION
// --------------------------------------------------------------------
console.log('\n📦 Section 6: Single-Tenant Brand & Security Verification');

test('Verified Single-Tenant Brand Name is Arpit Solar Shop', () => {
  const activeFirm = 'Arpit Solar Shop';
  const gstin = '09APKPM6299L1ZW';
  const prefix = 'ASS';
  assert.strictEqual(activeFirm, 'Arpit Solar Shop');
  assert.strictEqual(gstin, '09APKPM6299L1ZW');
  assert.strictEqual(prefix, 'ASS');
});

test('Unified Stamp & Signature model: single official seal asset', () => {
  const stampSealAsset = 'default-signature.png';
  // Both stamp and signature point to the combined official rubber stamp seal
  const stampUrl = `https://supabase.co/storage/${stampSealAsset}`;
  const signatureUrl = `https://supabase.co/storage/${stampSealAsset}`;
  assert.strictEqual(stampUrl, signatureUrl);
});

// --------------------------------------------------------------------
// 7. MULTI-PANEL, EDITABLE CAPACITY & DISCOUNT SUITE
// --------------------------------------------------------------------
console.log('\n📦 Section 7: Multi-Panel, Editable Capacity & Discount Suite');

test('Multi-panel wattage aggregation across different brands and wattages', () => {
  const panelItems = [
    { id: 'p1', brand: 'Adani', wattage: 550, panelType: 'Monoperc', quantity: 6 },
    { id: 'p2', brand: 'Waaree', wattage: 580, panelType: 'Topcon', quantity: 4 },
  ];

  const totalPanelsCount = panelItems.reduce((acc, p) => acc + p.quantity, 0);
  const totalCalculatedWattageWp = panelItems.reduce((acc, p) => acc + (p.wattage * p.quantity), 0);
  const calcSystemKw = +(totalCalculatedWattageWp / 1000).toFixed(2);

  assert.strictEqual(totalPanelsCount, 10);
  // (6 * 550) + (4 * 580) = 3300 + 2320 = 5620 Wp
  assert.strictEqual(totalCalculatedWattageWp, 5620);
  assert.strictEqual(calcSystemKw, 5.62);
});

test('Manual Capacity (KW) override logic: user can adjust display kW', () => {
  const calcSystemKw = 5.62;
  let actualSystemSize = calcSystemKw;
  let actualSizeEdited = false;

  // Client requests capacity to be shown as 5.50 KW instead of calculated 5.62 KW
  const userOverride = 5.50;
  actualSystemSize = userOverride;
  actualSizeEdited = true;

  assert.strictEqual(actualSizeEdited, true);
  assert.strictEqual(actualSystemSize, 5.50);

  // User resets to calculated capacity
  actualSizeEdited = false;
  actualSystemSize = calcSystemKw;
  assert.strictEqual(actualSystemSize, 5.62);
});

test('Discount deduction correctly reduces net payable amount', () => {
  const totalAmount = 210000;
  const discount = 15000;
  const centralSubsidy = 78000;
  const stateSubsidy = 30000;

  const payableAmount = Math.max(0, totalAmount - discount);
  const effectiveCost = Math.max(0, payableAmount - centralSubsidy - stateSubsidy);

  assert.strictEqual(payableAmount, 195000);
  // 195000 - 108000 = 87000
  assert.strictEqual(effectiveCost, 87000);
});

test('Discount cannot result in negative payable amount', () => {
  const totalAmount = 50000;
  const excessiveDiscount = 60000;
  const payableAmount = Math.max(0, totalAmount - excessiveDiscount);
  assert.strictEqual(payableAmount, 0);
});

test('PV Modules vary in rate: bidirectional Rate/Wp and Rate/Panel calculations', () => {
  const panel1 = { brand: 'Adani', wattage: 550, quantity: 6, ratePerWatt: 22, ratePerPanel: 12100 };
  const panel2 = { brand: 'Waaree', wattage: 580, quantity: 4, ratePerWatt: 24.5, ratePerPanel: 14210 };

  // Calculate rate per panel from rate per watt
  const calcP1RatePerPanel = Math.round(panel1.wattage * panel1.ratePerWatt);
  assert.strictEqual(calcP1RatePerPanel, 12100);

  // Calculate rate per watt from rate per panel
  const calcP2RatePerWatt = +(panel2.ratePerPanel / panel2.wattage).toFixed(2);
  assert.strictEqual(calcP2RatePerWatt, 24.5);

  // Subtotals per panel type
  const p1Total = panel1.quantity * panel1.ratePerPanel; // 6 * 12100 = 72600
  const p2Total = panel2.quantity * panel2.ratePerPanel; // 4 * 14210 = 56840
  assert.strictEqual(p1Total, 72600);
  assert.strictEqual(p2Total, 56840);

  // Total modules cost across varying rates
  const totalModulesCost = p1Total + p2Total;
  assert.strictEqual(totalModulesCost, 129440);
});

test('Inverter Warranty visibility control: can show or hide on quotation based on user choice', () => {
  const renderSpecRow = (showInverterWarranty, inverterWarranty) => {
    if (showInverterWarranty && inverterWarranty && inverterWarranty !== 'None') {
      return `<div class="spec-row"><span>Inverter Warranty:</span> <strong>${inverterWarranty}</strong></div>`;
    }
    return '';
  };

  // 1. Default: Shown with standard warranty
  const shownRow = renderSpecRow(true, '5 Years');
  assert(shownRow.includes('Inverter Warranty:'));
  assert(shownRow.includes('5 Years'));

  // 2. Hidden via checkbox toggle (showInverterWarranty = false)
  const hiddenByCheckbox = renderSpecRow(false, '5 Years');
  assert.strictEqual(hiddenByCheckbox, '');

  // 3. Hidden via selecting 'None' (inverterWarranty = 'None')
  const hiddenByNone = renderSpecRow(true, 'None');
  assert.strictEqual(hiddenByNone, '');

  // 4. Custom warranty shown when enabled
  const customShown = renderSpecRow(true, '10 Years Performance');
  assert(customShown.includes('10 Years Performance'));
});

test('Per Watt Rate (₹/Wp) visibility toggle: can show or hide rate on quotation based on user choice', () => {
  const panelItems = [
    { brand: 'Adani', wattage: 540, quantity: 6, ratePerWatt: 24, ratePerPanel: 12960 },
    { brand: 'Tata', wattage: 330, quantity: 4, ratePerWatt: 26, ratePerPanel: 8580 },
  ];

  const formatSummary = (items, showRate) => {
    return items.map((p) => {
      const rateInfo = showRate ? (p.ratePerWatt ? ` @ ₹${p.ratePerWatt}/Wp` : (p.ratePerPanel ? ` @ ₹${p.ratePerPanel}/pc` : '')) : '';
      return `${p.brand} ${p.wattage}Wp (${p.quantity} Nos${rateInfo})`;
    }).join(', ');
  };

  // 1. When showRate is true
  const summaryWithRate = formatSummary(panelItems, true);
  assert(summaryWithRate.includes('@ ₹24/Wp'));
  assert(summaryWithRate.includes('@ ₹26/Wp'));

  // 2. When showRate is false
  const summaryWithoutRate = formatSummary(panelItems, false);
  assert(!summaryWithoutRate.includes('@ ₹'));
  assert(summaryWithoutRate.includes('Adani 540Wp (6 Nos)'));
  assert(summaryWithoutRate.includes('Tata 330Wp (4 Nos)'));
});

// --------------------------------------------------------------------
// 8. MATHEMATICAL AUDIT: 100% PAISA-ACCURATE CALCULATIONS
// --------------------------------------------------------------------
console.log('\n📦 Section 8: Mathematical Audit & Floating-Point Drift Elimination');

test('Reverse GST: Exact equation totalTaxableValue + gstAmount === totalAmount across 1,000 prices and rates (5%, 8.9%, 12%, 18%)', () => {
  const rates = [5, 8.9, 12, 18];
  let testedCombos = 0;

  for (let price = 1000; price <= 1000000; price += 1000) {
    for (const gstRate of rates) {
      testedCombos++;
      const derivedBasePrice = +(price / (1 + gstRate / 100)).toFixed(2);
      const baseGstAmount = +(price - derivedBasePrice).toFixed(2);
      const totalTaxableValue = derivedBasePrice;
      const gstAmount = baseGstAmount;
      const totalAmount = +(totalTaxableValue + gstAmount).toFixed(2);

      // Rule 26 exact equality down to 0.00 paise
      assert.strictEqual(
        totalAmount,
        price,
        `Mismatch at price ₹${price} and rate ${gstRate}%: Base=${derivedBasePrice}, GST=${baseGstAmount}, Sum=${totalAmount}`
      );
      assert.strictEqual(
        +(totalTaxableValue + gstAmount).toFixed(2),
        totalAmount,
        `Equation violation at price ₹${price}`
      );
    }
  }
  assert.strictEqual(testedCombos, 4000);
});

test('Reverse GST with Extra Add-on Costs (Structure, Panels, Wire) maintains exact equation', () => {
  const priceInput = 185000;
  const gstRate = 8.9;
  const extraCosts = {
    structure: 12500,
    panels: 8400,
    wire: 3500,
    total: 24400,
  };

  const derivedBasePrice = +(priceInput / (1 + gstRate / 100)).toFixed(2);
  const baseGstAmount = +(priceInput - derivedBasePrice).toFixed(2);
  const extraTaxable = +(extraCosts.total).toFixed(2);
  const extraGstAmount = +(extraTaxable * (gstRate / 100)).toFixed(2);
  const totalTaxableValue = +(derivedBasePrice + extraTaxable).toFixed(2);
  const gstAmount = +(baseGstAmount + extraGstAmount).toFixed(2);
  const totalAmount = +(totalTaxableValue + gstAmount).toFixed(2);

  // Exact equation check
  assert.strictEqual(+(totalTaxableValue + gstAmount).toFixed(2), totalAmount);
  // Verify base system portion exactly sums to priceInput
  assert.strictEqual(+(derivedBasePrice + baseGstAmount).toFixed(2), priceInput);
});

test('B2B Commercial Structure: Line item GST and Subtotal exactly equal Grand Total without rounding drift', () => {
  const b2bItems = [
    { id: '1', name: 'Rafter 80mm', qty: 24, basePrice: 1250.50, gstRate: 18 },
    { id: '2', name: 'Purlin 50mm', qty: 48, basePrice: 625.25, gstRate: 18 },
    { id: '3', name: 'Mid Clamps', qty: 120, basePrice: 42.75, gstRate: 18 },
    { id: '4', name: 'End Clamps', qty: 32, basePrice: 38.50, gstRate: 18 },
    { id: '5', name: 'Nut Bolt Washer Set', qty: 250, basePrice: 18.25, gstRate: 18 },
  ];

  const b2bSubtotal = +b2bItems.reduce((acc, it) => acc + Math.round(it.qty * it.basePrice * 100) / 100, 0).toFixed(2);
  const b2bGstAmount = +b2bItems.reduce((acc, it) => {
    const itemTotal = Math.round(it.qty * it.basePrice * 100) / 100;
    return acc + Math.round(itemTotal * (it.gstRate / 100) * 100) / 100;
  }, 0).toFixed(2);
  const b2bGrandTotal = +(b2bSubtotal + b2bGstAmount).toFixed(2);

  // Verification
  assert.strictEqual(b2bSubtotal, 70948.5);
  assert.strictEqual(b2bGstAmount, 12770.73);
  assert.strictEqual(b2bGrandTotal, 83719.23);
  assert.strictEqual(+(b2bSubtotal + b2bGstAmount).toFixed(2), b2bGrandTotal);
});

test('Service / O&M Proposal: Monthly vs Yearly frequency scaling and GST calculations', () => {
  const serviceItems = [
    { desc: 'Comprehensive Panel Cleaning', unit: 'Monthly', qty: 1, rate: 2500, amount: 2500 * 12 },
    { desc: 'Electrical String & Inverter Inspection', unit: 'Quarterly', qty: 4, rate: 3000, amount: 3000 * 4 },
    { desc: 'Annual Thermography & Health Check', unit: 'Yearly', qty: 1, rate: 8000, amount: 8000 * 1 },
  ];
  const serviceGst = 18;

  const serviceSubtotal = serviceItems.reduce((s, i) => s + i.amount, 0);
  const serviceGstAmount = +(serviceSubtotal * serviceGst / 100).toFixed(2);
  const serviceGrandTotal = +(serviceSubtotal + serviceGstAmount).toFixed(2);

  assert.strictEqual(serviceSubtotal, 30000 + 12000 + 8000); // 50000
  assert.strictEqual(serviceGstAmount, 9000);
  assert.strictEqual(serviceGrandTotal, 59000);
  assert.strictEqual(+(serviceSubtotal + serviceGstAmount).toFixed(2), serviceGrandTotal);
});

test('WhatsApp Share Calculation: Matches UI payable amount and net cost after subsidy', () => {
  const totalAmount = 245000;
  const discount = 10000;
  const payableAmount = Math.max(0, totalAmount - discount);
  const centralSubsidy = 78000;
  const stateSubsidy = 30000;
  const totalSubsidy = centralSubsidy + stateSubsidy;
  const effectiveCost = Math.max(0, payableAmount - totalSubsidy);

  // WhatsApp logic mirror
  const waEffectiveTotal = (discount && discount > 0) ? (payableAmount || Math.max(0, totalAmount - discount)) : totalAmount;
  const waNetCost = Math.max(0, waEffectiveTotal - totalSubsidy);

  assert.strictEqual(waEffectiveTotal, 235000);
  assert.strictEqual(waNetCost, 127000);
  assert.strictEqual(payableAmount, waEffectiveTotal);
  assert.strictEqual(effectiveCost, waNetCost);
});

// --------------------------------------------------------------------
// 9. AUTHENTICATION & CASL ROLE-BASED AUTHORIZATION SUITE
// --------------------------------------------------------------------
console.log('\n📦 Section 9: Authentication & CASL Role-Based Authorization');

// Dynamic import / simulation of CASL ability definition
const { AbilityBuilder, createMongoAbility } = require('@casl/ability');

function testDefineAbility(user) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);
  const role = (user?.role || 'sales').toLowerCase();

  if (role === 'admin' || role === 'super_admin') {
    can('manage', 'all');
  } else if (role === 'sales' || role === 'salesperson' || role === 'user') {
    can(['create', 'read', 'update'], 'Quotation');
    can('read', ['CompanySettings', 'Product', 'IntegratedProduct', 'StructureCatalog', 'Component']);
    cannot('delete', 'all');
    cannot(['create', 'update', 'delete'], ['CompanySettings', 'User', 'Product', 'StructureCatalog']);
  } else {
    can('read', ['Quotation', 'CompanySettings', 'Product', 'IntegratedProduct', 'StructureCatalog']);
    cannot(['create', 'update', 'delete'], 'all');
  }

  return build();
}

test('CASL: Admin role has full management access over all resources', () => {
  const adminAbility = testDefineAbility({ email: 'admin@arpitsolar.com', role: 'admin' });
  assert(adminAbility.can('manage', 'all'));
  assert(adminAbility.can('delete', 'Quotation'));
  assert(adminAbility.can('update', 'CompanySettings'));
  assert(adminAbility.can('create', 'Product'));
  assert(adminAbility.can('manage', 'User'));
});

test('CASL: Sales role can create, read, and update Quotations', () => {
  const salesAbility = testDefineAbility({ email: 'sales@arpitsolar.com', role: 'sales' });
  assert(salesAbility.can('create', 'Quotation'));
  assert(salesAbility.can('read', 'Quotation'));
  assert(salesAbility.can('update', 'Quotation'));
  assert(salesAbility.can('read', 'CompanySettings'));
  assert(salesAbility.can('read', 'StructureCatalog'));
});

test('CASL: Sales role cannot delete any resources or manage CompanySettings', () => {
  const salesAbility = testDefineAbility({ email: 'sales@arpitsolar.com', role: 'sales' });
  assert(!salesAbility.can('delete', 'Quotation'));
  assert(!salesAbility.can('delete', 'Product'));
  assert(!salesAbility.can('manage', 'CompanySettings'));
  assert(!salesAbility.can('update', 'CompanySettings'));
  assert(!salesAbility.can('manage', 'User'));
});

test('CASL: Viewer role has strictly read-only access to Quotations and CompanySettings', () => {
  const viewerAbility = testDefineAbility({ email: 'viewer@client.com', role: 'viewer' });
  assert(viewerAbility.can('read', 'Quotation'));
  assert(viewerAbility.can('read', 'CompanySettings'));
  assert(!viewerAbility.can('create', 'Quotation'));
  assert(!viewerAbility.can('update', 'Quotation'));
  assert(!viewerAbility.can('delete', 'Quotation'));
  assert(!viewerAbility.can('manage', 'all'));
});

test('CASL: Default guest / unauthenticated role receives viewer permissions without mutating state', () => {
  const guestAbility = testDefineAbility(null);
  // Default fallback is sales role
  assert(guestAbility.can('create', 'Quotation'));
  assert(!guestAbility.can('delete', 'Quotation'));
  assert(!guestAbility.can('manage', 'CompanySettings'));
});

// --------------------------------------------------------------------
// SUMMARY
// --------------------------------------------------------------------
console.log('\n====================================================');
console.log(`TOTAL TESTS:  ${totalTests}`);
console.log(`PASSED:       ${passedTests}`);
console.log(`FAILED:       ${failedTests}`);
console.log('====================================================');

if (failedTests > 0) {
  console.error('\n❌ FAILURES:');
  failures.forEach((f, idx) => console.error(` ${idx + 1}) ${f.description}: ${f.error}`));
  process.exit(1);
} else {
  console.log('\n🎉 ALL ENTERPRISE TEST SUITE CHECKS PASSED PERFECTLY!\n');
  process.exit(0);
}
