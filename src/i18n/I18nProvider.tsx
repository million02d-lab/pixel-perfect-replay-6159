import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dictionaries, LANGS, type Dict, type Lang } from "./dictionaries";

type Ctx = { lang: Lang; t: Dict; dir: "rtl" | "ltr"; setLang: (l: Lang) => void };
const I18nContext = createContext<Ctx | null>(null);
const KEY = "ozannif.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY) as Lang | null;
    if (saved && saved in dictionaries) setLangState(saved);
  }, []);

  const dir = LANGS.find((l) => l.code === lang)!.dir;
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(KEY, l);
  };

  return <I18nContext.Provider value={{ lang, dir, t: dictionaries[lang], setLang }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
