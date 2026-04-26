'use client';

import { useEffect, useState } from "react";
import GoogleTranslateWidget from "@/components/GoogleTranslateWidget";

export default function LanguageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accessibilityMode, setAccessibilityMode] = useState(false);

  useEffect(() => {
    if (accessibilityMode) {
      document.documentElement.classList.add('accessibility-mode');
    } else {
      document.documentElement.classList.remove('accessibility-mode');
    }
  }, [accessibilityMode]);

  return (
    <div className={accessibilityMode ? 'accessibility-mode' : ''}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-full focus:bg-[#2f7a5f] focus:px-6 focus:py-3 focus:text-white focus:font-bold focus:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <div className="fixed top-4 right-4 z-[100] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
        <GoogleTranslateWidget />
        <button
          onClick={() => setAccessibilityMode((current) => !current)}
          className={`flex items-center justify-center px-6 py-4 rounded-[20px] shadow-lg border transition-all duration-200 font-bold text-center leading-tight whitespace-normal focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
            accessibilityMode
              ? 'bg-[#2f7a5f] text-white border-[#1f2520]'
              : 'bg-white text-[#1f2520] border-[#c8d1c4] hover:bg-[#f8f1e7]'
          }`}
          aria-pressed={accessibilityMode}
        >
          Accessibility Mode
        </button>
      </div>
      {children}
    </div>
  );
}
