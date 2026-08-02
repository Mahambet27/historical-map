import { createContext, useContext, useEffect, useMemo, useState } from "react";

const dictionaries = {
  ru: {
    nav: { map: "Карта", timeline: "Хронология", events: "События", people: "Личности", heritage: "Наследие", more: "Разделы" },
    openMap: "Открыть карту", explore: "Исследовать эпохи", menu: "Меню", language: "Язык",
    subtitle: "Цифровая историческая карта Казахстана",
    description: "Исследуйте историю Казахстана через время, территории, события, личности, памятники и архивные материалы.",
  },
  kk: {
    nav: { map: "Карта", timeline: "Хронология", events: "Оқиғалар", people: "Тұлғалар", heritage: "Мұра", more: "Бөлімдер" },
    openMap: "Картаны ашу", explore: "Дәуірлерді зерттеу", menu: "Мәзір", language: "Тіл",
    subtitle: "Қазақстанның цифрлық тарихи картасы",
    description: "Қазақстан тарихын уақыт, аумақтар, оқиғалар, тұлғалар, ескерткіштер және мұрағат материалдары арқылы зерттеңіз.",
  },
  en: {
    nav: { map: "Map", timeline: "Timeline", events: "Events", people: "People", heritage: "Heritage", more: "Sections" },
    openMap: "Open the map", explore: "Explore eras", menu: "Menu", language: "Language",
    subtitle: "The digital historical map of Kazakhstan",
    description: "Explore Kazakhstan’s history through time, territories, events, people, monuments, and archival materials.",
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("lang");
    if (
      window.location.pathname.startsWith("/demo") &&
      ["ru", "kk", "en"].includes(requested)
    ) {
      return requested;
    }
    return localStorage.getItem("qhm-language") || "ru";
  });
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const setLanguage = (value) => {
    setLanguageState(value);
    localStorage.setItem("qhm-language", value);
    document.documentElement.lang = value;
  };
  const value = useMemo(() => ({ language, setLanguage, t: dictionaries[language] || dictionaries.ru }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useI18n = () => useContext(I18nContext);
