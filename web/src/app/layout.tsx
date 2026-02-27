import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Required for @cloudflare/next-on-pages: all server components must use the Edge runtime
export const runtime = "edge";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

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

// Derive stellar.expert network name from the network passphrase env var
function explorerNetwork(): string {
  const passphrase = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? "";
  return passphrase.includes("Test") ? "testnet" : "public";
}

function contractExplorerUrl(): string | null {
  const id = process.env.NEXT_PUBLIC_CONTRACT_ID;
  if (!id) return null;
  return `https://stellar.expert/explorer/${explorerNetwork()}/contract/${id}`;
}

// Injected before first paint to avoid flash of wrong theme
const themeScript = `(function(){try{var s=localStorage.getItem('stellot-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',s||d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <footer>
          <a href="https://github.com/stanbar/stellot" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.mdpi.com/2076-3417/10/21/7606/pdf" target="_blank" rel="noopener noreferrer">Whitepaper</a>
          {contractExplorerUrl() && (
            <a href={contractExplorerUrl()!} target="_blank" rel="noopener noreferrer">Smart Contract</a>
          )}
        </footer>
      </body>
    </html>
  );
}
