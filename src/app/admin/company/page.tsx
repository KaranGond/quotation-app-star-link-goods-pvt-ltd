'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VerifiedIcon from '@mui/icons-material/Verified';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import LaunchIcon from '@mui/icons-material/Launch';
import GavelIcon from '@mui/icons-material/Gavel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { defaultTerms } from '@/lib/companyDetails';
import { defaultB2BTerms } from '@/data/apolloProducts';

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [quotePrefix, setQuotePrefix] = useState('ASS');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [signatory, setSignatory] = useState('');
  const [gstin, setGstin] = useState('');
  const [cin, setCin] = useState('');
  const [headOffice, setHeadOffice] = useState('');
  const [registeredOffice, setRegisteredOffice] = useState('');
  const [warehouse, setWarehouse] = useState('');

  // Bank Details
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');

  // Brand Assets
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [stampUrl, setStampUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Default Terms & Conditions
  const [rooftopTerms, setRooftopTerms] = useState<string[]>([...defaultTerms['On-grid'].slice(0, 8)]);
  const [b2bTerms, setB2bTerms] = useState<string[]>([...defaultB2BTerms]);
  const [termsTab, setTermsTab] = useState<'rooftop' | 'b2b'>('rooftop');
  const [newTermText, setNewTermText] = useState('');
  const [editingTermIndex, setEditingTermIndex] = useState<number | null>(null);
  const [editingTermText, setEditingTermText] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Fetch company details
  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/company');
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setName(d.name || '');
        setTagline(d.tagline || '');
        setQuotePrefix(d.quote_prefix || 'ASS');
        setPhone(d.phone || '');
        setAlternatePhone(d.alternate_phone || '');
        setEmail(d.email || '');
        setSignatory(d.authorized_signatory || '');
        setGstin(d.gstin || '');
        setCin(d.cin || '');
        setHeadOffice(d.head_office || '');
        setRegisteredOffice(d.registered_office || '');
        setWarehouse(d.warehouse || '');

        setBankName(d.bank_name || '');
        setBankBranch(d.bank_branch || '');
        setAccountName(d.account_name || '');
        setAccountNumber(d.account_number || '');
        setIfsc(d.ifsc || '');
        setUpiId(d.upi_id || '');

        setLogoUrl(d.logo_url || '');
        const mergedSealSign = d.stamp_url || d.signature_url || '';
        setSignatureUrl(mergedSealSign);
        setStampUrl(mergedSealSign);
        setQrCodeUrl(d.qr_code_url || '');

        if (d.default_terms) {
          if (Array.isArray(d.default_terms) && d.default_terms.length > 0) {
            setRooftopTerms(d.default_terms);
          } else if (typeof d.default_terms === 'object') {
            if (Array.isArray(d.default_terms.rooftop) && d.default_terms.rooftop.length > 0) {
              setRooftopTerms(d.default_terms.rooftop);
            }
            if (Array.isArray(d.default_terms.b2b) && d.default_terms.b2b.length > 0) {
              setB2bTerms(d.default_terms.b2b);
            }
          }
        }
      }
    } catch (err: any) {
      setErrorMsg('Failed to load company details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  // Handle Asset Upload to Supabase Storage Bucket
  const handleFileUpload = async (file: File, type: 'logo' | 'stamp_signature' | 'qr') => {
    if (type === 'logo') setUploadingLogo(true);
    if (type === 'stamp_signature') setUploadingStamp(true);
    if (type === 'qr') setUploadingQr(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('auto_update_db', 'true');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        if (type === 'logo') setLogoUrl(data.url);
        if (type === 'stamp_signature') {
          setStampUrl(data.url);
          setSignatureUrl(data.url);
        }
        if (type === 'qr') setQrCodeUrl(data.url);

        setSuccessMsg(`✅ ${type === 'stamp_signature' ? 'Official Rubber Stamp Seal with Signature' : type.toUpperCase()} uploaded and saved!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err: any) {
      setErrorMsg(`Failed to upload: ${err.message}`);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      if (type === 'stamp_signature') setUploadingStamp(false);
      if (type === 'qr') setUploadingQr(false);
    }
  };

  // Save Company Details
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Company Name is required');
      return;
    }

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        name: name.trim(),
        tagline: tagline.trim(),
        quote_prefix: quotePrefix.trim().toUpperCase() || 'ASS',
        phone: phone.trim(),
        alternate_phone: alternatePhone.trim(),
        email: email.trim(),
        authorized_signatory: signatory.trim(),
        gstin: gstin.trim().toUpperCase(),
        cin: cin.trim().toUpperCase(),
        head_office: headOffice.trim(),
        registered_office: registeredOffice.trim(),
        warehouse: warehouse.trim(),
        bank_name: bankName.trim(),
        bank_branch: bankBranch.trim(),
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        upi_id: upiId.trim(),
        logo_url: logoUrl,
        signature_url: stampUrl || signatureUrl || '',
        stamp_url: stampUrl || signatureUrl || '',
        qr_code_url: qrCodeUrl,
        default_terms: {
          rooftop: rooftopTerms,
          b2b: b2bTerms,
        },
      };

      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update company details');
      }

      setSuccessMsg('🎉 Company profile and branding assets updated successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            href="/admin"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#1e3a5f', borderColor: '#cbd5e1' }}
          >
            Admin Dashboard
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e3a5f' }}>
              Company Settings & Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure company profile, brand assets, rubber stamp seal, signature, bank accounts, and default quotation terms
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            component={Link}
            href="/"
            target="_blank"
            variant="outlined"
            size="small"
            endIcon={<LaunchIcon />}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#1e3a5f', borderColor: '#cbd5e1' }}
          >
            Open Quotation App
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: '#1e3a5f',
              '&:hover': { bgcolor: '#0f172a' },
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
            }}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </Box>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, fontWeight: 600 }}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, fontWeight: 600 }}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Brand Assets & Visual Seals */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a5f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedIcon color="primary" /> Official Brand Assets
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload your company logo, official rubber stamp seal, authorized signature, and payment barcode. Assets are stored securely in Supabase storage.
              </Typography>

              {/* 1. Logo Asset */}
              <Box sx={{ mb: 3, p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Company Logo
                  </Typography>
                  <Chip label="Header Logo" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                </Box>
                <Box sx={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', borderRadius: 1, border: '1px dashed #cbd5e1', mb: 1.5, p: 1 }}>
                  {logoUrl ? (
                    <Box component="img" src={logoUrl} alt="Logo" sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} onError={(e: any) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">No logo uploaded</Typography>
                  )}
                </Box>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  ref={logoInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'logo');
                  }}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={uploadingLogo ? <CircularProgress size={14} /> : <CloudUploadIcon />}
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1', color: '#1e3a5f' }}
                >
                  {uploadingLogo ? 'Uploading Logo...' : 'Upload Logo'}
                </Button>
              </Box>

              {/* 2. Unified Official Rubber Stamp Seal with Signature Asset */}
              <Box sx={{ mb: 3, p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    OFFICIAL RUBBER STAMP SEAL WITH SIGNATURE
                  </Typography>
                  <Chip label="Seal & Sign" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5, fontSize: '0.72rem' }}>
                  Upload your unified rubber stamp seal with signature image. This appears on all quotation PDFs and proposal documents.
                </Typography>
                <Box sx={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', borderRadius: 1, border: '1px dashed #cbd5e1', mb: 1.5, p: 1 }}>
                  {(stampUrl || signatureUrl) ? (
                    <Box
                      component="img"
                      src={stampUrl || signatureUrl}
                      alt="Official Rubber Stamp Seal with Signature"
                      sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      onError={(e: any) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">No stamp seal with signature uploaded</Typography>
                  )}
                </Box>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  ref={stampInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'stamp_signature');
                  }}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={uploadingStamp ? <CircularProgress size={14} /> : <CloudUploadIcon />}
                  disabled={uploadingStamp}
                  onClick={() => stampInputRef.current?.click()}
                  sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#cbd5e1', color: '#1e3a5f' }}
                >
                  {uploadingStamp ? 'Uploading Seal & Sign...' : 'Upload Official Rubber Stamp Seal with Signature'}
                </Button>
              </Box>

              {/* 3. Payment Barcode / QR Code Asset */}
              <Box sx={{ mb: 3, p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    UPI / Payment QR Code
                  </Typography>
                  <Chip label="UPI Barcode" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                </Box>
                <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', borderRadius: 1, border: '1px dashed #cbd5e1', mb: 1.5, p: 1 }}>
                  {qrCodeUrl ? (
                    <Box component="img" src={qrCodeUrl} alt="Payment QR" sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} onError={(e: any) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">No payment barcode</Typography>
                  )}
                </Box>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  ref={qrInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'qr');
                  }}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={uploadingQr ? <CircularProgress size={14} /> : <QrCode2Icon />}
                  disabled={uploadingQr}
                  onClick={() => qrInputRef.current?.click()}
                  sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1', color: '#1e3a5f' }}
                >
                  {uploadingQr ? 'Uploading QR...' : 'Upload Payment Barcode'}
                </Button>
              </Box>

              {/* Live Print Preview */}
              <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid #cbd5e1' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e3a5f', display: 'block', mb: 1 }}>
                  Print Preview (Official Seal & Signatory Box)
                </Typography>
                <Box sx={{ bgcolor: '#fff', p: 1.5, borderRadius: 1, textAlign: 'right', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5, fontWeight: 600 }}>
                    For {name || 'Your Company'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', minHeight: 55, my: 0.5 }}>
                    {(stampUrl || signatureUrl) ? (
                      <Box
                        component="img"
                        src={stampUrl || signatureUrl}
                        alt="Seal Preview"
                        sx={{ maxHeight: 52, maxWidth: 160, objectFit: 'contain' }}
                        onError={(e: any) => e.target.style.display = 'none'}
                      />
                    ) : (
                      <Box sx={{ height: 45 }} />
                    )}
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {signatory || 'Authorized Signatory'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Company Info, Addresses & Bank Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Section 1: Company Profile */}
          <Card elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a5f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" /> Company Profile & Identity
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Arpit Solar Shop"
                    required
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Quote Number Prefix"
                    value={quotePrefix}
                    onChange={(e) => setQuotePrefix(e.target.value.toUpperCase())}
                    placeholder="ASS, KSS, etc."
                    helperText="Appears on quote numbers (e.g. ASS/2026/...)"
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Company Tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. ILLUMINATING YOUR FUTURE WITH CLEAN ENERGY"
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Primary Phone / Mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9005770466"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Alternate Phone"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    placeholder="9044555572"
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Official Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.com"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Authorized Signatory Name"
                    value={signatory}
                    onChange={(e) => setSignatory(e.target.value)}
                    placeholder="e.g. Ratnesh Mishra"
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="GSTIN Number"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="09APKPM6299L1ZW"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Corporate Identity Number (CIN)"
                    value={cin}
                    onChange={(e) => setCin(e.target.value.toUpperCase())}
                    placeholder="Optional CIN number"
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Section 2: Addresses */}
          <Card elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a5f', mb: 2 }}>
                Official Addresses
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Head Office Address"
                    value={headOffice}
                    onChange={(e) => setHeadOffice(e.target.value)}
                    placeholder="Full head office address displayed on quote header"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Registered Office / Branch Address"
                    value={registeredOffice}
                    onChange={(e) => setRegisteredOffice(e.target.value)}
                    placeholder="Registered office or branch address"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Warehouse / Factory Address (Optional)"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    placeholder="Optional warehouse address"
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Section 3: Bank & UPI Payment Details */}
          <Card elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a5f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceIcon color="primary" /> Bank & UPI Details (Printed on Quotations)
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Bank Name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Bank Branch"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="e.g. Shivpur, Varanasi"
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Account Holder Name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. ARPIT SOLAR SHOP"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="50200123854806"
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="IFSC Code"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="HDFC0004807"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="UPI ID / VPA"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="vyapar.173575988777@hdfcbank"
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Section 4: Default Quotation Terms & Conditions */}
          <Card elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a5f', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GavelIcon color="primary" /> Default Quotation Terms & Conditions
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<RestartAltIcon fontSize="small" />}
                  onClick={() => {
                    const tabName = termsTab === 'rooftop' ? 'Solar Rooftop' : 'B2B Structure';
                    if (window.confirm(`Reset ${tabName} terms to standard defaults?`)) {
                      if (termsTab === 'rooftop') {
                        setRooftopTerms([...defaultTerms['On-grid'].slice(0, 8)]);
                      } else {
                        setB2bTerms([...defaultB2BTerms]);
                      }
                      setSuccessMsg(`Reset ${tabName} terms to defaults. Remember to click "Save All Changes" to save.`);
                      setTimeout(() => setSuccessMsg(''), 4000);
                    }
                  }}
                  sx={{ textTransform: 'none', fontSize: 11, fontWeight: 600 }}
                >
                  Reset Tab to Defaults
                </Button>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These clauses populate automatically on newly generated quotations. You can edit each clause, change its sequence, add company-specific policies, or delete obsolete points.
              </Typography>

              <Tabs
                value={termsTab}
                onChange={(_, val) => {
                  setTermsTab(val);
                  setEditingTermIndex(null);
                  setNewTermText('');
                }}
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label={`Solar Rooftop Terms (${rooftopTerms.length})`} value="rooftop" sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label={`B2B Commercial Terms (${b2bTerms.length})`} value="b2b" sx={{ textTransform: 'none', fontWeight: 700 }} />
              </Tabs>

              {/* Terms List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                {(termsTab === 'rooftop' ? rooftopTerms : b2bTerms).map((term, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.25,
                      bgcolor: idx % 2 === 0 ? '#f8fafc' : 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.2,
                    }}
                  >
                    <Chip
                      size="small"
                      label={idx + 1}
                      sx={{ height: 22, minWidth: 22, fontSize: 11, fontWeight: 700, bgcolor: '#e2e8f0', color: '#1e3a5f', p: 0 }}
                    />

                    {editingTermIndex === idx ? (
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <TextField
                          fullWidth
                          multiline
                          size="small"
                          value={editingTermText}
                          onChange={(e) => setEditingTermText(e.target.value)}
                          autoFocus
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<CheckIcon fontSize="small" />}
                            onClick={() => {
                              if (!editingTermText.trim()) return;
                              if (termsTab === 'rooftop') {
                                const updated = [...rooftopTerms];
                                updated[idx] = editingTermText.trim();
                                setRooftopTerms(updated);
                              } else {
                                const updated = [...b2bTerms];
                                updated[idx] = editingTermText.trim();
                                setB2bTerms(updated);
                              }
                              setEditingTermIndex(null);
                            }}
                            sx={{ textTransform: 'none', fontSize: 11, fontWeight: 600 }}
                          >
                            Save Clause
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CloseIcon fontSize="small" />}
                            onClick={() => setEditingTermIndex(null)}
                            sx={{ textTransform: 'none', fontSize: 11 }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            flex: 1,
                            fontSize: 12.5,
                            color: '#334155',
                            lineHeight: 1.45,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setEditingTermIndex(idx);
                            setEditingTermText(term);
                          }}
                        >
                          <span dangerouslySetInnerHTML={{ __html: term.replace(/^([^:]+:)/, '<strong>$1</strong>') }} />
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <Tooltip title="Move Up">
                            <span>
                              <IconButton
                                size="small"
                                disabled={idx === 0}
                                onClick={() => {
                                  const list = termsTab === 'rooftop' ? [...rooftopTerms] : [...b2bTerms];
                                  const temp = list[idx - 1];
                                  list[idx - 1] = list[idx];
                                  list[idx] = temp;
                                  if (termsTab === 'rooftop') setRooftopTerms(list);
                                  else setB2bTerms(list);
                                }}
                              >
                                <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Move Down">
                            <span>
                              <IconButton
                                size="small"
                                disabled={idx === (termsTab === 'rooftop' ? rooftopTerms.length - 1 : b2bTerms.length - 1)}
                                onClick={() => {
                                  const list = termsTab === 'rooftop' ? [...rooftopTerms] : [...b2bTerms];
                                  const temp = list[idx + 1];
                                  list[idx + 1] = list[idx];
                                  list[idx] = temp;
                                  if (termsTab === 'rooftop') setRooftopTerms(list);
                                  else setB2bTerms(list);
                                }}
                              >
                                <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Edit Clause">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingTermIndex(idx);
                                setEditingTermText(term);
                              }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Clause">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                if (termsTab === 'rooftop') {
                                  setRooftopTerms(rooftopTerms.filter((_, i) => i !== idx));
                                } else {
                                  setB2bTerms(b2bTerms.filter((_, i) => i !== idx));
                                }
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </>
                    )}
                  </Box>
                ))}
              </Box>

              {/* Add New Term */}
              <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 1.5, border: '1px dashed #cbd5e1' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e3a5f', display: 'block', mb: 1 }}>
                  + Add New {termsTab === 'rooftop' ? 'Solar Rooftop' : 'B2B Commercial'} Term:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. Payment: 10% advance upon confirmation..."
                    value={newTermText}
                    onChange={(e) => setNewTermText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTermText.trim()) {
                        e.preventDefault();
                        if (termsTab === 'rooftop') setRooftopTerms([...rooftopTerms, newTermText.trim()]);
                        else setB2bTerms([...b2bTerms, newTermText.trim()]);
                        setNewTermText('');
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      if (!newTermText.trim()) return;
                      if (termsTab === 'rooftop') setRooftopTerms([...rooftopTerms, newTermText.trim()]);
                      else setB2bTerms([...b2bTerms, newTermText.trim()]);
                      setNewTermText('');
                    }}
                    disabled={!newTermText.trim()}
                    sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap', bgcolor: '#1e3a5f' }}
                  >
                    Add Term
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Bottom Save Action */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                bgcolor: '#1e3a5f',
                '&:hover': { bgcolor: '#0f172a' },
                fontWeight: 700,
                textTransform: 'none',
                px: 4,
                py: 1.2,
              }}
            >
              {saving ? 'Saving...' : 'Save All Company Details'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
