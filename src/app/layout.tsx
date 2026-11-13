import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import "./globals.css";

// Fonts recommended for analytics dashboards by the ui-ux-pro-max skill.
// next/font downloads them at build time and serves them from our own site,
// so there's no request to Google from the visitor's browser and no layout jump.
const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Monospace font, used only for code-like text such as page paths ("/contact").
const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rootcode Dashboard",
  description: "Internal sales and marketing dashboard for Rootcode",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${firaSans.variable} ${firaCode.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
