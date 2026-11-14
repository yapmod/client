import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Geist } from 'next/font/google';
import { GeistPixelSquare } from 'geist/font/pixel';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const geistPixel = GeistPixelSquare;

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={cn(geist.className, geist.variable, geistPixel.variable)} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
