"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EyHeader } from "@/components/EyHeader";

export default function Home() {
  const [name, setName] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    router.push(`/chat?client=${encodeURIComponent(trimmed)}`);
  }

  function handleSkip() {
    router.push("/chat");
  }

  return (
    <div className="flex min-h-screen flex-col bg-ey-grey-100 text-ey-black">
      <EyHeader subtitle="Fin OS · AP Diagnostic" />

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <form
          onSubmit={handleSubmit}
          className="animate-message-in w-full max-w-md rounded-2xl border border-ey-grey-200 bg-white p-8 shadow-sm"
        >
          <h1 className="mb-1 font-[var(--font-display)] text-xl font-extrabold text-ey-black">
            Before we start
          </h1>
          <p className="mb-6 text-sm text-ey-grey-700">
            Who is this Accounts Payable diagnostic for?
          </p>

          <label htmlFor="clientName" className="mb-2 block text-sm font-semibold text-ey-black">
            Client or organisation name
          </label>
          <input
            id="clientName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Northwind Industrial Supplies"
            autoFocus
            className="mb-6 w-full rounded-lg border border-ey-grey-200 px-4 py-3 text-[15px] text-ey-black outline-none placeholder:text-ey-grey-400 focus:border-ey-black focus:ring-2 focus:ring-ey-yellow"
          />

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-full bg-ey-yellow px-6 py-3 text-sm font-bold text-ey-black transition-all hover:enabled:opacity-90 active:enabled:scale-[0.98] disabled:opacity-40"
          >
            Continue to interview
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="mt-3 w-full text-center text-sm font-medium text-ey-grey-700 underline decoration-ey-grey-400 underline-offset-2 transition-colors hover:text-ey-black"
          >
            Continue without a client name
          </button>
        </form>
      </main>
    </div>
  );
}
