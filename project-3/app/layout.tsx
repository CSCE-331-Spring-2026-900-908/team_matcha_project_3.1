import type { Metadata } from "next";
import "./globals.css";
import LanguageLayout from "@/components/LanguageLayout";

export const metadata: Metadata = {
  title: "Team Matcha Portal",
  description: "Menu portal for Team Matcha",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LanguageLayout>{children}</LanguageLayout>
      </body>
    </html>
  );
}
