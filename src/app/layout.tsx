import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TCG Tracker | Ultimate Collector's Vault",
  description: "Track Pokémon, Magic: The Gathering, and One Piece cards in a luxurious digital vault.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-vault-900 text-foreground min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-grow pt-[88px]">
          {children}
        </main>
      </body>
    </html>
  );
}
