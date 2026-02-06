import "./globals.css";

export const metadata = {
  title: "ROSS Tax & Bookkeeping",
  description: "Professional Tax Preparation & Bookkeeping Services",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cream text-navy min-h-screen">{children}</body>
    </html>
  );
}
