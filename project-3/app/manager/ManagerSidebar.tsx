'use client';

import type { ManagerTool } from '@/app/manager/ManagerWorkspace';

type ManagerSidebarProps = {
  selectedTool: ManagerTool;
  onSelect: (tool: ManagerTool) => void;
};

const tools: Array<{
  id: ManagerTool;
  eyebrow: string;
  title: string;
  description: string;
}> = [
  {
    id: 'inventory',
    eyebrow: 'Live stock view',
    title: 'Inventory',
    description: 'Manager inventory page.',
  },
  {
    id: 'employees',
    eyebrow: 'Staff records',
    title: 'Employees',
    description: 'Add, edit, and delete employee rows.',
  },
];

export default function ManagerSidebar({
  selectedTool,
  onSelect,
}: ManagerSidebarProps) {
  return (
    <aside className="rounded-[28px] border border-[#cfd9ca] bg-[#f7faf5] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#667463]">
        Manager Tools
      </p>
      <div className="mt-5 flex flex-col gap-3">
        {tools.map((tool) => {
          const isSelected = selectedTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelect(tool.id)}
              className={`w-full rounded-[22px] border px-4 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-[#dbe7d7] ${
                isSelected
                  ? 'border-[#6a8e67] bg-[#e6f1e1]'
                  : 'border-[#d7dfd3] bg-white hover:bg-[#f0f6ed]'
              }`}
            >
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#748272]">
                {tool.eyebrow}
              </p>
              <h2 className="mt-2 text-lg font-bold text-[#243022]">
                {tool.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#556253]">
                {tool.description}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
