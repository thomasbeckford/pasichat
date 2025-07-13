import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_URL || "https://localhost:3000"
  ),
  title: {
    default: "PasiChat - Tu Asistente Inteligente",
    template: "%s | PasiChat",
  },
  description:
    "Asistente inteligente con IA que actúa como tu segundo cerebro. Sube documentos, haz preguntas y obtén respuestas precisas basadas en tu base de conocimiento.",
  keywords: [
    "IA",
    "asistente",
    "chatbot",
    "documentos",
    "RAG",
    "inteligencia artificial",
  ],
  authors: [{ name: "Thomas Beckford" }],
  creator: "Thomas Beckford",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: process.env.NEXT_PUBLIC_URL || "https://localhost:3000",
    title: "PasiChat - Tu Asistente Inteligente",
    description:
      "Asistente inteligente con IA que actúa como tu segundo cerebro",
    siteName: "PasiChat",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PasiChat - Asistente Inteligente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PasiChat - Tu Asistente Inteligente",
    description:
      "Asistente inteligente con IA que actúa como tu segundo cerebro",
    images: ["/og-image.png"],
    creator: "@tebeck",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.className} dark antialiased min-h-screen bg-background`}
      >
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            },
          }}
          closeButton
          richColors
        />
      </body>
    </html>
  );
}
