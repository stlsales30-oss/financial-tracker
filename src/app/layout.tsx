import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import DBProvider from "@/components/DBProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Financial Tracker",
  description: "Track your finances with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <ThemeProvider>
          <DBProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </DBProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
