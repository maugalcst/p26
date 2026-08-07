import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Boot from '@/components/Boot';
import CustomCursor from '@/components/CustomCursor';
import StatusWidget from '@/components/StatusWidget';
import { site } from '@/data/site';

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${site.handle} ~ ${site.role}`,
  description:
    'Portfolio / homelab de la carrera de Mau — QA Automation Developer en Epicor. Grafo navegable de experiencia, proyectos y skills.',
};

export const viewport: Viewport = {
  themeColor: '#171614',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={mono.variable}>
      <body>
        <a className="skip-link" href="#main">
          [ saltar al contenido ]
        </a>
        <Boot>{children}</Boot>
        <StatusWidget />
        <CustomCursor />
      </body>
    </html>
  );
}
