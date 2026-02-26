import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Required for @cloudflare/next-on-pages: all server components must use the Edge runtime
export const runtime = "edge";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stellot† — Threshold E-Voting on Soroban",
  description:
    "A cryptographically real proof-of-concept of the Stellot† e-voting protocol: threshold ElGamal, Feldman VSS DKG, Shamir secret sharing, and Ed25519 nullifiers on Stellar Soroban.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={mono.variable}>
      <body>{children}</body>
    </html>
  );
}
