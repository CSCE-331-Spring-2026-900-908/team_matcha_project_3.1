'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: {
          InlineLayout?: {
            SIMPLE?: number;
          };
          new (
            options: {
              pageLanguage: string;
              includedLanguages: string;
              autoDisplay: boolean;
              layout?: number;
            },
            elementId: string
          ): unknown;
        };
      };
    };
    googleTranslateElementInit?: () => void;
    __googleTranslateWidgetInitialized?: boolean;
  }
}

function initializeGoogleTranslate() {
  if (!window.google?.translate?.TranslateElement) return;

  const container = document.getElementById('google_translate_element');
  if (!container) return;

  if (container.childNodes.length > 0 && window.__googleTranslateWidgetInitialized) {
    return;
  }

  container.innerHTML = '';
  new window.google.translate.TranslateElement(
    {
      pageLanguage: 'en',
      includedLanguages: 'es,fr,de,ko,ja',
      autoDisplay: false,
      layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE,
    },
    'google_translate_element'
  );
  window.__googleTranslateWidgetInitialized = true;
}

export default function GoogleTranslateWidget() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.googleTranslateElementInit = () => {
      window.__googleTranslateWidgetInitialized = false;
      initializeGoogleTranslate();
    };

    if (window.google?.translate?.TranslateElement) {
      initializeGoogleTranslate();
      return;
    }

    let script = document.querySelector(
      'script[data-google-translate-widget="true"]'
    ) as HTMLScriptElement | null;

    const handleLoad = () => {
      script?.setAttribute('data-loaded', 'true');
      initializeGoogleTranslate();
    };

    if (!script) {
      script = document.createElement('script');
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-google-translate-widget', 'true');
      script.addEventListener('load', handleLoad);
      document.body.appendChild(script);
    } else if (script.getAttribute('data-loaded') === 'true') {
      initializeGoogleTranslate();
    } else {
      script.addEventListener('load', handleLoad);
    }

    return () => {
      script?.removeEventListener('load', handleLoad);
    };
  }, []);

  return (
    <div
      id="google_translate_element"
      className="google-translate-widget min-h-[40px]"
    />
  );
}
