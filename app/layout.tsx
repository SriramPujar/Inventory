import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventory Management",
  description: "Admin and Worker Inventory System",
};

import { ChatInterface } from "@/components/ChatInterface";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <ChatInterface />
        </Providers>
        <div className="fixed bottom-0 right-0 p-1 text-xs text-gray-400 bg-white/50 pointer-events-none z-50">v1.1</div>
      </body>
    </html>
  );
}
