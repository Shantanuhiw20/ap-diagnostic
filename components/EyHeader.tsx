import Link from "next/link";
import type { ReactNode } from "react";

export function EyHeader({
  subtitle,
  clientName,
  children,
}: {
  subtitle: string;
  clientName?: string;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-ey-charcoal overflow-hidden bg-ey-black">
      <div
        className="animate-beam-sweep pointer-events-none absolute inset-y-0 right-[-8%] w-1/3 bg-ey-yellow opacity-95 sm:w-2/5"
        style={{ clipPath: "polygon(45% 0, 100% 0, 55% 100%, 0 100%)" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="group flex items-baseline gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ey-yellow"
          >
            <span className="relative inline-flex items-center font-[var(--font-display)] text-2xl font-black tracking-tight text-ey-white">
              EY
              <span
                className="ml-1 inline-block h-2 w-2 bg-ey-yellow transition-transform group-hover:scale-125"
                aria-hidden="true"
              />
            </span>
            <span className="font-[var(--font-display)] text-xs font-extrabold tracking-[0.18em] text-ey-grey-200 uppercase sm:text-sm">
              {subtitle}
            </span>
          </Link>
          {clientName && (
            <span className="hidden items-center gap-1.5 rounded border border-ey-grey-700 bg-ey-charcoal px-2.5 py-1 text-xs font-semibold text-ey-white md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-ey-yellow" aria-hidden="true" />
              {clientName}
            </span>
          )}
        </div>
        {children && <div className="relative z-10 flex items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

