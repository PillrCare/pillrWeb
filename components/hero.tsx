import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <h1 className="sr-only">Pillr solves medical adherence protection and information</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
        {/* Text content - order-2 on mobile, order-1 on desktop */}
        <div className="flex flex-col gap-6 lg:order-1 order-2">
          <h2 className="text-3xl lg:text-5xl !leading-tight font-bold">
            Stop wondering. Know they took it.
          </h2>
          <p className="text-lg text-muted-foreground">
            Smart pill dispenser with biometric security and precision weight sensors.
            Real-time verification for peace of mind.
          </p>
          <div className="flex gap-4 items-center flex-wrap">
            <Button size="lg" asChild>
              <Link href="/contact">Get Started</Link>
            </Button>
            <Badge variant="outline" className="inline-flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Verified Adherence
            </Badge>
          </div>
        </div>

        {/* Product placeholder - order-1 on mobile, order-2 on desktop */}
        <div className="lg:order-2 order-1">
          <div className="relative aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-accent/40 border border-foreground/10 flex items-center justify-center">
            <p className="text-muted-foreground">Product Rendering</p>
          </div>
        </div>
      </div>

      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
    </div>
  );
}
