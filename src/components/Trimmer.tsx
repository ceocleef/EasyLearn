"use client";

import { useEffect, useState, type RefObject } from "react";
import { useT } from "@/i18n/LanguageProvider";

export type Trim = { start: number; end: number };

const MIN_GAP = 0.5; // минимальная длина фрагмента, секунд
const STEP = 0.1;

// 75.43 → "1:15.4"
export function formatPrecise(sec: number) {
  const tenths = Math.round(sec * 10);
  const m = Math.floor(tenths / 600);
  const s = Math.floor((tenths % 600) / 10);
  return `${m}:${String(s).padStart(2, "0")}.${tenths % 10}`;
}

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  duration: number;
  trim: Trim;
  onChange: (t: Trim) => void;
};

export default function Trimmer({ videoRef, duration, trim, onChange }: Props) {
  const { t } = useT();
  const tt = t.studio.trim;
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);

  // Плеер играет только внутри выбранного фрагмента
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let raf = 0;
    const tick = () => {
      setCurrent(v.currentTime);
      if (!v.paused && v.currentTime >= trim.end) {
        v.pause();
        v.currentTime = trim.start;
      }
      if (!v.paused) raf = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      if (v.currentTime < trim.start || v.currentTime >= trim.end - 0.05) {
        v.currentTime = trim.start;
      }
      setPlaying(true);
      raf = requestAnimationFrame(tick);
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(raf);
    };
    const onSeeked = () => setCurrent(v.currentTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("seeked", onSeeked);
    if (!v.paused) raf = requestAnimationFrame(tick);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("seeked", onSeeked);
      cancelAnimationFrame(raf);
    };
  }, [videoRef, trim.start, trim.end]);

  // Показываем в плеере кадр, на который указывает ползунок
  function seek(time: number) {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = time;
  }

  function setStart(value: number) {
    const start = Math.max(0, Math.min(value, trim.end - MIN_GAP));
    onChange({ ...trim, start });
    seek(start);
  }
  function setEnd(value: number) {
    const end = Math.min(duration, Math.max(value, trim.start + MIN_GAP));
    onChange({ ...trim, end });
    seek(end);
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.currentTime = trim.start;
      void v.play();
    } else {
      v.pause();
    }
  }

  const pct = (x: number) => `${(x / duration) * 100}%`;
  const isFull = trim.start === 0 && trim.end === duration;

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">{tt.title}</h2>
        <p className="text-sm text-muted">{tt.hint}</p>
      </div>

      {/* Шкала с двумя ползунками */}
      <div className="relative mt-5 h-10 select-none">
        <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: pct(trim.start), width: pct(trim.end - trim.start) }}
        />
        {/* Текущая позиция плеера */}
        <div
          aria-hidden
          className="absolute top-1 bottom-1 w-0.5 -translate-x-1/2 rounded bg-fg"
          style={{ left: pct(Math.min(current, duration)) }}
        />
        <input
          type="range"
          className="trim-range"
          aria-label={tt.start}
          style={{ zIndex: trim.start > duration / 2 ? 2 : 1 }}
          min={0}
          max={duration}
          step={STEP}
          value={trim.start}
          onChange={(e) => setStart(Number(e.target.value))}
        />
        <input
          type="range"
          className="trim-range"
          aria-label={tt.end}
          min={0}
          max={duration}
          step={STEP}
          value={trim.end}
          onChange={(e) => setEnd(Number(e.target.value))}
        />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-muted">{tt.start}</dt>
          <dd className="mt-1 font-mono">{formatPrecise(trim.start)}</dd>
        </div>
        <div className="text-center">
          <dt className="text-muted">{tt.length}</dt>
          <dd className="mt-1 font-mono text-accent-light">{formatPrecise(trim.end - trim.start)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-muted">{tt.end}</dt>
          <dd className="mt-1 font-mono">{formatPrecise(trim.end)}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={togglePlay}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          {playing ? tt.pause : `▶ ${tt.play}`}
        </button>
        <button
          onClick={() => setStart(videoRef.current?.currentTime ?? 0)}
          className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold transition hover:bg-line"
        >
          [ {tt.setStart}
        </button>
        <button
          onClick={() => setEnd(videoRef.current?.currentTime ?? duration)}
          className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold transition hover:bg-line"
        >
          {tt.setEnd} ]
        </button>
        <button
          onClick={() => {
            onChange({ start: 0, end: duration });
            seek(0);
          }}
          disabled={isFull}
          className="rounded-xl px-4 py-2.5 text-sm text-muted transition hover:text-fg disabled:opacity-40 disabled:hover:text-muted"
        >
          {tt.reset}
        </button>
      </div>
      <p className="mt-3 text-xs text-muted">{tt.setHint}</p>
    </div>
  );
}
