import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
// @ts-ignore: Next.js processes this global stylesheet import at build time.
import "./globals.css";
import { Providers } from "./providers";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
});

const title = "Panel de clientes | VendeYaOnline";
const description = "Gestiona tus productos, pedidos y ventas desde un solo lugar con el panel de clientes de VendeYaOnline.";

export const metadata: Metadata = {
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL) }
    : {}),
  title: { default: title, template: "%s | VendeYaOnline" },
  description,
  applicationName: "VendeYaOnline",
  authors: [{ name: "VendeYaOnline" }],
  creator: "VendeYaOnline",
  publisher: "VendeYaOnline",
  openGraph: {
    type: "website", locale: "es_CO", siteName: "VendeYaOnline", title, description,
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${googleSans.variable} bg-background antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
