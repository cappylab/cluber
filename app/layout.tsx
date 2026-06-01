import "./globals.css";
import { DM_Sans, Nunito } from "next/font/google";

export const metadata = { title: "Cluber", description: "동호회 관리 프로그램" };

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["700", "800", "900"],
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${dmSans.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
