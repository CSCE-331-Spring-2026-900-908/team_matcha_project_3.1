'use client';

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

export default function LanguageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const langContext = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (langContext.accessibilityMode) {
      document.documentElement.classList.add('accessibility-mode');
    } else {
      document.documentElement.classList.remove('accessibility-mode');
    }
  }, [langContext.accessibilityMode]);

  // Use a stable class name for the initial server render
  const accessibilityClass = mounted && langContext.accessibilityMode ? 'accessibility-mode' : '';

  return (
    <div className={accessibilityClass}>
      {mounted && (
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-full focus:bg-[#2f7a5f] focus:px-6 focus:py-3 focus:text-white focus:font-bold focus:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
        >
          {langContext.t('Skip to main content')}
        </a>
      )}
      <div className="fixed top-4 right-4 z-[100]">
        <LanguageToggle />
      </div>
      {children}
    </div>
  );
}
