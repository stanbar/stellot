import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stellot† — Threshold E-Voting on Soroban",
  description:
    "A cryptographically real proof-of-concept of the Stellot† e-voting protocol built on Stellar Soroban.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
