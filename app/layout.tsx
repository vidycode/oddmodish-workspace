import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oddmodish OS",
  description: "Agency operations control system for Oddmodish",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
