"use client";

import { useState } from "react";
import Link from "next/link";
import { useT, useDocumentTitle, type Lang } from "@/i18n/LanguageProvider";

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";
const card = "rounded-2xl border border-line bg-card";
const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light";
const btnGhost =
  "inline-flex items-center justify-center rounded-xl border border-line px-5 py-3 font-semibold text-fg transition hover:bg-card";

/* ---------- Иконки (простые SVG) ---------- */
function Icon({ name }: { name: string }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "play":
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M10 9l5 3-5 3z" />
        </svg>
      );
    case "frame":
      return (
        <svg {...p}>
          <path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "mic":
      return (
        <svg {...p}>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0014 0M12 18v3" />
        </svg>
      );
    case "camera":
      return (
        <svg {...p}>
          <rect x="3" y="6" width="13" height="12" rx="2" />
          <path d="M16 10l5-3v10l-5-3" />
        </svg>
      );
    case "scissors":
      return (
        <svg {...p}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M8.1 8.1L20 20M8.1 15.9L20 4" />
        </svg>
      );
    case "lock":
      return (
        <svg {...p}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 018 0v4" />
        </svg>
      );
    case "check":
      return (
        <svg {...p} width={18} height={18}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      );
    case "info":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      );
    default:
      return null;
  }
}

/* ---------- Главный компонент ---------- */
export default function Landing() {
  const { t } = useT();
  useDocumentTitle(t.meta.title);
  // Сообщение-заглушка для кнопок, которые пока не работают
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <>
      <Header onStub={() => setNotice(t.stub.login)} />
      <main>
        <Hero />
        <Scenarios />
        <Features />
        <HowItWorks />
        <Pricing onChoose={() => setNotice(t.stub.pay)} />
        <Faq />
      </main>
      <Footer />
      {notice && <Notice text={notice} onClose={() => setNotice(null)} />}
    </>
  );
}

/* ---------- Шапка ---------- */
export function Logo() {
  return (
    <Link href="/" className="text-xl font-bold tracking-tight">
      Easy<span className="text-accent-light">Learn</span>
    </Link>
  );
}

