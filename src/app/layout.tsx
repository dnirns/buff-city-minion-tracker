import type { Metadata } from "next";
import { Tomorrow, Google_Sans_Code } from "next/font/google";
import "./globals.css";

const tomorrow = Tomorrow({
  variable: "--font-tomorrow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const googleSansCode = Google_Sans_Code({
  variable: "--font-google-sans-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blok City Warz - Minion Tracker",
  description: "Automate minion spawning and stat tracking for Blok City Warz",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en">
      <body className={`${tomorrow.variable} ${googleSansCode.variable}`}>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
