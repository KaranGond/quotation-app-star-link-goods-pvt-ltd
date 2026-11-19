'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  EmailOutlined,
  LockOutlined,
  SolarPower,
  ShieldOutlined,
} from '@mui/icons-material';
import { signIn, useSession } from '@/lib/auth-client';

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
          <CircularProgress size={32} sx={{ color: '#1e3a5f' }} />
        </Box>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { data: session } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [company, setCompany] = useState<{ name?: string; logo_url?: string } | null>(null);

  React.useEffect(() => {
    fetch('/api/company')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setCompany(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // If already logged in, redirect
  React.useEffect(() => {
    if (session?.user) {
      router.push(redirectUrl);
    }
  }, [session, redirectUrl, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await signIn.email({
        email: email.trim(),
        password: password,
      });

      if (res?.error) {
        setErrorMsg(res.error.message || 'Invalid email or password.');
      } else {
        setSuccessMsg('Signed in successfully! Redirecting...');
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 3,
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {/* Header Banner */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
            color: '#ffffff',
            p: 3,
            textAlign: 'center',
          }}
        >
          {company?.logo_url ? (
            <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'center' }}>
              <Box
                component="img"
                src={company.logo_url}
                alt="Logo"
                sx={{ maxHeight: 52, maxWidth: 220, objectFit: 'contain', bgcolor: '#ffffff', p: 0.8, borderRadius: 2 }}
                onError={(e: any) => { e.target.style.display = 'none'; }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'inline-flex', p: 1.25, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)', mb: 1.2 }}>
              <SolarPower sx={{ fontSize: 36, color: '#f59e0b' }} />
            </Box>
          )}
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            {company?.name || 'Star Link Goods Pvt. Ltd.'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '10.5px' }}>
            Enterprise Quotation & Solar CRM Platform
          </Typography>
        </Box>

        {/* Sign In Header */}
        <Box sx={{ p: 2, px: 3, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700} color="#1e3a5f">
            Sign In to Your Workspace
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Enter your authorized business credentials to continue
          </Typography>
        </Box>

        <CardContent sx={{ p: 3, bgcolor: '#ffffff' }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '13px' }}>
              {errorMsg}
            </Alert>
          )}

          {successMsg && (
            <Alert severity="success" sx={{ mb: 2, fontSize: '13px' }}>
              {successMsg}
            </Alert>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSignIn}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                size="small"
                placeholder="name@company.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined sx={{ color: '#64748b', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: '#64748b', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.2,
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: '#1e3a5f',
                  '&:hover': { bgcolor: '#0f172a' },
                }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: '#ffffff' }} /> : 'Sign In'}
              </Button>
            </Box>
          </form>

          {/* Invite-Only Security Notice */}
          <Box
            sx={{
              mt: 2.5,
              p: 1.5,
              bgcolor: '#f8fafc',
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#64748b',
                fontSize: '11.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.6,
                fontWeight: 500,
              }}
            >
              <LockOutlined sx={{ fontSize: 14, color: '#94a3b8' }} />
              Closed Enterprise System. Accounts are created by Administrators.
            </Typography>
          </Box>

          {/* Quick Demo Credentials */}
          <Divider sx={{ my: 2.5 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px', px: 1 }}>
              PRIMARY ADMINISTRATOR CREDENTIALS
            </Typography>
          </Divider>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Chip
              icon={<ShieldOutlined sx={{ fontSize: '16px !important' }} />}
              label="Admin (karangond221998@gmail.com)"
              onClick={() => fillDemo('karangond221998@gmail.com', 'Karan1998')}
              clickable
              size="small"
              sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: '11.5px', py: 1.8 }}
            />
          </Box>
        </CardContent>
      </Card>

      <Typography variant="caption" sx={{ mt: 3, color: '#94a3b8', fontSize: '11px' }}>
        Protected by Better Auth & CASL Role-Based Authorization
      </Typography>
    </Box>
  );
}
