"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useT } from "@/i18n/LanguageProvider";
import { exportMp4, ExportError, isExportSupported, type ExportJob } from "@/lib/exportMp4";
import type { Trim } from "@/components/Trimmer";

type State =
  | { kind: "idle" }
  | { kind: "working"; progress: number }
  | { kind: "done"; url: string; size: number; name: string }
  | { kind: "canceled" }
  | { kind: "error"; code: "unsupported" | "noVideo" | "failed" };

// "мое видео.mov" → "мое видео_easylearn.mp4"
function outputName(original: string) {
  const base = original.replace(/\.[^.]+$/, "") || "video";
  return `${base}_easylearn.mp4`;
}

export default function Exporter({ file, trim }: { file: File; trim: Trim }) {
  const { t } = useT();
  const te = t.studio.export;
  const [state, setState] = useState<State>({ kind: "idle" });
  const jobRef = useRef<ExportJob | null>(null);

  // Освобождаем память от готового файла, когда он больше не нужен
  const doneUrl = state.kind === "done" ? state.url : null;
  useEffect(() => {
    return () => {
      if (doneUrl) URL.revokeObjectURL(doneUrl);
    };
  }, [doneUrl]);

  // Остановить обработку, если пользователь ушёл со страницы
  useEffect(() => () => jobRef.current?.cancel(), []);

  async function start() {
    if (!isExportSupported()) {
      setState({ kind: "error", code: "unsupported" });
      return;
    }
    setState({ kind: "working", progress: 0 });
    const job = exportMp4(file, trim, (p) => {
      if (jobRef.current === job) setState({ kind: "working", progress: p });
    });
    jobRef.current = job;
    try {
      const blob = await job.result;
      if (jobRef.current !== job) return;
      jobRef.current = null;
      setState({ kind: "done", url: URL.createObjectURL(blob), size: blob.size, name: outputName(file.name) });
    } catch (e) {
      if (jobRef.current !== job) return; // отменено или заменено новым экспортом
      jobRef.current = null;
      console.error(e);
      setState({ kind: "error", code: e instanceof ExportError ? e.code : "failed" });
    }
  }

  function cancel() {
    jobRef.current?.cancel();
    jobRef.current = null;
    setState({ kind: "canceled" });
  }

  const btn =
    "rounded-xl bg-accent px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50";

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="font-semibold">{te.title}</h2>
      <p className="mt-1 text-sm text-muted">{te.hint}</p>

      {state.kind === "working" ? (
        <div className="mt-5" aria-live="polite">
          <div className="flex items-center justify-between text-sm">
            <span>{te.working}</span>
            <span className="font-mono text-accent-light">{Math.round(state.progress * 100)}%</span>
          </div>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(state.progress * 100)}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${state.progress * 100}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={cancel}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold transition hover:bg-line"
            >
              {te.cancel}
            </button>
            <p className="text-xs text-muted">{te.keepOpen}</p>
          </div>
        </div>
      ) : state.kind === "done" ? (
        <div className="mt-5 space-y-4" aria-live="polite">
          <p className="font-semibold text-accent-light">
            ✓ {te.done}{" "}
            <span className="font-normal text-muted">
              {state.name} · {(state.size / 1024 / 1024).toFixed(1)} {t.studio.mb}
            </span>
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={state.url} download={state.name} className={btn}>
              ⬇ {te.download}
            </a>
            <button
              onClick={start}
              className="rounded-xl border border-line px-4 py-3 text-sm font-semibold transition hover:bg-line"
            >
              {te.again}
            </button>
          </div>
          <p className="text-sm text-muted">
            {te.obsTip}{" "}
            <Link href="/guide" target="_blank" className="font-semibold text-accent-light hover:underline">
              {te.guideLink} →
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {state.kind === "error" && (
            <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
              {te[state.code]}
            </p>
          )}
          {state.kind === "canceled" && <p className="text-sm text-muted">{te.canceled}</p>}
          <button onClick={start} className={btn}>
            {te.button}
          </button>
        </div>
      )}
    </div>
  );
}
