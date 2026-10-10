import type { Metadata } from "next";
import { Header, Footer } from "@/components/navigation";
import { ToastProvider } from "@/components/ui";
import { getUser } from "@/lib/auth";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "BriefProof — Hire on proof, not promises.",
    template: "%s · BriefProof",
  },
  description:
    "Discover exceptional AI creators, build a considered brief, and move from creative ambition to clear delivery.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <Header email={user?.email || null} />
          <main id="main">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
