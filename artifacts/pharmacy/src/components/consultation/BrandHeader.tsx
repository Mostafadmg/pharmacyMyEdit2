import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandHeaderProps {
  showLogo?: boolean;
  className?: string;
}

export function BrandHeader({ showLogo = true, className }: BrandHeaderProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 py-6", className)}>
      {showLogo && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Leaf className="h-5 w-5" />
        </div>
      )}
      <h1 className="font-serif text-2xl font-semibold text-primary tracking-tight">
        PharmaCare
      </h1>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Everyday care. Expertly delivered.
      </p>
    </div>
  );
}

export default BrandHeader;
