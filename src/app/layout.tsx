import type { Metadata } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme';
import "../styles/globals.css";
import { AuthAbilityProvider } from '@/components/Can';

export const metadata: Metadata = {
  title: "Solar Quotation System | Arpit Solar Shop",
  description: "Executive Solar & Structure Quotation Builder with Commercial Billing and Subsidy Estimations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthAbilityProvider>
              {children}
            </AuthAbilityProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}