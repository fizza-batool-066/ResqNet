import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResQNet — When Every Second Counts.",
  description:
    "ResQNet is an AI-powered multi-agent emergency coordination platform that connects patients with hospitals, ambulances, blood banks and specialists — instantly.",
  keywords: [
    "ResQNet",
    "emergency",
    "AI coordination",
    "hospital",
    "ambulance",
    "blood bank",
    "specialist",
    "telemedicine",
    "Pakistan",
  ],
  authors: [{ name: "ResQNet" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "ResQNet — When Every Second Counts.",
    description:
      "AI-powered multi-agent emergency coordination platform.",
    siteName: "ResQNet",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResQNet — When Every Second Counts.",
    description:
      "AI-powered multi-agent emergency coordination platform.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jakarta.variable} font-sans antialiased bg-white text-slate-900`}
      >
        {children}
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
