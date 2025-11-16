'use client'

import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

// export const metadata: Metadata = {
//   title: "Gale UI",
//   description: "Gale User Interface",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Gale UI app" />
        <title>Gale UI</title>
      </head>
      <body className="antialiased">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#1e3a5f] text-white z-50 flex items-center px-6 shadow-md">
          <h1 className="text-xl font-semibold">Gale UI</h1>
        </header>

        {/* Left Navigation Pane */}
        <aside className="fixed top-16 left-0 bottom-0 w-64 bg-[#2a2a2a] text-gray-200 z-40 overflow-y-auto">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/agents" 
                  className="block px-4 py-3 rounded-lg hover:bg-[#3a3a3a] transition-colors"
                >
                  Agents
                </Link>
              </li>
              <li>
                <Link 
                  href="/executions" 
                  className="block px-4 py-3 rounded-lg hover:bg-[#3a3a3a] transition-colors"
                >
                  Executions
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="pt-16 pl-64">
          <div className="p-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
