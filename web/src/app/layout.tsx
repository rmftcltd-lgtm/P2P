import type { Metadata } from "next";
import { Bricolage_Grotesque, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lonelyseat Delivery — Peer-to-peer delivery for Aotearoa",
  description:
    "Match your stuff with Kiwis already heading that way. Cheaper than freight, greener on Aotearoa’s roads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${bricolage.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
