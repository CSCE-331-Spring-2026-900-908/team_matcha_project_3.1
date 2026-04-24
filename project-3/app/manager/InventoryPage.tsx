'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { authFetch } from '@/lib/fetch-utils';

type InventoryItem = {
  inventoryId: number;
  name: string;
  cost: number;
  inventoryNum: number;
  useAverage: number;
  daysLeft: number | null;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

type EditModalState = {
  item: InventoryItem;
  cost: string;
  stagedStock: number;
  stockChange: string;
};

type NewItemForm = {
  name: string;
  cost: string;
  inventoryNum: string;
};

const defaultNewItemForm = (): NewItemForm => ({
  name: '',
  cost: '',
  inventoryNum: '',
});

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState<NewItemForm>(
    defaultNewItemForm()
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInventory() {
      try {
        const response = await fetch('/api/manager/inventory');

        if (!response.ok) {
          throw new Error('Failed to load inventory data.');
        }

        const data: InventoryItem[] = await response.json();

        if (isMounted) {
          setItems(data);
        }
      } catch (fetchError) {
        if (isMounted) {
          const message =
            fetchError instanceof Error
              ? fetchError.message
              : 'Failed to load inventory data.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInventory();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const openEditModal = (item: InventoryItem) => {
    setSaveError(null);
    setEditModal({
      item,
      cost: item.cost.toFixed(2),
      stagedStock: item.inventoryNum,
      stockChange: '1',
    });
  };

  const closeEditModal = () => {
    if (isSaving) return;
    setEditModal(null);
    setSaveError(null);
  };

  const openCreateModal = () => {
    setCreateError(null);
    setNewItemForm(defaultNewItemForm());
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setIsCreateModalOpen(false);
    setCreateError(null);
  };

  const adjustStagedStock = (direction: 'add' | 'remove') => {
    if (!editModal) return;

    const amount = Math.max(1, Math.floor(Number(editModal.stockChange) || 0));
    const nextStock =
      direction === 'add'
        ? editModal.stagedStock + amount
        : Math.max(0, editModal.stagedStock - amount);

    setEditModal({
      ...editModal,
      stagedStock: nextStock,
      stockChange: String(amount),
    });
  };

  const handleSave = async () => {
    if (!editModal) return;

    const parsedCost = Number(editModal.cost);

    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      setSaveError('Enter a valid cost that is zero or greater.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/manager/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: editModal.item.inventoryId,
          cost: parsedCost,
          inventoryNum: editModal.stagedStock,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update inventory item.');
      }

      setItems((prev) =>
        prev.map((item) =>
          item.inventoryId === data.inventoryId ? data : item
        )
      );
      setEditModal(null);
    } catch (saveFailure) {
      setSaveError(
        saveFailure instanceof Error
          ? saveFailure.message
          : 'Failed to update inventory item.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    const name = newItemForm.name.trim();
    const cost = Number(newItemForm.cost);
    const inventoryNum = Number(newItemForm.inventoryNum);

    if (!name) {
      setCreateError('Enter a name for the inventory item.');
      return;
    }

    if (!Number.isFinite(cost) || !Number.isFinite(inventoryNum)) {
      setCreateError('Enter valid numbers for cost and stock.');
      return;
    }

    if (cost < 0 || inventoryNum < 0) {
      setCreateError('Cost and stock must be zero or greater.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/manager/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          cost,
          inventoryNum,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create inventory item.');
      }

      setItems((prev) =>
        [...prev, data].sort((first, second) =>
          first.name.localeCompare(second.name)
        )
      );
      setIsCreateModalOpen(false);
      setNewItemForm(defaultNewItemForm());
    } catch (createFailure) {
      setCreateError(
        createFailure instanceof Error
          ? createFailure.message
          : 'Failed to create inventory item.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="rounded-[32px] border border-[#cfd9ca] bg-[#f7faf5] p-6 shadow-[0_18px_50px_rgba(31,37,32,0.06)] sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-[#dbe4d6] pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#667463]">
              Inventory
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#223020] sm:text-4xl">
              Ingredient and stock overview
            </h2>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-3 inline-flex items-center justify-center self-start rounded-full bg-[#46b96c] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(70,185,108,0.24)] transition hover:bg-[#38c567] sm:mt-6"
          >
            New Item
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-[24px] border border-dashed border-[#ccd7c7] bg-white px-6 py-12 text-center text-[#677564]">
            Loading inventory...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-[24px] border border-[#e0b1aa] bg-[#fff2f0] px-6 py-12 text-center text-[#91463d]">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#ccd7c7] bg-white px-6 py-12 text-center text-[#677564]">
            No inventory records are available right now.
          </div>
        ) : null}

        {!isLoading && !error && items.length > 0 ? (
          <div className="overflow-visible rounded-[28px] border border-[#d9e3d5] bg-white">
            <div className="hidden grid-cols-[1.8fr_1fr_1fr_1fr_1fr_auto] gap-4 rounded-t-[28px] border-b border-[#dfe8da] bg-[#edf4ea] px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-[#6c7968] lg:grid">
              <span>Ingredient / Stock Item</span>
              <span>Cost</span>
              <span>Current Stock</span>
              <span>Avg. Use</span>
              <span className="group relative inline-flex items-center">
                <span className="cursor-help underline decoration-dotted underline-offset-4">
                  Approx. Days Left
                </span>
                <span className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-max max-w-52 rounded-[16px] border border-[#d8e2d3] bg-white px-3 py-3 text-left text-[0.68rem] font-medium normal-case tracking-normal text-[#586756] shadow-[0_14px_30px_rgba(31,37,32,0.10)] group-hover:block">
                  Current stock divided by average use.
                </span>
              </span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-[#ebf0e8]">
              {items.map((item) => (
                <article
                  key={item.inventoryId}
                  className="grid gap-4 px-6 py-5 lg:grid-cols-[1.8fr_1fr_1fr_1fr_1fr_auto] lg:items-center"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Ingredient / Stock Item
                    </p>
                    <p className="text-base font-semibold text-[#223020] sm:text-lg">
                      {item.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Cost
                    </p>
                    <p className="text-sm font-medium text-[#586756] sm:text-base">
                      {currencyFormatter.format(item.cost)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Current Stock
                    </p>
                    <p className="text-sm font-medium text-[#223020] sm:text-base">
                      {item.inventoryNum}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Avg. Use
                    </p>
                    <p className="text-sm font-medium text-[#586756] sm:text-base">
                      {item.useAverage}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Days Left
                    </p>
                    <p className="text-sm font-medium text-[#586756] sm:text-base">
                      {item.daysLeft ?? 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-start lg:justify-end">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="rounded-full border border-[#b8c8b3] bg-[#f4f8f1] px-4 py-2 text-sm font-semibold text-[#2a5b34] transition hover:border-[#8fa889] hover:bg-[#ebf3e7]"
                    >
                      Edit
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {editModal && isMounted
        ? createPortal(
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[rgba(34,48,32,0.35)] p-4">
              <div className="w-full max-w-md rounded-[28px] border border-[#d9e3d5] bg-white p-6 shadow-[0_22px_60px_rgba(31,37,32,0.20)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#667463]">
                      Edit Inventory
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-[#223020]">
                      {editModal.item.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="rounded-full border border-[#d9e3d5] px-3 py-1 text-sm font-semibold text-[#586756] transition hover:bg-[#f5f8f3]"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777]">
                      Cost
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editModal.cost}
                      onChange={(event) =>
                        setEditModal({
                          ...editModal,
                          cost: event.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-[18px] border border-[#d8e2d3] bg-[#fbfdfb] px-4 py-3 text-[#223020] focus:outline-none focus:ring-2 focus:ring-[#9db59a]"
                    />
                  </div>

                  <div className="rounded-[22px] border border-[#e4ece0] bg-[#f8fbf7] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777]">
                          Current Stock
                        </p>
                        <p className="mt-1 text-3xl font-bold text-[#223020]">
                          {editModal.stagedStock}
                        </p>
                      </div>

                      <div className="w-28">
                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777]">
                          Change By
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editModal.stockChange}
                          onChange={(event) =>
                            setEditModal({
                              ...editModal,
                              stockChange: event.target.value,
                            })
                          }
                          className="mt-2 w-full rounded-[16px] border border-[#d8e2d3] bg-white px-3 py-2 text-[#223020] focus:outline-none focus:ring-2 focus:ring-[#9db59a]"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => adjustStagedStock('add')}
                        className="flex-1 rounded-full bg-[#2f7a5f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#28684f]"
                      >
                        Add Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustStagedStock('remove')}
                        className="flex-1 rounded-full border border-[#d4ddd0] bg-white px-4 py-2 text-sm font-semibold text-[#7a453d] transition hover:bg-[#fcf3f1]"
                      >
                        Remove Stock
                      </button>
                    </div>
                  </div>

                  {saveError ? (
                    <div className="rounded-[18px] border border-[#e0b1aa] bg-[#fff2f0] px-4 py-3 text-sm text-[#91463d]">
                      {saveError}
                    </div>
                  ) : null}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      disabled={isSaving}
                      className="rounded-full border border-[#d4ddd0] bg-white px-5 py-2 text-sm font-semibold text-[#586756] transition hover:bg-[#f5f8f3] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="rounded-full bg-[#223020] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#172014] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {isCreateModalOpen && isMounted
        ? createPortal(
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[rgba(34,48,32,0.35)] p-4">
              <div className="w-full max-w-md rounded-[28px] border border-[#d9e3d5] bg-white p-6 shadow-[0_22px_60px_rgba(31,37,32,0.20)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#667463]">
                      Add Inventory
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-[#223020]">
                      New Stock Item
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="rounded-full border border-[#d9e3d5] px-3 py-1 text-sm font-semibold text-[#586756] transition hover:bg-[#f5f8f3]"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777]">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={newItemForm.name}
                      onChange={(event) =>
                        setNewItemForm({
                          ...newItemForm,
                          name: event.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-[18px] border border-[#d8e2d3] bg-[#fbfdfb] px-4 py-3 text-[#223020] focus:outline-none focus:ring-2 focus:ring-[#9db59a]"
                      placeholder="Example: Brown Sugar Syrup"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777]">
                        Cost
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newItemForm.cost}
                        onChange={(event) =>
                          setNewItemForm({
                            ...newItemForm,
                            cost: event.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-[18px] border border-[#d8e2d3] bg-[#fbfdfb] px-4 py-3 text-[#223020] focus:outline-none focus:ring-2 focus:ring-[#9db59a]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777]">
                        Starting Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={newItemForm.inventoryNum}
                        onChange={(event) =>
                          setNewItemForm({
                            ...newItemForm,
                            inventoryNum: event.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-[18px] border border-[#d8e2d3] bg-[#fbfdfb] px-4 py-3 text-[#223020] focus:outline-none focus:ring-2 focus:ring-[#9db59a]"
                      />
                    </div>
                  </div>

                  {createError ? (
                    <div className="rounded-[18px] border border-[#e0b1aa] bg-[#fff2f0] px-4 py-3 text-sm text-[#91463d]">
                      {createError}
                    </div>
                  ) : null}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      disabled={isCreating}
                      className="rounded-full border border-[#d4ddd0] bg-white px-5 py-2 text-sm font-semibold text-[#586756] transition hover:bg-[#f5f8f3] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={isCreating}
                      className="rounded-full bg-[#223020] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#172014] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCreating ? 'Adding...' : 'Add Item'}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}
