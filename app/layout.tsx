import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gale UI",
  description: "Gale User Interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Gale UI app" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
