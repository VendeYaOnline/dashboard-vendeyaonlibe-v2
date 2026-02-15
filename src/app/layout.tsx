import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VendeYaOnline - Panel de Clientes",
  description: "Panel de Clientes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${googleSans.variable} antialiased`}>
        {children}

        <Toaster />
      </body>
    </html>
  );
}
