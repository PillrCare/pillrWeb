import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Fingerprint, Activity, Smartphone } from "lucide-react";

const features = [
  {
    icon: <Fingerprint className="h-6 w-6" />,
    title: "Biometric Security",
    description: "Integrated fingerprint scanner ensures only the right person accesses the medication at the right time."
  },
  {
    icon: <Activity className="h-6 w-6" />,
    title: "Weight-Based Verification",
    description: "High-precision load cells detect when a pill is actually removed, preventing false confirmations."
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: "Real-Time Alerts",
    description: "Instant notifications sent to your phone via our app. If a dose is missed, you'll be the first to know."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Pillr.</Link>
              
            </div>
            <div className="flex gap-5 items-center">
              <Link href={"/dashboard"} className="font-semibold">Dashboard</Link>
              <Link href={"/contact"} className="font-semibold">Contact Us</Link>
              {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <Hero />

          {/* Trust Section */}
          <section className="text-center max-w-3xl mx-auto py-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Built for Reliability
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple for them. Certainty for you.
            </p>
          </section>

          {/* Features Grid Section */}
          <section className="py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-start gap-4 p-6 rounded-lg border border-foreground/10 bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="h-12 w-12 rounded-md bg-primary/10 text-primary grid place-items-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Waitlist CTA Section */}
          <section className="text-center max-w-2xl mx-auto py-20">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to bring Pillr home?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join our waitlist for early access and launch pricing.
            </p>
            <Button size="lg" asChild>
              <Link href="/contact">Get in Touch</Link>
            </Button>
          </section>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Pillr.
            </a>
            2025{" "}
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
