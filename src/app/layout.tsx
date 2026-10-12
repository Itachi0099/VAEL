import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VAEL — Personal Styling Artist',
  description: 'Personal styling, explained. Tell VAEL who you are and where you\'re going.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fafaf9] text-[#121212] selection:bg-neutral-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
