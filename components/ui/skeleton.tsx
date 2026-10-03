import { cn } from "@/lib/utils";

/** Placeholder block with a sweeping shimmer (see .skeleton-shimmer in globals.css). */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md bg-surface-container-high", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
