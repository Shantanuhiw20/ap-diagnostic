import type { ReactNode } from "react";

export function EyHeader({ subtitle, children }: { subtitle: string; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 overflow-hidden bg-ey-black">
      <div
        className="animate-beam-sweep absolute inset-y-0 right-[-10%] w-2/3 bg-ey-yellow"
        style={{ clipPath: "polygon(35% 0, 100% 0, 65% 100%, 0 100%)" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-6">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-[var(--font-display)] font-black tracking-tight text-ey-white">EY</span>
          <span className="text-sm font-[var(--font-display)] font-bold uppercase tracking-[0.2em] text-ey-grey-200">
            {subtitle}
          </span>
        </div>
        {children}
      </div>
    </header>
  );
}
