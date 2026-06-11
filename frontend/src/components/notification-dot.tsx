export function NotificationDot({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background animate-pulse ${className}`}
      aria-label="New notification"
    />
  );
}

export function NotificationCount({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-green-500 text-white text-xs font-semibold ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
