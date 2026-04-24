'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalyticsPage from '@/app/manager/AnalyticsPage';
import EmployeesPage from '@/app/manager/EmployeesPage';
import InventoryPage from '@/app/manager/InventoryPage';
import ManagerSidebar from '@/app/manager/ManagerSidebar';
import ReportsPage from '@/app/manager/ReportsPage';

export type ManagerTool = 'analytics' | 'reports' | 'inventory' | 'employees';

export default function ManagerWorkspace() {
  const [selectedTool, setSelectedTool] = useState<ManagerTool>('analytics');
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#edf2ea_0%,#f8fbf7_45%,#e0ebdc_100%)] px-6 py-10 text-[#1f2520]">
      <section className="mx-auto w-full max-w-7xl">
        <div className="rounded-[32px] border border-[#c8d2c3] bg-white/80 p-8 shadow-[0_24px_70px_rgba(31,37,32,0.08)] backdrop-blur sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#637160]">
                Team Matcha POS
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#1f2520] sm:text-5xl">
                Manager View
              </h1>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-center">
              <button
                onClick={() => router.push('/employee')}
                className="rounded-xl border border-[#2f7a5f] text-[#2f7a5f] px-6 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-[#2f7a5f] hover:text-white transition-all shadow-sm"
              >
                Switch to Cashier
              </button>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-red-200 bg-red-50 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 transition-colors shadow-sm"
              >
                Log Out
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <ManagerSidebar
              selectedTool={selectedTool}
              onSelect={setSelectedTool}
            />
            {selectedTool === 'analytics' ? <AnalyticsPage /> : null}
            {selectedTool === 'reports' ? <ReportsPage /> : null}
            {selectedTool === 'inventory' ? <InventoryPage /> : null}
            {selectedTool === 'employees' ? <EmployeesPage /> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
