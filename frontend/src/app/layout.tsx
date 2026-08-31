import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "30-Day Consulting Offer Bootcamp",
  description: "Package your expertise into a consulting offer that lands real clients in 30 days.",
  icons: {
    icon: "/enylogo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
