"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Inventory,
  SettingsInputComponent,
  Receipt,
  Home,
  Add,
  Construction,
  Inventory2,
  Business,
  Logout,
  Person,
  Shield,
  Group,
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { companyDetails as fallbackCompanyDetails } from "@/lib/companyDetails";
import { useSession, signOut } from "@/lib/auth-client";
import { useAbility } from "@/components/Can";
import { Actions, Subjects } from "@/lib/permissions";

type DashboardStats = {
  totalQuotations: number;
  draftQuotations: number;
  sentQuotations: number;
};

type MenuItem = {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
  action: Actions;
  subject: Subjects;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const ability = useAbility();

  const [companyName, setCompanyName] = useState(fallbackCompanyDetails.name);
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotations: 0,
    draftQuotations: 0,
    sentQuotations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [resQuotes, resCompany] = await Promise.all([
          fetch("/api/quotations?limit=100"),
          fetch("/api/company"),
        ]);
        const data = await resQuotes.json();
        if (data.success) {
          const quotations = data.data || [];
          setStats({
            totalQuotations: quotations.length,
            draftQuotations: quotations.filter((q: any) => q.status === "draft").length,
            sentQuotations: quotations.filter((q: any) => q.status === "sent").length,
          });
        }
        const companyData = await resCompany.json();
        if (companyData.success && companyData.data?.name) {
          setCompanyName(companyData.data.name);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const menuItems: MenuItem[] = [
    {
      title: "Company Settings & Profile",
      description: "Edit company details, official rubber stamp, signature, bank details, & default terms",
      icon: <Business sx={{ fontSize: 40 }} />,
      color: "#0284c7",
      href: "/admin/company",
      action: "manage",
      subject: "CompanySettings",
    },
    {
      title: "Rooftop Quotation",
      description: "On-grid, Off-grid & Hybrid Solar Quotations",
      icon: <Add sx={{ fontSize: 40 }} />,
      color: "#16a34a",
      href: "/",
      action: "create",
      subject: "Quotation",
    },
    {
      title: "Structure / B2B Quote",
      description: "Apollo & Tata Solar Structures, Wires & Kits",
      icon: <Construction sx={{ fontSize: 40 }} />,
      color: "#d97706",
      href: "/?tab=ApolloB2B",
      action: "create",
      subject: "Quotation",
    },
    {
      title: "Structure Catalog",
      description: "Browse 41 mounting structures, clamps & cables",
      icon: <Inventory2 sx={{ fontSize: 40 }} />,
      color: "#2563eb",
      href: "/admin/structure-catalog",
      action: "read",
      subject: "StructureCatalog",
    },
    {
      title: "Solar Products",
      description: "Manage rooftop panels & inverters",
      icon: <Inventory sx={{ fontSize: 40 }} />,
      color: "#0891b2",
      href: "/admin/products",
      action: "manage",
      subject: "Product",
    },
    {
      title: "Bill of Materials",
      description: "Customize components for solar systems",
      icon: <SettingsInputComponent sx={{ fontSize: 40 }} />,
      color: "#f59e0b",
      href: "/admin/components",
      action: "manage",
      subject: "Component",
    },
    {
      title: "Team & User Access",
      description: "Manage users, assign roles (Admin, Sales, Viewer), and control access",
      icon: <Group sx={{ fontSize: 40 }} />,
      color: "#6366f1",
      href: "/admin/users",
      action: "manage",
      subject: "User",
    },
    {
      title: "Saved Quotations",
      description: "View, edit, search & export quotations",
      icon: <Receipt sx={{ fontSize: 40 }} />,
      color: "#9333ea",
      href: "/admin/quotations",
      action: "read",
      subject: "Quotation",
    },
  ];

  return (
    <Box sx={{ p: 3, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="#1a237e">
              {companyName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admin & Enterprise Management Portal
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            {session?.user && (
              <Chip
                icon={session.user.role === 'admin' ? <Shield sx={{ fontSize: 16 }} /> : <Person sx={{ fontSize: 16 }} />}
                label={`${session.user.name || session.user.email} (${(session.user.role || 'sales').toUpperCase()})`}
                sx={{ bgcolor: "#ffffff", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: "12px", py: 1.8 }}
              />
            )}
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" startIcon={<Home />}>
                Back to Home
              </Button>
            </Link>
            {session?.user ? (
              <Tooltip title="Sign Out">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Logout />}
                  onClick={async () => {
                    await signOut();
                    router.push('/login');
                  }}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Sign Out
                </Button>
              </Tooltip>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Button variant="contained" sx={{ bgcolor: "#1e3a5f", textTransform: "none", fontWeight: 700 }}>
                  Sign In
                </Button>
              </Link>
            )}
          </Box>
        </Box>

        {/* Stats Cards */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderRadius: 2, borderLeft: "4px solid #4CAF50" }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold" color="#4CAF50">
                    {stats.totalQuotations}
                  </Typography>
                  <Typography color="text.secondary">Total Quotations</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderRadius: 2, borderLeft: "4px solid #FF9800" }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold" color="#FF9800">
                    {stats.draftQuotations}
                  </Typography>
                  <Typography color="text.secondary">Draft Quotations</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderRadius: 2, borderLeft: "4px solid #2196F3" }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold" color="#2196F3">
                    {stats.sentQuotations}
                  </Typography>
                  <Typography color="text.secondary">Sent Quotations</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Menu Cards */}
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {menuItems.map((item) => {
            const isAllowed = ability.can(item.action, item.subject);
            if (!isAllowed) return null; // CASL permission filtering

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.title}>
                <Link href={item.href} style={{ textDecoration: "none" }}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
                    }}
                  >
                    <CardContent sx={{ textAlign: "center", py: 4 }}>
                      <Box sx={{ color: item.color, mb: 2 }}>{item.icon}</Box>
                      <Typography variant="h6" fontWeight="bold">
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Link>
              </Grid>
            );
          })}
        </Grid>

        {/* Company Info */}
        <Card sx={{ mt: 4, borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Company Information
              </Typography>
              <Link href="/admin/company">
                <Button size="small" variant="text" sx={{ textTransform: "none", fontWeight: 600 }}>
                  Edit Details & Seals →
                </Button>
              </Link>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  GSTIN: {fallbackCompanyDetails.gstin}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Head Office: {fallbackCompanyDetails.headOffice}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Phone: {fallbackCompanyDetails.phone}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email: {fallbackCompanyDetails.email}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
