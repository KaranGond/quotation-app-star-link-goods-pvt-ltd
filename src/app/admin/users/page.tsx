'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Home,
  Add,
  Delete,
  Shield,
  Person,
  ArrowBack,
  Lock,
} from '@mui/icons-material';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { useAbility } from '@/components/Can';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'viewer';
  banned?: boolean;
  createdAt: string;
}

export default function UsersManagementPage() {
  const { data: session } = useSession();
  const ability = useAbility();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dialog State: Add User
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'sales' | 'viewer'>('sales');
  const [savingUser, setSavingUser] = useState(false);

  // Dialog State: Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setErrorMsg(data.message || 'Failed to load users');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    setSavingUser(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`✅ User "${newName}" created with role ${newRole.toUpperCase()}!`);
        setAddModalOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('sales');
        fetchUsers();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.message || 'Failed to create user');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error creating user');
    } finally {
      setSavingUser(false);
    }
  };

  const handleRoleChange = async (userId: string, targetRole: string) => {
    setErrorMsg('');
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Role updated to ${targetRole.toUpperCase()}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: targetRole as any } : u))
        );
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.message || 'Failed to update role');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error updating role');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/users/${deleteId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('User deleted successfully');
        setDeleteId(null);
        setUsers((prev) => prev.filter((u) => u.id !== deleteId));
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.message || 'Failed to delete user');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error deleting user');
    } finally {
      setDeleting(false);
    }
  };

  // CASL Guard: Check if current user has permission to manage users
  const canManageUsers = ability.can('manage', 'User');

  if (!canManageUsers && !loading) {
    return (
      <Box sx={{ p: 4, minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card sx={{ maxWidth: 480, p: 3, textAlign: 'center', borderRadius: 3, border: '1px solid #fee2e2' }}>
          <Lock sx={{ fontSize: 48, color: '#ef4444', mb: 1 }} />
          <Typography variant="h6" fontWeight="bold" color="#991b1b">
            Access Restricted
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Only Administrators have authorization to access the Team & User Management panel. Your current role is <strong>{(session?.user?.role || 'sales').toUpperCase()}</strong>.
          </Typography>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <Button variant="contained" sx={{ bgcolor: '#1e3a5f' }}>
              Return to Admin Dashboard
            </Button>
          </Link>
        </Card>
      </Box>
    );
  }

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const salesCount = users.filter((u) => u.role === 'sales').length;
  const viewerCount = users.filter((u) => u.role === 'viewer').length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Link href="/admin" style={{ textDecoration: 'none' }}>
              <IconButton size="small" sx={{ bgcolor: '#ffffff', border: '1px solid #cbd5e1' }}>
                <ArrowBack fontSize="small" />
              </IconButton>
            </Link>
            <Box>
              <Typography variant="h5" fontWeight="bold" color="#1e3a5f">
                Team & User Management
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Configure roles, permissions, and team member access
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Link href="/admin" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" startIcon={<Home />} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Admin Portal
              </Button>
            </Link>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddModalOpen(true)}
              sx={{ bgcolor: '#1e3a5f', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#0f172a' } }}
            >
              Add New User
            </Button>
          </Box>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
            {successMsg}
          </Alert>
        )}

        {/* Overview Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2, borderLeft: '4px solid #1e3a5f' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="#1e3a5f">
                  {users.length}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Total Team Members
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2, borderLeft: '4px solid #0284c7' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="#0284c7">
                  {adminCount}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Administrators (Full Access)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2, borderLeft: '4px solid #16a34a' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="#16a34a">
                  {salesCount}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Sales Executives
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2, borderLeft: '4px solid #64748b' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="#64748b">
                  {viewerCount}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Viewers (Read Only)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* User Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={32} />
              <Typography variant="body2" sx={{ mt: 1, color: '#64748b' }}>Loading team members...</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>USER</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>EMAIL</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>ASSIGNED ROLE</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>CREATED ON</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const isCurrentAuthUser = session?.user?.email === u.email;
                  const isRootAdmin = u.email === 'karangond221998@gmail.com';

                  return (
                    <TableRow key={u.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              bgcolor: u.role === 'admin' ? '#e0f2fe' : u.role === 'sales' ? '#f0fdf4' : '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: u.role === 'admin' ? '#0369a1' : u.role === 'sales' ? '#166534' : '#475569',
                            }}
                          >
                            {u.role === 'admin' ? <Shield sx={{ fontSize: 18 }} /> : <Person sx={{ fontSize: 18 }} />}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                            <Typography component="span" variant="body2" fontWeight={700} sx={{ fontSize: '13px' }}>
                              {u.name}
                            </Typography>
                            {isCurrentAuthUser && (
                              <Chip
                                component="span"
                                label="You"
                                size="small"
                                sx={{ height: 16, fontSize: '9.5px' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '12.5px', color: '#475569' }}>
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={u.role || 'sales'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={isRootAdmin}
                            sx={{
                              fontSize: '12px',
                              fontWeight: 700,
                              height: 30,
                              bgcolor: u.role === 'admin' ? '#f0f9ff' : u.role === 'sales' ? '#f0fdf4' : '#f8fafc',
                              color: u.role === 'admin' ? '#0369a1' : u.role === 'sales' ? '#166534' : '#475569',
                            }}
                          >
                            <MenuItem value="admin">Admin (Full Access)</MenuItem>
                            <MenuItem value="sales">Sales (Quotations)</MenuItem>
                            <MenuItem value="viewer">Viewer (Read Only)</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={isRootAdmin ? 'Primary Administrator cannot be deleted' : 'Delete user account'}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={isRootAdmin || isCurrentAuthUser}
                              onClick={() => {
                                setDeleteId(u.id);
                                setDeleteName(u.name || u.email);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Add User Modal */}
        <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="xs" fullWidth>
          <form onSubmit={handleCreateUser}>
            <DialogTitle sx={{ fontWeight: 800, color: '#1e3a5f' }}>
              Add New Team Member
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Full Name"
                fullWidth
                size="small"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                placeholder="e.g. Rahul Sharma"
              />
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                size="small"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                placeholder="e.g. sales@starlinkgoods.com"
              />
              <TextField
                label="Initial Password"
                type="password"
                fullWidth
                size="small"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                helperText="Minimum 6 characters"
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Assign Role</InputLabel>
                <Select
                  value={newRole}
                  label="Assign Role"
                  onChange={(e) => setNewRole(e.target.value as any)}
                >
                  <MenuItem value="sales">Sales Executive (Create & Manage Quotes)</MenuItem>
                  <MenuItem value="admin">Administrator (Full Control & Company Settings)</MenuItem>
                  <MenuItem value="viewer">Viewer (Read-only access)</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setAddModalOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={savingUser}
                sx={{ bgcolor: '#1e3a5f', textTransform: 'none', fontWeight: 700 }}
              >
                {savingUser ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : 'Create Team Member'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: '#991b1b' }}>
            Delete User Account
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to permanently delete user <strong>{deleteName}</strong>? All their active sessions will be terminated immediately.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteId(null)} sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteUser}
              disabled={deleting}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {deleting ? <CircularProgress size={18} sx={{ color: '#ffffff' }} /> : 'Confirm Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
