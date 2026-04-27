'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import GoogleTranslateWidget from "@/components/GoogleTranslateWidget";

const subscribeToClientSnapshot = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function LanguageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mounted = useSyncExternalStore(
    subscribeToClientSnapshot,
    getClientSnapshot,
    getServerSnapshot
  );
  const [textSize, setTextSize] = useState<'default' | 'large' | 'x-large'>('default');
  const [contrastMode, setContrastMode] = useState(false);
  const [isReaderActive, setIsReaderActive] = useState(false);
  const [isAccessibilityPanelOpen, setIsAccessibilityPanelOpen] = useState(false);
  const readerQueueRef = useRef<string[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-size-large', 'text-size-x-large');

    if (textSize === 'large') {
      root.classList.add('text-size-large');
    } else if (textSize === 'x-large') {
      root.classList.add('text-size-x-large');
    }
  }, [textSize]);

  useEffect(() => {
    if (contrastMode) {
      document.documentElement.classList.add('contrast-dark');
    } else {
      document.documentElement.classList.remove('contrast-dark');
    }
  }, [contrastMode]);

  const stopReader = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    readerQueueRef.current = [];
    currentUtteranceRef.current = null;
    setIsReaderActive(false);
  };

  const buildReaderChunks = () => {
    const activeDialog = document.querySelector(
      '[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]'
    );

    const root: ParentNode = activeDialog ?? document;
    const selectors = [
      activeDialog ? 'h1' : 'main h1',
      activeDialog ? 'h2' : 'main h2',
      activeDialog ? 'h3' : 'main h3',
      activeDialog ? 'p' : 'main p',
      activeDialog ? 'li' : 'main li',
      activeDialog ? 'button' : 'main button',
      activeDialog ? 'a' : 'main a',
      activeDialog ? '[role="heading"]' : 'main [role="heading"]',
    ];

    const seen = new Set<Element>();
    const elements = selectors.flatMap((selector) =>
      Array.from(root.querySelectorAll(selector)).filter((element) => {
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
    <div>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-full focus:bg-[#2f7a5f] focus:px-6 focus:py-3 focus:text-white focus:font-bold focus:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
      >
        Skip to main content
      </a>
      {mounted ? (
        <div className="pointer-events-none fixed right-5 top-5 z-[100] flex items-start gap-3">
          <div
            className={`w-[min(22rem,calc(100vw-2rem))] rounded-[28px] border border-[#d7dfd4] bg-white/95 p-4 shadow-[0_22px_48px_rgba(31,37,32,0.16)] backdrop-blur transition-all duration-200 ${
              isAccessibilityPanelOpen
                ? 'pointer-events-auto translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-2 opacity-0'
            }`}
            aria-hidden={!isAccessibilityPanelOpen}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6d8a6f]">
                  Accessibility
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#1f2520]">
                  Page Tools
                </h2>
              </div>
              <button
                onClick={() => setIsAccessibilityPanelOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d7dfd4] bg-[#f8faf7] text-[#4a554a] transition hover:bg-[#eef1ec] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
                aria-label="Close accessibility tools"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-[22px] border border-[#dce5d8] bg-[#f8faf7] p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#6d8a6f]">
                  Language
                </p>
                <GoogleTranslateWidget />
              </div>

              <button
                onClick={handleReaderToggle}
                className="flex w-full items-center justify-between rounded-[22px] border border-[#c8d1c4] bg-white px-5 py-4 font-bold text-[#1f2520] transition-all duration-200 hover:bg-[#f8f1e7] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
                aria-pressed={isReaderActive}
                aria-label={isReaderActive ? 'Stop reading this page aloud' : 'Read this page aloud'}
              >
                <span>Reader</span>
                <span className="text-sm text-[#6d8a6f]">
                  {isReaderActive ? 'On' : 'Off'}
                </span>
              </button>

              <div className="rounded-[22px] border border-[#dce5d8] bg-[#f8faf7] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-bold text-[#1f2520]">Text Size</span>
                  <span className="text-sm text-[#6d8a6f]">
                    {textSize === 'default' ? 'Default' : textSize === 'large' ? 'Large' : 'Extra Large'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'A', value: 'default' as const },
                    { label: 'A+', value: 'large' as const },
                    { label: 'A++', value: 'x-large' as const },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTextSize(option.value)}
                      className={`rounded-[16px] border px-4 py-3 font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
                        textSize === option.value
                          ? 'border-[#1f2520] bg-[#2f7a5f] text-white'
                          : 'border-[#c8d1c4] bg-white text-[#1f2520] hover:bg-[#f8f1e7]'
                      }`}
                      aria-pressed={textSize === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setContrastMode((current) => !current)}
                className={`flex w-full items-center justify-between rounded-[22px] border px-5 py-4 font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
                  contrastMode
                    ? 'border-[#0f172a] bg-[#111827] text-white'
                    : 'border-[#c8d1c4] bg-white text-[#1f2520] hover:bg-[#f8f1e7]'
                }`}
                aria-pressed={contrastMode}
              >
                <span>Contrast Mode</span>
                <span className="text-sm opacity-80">
                  {contrastMode ? 'Dark' : 'Light'}
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsAccessibilityPanelOpen((current) => !current)}
            className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#c8d1c4] bg-[linear-gradient(180deg,#fffdf9_0%,#eef1ec_100%)] text-[#2f7a5f] shadow-[0_18px_36px_rgba(31,37,32,0.16)] transition hover:-translate-y-0.5 hover:bg-[#f8f1e7] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
            aria-expanded={isAccessibilityPanelOpen}
            aria-label={isAccessibilityPanelOpen ? 'Close accessibility tools' : 'Open accessibility tools'}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <circle cx="12" cy="5" r="2.5" />
              <path d="M12 8.5v5" />
              <path d="M8 12h8" />
              <path d="M10 13.5 7.5 21" />
              <path d="M14 13.5 16.5 21" />
            </svg>
          </button>
        </div>
      ) : null}
      {children}
    </div>
  );
}
