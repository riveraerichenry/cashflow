import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CashFlow | Business Cash Monitoring",
  description: "Business cash-in and cash-out monitoring system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}