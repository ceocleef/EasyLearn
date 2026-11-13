"use client";

import Link from "next/link";
import { Logo, LangSwitch } from "@/components/Landing";

// Шапка внутренних страниц (Студія, Інструкція)
export default function PageHeader({
  section,
  link,
}: {
  section: string;
  link: { href: string; label: string };
}) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="hidden text-muted sm:inline">/ {section}</span>
        </div>
        <div className="flex items-center gap-3">
          <LangSwitch />
          <Link href={link.href} className="text-sm text-muted transition hover:text-fg">
            {link.label}
          </Link>
        </div>
      </div>
    </header>
  );
}
