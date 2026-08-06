"use client";

import Link from "next/link";
import Image from "next/image";

export default function BackHome({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#241A14] ${className}`}
      style={{ color: "#75604F", fontFamily: "var(--font-sans)" }}
    >
      <Image src="/logo.png" alt="" width={24} height={24} className="rounded-full" />
      Nexus Node
    </Link>
  );
}
