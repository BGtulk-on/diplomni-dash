import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Дипломни Проекти • УКТЦ Правец 2026",
  description:
    "Професионална платформа за заявяване, техническо съгласуване и разработка на дипломни работи за випускниците на УКТЦ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#090a0f] text-[#f3f5f8] selection:bg-blue-600/30 selection:text-white flex flex-col font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
