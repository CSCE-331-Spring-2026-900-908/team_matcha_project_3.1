'use client';

type ManagerSidebarProps = {
  onSelect: () => void;
};

export default function ManagerSidebar({ onSelect }: ManagerSidebarProps) {
  return (
    <aside className="rounded-[28px] border border-[#cfd9ca] bg-[#f7faf5] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#667463]">
        Manager Tools
      </p>
      <button
        type="button"
        onClick={onSelect}
        className="mt-5 w-full rounded-[22px] border border-[#6a8e67] bg-[#e6f1e1] px-4 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-[#dbe7d7]"
      >
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#748272]">
          Live stock view
        </p>
        <h2 className="mt-2 text-lg font-bold text-[#243022]">Inventory</h2>
        <p className="mt-2 text-sm leading-6 text-[#556253]">
          Manager inventory page.
        </p>
      </button>
    </aside>
  );
}
