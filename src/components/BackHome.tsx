"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackHome({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Regresar a la página anterior"
        className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-[#FBF6F0]"
        style={{ borderColor: "#E9DFD2", color: "#75604F" }}
      >
        <ArrowLeft size={18} strokeWidth={2} />
      </button>

      <div
        className="inline-flex items-center gap-2 text-sm font-medium"
        style={{ color: "#75604F", fontFamily: "var(--font-sans)" }}
      >
        <Image src="/logo.png" alt="" width={24} height={24} className="rounded-full" />
        Nexus Node
      </div>
    </div>
  );
}