export function LangSwitch() {
  const { lang, setLang } = useT();
  const langs: { id: Lang; label: string }[] = [
    { id: "uk", label: "UA" },
    { id: "ru", label: "RU" },
  ];
  return (
    <div className="flex rounded-xl border border-line p-0.5 text-sm">
      {langs.map((l) => (
        <button
          key={l.id}
          onClick={() => setLang(l.id)}
          aria-pressed={lang === l.id}
          className={`rounded-[10px] px-2.5 py-1 font-medium transition ${
            lang === l.id ? "bg-card text-fg" : "text-muted hover:text-fg"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function Header({ onStub }: { onStub: () => void }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#features", label: t.nav.features },
    { href: "#how", label: t.nav.how },
    { href: "#pricing", label: t.nav.pricing },
    { href: "#faq", label: t.nav.faq },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className={`${container} flex h-16 items-center justify-between gap-4`}>
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-fg">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LangSwitch />
          <button
            onClick={onStub}
            className="hidden rounded-xl border border-line px-4 py-2 text-sm font-semibold transition hover:bg-card sm:inline-flex"
          >
            {t.nav.login}
          </button>
          <button
            onClick={() => setOpen(!open)}
            aria-label={t.nav.menu}
            aria-expanded={open}
            className="rounded-xl border border-line p-2 md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-line md:hidden">
          <div className={`${container} flex flex-col py-3`}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-muted hover:text-fg"
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                onStub();
              }}
              className="mt-2 rounded-xl border border-line px-4 py-2.5 text-left font-semibold sm:hidden"
            >
              {t.nav.login}
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  const { t } = useT();
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-200px] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]"
      />
      <div className={`${container} relative py-20 text-center sm:py-28`}>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-sm text-muted">
          <span className="text-accent-light">
            <Icon name="lock" />
          </span>
          {t.hero.badge}
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          {t.hero.title1}{" "}
          <span className="text-accent-light">{t.hero.title2}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">{t.hero.subtitle}</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/studio" className={`${btnPrimary} w-full sm:w-auto`}>
            {t.hero.cta}
          </Link>
          <a href="#how" className={`${btnGhost} w-full sm:w-auto`}>
            {t.hero.secondary}
          </a>
        </div>
        <p className="mt-5 text-sm text-muted">{t.hero.note}</p>
      </div>
    </section>
  );
}

/* ---------- Сценарии ---------- */
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-muted">{subtitle}</p>}
    </div>
  );
}

function Scenarios() {
  const { t } = useT();
  const icons = ["play", "frame", "mic"];
  return (
    <section className={`${container} py-20`}>
      <SectionTitle title={t.scenarios.title} subtitle={t.scenarios.subtitle} />
      <div className="grid gap-5 md:grid-cols-3">
        {t.scenarios.items.map((s, i) => (
          <div key={s.title} className={`${card} p-6`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent-light">
              <Icon name={icons[i]} />
            </div>
            <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-muted">{s.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-5">
        <span className="mt-0.5 shrink-0 text-accent-light">
          <Icon name="info" />
        </span>
        <p>
          <span className="font-semibold">{t.scenarios.honestTitle}. </span>
          <span className="text-muted">{t.scenarios.honest}</span>
        </p>
      </div>
    </section>
  );
}

/* ---------- Возможности ---------- */
function Features() {
  const { t } = useT();
  const icons = ["camera", "scissors", "lock"];
  return (
    <section id="features" className={`${container} py-20`}>
      <SectionTitle title={t.features.title} />
      <div className="grid gap-5 md:grid-cols-3">
        {t.features.items.map((f, i) => (
          <div key={f.title} className={`${card} p-6`}>
            <div className="text-accent-light">
              <Icon name={icons[i]} />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-muted">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Как это работает ---------- */
function HowItWorks() {
  const { t } = useT();
  return (
    <section id="how" className={`${container} py-20`}>
      <SectionTitle title={t.how.title} />
      <ol className="grid gap-5 md:grid-cols-3">
        {t.how.steps.map((s, i) => (
          <li key={s.title} className={`${card} p-6`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-semibold text-white">
              {i + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------- Тарифы ---------- */
function Pricing({ onChoose }: { onChoose: () => void }) {
  const { t } = useT();
  const popularIndex = 1; // «Місяць»
  return (
    <section id="pricing" className={`${container} py-20`}>
      <SectionTitle title={t.pricing.title} subtitle={t.pricing.subtitle} />
      <div className="grid items-stretch gap-5 md:grid-cols-3">
        {t.pricing.plans.map((plan, i) => {
          const popular = i === popularIndex;
          return (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                popular ? "border-accent bg-card shadow-[0_0_40px_-10px] shadow-accent/50" : "border-line bg-card"
              }`}
            >
              {popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                  {t.pricing.popular}
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-accent-light">{t.pricing.trial}</p>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-muted">
                  {t.pricing.currency} {plan.period}
                </span>
              </div>
              <p className="mt-2 min-h-5 text-sm text-muted">{plan.extra}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {t.pricing.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2.5">
                    <span className="text-accent-light">
                      <Icon name="check" />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
              <button
                onClick={onChoose}
                className={`mt-8 w-full ${popular ? btnPrimary : btnGhost}`}
              >
                {t.pricing.choose}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
function Faq() {
  const { t } = useT();
  return (
    <section id="faq" className={`${container} py-20`}>
      <SectionTitle title={t.faq.title} />
      <div className="mx-auto max-w-3xl space-y-3">
        {t.faq.items.map((item) => (
          <details key={item.q} className={`${card} group p-5`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              {item.q}
              <span className="text-xl text-muted transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ---------- Футер ---------- */
function Footer() {
  const { t } = useT();
  return (
    <footer className="mt-10 border-t border-line">
      <div className={`${container} flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between`}>
        <div>
          <Logo />
          <p className="mt-2 text-sm text-muted">{t.footer.tagline}</p>
        </div>
        <nav className="flex flex-wrap gap-5 text-sm text-muted">
          <a href="#features" className="hover:text-fg">{t.nav.features}</a>
          <a href="#how" className="hover:text-fg">{t.nav.how}</a>
          <a href="#pricing" className="hover:text-fg">{t.nav.pricing}</a>
          <a href="#faq" className="hover:text-fg">{t.nav.faq}</a>
        </nav>
        <p className="text-sm text-muted">
          © 2026 EasyLearn. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}

/* ---------- Всплывающее сообщение-заглушка ---------- */
function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  const { t } = useT();
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between gap-4 rounded-2xl border border-line bg-card p-4 shadow-2xl"
    >
      <p className="text-sm">{text}</p>
      <button onClick={onClose} className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-line hover:text-fg">
        {t.stub.close}
      </button>
    </div>
  );
}
