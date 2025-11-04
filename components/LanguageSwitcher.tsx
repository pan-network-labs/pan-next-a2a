"use client";

import { useLanguage } from "~~/utils/i18n/LanguageContext";
import { Language } from "~~/utils/i18n/translations";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "zh-TW", label: "繁中" },
  ];

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-sm rounded-lg bg-[#1A110A]/50 border border-[#FF6B00]/30 text-white hover:bg-[#FF6B00]/20 transition-all duration-300">
        <span className="text-sm font-medium">{language === "en" ? "EN" : "繁中"}</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <ul tabIndex={0} className="dropdown-content menu bg-[#1A110A] border border-[#FF6B00]/30 rounded-lg shadow-lg z-[1] mt-2 p-2 min-w-[100px]">
        {languages.map((lang) => (
          <li key={lang.code}>
            <button
              onClick={() => setLanguage(lang.code)}
              className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                language === lang.code
                  ? "bg-[#FF6B00] text-white"
                  : "text-white/70 hover:bg-[#261A10] hover:text-white"
              }`}
            >
              {lang.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

