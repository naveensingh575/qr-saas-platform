import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { AuthProvider } from '@/lib/auth-context';
import { GlobalModals } from '@/components/global-modals';

export const metadata: Metadata = {
  title: 'OmniQR - Multi-Tenant Production QR SaaS Platform',
  description:
    'Enterprise multi-tenant QR platform. Free client-side static UPI QRs, server-generated dynamic Level H logo QRs with sub-10ms edge redirects, and BullMQ bulk CSV generation with RBAC API keys.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
          <GlobalModals />
        </AuthProvider>
      </body>
    </html>
  );
}
