'use client'

import "./globals.css";
import Link from "next/link";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@300..700&display=swap" rel="stylesheet" />
        <title>Gale UI</title>
      </head>
      <body className="antialiased font-sans">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#1e3a5f] text-white z-50 flex items-center px-6 shadow-md">
          <h1 className="text-xl font-semibold">Gale</h1>
        </header>

        {/* Left Navigation Pane */}
        <aside className="fixed text-base top-16 left-0 bottom-0 w-64 bg-[#2a2a2a] text-gray-200 z-40 overflow-y-auto">
          <nav className="p-4">
            <ul className="space-y-1">
              <li>
                <Link href="/agents" className="block px-2 py-2 space-x-2 rounded-lg hover:bg-[#3a3a3a] transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="inline-block mr-2" xmlns="http://www.w3.org/2000/svg">
                    <g fill="currentColor">
                      <path d="M17.7530511,13.999921 C18.9956918,13.999921 20.0030511,15.0072804 20.0030511,16.249921 L20.0030511,17.1550008 C20.0030511,18.2486786 19.5255957,19.2878579 18.6957793,20.0002733 C17.1303315,21.344244 14.8899962,22.0010712 12,22.0010712 C9.11050247,22.0010712 6.87168436,21.3444691 5.30881727,20.0007885 C4.48019625,19.2883988 4.00354153,18.2500002 4.00354153,17.1572408 L4.00354153,16.249921 C4.00354153,15.0072804 5.01090084,13.999921 6.25354153,13.999921 L17.7530511,13.999921 Z M11.8985607,2.00734093 L12.0003312,2.00049432 C12.380027,2.00049432 12.6938222,2.2826482 12.7434846,2.64872376 L12.7503312,2.75049432 L12.7495415,3.49949432 L16.25,3.5 C17.4926407,3.5 18.5,4.50735931 18.5,5.75 L18.5,10.254591 C18.5,11.4972317 17.4926407,12.504591 16.25,12.504591 L7.75,12.504591 C6.50735931,12.504591 5.5,11.4972317 5.5,10.254591 L5.5,5.75 C5.5,4.50735931 6.50735931,3.5 7.75,3.5 L11.2495415,3.49949432 L11.2503312,2.75049432 C11.2503312,2.37079855 11.5324851,2.05700336 11.8985607,2.00734093 L12.0003312,2.00049432 L11.8985607,2.00734093 Z M9.74928905,6.5 C9.05932576,6.5 8.5,7.05932576 8.5,7.74928905 C8.5,8.43925235 9.05932576,8.99857811 9.74928905,8.99857811 C10.4392523,8.99857811 10.9985781,8.43925235 10.9985781,7.74928905 C10.9985781,7.05932576 10.4392523,6.5 9.74928905,6.5 Z M14.2420255,6.5 C13.5520622,6.5 12.9927364,7.05932576 12.9927364,7.74928905 C12.9927364,8.43925235 13.5520622,8.99857811 14.2420255,8.99857811 C14.9319888,8.99857811 15.4913145,8.43925235 15.4913145,7.74928905 C15.4913145,7.05932576 14.9319888,6.5 14.2420255,6.5 Z" />
                    </g>
                  </svg>
                  <span>Agents</span>
                </Link>
              </li>
              <li>
                <Link href="/executions" className="block px-2 py-2 space-x-2 rounded-lg hover:bg-[#3a3a3a] transition-colors" >
                  <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block mr-2" xmlns="http://www.w3.org/2000/svg">
                    <g>
                      <rect width="48" height="48" fill="none" />
                      <path fill="currentColor" d="M44,9a7,7,0,1,0-9,6.7V16a6,6,0,0,1-6,6H21a10.3,10.3,0,0,0-6,2V15.7a7,7,0,1,0-4,0V32.3a7,7,0,1,0,4,0V32a6,6,0,0,1,6-6h8A10,10,0,0,0,39,16v-.3A7,7,0,0,0,44,9Z" />
                    </g>
                  </svg>
                  <span>Executions</span>
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
