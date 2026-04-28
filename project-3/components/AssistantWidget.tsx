'use client';

import { useMemo, useRef, useState } from 'react';
import type { CartItem } from './pos-types';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type AssistantCartItem = CartItem & {
  iceLevel: string;
  sugarLevel: string;
  topping: string;
  cupSize: CartItem['cupSize'];
};

type AssistantResponse = {
  reply: string;
  cartItems?: AssistantCartItem[];
  warning?: string;
};

type Props = {
  onAddToCart: (item: CartItem) => void;
  className?: string;
};

const quickPrompts = [
  { label: 'Popular drinks', message: 'What drinks are popular?', action: 'popular' },
  { label: "Today's Recommendation", message: 'Add today\'s drink recommendation.', action: 'weather-recommendation' },
  { label: 'Available toppings', message: 'What toppings do you have?', action: 'toppings' },
];

function ChatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-8.6 8.3 9.2 9.2 0 0 1-3.9-.9L3 20l1.3-4.5a8 8 0 0 1-.9-3.8A8.4 8.4 0 0 1 12 3.3a8.4 8.4 0 0 1 9 8.2Z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

export default function AssistantWidget({ onAddToCart, className = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi, I can answer menu questions and add drinks to your cart. I cannot place the order for you.',
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const messageCounter = useRef(0);

  const apiMessages = useMemo(
    () =>
      messages
        .filter((message) => message.id !== 'welcome')
        .map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  const nextId = () => {
    messageCounter.current += 1;
    return `assistant-message-${messageCounter.current}`;
  };

  const addReturnedItemsToCart = (cartItems: AssistantCartItem[]) => {
    let addedCount = 0;

    cartItems.forEach((item) => {
      const quantity = Math.max(1, Math.floor(item.quantity || 1));

      for (let index = 0; index < quantity; index += 1) {
        onAddToCart({
          menuid: item.menuid,
          name: item.name,
          cost: item.cost,
          image_url: item.image_url,
          quantity: 1,
          iceLevel: item.iceLevel,
          sugarLevel: item.sugarLevel,
          topping: item.topping,
          cupSize: item.cupSize,
        });
        addedCount += 1;
      }
    });

    if (addedCount > 0) {
      setStatus(`${addedCount} item${addedCount === 1 ? '' : 's'} added to cart.`);
    }
  };

  const sendMessage = async (content: string, action?: string) => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;

    setInput('');
    setStatus(null);

    const userMessage: ChatMessage = {
      id: nextId(),
      role: 'user',
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsSending(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          messages: [
            ...apiMessages,
            {
              role: userMessage.role,
              content: userMessage.content,
            },
          ],
        }),
      });

      const data = (await response.json()) as AssistantResponse;

      if (!response.ok) {
        throw new Error(data.reply || 'Assistant request failed.');
      }

      addReturnedItemsToCart(data.cartItems ?? []);
      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          role: 'assistant',
          content: data.reply,
        },
      ]);

      if (data.warning) {
        setStatus(data.warning);
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          role: 'assistant',
          content:
            error instanceof Error
              ? error.message
              : 'I had trouble answering that. Please try again.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
<div className={`fixed bottom-6 left-5 z-[70] w-fit pointer-events-none sm:left-6 ${className}`}>  {isOpen ? (
        <section className="pointer-events-auto absolute bottom-20 left-0 flex h-[min(680px,calc(100vh-8rem))] w-[calc(100vw-2.5rem)] max-w-[420px] flex-col overflow-hidden rounded-[28px] border border-[#d7e3d5] bg-[#fffdf9] shadow-[0_26px_80px_rgba(31,37,32,0.28)]">
          <header className="flex items-center justify-between border-b border-[#e7ded0] bg-[#1f2520] px-5 py-4 text-white">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#cfe4d5]">
                Team Matcha
              </p>
              <h2 className="mt-1 text-lg font-extrabold">Personal Assistant</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close assistant"
            >
              <CloseIcon />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#fffdf9_0%,#f4f8f3_100%)] p-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[86%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-[#2f7a5f] text-white'
                      : 'border border-[#e7ded0] bg-white text-[#1f2520]'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isSending ? (
              <div className="flex justify-start">
                <div className="rounded-[22px] border border-[#e7ded0] bg-white px-4 py-3 text-sm font-semibold text-[#4a554a] shadow-sm">
                  Thinking...
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#e7ded0] bg-white p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => sendMessage(prompt.message, prompt.action)}
                  disabled={isSending}
                  className="min-h-[38px] shrink-0 rounded-full border border-[#d7e3d5] bg-[#f4f8f3] px-4 py-2 text-sm font-bold text-[#2f7a5f] transition hover:bg-[#e8f0e6] disabled:opacity-50"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            {status ? (
              <p className="mb-3 rounded-[16px] bg-[#eef7ef] px-3 py-2 text-xs font-semibold text-[#2f7a5f]">
                {status}
              </p>
            ) : null}

            <form
              className="grid grid-cols-[minmax(0,1fr)_48px] gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(input);
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about drinks or add to cart"
                className="min-h-[48px] rounded-[18px] border border-[#d7e3d5] bg-[#f9fbf8] px-4 text-sm font-semibold text-[#1f2520] outline-none transition focus:border-[#2f7a5f] focus:ring-4 focus:ring-[#2f7a5f]/15"
              />
              <button
                type="submit"
                disabled={isSending || input.trim().length === 0}
                className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#2f7a5f] text-white shadow-lg shadow-[#2f7a5f]/20 transition hover:bg-[#25614b] disabled:grayscale disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]/30"
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="pointer-events-auto group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#6d4a13] bg-[linear-gradient(135deg,#9a6718_0%,#f4cf72_28%,#c78f28_52%,#ffe19a_72%,#9f6815_100%)] text-[#1f2520] shadow-[0_14px_34px_rgba(109,74,19,0.28)] transition-colors before:absolute before:inset-y-[-35%] before:left-[-100%] before:w-16 before:rotate-12 before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.95)_48%,transparent_100%)] before:blur-[2px] before:content-[''] hover:before:animate-[assistant-sheen_760ms_ease-out_forwards] focus:outline-none focus:ring-4 focus:ring-[#d9a441]/35"
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
      >
        <span className="relative z-10">
          <ChatIcon />
        </span>
        <span className="pointer-events-none absolute bottom-full left-0 mb-3 hidden whitespace-nowrap rounded-full bg-[#1f2520] px-4 py-2 text-xs font-bold text-white shadow-lg group-hover:block">
          Ask Assistant
        </span>
      </button>
      <style jsx>{`
        @keyframes assistant-sheen {
          from {
            transform: translateX(0) rotate(12deg);
          }
          to {
            transform: translateX(220px) rotate(12deg);
          }
        }
      `}</style>
    </div>
  );
}
