import { cn } from "@/lib/cn";

/**
 * Content-shaped loading placeholder. Compose several to mirror the real
 * layout (rows, cards) instead of using a spinner.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
