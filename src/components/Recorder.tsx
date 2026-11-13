"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/LanguageProvider";

type Phase = "off" | "starting" | "ready" | "countdown" | "recording";
type RecError = "denied" | "noCamera" | "busy" | "unsupported" | "failed";

// Форматы записи по порядку предпочтения.
// MP4 берём только с H.264: другие кодеки внутри MP4 некоторые браузеры записывают так,
// что потом сами не могут их прочитать при экспорте. Иначе — WebM.
const MIME_TYPES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

function pickMimeType() {
  return MIME_TYPES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

function errorCode(e: unknown): RecError {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "noCamera";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  return "failed";
}

// recording-2026-11-13-1745.webm
function fileName(ext: string) {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `recording-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.${ext}`;
}

function formatClock(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export default function Recorder({ onRecorded }: { onRecorded: (f: File) => void }) {
  const { t } = useT();
  const tr = t.studio.rec;

  const [phase, setPhase] = useState<Phase>("off");
  const [error, setError] = useState<RecError | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [micId, setMicId] = useState("");
  const [withSound, setWithSound] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);

  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timersRef = useRef<number[]>([]);

  // Показываем картинку с камеры в окне предпросмотра
  useEffect(() => {
    if (previewRef.current) previewRef.current.srcObject = stream;
  }, [stream]);

  // При уходе со страницы выключаем камеру и останавливаем запись
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.ondataavailable = null;
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setStream(null);
  }

  function clearTimers() {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }

  async function startCamera(opts?: { cameraId?: string; micId?: string; withSound?: boolean }) {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("unsupported");
      return;
    }
    const cam = opts?.cameraId ?? cameraId;
    const mic = opts?.micId ?? micId;
    const sound = opts?.withSound ?? withSound;

    stopStream();
    setError(null);
    setPhase("starting");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...(cam ? { deviceId: { exact: cam } } : {}),
        },
        audio: sound ? (mic ? { deviceId: { exact: mic } } : true) : false,
      });
      streamRef.current = s;
      setStream(s);

      // После разрешения браузер показывает названия устройств
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter((d) => d.kind === "videoinput"));
      setMics(devices.filter((d) => d.kind === "audioinput"));
      setCameraId(s.getVideoTracks()[0]?.getSettings().deviceId ?? cam);
      setMicId(s.getAudioTracks()[0]?.getSettings().deviceId ?? mic);
      setPhase("ready");
    } catch (e) {
      console.error(e);
      setError(errorCode(e));
      setPhase("off");
    }
  }

  // Обратный отсчёт 3-2-1, чтобы успеть подготовиться
  function startCountdown() {
    clearTimers();
    setPhase("countdown");
    setCountdown(3);
    timersRef.current = [
      window.setTimeout(() => setCountdown(2), 1000),
      window.setTimeout(() => setCountdown(1), 2000),
      window.setTimeout(startRecording, 3000),
    ];
  }

  function startRecording() {
    const s = streamRef.current;
    if (!s) return;
    const mimeType = pickMimeType();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(s, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 5_000_000 });
    } catch (e) {
      console.error(e);
      setError("failed");
      setPhase("ready");
      return;
    }
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => {
      clearTimers();
      const type = (rec.mimeType || mimeType || "video/webm").split(";")[0];
      const blob = new Blob(chunks, { type });
      stopStream();
      setPhase("off");
      if (blob.size === 0) {
        setError("failed");
        return;
      }
      const ext = type.includes("mp4") ? "mp4" : "webm";
      onRecorded(new File([blob], fileName(ext), { type }));
    };
    recorderRef.current = rec;
    rec.start(1000);
    setElapsed(0);
    setPhase("recording");

    const startedAt = Date.now();
    const tick = () => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      timersRef.current.push(window.setTimeout(tick, 250));
    };
    tick();
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function cancelCountdown() {
    clearTimers();
    setPhase("ready");
  }

  const selectCls =
    "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-fg disabled:opacity-50";
  const live = phase === "ready" || phase === "countdown" || phase === "recording";

  return (
    <div className="mt-6 rounded-2xl border border-line bg-card p-5">
      <p className="text-sm text-muted">{tr.intro}</p>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
          {tr[error]}
        </div>
      )}

      {/* Окно предпросмотра */}
      <div className="relative mt-4 overflow-hidden rounded-xl border border-line bg-black">
        <video
          ref={previewRef}
          autoPlay
          muted
          playsInline
          className={`aspect-video w-full -scale-x-100 object-cover ${live ? "" : "invisible"}`}
        />
        {!live && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => startCamera()}
              disabled={phase === "starting"}
              className="rounded-xl bg-accent px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {phase === "starting" ? tr.enabling : tr.enable}
            </button>
          </div>
        )}
        {phase === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-7xl font-bold text-white" aria-live="assertive">
              {countdown}
            </span>
          </div>
        )}
        {phase === "recording" && (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-sm font-semibold text-white">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            {tr.recording} · <span className="font-mono">{formatClock(elapsed)}</span>
          </div>
        )}
      </div>

      {live && (
        <>
          <p className="mt-2 text-xs text-muted">{tr.mirrorHint}</p>

          {/* Выбор устройств */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-muted">{tr.camera}</span>
              <select
                className={`mt-1 ${selectCls}`}
                value={cameraId}
                disabled={phase !== "ready"}
                onChange={(e) => {
                  setCameraId(e.target.value);
                  void startCamera({ cameraId: e.target.value });
                }}
              >
                {cameras.map((c, i) => (
                  <option key={c.deviceId || i} value={c.deviceId}>
                    {c.label || `${tr.camera} ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted">{tr.mic}</span>
              <select
                className={`mt-1 ${selectCls}`}
                value={micId}
                disabled={phase !== "ready" || !withSound}
                onChange={(e) => {
                  setMicId(e.target.value);
                  void startCamera({ micId: e.target.value });
                }}
              >
                {mics.map((m, i) => (
                  <option key={m.deviceId || i} value={m.deviceId}>
                    {m.label || `${tr.mic} ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent"
              checked={withSound}
              disabled={phase !== "ready"}
              onChange={(e) => {
                setWithSound(e.target.checked);
                void startCamera({ withSound: e.target.checked });
              }}
            />
            {tr.withSound}
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            {phase === "ready" && (
              <button
                onClick={startCountdown}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-white transition hover:brightness-110"
              >
                <span className="h-3 w-3 rounded-full bg-red-500" />
                {tr.start}
              </button>
            )}
            {phase === "countdown" && (
              <button
                onClick={cancelCountdown}
                className="rounded-xl border border-line px-5 py-3 font-semibold transition hover:bg-line"
              >
                {tr.cancel}
              </button>
            )}
            {phase === "recording" && (
              <button
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:brightness-110"
              >
                <span className="h-3 w-3 rounded-sm bg-white" />
                {tr.stop}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
