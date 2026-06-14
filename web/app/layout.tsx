import type { Metadata } from "next";
import { Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const urdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-urdu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HumQadam — Voice-First Civic Assistant",
  description:
    "Call and ask — in Urdu, Punjabi or Pashto — about voting, CNICs and government services, answered from verified official sources.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ur">
      <body className={`${urdu.variable} bg-civic min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
