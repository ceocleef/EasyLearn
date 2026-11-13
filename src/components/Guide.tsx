"use client";

import Link from "next/link";
import { useT, useDocumentTitle } from "@/i18n/LanguageProvider";
import PageHeader from "@/components/PageHeader";

const card = "rounded-2xl border border-line bg-card";

export default function Guide() {
  const { t } = useT();
  const g = t.guide;
  useDocumentTitle(g.metaTitle);

  const toc = [
    ...g.parts.map((p) => ({ id: p.id, title: p.title })),
    { id: "important", title: g.importantTitle },
    { id: "trouble", title: g.troubleTitle },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader section={t.nav.guide} link={{ href: "/studio", label: g.openStudio }} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        {/* Заголовок */}
        <span className="inline-block rounded-full border border-line bg-card px-3 py-1 text-sm text-accent-light">
          {g.badge}
        </span>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{g.title}</h1>
        <p className="mt-4 text-lg text-muted">{g.intro}</p>

        {/* Содержание */}
        <nav aria-label={g.contents} className={`${card} mt-8 p-5`}>
          <p className="text-sm font-semibold text-muted">{g.contents}</p>
          <ol className="mt-3 space-y-2">
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-fg transition hover:text-accent-light">
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Части с шагами */}
        {g.parts.map((part) => (
          <section key={part.id} id={part.id} className="mt-14 scroll-mt-6">
            <h2 className="text-2xl font-bold tracking-tight">{part.title}</h2>
            <ol className="mt-6 space-y-4">
              {part.steps.map((step, i) => (
                <li key={step.title} className={`${card} flex gap-4 p-5`}>
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
                    aria-label={`${g.stepLabel} ${i + 1}`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1.5 text-muted">{step.text}</p>
                    {"tip" in step && step.tip && (
                      <p className="mt-3 rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm">
                        <span aria-hidden>💡 </span>
                        {step.tip}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {/* Важно знать */}
        <section id="important" className="mt-14 scroll-mt-6">
          <h2 className="text-2xl font-bold tracking-tight">{g.importantTitle}</h2>
          <div className="mt-6 space-y-4">
            {g.important.map((item) => (
              <div key={item.title} className={`${card} p-5`}>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Если не работает */}
        <section id="trouble" className="mt-14 scroll-mt-6">
          <h2 className="text-2xl font-bold tracking-tight">{g.troubleTitle}</h2>
          <div className="mt-6 space-y-3">
            {g.trouble.map((item) => (
              <details key={item.q} className={`${card} group p-5`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {item.q}
                  <span className="text-xl text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">{g.note}</p>
        </section>

        {/* Призыв */}
        <section className="mt-14 rounded-2xl border border-accent/40 bg-accent/10 p-6 text-center">
          <h2 className="text-xl font-bold">{g.ctaTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">{g.ctaText}</p>
          <Link
            href="/studio"
            className="mt-5 inline-flex rounded-xl bg-accent px-5 py-3 font-semibold text-white transition hover:brightness-110"
          >
            {g.openStudio}
          </Link>
        </section>
      </main>
    </div>
  );
}
