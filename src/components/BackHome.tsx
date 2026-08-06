"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function BackHome({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Regresar a la página anterior"
        className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-[#FBF6F0]"
        style={{ borderColor: "#E9DFD2", color: "#75604F" }}
      >
        ←
      </button>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#241A14]"
        style={{ color: "#75604F", fontFamily: "var(--font-sans)" }}
      >
        <Image src="/logo.png" alt="" width={24} height={24} className="rounded-full" />
        Nexus Node
      </Link>
    </div>
  );
}
