"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import uk, { type Dictionary } from "./uk";
import ru from "./ru";

// Список языков. Украинский — основной (по умолчанию).
export const dictionaries = { uk, ru } as const;
export type Lang = keyof typeof dictionaries;
export const DEFAULT_LANG: Lang = "uk";

// Выбор языка хранится в браузере (localStorage).
const listeners = new Set<() => void>();
let current: Lang | null = null;
function readLang(): Lang {
  if (current) return current;
  try {
    const saved = localStorage.getItem("lang");
    if (saved && saved in dictionaries) return (current = saved as Lang);
  } catch {}
  return (current = DEFAULT_LANG);
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function setLang(l: Lang) {
  current = l;
  try {
    localStorage.setItem("lang", l);
  } catch {}
  listeners.forEach((cb) => cb());
}

type Ctx = { lang: Lang; t: Dictionary; setLang: (l: Lang) => void };
const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, () => DEFAULT_LANG);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = dictionaries[lang].meta.title;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, t: dictionaries[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx;
}
