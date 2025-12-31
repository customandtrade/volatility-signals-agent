import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Volatility Signals Agent',
  description: 'Professional volatility selling signals agent',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}


