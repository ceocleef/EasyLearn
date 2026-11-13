// Экспорт фрагмента видео в MP4 прямо в браузере (библиотека Mediabunny).
// Файл никуда не отправляется: читается с диска пользователя и собирается в памяти браузера.

export type ExportErrorCode =
  | "unsupported" // браузер не поддерживает нужные технологии
  | "noVideo" // в файле нет видео, которое можно обработать
  | "failed"; // что-то пошло не так во время обработки

export class ExportError extends Error {
  constructor(public code: ExportErrorCode, message?: string) {
    super(message ?? code);
  }
}

export type ExportJob = {
  /** Готовый MP4 */
  result: Promise<Blob>;
  /** Остановить экспорт */
  cancel: () => void;
};

export function isExportSupported() {
  return typeof window !== "undefined" && "VideoEncoder" in window && "VideoDecoder" in window;
}

export function exportMp4(
  file: File,
  trim: { start: number; end: number },
  onProgress: (fraction: number) => void,
): ExportJob {
  let cancelFn: () => void = () => {};
  let canceled = false;

  const result = (async () => {
    if (!isExportSupported()) throw new ExportError("unsupported");

    // Библиотека загружается только когда пользователь нажал «Експорт»
    const mb = await import("mediabunny");

    const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) throw new ExportError("noVideo");

    // Предпочитаем H.264 + AAC: этот вариант лучше всего понимают OBS и другие программы.
    const format = new mb.Mp4OutputFormat({ fastStart: "in-memory" });
    const videoCodec = await mb.getFirstEncodableVideoCodec(
      ["avc", "hevc", "vp9", "av1"].filter((c) =>
        format.getSupportedVideoCodecs().includes(c as never),
      ) as Parameters<typeof mb.getFirstEncodableVideoCodec>[0],
      { width: videoTrack.displayWidth, height: videoTrack.displayHeight },
    );
    const audioCodec = await mb.getFirstEncodableAudioCodec(
      ["aac", "opus"].filter((c) =>
        format.getSupportedAudioCodecs().includes(c as never),
      ) as Parameters<typeof mb.getFirstEncodableAudioCodec>[0],
    );

    const sourceAudioCodec = (await input.getPrimaryAudioTrack())?.codec ?? null;

    const target = new mb.BufferTarget();
    const output = new mb.Output({ format, target });

    const conversion = await mb.Conversion.init({
      input,
      output,
      trim: { start: trim.start, end: trim.end },
      // Если исходный кодек уже подходит для MP4 (например, H.264 / AAC с телефона) — оставляем его
      video:
        videoTrack.codec === "avc" || !videoCodec ? {} : { codec: videoCodec },
      audio:
        !audioCodec || (sourceAudioCodec && format.getSupportedAudioCodecs().includes(sourceAudioCodec))
          ? {}
          : { codec: audioCodec },
      // Точная обрезка: копируем без перекодирования, только если это не сдвинет границы
      copy: { boundaryTolerance: 0 },
      showWarnings: false,
    });

    const hasVideo = conversion.utilizedTracks.some((t) => t.type === "video");
    if (!conversion.isValid || !hasVideo) {
      throw new ExportError(videoCodec ? "noVideo" : "unsupported");
    }

    cancelFn = () => {
      canceled = true;
      void conversion.cancel();
    };
    if (canceled) cancelFn();

    conversion.onProgress = (p) => onProgress(Math.min(1, Math.max(0, p)));

    try {
      await conversion.execute();
    } catch (e) {
      if (e instanceof mb.ConversionCanceledError) throw e;
      throw new ExportError("failed", e instanceof Error ? e.message : String(e));
    }

    if (!target.buffer) throw new ExportError("failed", "empty output");
    return new Blob([target.buffer], { type: "video/mp4" });
  })();

  return {
    result,
    cancel: () => {
      canceled = true;
      cancelFn();
    },
  };
}
