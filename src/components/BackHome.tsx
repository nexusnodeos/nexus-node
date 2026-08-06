"use client";

import Link from "next/link";

export default function BackHome({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[#241A14] ${className}`}
      style={{ color: "#75604F", fontFamily: "var(--font-sans)" }}
    >
      <span aria-hidden>←</span> Nexus Node
    </Link>
  );
}
