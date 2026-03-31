import Link from "next/link";

export default function Home() {
  const portalLinks = [
    {
      href: "/menu",
      label: "Menu",
    },
    {
      href: "/employee",
      label: "Employee",
    },
    {
      href: "/manager",
      label: "Manager",
    },
    {
      href: "/Kiosk",
      label: "Kiosk",
    }
  ];

  return (
    <main className="min-h-screen bg-[#eef1ec] px-6 py-10 text-[#1f2520]">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl flex-col justify-center rounded-[28px] border border-[#c8d1c4] bg-[#f8faf7] p-8 shadow-[0_18px_48px_rgba(31,37,32,0.08)] sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#5d6b5e]">
          Team Matcha POS
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Portal
        </h1>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {portalLinks.map((portalLink) => (
            <Link
              key={portalLink.href}
              href={portalLink.href}
              className={`flex min-h-40 items-center justify-center rounded-[24px] border border-[#b9c5b6] bg-white px-6 py-6 text-center shadow-[0_8px_24px_rgba(31,37,32,0.06)] transition hover:border-[#829080] hover:bg-[#f4f7f3] focus:outline-none focus:ring-4 focus:ring-[#d7e2d4] ${
                portalLink.label === "Kiosk" ? "md:col-start-2" : ""
              }`}
            >
              <h2 className="text-3xl font-bold text-[#1f2520]">
                {portalLink.label}
              </h2>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
