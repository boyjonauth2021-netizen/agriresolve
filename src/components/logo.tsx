import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function Logo({ className, showName = true, size = "md" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2 text-primary font-bold tracking-tight", className)}>
      <img
        src="/logo.png"
        alt="AgriResolve"
        className={cn(sizeClasses[size], "rounded-lg object-cover shrink-0")}
      />
      {showName && <span>AgriResolve</span>}
    </div>
  );
}
