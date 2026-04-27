'use client';

import { useEffect, useRef, useState } from "react";
import GoogleTranslateWidget from "@/components/GoogleTranslateWidget";

export default function LanguageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [isReaderActive, setIsReaderActive] = useState(false);
  const readerQueueRef = useRef<string[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (accessibilityMode) {
      document.documentElement.classList.add('accessibility-mode');
    } else {
      document.documentElement.classList.remove('accessibility-mode');
    }
  }, [accessibilityMode]);

  const stopReader = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    readerQueueRef.current = [];
    currentUtteranceRef.current = null;
    setIsReaderActive(false);
  };

  const buildReaderChunks = () => {
    const selectors = [
      'main h1',
      'main h2',
      'main h3',
      'main p',
      'main li',
      'main button',
      'main a',
      'main [role="heading"]',
    ];

    const seen = new Set<Element>();
    const elements = selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll(selector)).filter((element) => {
        if (seen.has(element)) return false;
        seen.add(element);
        return true;
      })
    );

    const chunks = elements
      .map((element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '')
      .filter((text) => text.length > 0);

    if (chunks.length > 0) {
      return chunks;
    }

    const fallback = document.body.innerText.replace(/\s+/g, ' ').trim();
    return fallback ? [fallback] : [];
  };

  const speakNextChunk = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsReaderActive(false);
      return;
    }

    const nextChunk = readerQueueRef.current.shift();
    if (!nextChunk) {
      currentUtteranceRef.current = null;
      setIsReaderActive(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(nextChunk);
    utterance.rate = 0.82;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => {
      currentUtteranceRef.current = null;
      speakNextChunk();
    };
    utterance.onerror = () => {
      currentUtteranceRef.current = null;
      speakNextChunk();
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleReaderToggle = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isReaderActive) {
      stopReader();
      return;
    }

    const chunks = buildReaderChunks();
    if (chunks.length === 0) return;

    window.speechSynthesis.cancel();
    readerQueueRef.current = chunks;
    setIsReaderActive(true);
    speakNextChunk();
  };

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
          onClick={handleReaderToggle}
          className="flex items-center justify-center px-6 py-4 rounded-[20px] shadow-lg border transition-all duration-200 font-bold text-center leading-tight whitespace-normal focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 bg-white text-[#1f2520] border-[#c8d1c4] hover:bg-[#f8f1e7]"
          aria-pressed={isReaderActive}
          aria-label={isReaderActive ? 'Stop reading this page aloud' : 'Read this page aloud'}
        >
          {isReaderActive ? 'Stop Reader' : 'Reader'}
        </button>
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
