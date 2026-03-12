import "./globals.css";

import type { ReactNode } from "react";

export const metadata = {
  title: "Super Admin | Salon White Label",
  description: "Pannello super admin centrale per la piattaforma SaaS white-label."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
