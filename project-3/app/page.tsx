import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#fff8ef_0%,#f8efe3_45%,#e9f5ef_100%)] px-6 py-16 text-[#2f241d]">
      <section className="w-full max-w-2xl rounded-[32px] border border-[#cbb8a3] bg-white/85 p-10 shadow-[0_24px_80px_rgba(79,55,33,0.16)] backdrop-blur">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#8a6240]">
          Team Matcha Portal
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Portal Page
        </h1>

        <div className="mt-8">
          <Link
            href="/api/menu"
            className="inline-flex items-center justify-center rounded-full bg-[#2f7a5f] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#245f4a]"
          >
            Open Menu
          </Link>
        </div>
      </section>
    </main>
  );
}
