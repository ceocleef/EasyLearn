"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useT } from "@/i18n/LanguageProvider";
import { Logo, LangSwitch } from "@/components/Landing";
import Trimmer, { type Trim } from "@/components/Trimmer";

type Meta = { duration: number; width: number; height: number };

// Форматирование длительности: 75.4 → "1:15"
function formatTime(sec: number) {
  if (!isFinite(sec)) return "—";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

export default function Studio() {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [trim, setTrim] = useState<Trim | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<"notVideo" | "cantPlay" | null>(null);
  const [dragging, setDragging] = useState(false);

  // Освобождаем память браузера, когда видео меняется или страница закрывается
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  // Открываем файл локально: создаём временную ссылку внутри браузера
  function openFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("notVideo");
      return;
    }
    setError(null);
    setMeta(null);
    setTrim(null);
    setFile(f);
    setUrl(URL.createObjectURL(f));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden text-muted sm:inline">/ {t.studio.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <LangSwitch />
            <Link href="/" className="text-sm text-muted transition hover:text-fg">
              {t.studio.back}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">{t.studio.title}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          <span aria-hidden>🔒</span>
          {t.studio.privacy}
        </p>

        {/* Скрытое поле выбора файла */}
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            openFile(e.target.files?.[0]);
            e.target.value = ""; // чтобы можно было выбрать тот же файл ещё раз
          }}
        />

        {error && (
          <div role="alert" className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
            {t.studio[error]}
          </div>
        )}

        {!url ? (
          /* Зона перетаскивания */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              openFile(e.dataTransfer.files?.[0]);
            }}
            className={`mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition ${
              dragging ? "border-accent bg-accent/10" : "border-line bg-card"
            }`}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-accent-light">
              <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
            </svg>
            <p className="mt-4 text-lg font-semibold">{t.studio.dropTitle}</p>
            <p className="mt-1 text-sm text-muted">{t.studio.dropOr}</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-3 rounded-xl bg-accent px-5 py-3 font-semibold text-white transition hover:brightness-110"
            >
              {t.studio.choose}
            </button>
            <p className="mt-4 text-xs text-muted">{t.studio.formats}</p>
          </div>
        ) : (
          /* Плеер и информация о файле */
          <div className="mt-6 space-y-5">
            <div className="overflow-hidden rounded-2xl border border-line bg-black">
              <video
                key={url}
                ref={videoRef}
                src={url}
                controls
                playsInline
                className="aspect-video w-full"
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  setMeta({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
                  if (isFinite(v.duration) && v.duration > 0) {
                    setTrim({ start: 0, end: v.duration });
                  }
                }}
                onError={() => setError("cantPlay")}
              />
            </div>

            <div className="rounded-2xl border border-line bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">{t.studio.info}</h2>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="rounded-xl border border-line px-4 py-2 text-sm font-semibold transition hover:bg-line"
                >
                  {t.studio.another}
                </button>
              </div>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
                <div className="sm:col-span-4">
                  <dt className="text-muted">{t.studio.name}</dt>
                  <dd className="mt-1 break-all">{file?.name}</dd>
                </div>
                <div>
                  <dt className="text-muted">{t.studio.size}</dt>
                  <dd className="mt-1">
                    {file ? (file.size / 1024 / 1024).toFixed(1) : "—"} {t.studio.mb}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">{t.studio.duration}</dt>
                  <dd className="mt-1">{meta ? formatTime(meta.duration) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted">{t.studio.resolution}</dt>
                  <dd className="mt-1">{meta && meta.width ? `${meta.width}×${meta.height}` : "—"}</dd>
                </div>
              </dl>
            </div>

            {meta && trim && (
              <Trimmer videoRef={videoRef} duration={meta.duration} trim={trim} onChange={setTrim} />
            )}
            {meta && !trim && (
              <p className="rounded-xl border border-line bg-card p-4 text-sm text-muted">
                {t.studio.trim.noDuration}
              </p>
            )}

            <p className="text-sm text-muted">{t.studio.next}</p>
          </div>
        )}
      </main>
    </div>
  );
}
