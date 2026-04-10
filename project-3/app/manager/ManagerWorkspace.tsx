'use client';

import InventoryPage from '@/app/manager/InventoryPage';
import ManagerSidebar from '@/app/manager/ManagerSidebar';

export default function ManagerWorkspace() {
  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#edf2ea_0%,#f8fbf7_45%,#e0ebdc_100%)] px-6 py-10 text-[#1f2520]">
      <section className="mx-auto w-full max-w-7xl">
        <div className="rounded-[32px] border border-[#c8d2c3] bg-white/80 p-8 shadow-[0_24px_70px_rgba(31,37,32,0.08)] backdrop-blur sm:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#637160]">
              Team Matcha POS
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#1f2520] sm:text-5xl">
              Manager View
            </h1>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <ManagerSidebar onSelect={() => undefined} />
            <InventoryPage />
          </div>
        </div>
      </section>
    </main>
  );
}
