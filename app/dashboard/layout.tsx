import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center bg-background">
      <div className="flex-1 w-full flex flex-col gap-12 items-center">
        <nav className="w-full flex justify-center border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-40 h-16">
          <div className="w-full max-w-7xl flex justify-between items-center px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex gap-6 items-center">
              <Link href={"/"} className="text-xl font-bold hover:opacity-80 transition-opacity">Pillr.</Link>
            </div>
            <div className="flex gap-4 sm:gap-6 items-center">
              <Link href={"/dashboard"} className="text-sm font-medium hover:text-primary transition-colors hidden sm:inline-block">Dashboard</Link>
              <Link href={"/contact"} className="text-sm font-medium hover:text-primary transition-colors hidden sm:inline-block">Contact Us</Link>
              {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
          {children}
        </div>

        <footer className="w-full flex flex-col sm:flex-row items-center justify-center border-t border-border/50 bg-muted/30 py-8 gap-4 text-xs">
          <p className="text-muted-foreground">
            <a
              href="https://support-pillr.vercel.app"
              target="_blank"
              className="font-semibold hover:text-foreground transition-colors"
              rel="noreferrer"
            >
              Pillr.
            </a>
            {" 2025"}
          </p>
          <Link href="/dashboard/sms-preferences" className="text-muted-foreground hover:text-foreground transition-colors">
            SMS Preferences
          </Link>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
