import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "ЛЕСНА ДИПЛОМНА • УКТЦ Правец 2026",
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
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
