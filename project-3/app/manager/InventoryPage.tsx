export default function InventoryPage() {
  const inventoryPreviewRows = [
    {
      item: 'Matcha Powder',
      cost: '$4.20',
      stock: '820',
      averageUse: '3',
      daysLeft: '273',
      status: 'Healthy',
    },
    {
      item: 'Milk',
      cost: '$2.15',
      stock: '540',
      averageUse: '5',
      daysLeft: '108',
      status: 'Healthy',
    },
    {
      item: 'Tapioca Pearls (Boba)',
      cost: '$3.75',
      stock: '150',
      averageUse: '4',
      daysLeft: '37',
      status: 'Low Soon',
    },
    {
      item: 'Brown Sugar Syrup',
      cost: '$1.90',
      stock: '48',
      averageUse: '4',
      daysLeft: '12',
      status: 'Low Stock',
    },
    {
      item: 'Cup Lid',
      cost: '$0.65',
      stock: '1200',
      averageUse: '2',
      daysLeft: '600',
      status: 'Healthy',
    },
  ];

  const statusClasses: Record<string, string> = {
    Healthy: 'border-[#cfe3cc] bg-[#eef8ec] text-[#2f6d2a]',
    'Low Soon': 'border-[#ead5a3] bg-[#fff7e2] text-[#8b671c]',
    'Low Stock': 'border-[#e7b8b2] bg-[#fff1ef] text-[#97463c]',
  };

  return (
    <section className="rounded-[32px] border border-[#cfd9ca] bg-[#f7faf5] p-6 shadow-[0_18px_50px_rgba(31,37,32,0.06)] sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="border-b border-[#dbe4d6] pb-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#667463]">
              Inventory
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#223020] sm:text-4xl">
              Ingredient and stock overview
            </h2>
            
          </div>
        </div>

        
        <div className="overflow-hidden rounded-[28px] border border-[#d9e3d5] bg-white">
          <div className="hidden grid-cols-[1.8fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-[#dfe8da] bg-[#edf4ea] px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-[#6c7968] lg:grid">
            <span>Ingredient / Stock Item</span>
            <span>Cost</span>
            <span>Current Stock</span>
            <span>Avg. Use</span>
            <span>Days Left</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-[#ebf0e8]">
            {inventoryPreviewRows.map((row) => (
              <article
                key={row.item}
                className="grid gap-4 px-6 py-5 lg:grid-cols-[1.8fr_1fr_1fr_1fr_1fr_1fr] lg:items-center"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                    Ingredient / Stock Item
                  </p>
                  <p className="text-base font-semibold text-[#223020] sm:text-lg">
                    {row.item}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                    Cost
                  </p>
                  <p className="text-sm font-medium text-[#586756] sm:text-base">
                    {row.cost}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                    Current Stock
                  </p>
                  <p className="text-sm font-medium text-[#223020] sm:text-base">
                    {row.stock}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                    Avg. Use
                  </p>
                  <p className="text-sm font-medium text-[#586756] sm:text-base">
                    {row.averageUse}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                    Days Left
                  </p>
                  <p className="text-sm font-medium text-[#586756] sm:text-base">
                    {row.daysLeft}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                    Status
                  </p>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusClasses[row.status]}`}
                  >
                    {row.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
