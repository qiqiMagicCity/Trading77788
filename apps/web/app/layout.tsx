import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Trading Dashboard',
  description: 'Rebuilt trading dashboard'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-white">{children}</body>
    </html>
  );
}
