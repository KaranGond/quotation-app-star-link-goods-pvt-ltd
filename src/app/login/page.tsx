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
  Tabs,
  Tab,
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
  PersonOutline,
  SolarPower,
  ShieldOutlined,
} from '@mui/icons-material';
import { signIn, signUp, useSession } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { data: session } = useSession();

  const [tab, setTab] = useState<number>(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await signUp.email({
        name: name.trim(),
        email: email.trim(),
        password: password,
      });

      if (res?.error) {
        setErrorMsg(res.error.message || 'Registration failed.');
      } else {
        setSuccessMsg('Account created successfully! You are now logged in.');
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setTab(0);
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
        backgroundImage: 'radial-gradient(at 50% 0%, rgba(30, 58, 95, 0.08) 0px, transparent 60%)',
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
          <Box sx={{ display: 'inline-flex', p: 1.25, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)', mb: 1.2 }}>
            <SolarPower sx={{ fontSize: 36, color: '#f59e0b' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Arpit Solar Shop
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '10.5px' }}>
            Enterprise Quotation & Solar CRM Platform
          </Typography>
        </Box>

        {/* Tab Switcher */}
        <Box sx={{ borderBottom: 1, borderColor: '#e2e8f0', bgcolor: '#ffffff' }}>
          <Tabs
            value={tab}
            onChange={(_, val) => {
              setTab(val);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Sign In" sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label="Create Account" sx={{ fontWeight: 700, textTransform: 'none' }} />
          </Tabs>
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

          {tab === 0 ? (
            /* Sign In Form */
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
                  {loading ? <CircularProgress size={22} sx={{ color: '#ffffff' }} /> : 'Sign In to Workspace'}
                </Button>
              </Box>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUp}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  size="small"
                  placeholder="e.g. John Doe"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline sx={{ color: '#64748b', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Work Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  size="small"
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
                  helperText="Minimum 6 characters"
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
                  {loading ? <CircularProgress size={22} sx={{ color: '#ffffff' }} /> : 'Create Account'}
                </Button>
              </Box>
            </form>
          )}

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
        Protected by Better Auth (Self-Hosted) & CASL Role-Based Authorization
      </Typography>
    </Box>
  );
}
