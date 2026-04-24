'use client';

import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';

const LanguageToggle = () => {
  const { language, setLanguage, accessibilityMode, setAccessibilityMode, t } = useLanguage();

  return (
    <div className="flex flex-col gap-3 items-end">
      <div className="flex items-center gap-2 p-1 bg-white border border-[#c8d1c4] rounded-full shadow-lg" role="region" aria-label="Language selection">
        <button
          onClick={() => setLanguage('en')}
          className={`px-6 py-3 rounded-full min-w-[64px] min-h-[48px] flex items-center justify-center transition-all duration-200 font-bold text-base focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
            language === 'en'
              ? 'bg-[#1f2520] text-white shadow-md'
              : 'text-[#1f2520] hover:bg-[#e6f1e1]'
          }`}
          aria-label="Switch to English"
          aria-pressed={language === 'en'}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('es')}
          className={`px-6 py-3 rounded-full min-w-[64px] min-h-[48px] flex items-center justify-center transition-all duration-200 font-bold text-base focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
            language === 'es'
              ? 'bg-[#1f2520] text-white shadow-md'
              : 'text-[#1f2520] hover:bg-[#e6f1e1]'
          }`}
          aria-label="Cambiar a Español"
          aria-pressed={language === 'es'}
        >
          ES
        </button>
      </div>
      
      <button
        onClick={() => setAccessibilityMode(!accessibilityMode)}
        className={`flex items-center gap-2 px-6 py-4 rounded-[20px] shadow-lg border transition-all duration-200 font-bold focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
          accessibilityMode 
            ? 'bg-[#2f7a5f] text-white border-[#1f2520]' 
            : 'bg-white text-[#1f2520] border-[#c8d1c4] hover:bg-[#f8f1e7]'
        }`}
        aria-pressed={accessibilityMode}
      >
        <span className="text-xl" aria-hidden="true">👁️</span>
        {t('Accessibility Mode')}
      </button>
    </div>
  );
};

export default LanguageToggle;
