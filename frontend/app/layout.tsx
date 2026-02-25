import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata: Metadata = {
  title: 'Vive Code – Agri Intelligence Platform',
  description:
    'AI-powered agricultural intelligence for Indian farmers: crop disease detection, live mandi prices, satellite field monitoring, and more.',
  keywords:
    'farmer, agriculture, mandi prices, crop disease, Vive Code, India, AI farming',
  authors: [{ name: 'Vive Code' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
  openGraph: {
    title: 'Vive Code',
    description: 'AI-powered Agri Intelligence Platform for Indian Farmers',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#166534',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-primary-50 text-primary-900 font-sans">
        <LanguageProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#166534',
                  color: '#fff',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: {
                  style: { background: '#15803d' },
                  iconTheme: { primary: '#dcfce7', secondary: '#166534' },
                },
                error: {
                  style: { background: '#dc2626' },
                  iconTheme: { primary: '#fee2e2', secondary: '#dc2626' },
                },
              }}
            />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
