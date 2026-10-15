import type { Metadata } from 'next';
import './globals.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'VAEL — Personal Visual Styling System',
  description: 'Personal styling, explained. Tell VAEL who you are and where you\'re going.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vael_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#fafaf9] dark:bg-[#121212] text-[#121212] dark:text-[#f4f4f5] selection:bg-neutral-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}

