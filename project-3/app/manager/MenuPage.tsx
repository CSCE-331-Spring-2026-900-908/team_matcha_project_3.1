'use client';

import {
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { authFetch } from '@/lib/fetch-utils';

type MenuCategory = {
  categoryId: number;
  name: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
};

type InventoryItem = {
  inventoryId: number;
  name: string;
  cost: number;
  inventoryNum: number;
  categoryName: string | null;
  isActive: boolean;
};

type RecipeIngredient = {
  id: number;
  inventoryId: number;
  inventoryName: string;
  itemQuantity: number;
  inventoryIsActive: boolean;
};

type ManagerMenuItem = {
  menuId: number;
  name: string;
  cost: number;
  salesNum: number;
  imageUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  isActive: boolean;
  archivedAt: string | null;
  recipe: RecipeIngredient[];
};

type RecipeFormRow = {
  key: string;
  inventoryId: string;
  itemQuantity: string;
};

type MenuForm = {
  name: string;
  cost: string;
  imageUrl: string;
  categoryId: string;
  recipe: RecipeFormRow[];
};

type CategoryForm = {
  name: string;
  color: string;
};

const emptyMenuForm: MenuForm = {
  name: '',
  cost: '',
  imageUrl: '',
  categoryId: '',
  recipe: [],
};

const emptyCategoryForm: CategoryForm = {
  name: '',
  color: '#667463',
};

const categoryColorPresets = [
  '#b65a53',
  '#c77a3a',
  '#d6a84f',
  '#6d8a6f',
  '#3f8a7a',
  '#4f7fa8',
  '#6b6fa8',
  '#a65a78',
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageUploadSize = 5 * 1024 * 1024;

function sortCategories(categories: MenuCategory[]) {
  return [...categories].sort(
    (first, second) =>
      first.displayOrder - second.displayOrder ||
      first.name.localeCompare(second.name)
  );
}

function buildRecipeRow(ingredient?: RecipeIngredient): RecipeFormRow {
  return {
    key: `${ingredient?.id ?? 'new'}-${crypto.randomUUID()}`,
    inventoryId: ingredient ? String(ingredient.inventoryId) : '',
    itemQuantity: ingredient ? String(ingredient.itemQuantity) : '1',
  };
}

function getInventoryName(inventory: InventoryItem[], inventoryId: string) {
  const id = Number(inventoryId);
  return inventory.find((item) => item.inventoryId === id)?.name ?? 'Ingredient';
}

function isValidImageUrl(value: string) {
  if (!value) return true;
  if (value.startsWith('/images/')) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function MenuPage() {
  const [items, setItems] = useState<ManagerMenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingItem, setEditingItem] = useState<ManagerMenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<MenuForm>(emptyMenuForm);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategoryForm);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [draftCategories, setDraftCategories] = useState<MenuCategory[]>([]);
  const [draggedCategoryId, setDraggedCategoryId] = useState<number | null>(null);
  const [isColorPanelOpen, setIsColorPanelOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageDragActive, setIsImageDragActive] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const categoryNameInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [menuResponse, categoryResponse, inventoryResponse] = await Promise.all([
        authFetch('/api/manager/menu?includeArchived=true'),
        authFetch('/api/manager/menu/categories?includeInactive=true'),
        authFetch('/api/manager/inventory?includeArchived=true'),
      ]);

      if (!menuResponse.ok || !categoryResponse.ok || !inventoryResponse.ok) {
        throw new Error('Failed to load menu manager data.');
      }

      setItems(await menuResponse.json());
      setCategories(sortCategories(await categoryResponse.json()));
      setInventory(await inventoryResponse.json());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load menu manager data.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!editingCategory) return;
    categoryNameInputRef.current?.focus();
    categoryNameInputRef.current?.select();
  }, [editingCategory]);

  const activeCategories = useMemo(
    () => sortCategories(categories).filter((category) => category.isActive),
    [categories]
  );

  const activeInventory = useMemo(
    () => inventory.filter((item) => item.isActive),
    [inventory]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter === 'active' && !item.isActive) return false;
      if (filter === 'archived' && item.isActive) return false;
      if (
        categoryFilter !== 'all' &&
        String(item.categoryId ?? '') !== categoryFilter
      ) {
        return false;
      }

      return true;
    });
  }, [categoryFilter, filter, items]);

  function openCreateModal() {
    setEditingItem(null);
    setForm({
      ...emptyMenuForm,
      categoryId: activeCategories[0]
        ? String(activeCategories[0].categoryId)
        : '',
      recipe: [buildRecipeRow()],
    });
    setError(null);
    setNotice(null);
    setImageError(null);
    setImageUploadError(null);
    setIsImageDragActive(false);
    setIsModalOpen(true);
  }

  function openEditModal(item: ManagerMenuItem) {
    setEditingItem(item);
    setForm({
      name: item.name,
      cost: item.cost.toFixed(2),
      imageUrl: item.imageUrl ?? '',
      categoryId: item.categoryId ? String(item.categoryId) : '',
      recipe:
        item.recipe.length > 0
          ? item.recipe.map(buildRecipeRow)
          : [buildRecipeRow()],
    });
    setError(null);
    setNotice(null);
    setImageError(null);
    setImageUploadError(null);
    setIsImageDragActive(false);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving || isImageUploading) return;
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(emptyMenuForm);
    setImageError(null);
    setImageUploadError(null);
    setIsImageDragActive(false);
  }

  function updateForm(field: keyof MenuForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateImageUrl(value: string) {
    updateForm('imageUrl', value);
    setImageUploadError(null);
    setImageError(
      value.trim() && !isValidImageUrl(value.trim())
        ? 'Enter a valid http(s) image URL, /images path, or upload a file.'
        : null
    );
  }

  async function uploadMenuImage(file: File | null | undefined) {
    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
      setImageUploadError('Upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > maxImageUploadSize) {
      setImageUploadError('Image must be 5 MB or smaller.');
      return;
    }

    const uploadForm = new FormData();
    uploadForm.append('file', file);
    setIsImageUploading(true);
    setImageUploadError(null);
    setImageError(null);

    try {
      const response = await authFetch('/api/manager/menu/image', {
        method: 'POST',
        body: uploadForm,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      updateImageUrl(data.imageUrl);
    } catch (uploadError) {
      setImageUploadError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Failed to upload image.'
      );
    } finally {
      setIsImageUploading(false);
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
    }
  }

  function handleImageDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsImageDragActive(false);
    uploadMenuImage(event.dataTransfer.files[0]);
  }

  function handleImagePaste(event: ClipboardEvent<HTMLDivElement>) {
    const file = Array.from(event.clipboardData.files).find((pastedFile) =>
      pastedFile.type.startsWith('image/')
    );

    if (file) {
      event.preventDefault();
      uploadMenuImage(file);
    }
  }

  function updateRecipeRow(
    key: string,
    field: keyof Omit<RecipeFormRow, 'key'>,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      recipe: current.recipe.map((row) =>
        row.key === key ? { ...row, [field]: value } : row
      ),
    }));
  }

  function addRecipeRow() {
    setForm((current) => ({
      ...current,
      recipe: [...current.recipe, buildRecipeRow()],
    }));
  }

  function removeRecipeRow(key: string) {
    setForm((current) => ({
      ...current,
      recipe: current.recipe.filter((row) => row.key !== key),
    }));
  }

  function parseMenuForm() {
    const name = form.name.trim();
    const cost = Number(form.cost);
    const categoryId = form.categoryId ? Number(form.categoryId) : null;
    const recipe = form.recipe
      .map((row) => ({
        inventoryId: Number(row.inventoryId),
        itemQuantity: Number(row.itemQuantity),
      }))
      .filter(
        (row) =>
          Number.isInteger(row.inventoryId) &&
          row.inventoryId > 0 &&
          Number.isFinite(row.itemQuantity) &&
          row.itemQuantity > 0
      );

    if (!name || !Number.isFinite(cost) || cost < 0) {
      return null;
    }

    return {
      name,
      cost,
      imageUrl: form.imageUrl.trim() || null,
      categoryId,
      recipe,
    };
  }

  async function handleMenuSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isImageUploading) {
      setError('Wait for the image upload to finish before saving.');
      setNotice(null);
      return;
    }

    const imageUrl = form.imageUrl.trim();

    if (imageUrl && (!isValidImageUrl(imageUrl) || imageError)) {
      setError(
        imageError || 'Enter a valid image URL or upload a JPEG, PNG, or WebP file.'
      );
      setNotice(null);
      return;
    }

    const input = parseMenuForm();

    if (!input) {
      setError('Enter a menu item name, valid price, and recipe ingredients.');
      setNotice(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await authFetch('/api/manager/menu', {
        method: editingItem ? 'PATCH' : 'POST',
        body: JSON.stringify(
          editingItem ? { menuId: editingItem.menuId, ...input } : input
        ),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save menu item.');
      }

      if (editingItem) {
        setItems((current) =>
          current.map((item) => (item.menuId === data.menuId ? data : item))
        );
        setNotice('Menu item updated.');
      } else {
        setItems((current) => [...current, data]);
        setNotice('Menu item created.');
      }

      closeModal();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save menu item.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteMenuItem(item: ManagerMenuItem) {
    const confirmed = window.confirm(
      `${item.isActive ? 'Delete or archive' : 'Delete'} ${item.name}? Used items will be archived instead of removed.`
    );

    if (!confirmed) return;

    setError(null);
    setNotice(null);

    try {
      const response = await authFetch('/api/manager/menu', {
        method: 'DELETE',
        body: JSON.stringify({ menuId: item.menuId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete menu item.');
      }

      if (data.deleted) {
        setItems((current) =>
          current.filter((currentItem) => currentItem.menuId !== item.menuId)
        );
        setNotice('Menu item deleted.');
      } else {
        await loadData();
        setNotice('Menu item archived.');
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete menu item.'
      );
    }
  }

  async function restoreMenuItem(item: ManagerMenuItem) {
    setError(null);
    setNotice(null);

    try {
      const response = await authFetch('/api/manager/menu/restore', {
        method: 'POST',
        body: JSON.stringify({ menuId: item.menuId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to restore menu item.');
      }

      await loadData();
      setNotice('Menu item restored.');
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : 'Failed to restore menu item.'
      );
    }
  }

  function startCategoryEdit(category: MenuCategory) {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      color: category.color,
    });
  }

  function resetCategoryForm() {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setIsColorPanelOpen(false);
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = categoryForm.name.trim();

    if (!name) {
      setError('Enter a category name.');
      setNotice(null);
      return;
    }

    setError(null);
    setNotice(null);

    try {
      const response = await authFetch('/api/manager/menu/categories', {
        method: editingCategory ? 'PATCH' : 'POST',
        body: JSON.stringify({
          categoryId: editingCategory?.categoryId,
          name,
          color: categoryForm.color || '#667463',
          isActive: editingCategory?.isActive ?? true,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save category.');
      }

      setCategories((current) =>
        sortCategories(
          editingCategory
            ? current.map((category) =>
                category.categoryId === data.categoryId ? data : category
              )
            : [...current, data]
        )
      );
      resetCategoryForm();
      setNotice(editingCategory ? 'Category updated.' : 'Category created.');
    } catch (categoryError) {
      setError(
        categoryError instanceof Error
          ? categoryError.message
          : 'Failed to save category.'
      );
    }
  }

  async function deleteCategory(category: MenuCategory) {
    const confirmed = window.confirm(
      `Remove ${category.name}? Categories used by menu items will be deactivated.`
    );

    if (!confirmed) return;

    setError(null);
    setNotice(null);

    try {
      const response = await authFetch('/api/manager/menu/categories', {
        method: 'DELETE',
        body: JSON.stringify({ categoryId: category.categoryId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove category.');
      }

      await loadData();
      setDraftCategories((current) =>
        current.filter((item) => item.categoryId !== category.categoryId)
      );
      setNotice(data.deleted ? 'Category deleted.' : 'Category deactivated.');
    } catch (categoryError) {
      setError(
        categoryError instanceof Error
          ? categoryError.message
          : 'Failed to remove category.'
      );
    }
  }

  function openCategoryModal() {
    setDraftCategories(sortCategories(categories));
    setDraggedCategoryId(null);
    setIsCategoryModalOpen(true);
  }

  function moveDraftCategory(targetCategoryId: number) {
    if (draggedCategoryId === null || draggedCategoryId === targetCategoryId) return;

    setDraftCategories((current) => {
      const dragged = current.find((category) => category.categoryId === draggedCategoryId);
      const next = current.filter((category) => category.categoryId !== draggedCategoryId);
      const targetIndex = next.findIndex(
        (category) => category.categoryId === targetCategoryId
      );

      if (!dragged || targetIndex === -1) return current;
      next.splice(targetIndex, 0, dragged);
      return next;
    });
  }

  async function saveCategoryOrder() {
    setError(null);
    setNotice(null);

    try {
      const response = await authFetch('/api/manager/menu/categories/reorder', {
        method: 'POST',
        body: JSON.stringify({
          categoryIds: draftCategories.map((category) => category.categoryId),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save category order.');
      }

      setCategories(sortCategories(data));
      setIsCategoryModalOpen(false);
      setNotice('Category order updated.');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save category order.'
      );
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-[#cfd9ca] bg-[#f7faf5] p-6 shadow-[0_18px_50px_rgba(31,37,32,0.06)] sm:p-8">
        <div className="flex flex-col gap-5 border-b border-[#dbe4d6] pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#667463]">
              Menu
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#223020] sm:text-4xl">
              Items, categories, and recipes
            </h2>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center self-start rounded-full bg-[#3f8a5a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(63,138,90,0.18)] transition hover:bg-[#34784d]"
          >
            New Menu Item
          </button>
        </div>

        {notice ? (
          <div className="mt-5 rounded-[18px] border border-[#b7d7bd] bg-[#eef8ef] px-4 py-3 text-sm font-semibold text-[#28613a]">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="mt-5 rounded-[18px] border border-[#e0b1aa] bg-[#fff2f0] px-4 py-3 text-sm font-semibold text-[#91463d]">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777]">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="mt-2 w-full rounded-[18px] border border-[#d8e2d3] bg-white px-4 py-3 text-[#223020] focus:outline-none focus:ring-2 focus:ring-[#9db59a]"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                  {category.isActive ? '' : ' (inactive)'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex rounded-full border border-[#d8e2d3] bg-white p-1">
            {(['active', 'archived', 'all'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                  filter === value
                    ? 'bg-[#223020] text-white'
                    : 'text-[#586756] hover:bg-[#eef4eb]'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <details className="mt-5 rounded-[24px] border border-[#d9e3d5] bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-[#667463]">
            Manage Categories
          </summary>
          <div className="mt-5 space-y-3">
            <form
              onSubmit={handleCategorySubmit}
              className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-end"
            >
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8777]">
                  Category Name
                </span>
                <input
                  ref={categoryNameInputRef}
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={`h-[50px] w-full rounded-[16px] border px-4 py-3 text-[#223020] transition focus:outline-none focus:ring-2 focus:ring-[#9db59a] ${
                    editingCategory
                      ? 'border-[#3f8a5a] bg-[#eef8ef] shadow-[0_0_0_3px_rgba(63,138,90,0.14)]'
                      : 'border-[#d8e2d3] bg-[#fbfdfb]'
                  }`}
                  placeholder="Category name"
                />
              </label>
              <div className="relative self-end">
                <button
                  type="button"
                  onClick={() => setIsColorPanelOpen((current) => !current)}
                  className="grid h-[50px] w-[50px] place-items-center rounded-full bg-transparent transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#9db59a]/35"
                  aria-expanded={isColorPanelOpen}
                  aria-label="Choose category color"
                  title="Choose category color"
                >
                  <span
                    className="h-9 w-9 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(34,48,32,0.14),0_8px_18px_rgba(34,48,32,0.14)]"
                    style={{ backgroundColor: categoryForm.color }}
                  />
                </button>
                {isColorPanelOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-72 rounded-[18px] border border-[#d8e2d3] bg-white p-4 shadow-[0_18px_42px_rgba(31,37,32,0.16)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8777]">
                      Presets
                    </p>
                    <div className="mt-3 grid grid-cols-8 gap-2">
                      {categoryColorPresets.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setCategoryForm((current) => ({ ...current, color }));
                            setIsColorPanelOpen(false);
                          }}
                          className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${
                            categoryForm.color.toLowerCase() === color.toLowerCase()
                              ? 'border-[#223020] shadow-[0_0_0_2px_rgba(63,138,90,0.18)]'
                              : 'border-white shadow-[0_0_0_1px_rgba(34,48,32,0.12)]'
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Use category color ${color}`}
                          title={color.toUpperCase()}
                        />
                      ))}
                    </div>
                    <label
                      className="mt-4 flex cursor-pointer items-center justify-between rounded-[14px] border border-[#d8e2d3] bg-[#fbfdfb] px-3 py-2 text-sm font-semibold text-[#586756] transition hover:bg-[#f5f8f3]"
                      title="Pick custom category color"
                    >
                      <span>Custom color</span>
                      <span
                        className="h-7 w-7 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(34,48,32,0.14)]"
                        style={{ backgroundColor: categoryForm.color }}
                      />
                      <input
                        type="color"
                        value={categoryForm.color}
                        onChange={(event) =>
                          setCategoryForm((current) => ({
                            ...current,
                            color: event.target.value,
                          }))
                        }
                        className="sr-only"
                        aria-label="Custom category color"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 self-end sm:flex-row xl:justify-end">
                <button
                  type="submit"
                  className="inline-flex h-[50px] items-center justify-center rounded-full bg-[#3f8a5a] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(63,138,90,0.18)] transition hover:bg-[#34784d]"
                >
                  {editingCategory ? 'Save Category' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={openCategoryModal}
                  className="inline-flex h-[50px] items-center justify-center rounded-full border border-[#b9c8b4] bg-[#f8fbf7] px-5 py-2 text-sm font-semibold text-[#3f5f3c] transition hover:bg-[#eef4eb]"
                >
                  Edit Categories
                </button>
              </div>
            </form>
            {editingCategory ? (
              <div className="flex items-center justify-between rounded-[16px] border border-[#d8e2d3] bg-[#f8fbf7] px-4 py-3">
                <p className="text-sm text-[#586756]">
                  Editing <span className="font-bold text-[#223020]">{editingCategory.name}</span>. New categories are added to the end automatically.
                </p>
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="rounded-full border border-[#d4ddd0] bg-white px-4 py-2 text-sm font-semibold text-[#586756] transition hover:bg-[#f5f8f3]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="text-xs font-medium text-[#667463]">
                New categories are appended at the end. Category order is controlled from the edit modal.
              </p>
            )}
          </div>
        </details>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-[#d9e3d5] bg-white">
          <div className="hidden grid-cols-[1.5fr_0.9fr_0.8fr_0.8fr_auto] gap-4 border-b border-[#dfe8da] bg-[#edf4ea] px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-[#6c7968] xl:grid">
            <span>Menu Item</span>
            <span>Category</span>
            <span>Price</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-[#ebf0e8]">
            {isLoading ? (
              <div className="px-6 py-10 text-center text-[#677564]">
                Loading menu items...
              </div>
            ) : null}
            {!isLoading && filteredItems.length === 0 ? (
              <div className="px-6 py-10 text-center text-[#677564]">
                No menu items match this view.
              </div>
            ) : null}
            {!isLoading
              ? filteredItems.map((item) => {
                  return (
                    <article
                      key={item.menuId}
                      className={`grid gap-4 px-6 py-5 xl:grid-cols-[1.5fr_0.9fr_0.8fr_0.8fr_auto] xl:items-center ${
                        item.isActive ? 'bg-white' : 'bg-[#fff8f1]'
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-[#223020]">
                            {item.name}
                          </h3>
                          {!item.isActive ? (
                            <span className="rounded-full border border-[#b98712] bg-[#fff8d7] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#6b4a08]">
                              Archived
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] xl:hidden">
                          Category
                        </p>
                        <span
                          className="mt-1 inline-flex rounded-full px-3 py-1 text-sm font-bold text-white"
                          style={{
                            backgroundColor:
                              item.categoryColor ?? '#667463',
                          }}
                        >
                          {item.categoryName ?? 'Unassigned'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] xl:hidden">
                          Price
                        </p>
                        <p className="text-base font-semibold text-[#223020]">
                          {currencyFormatter.format(item.cost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] xl:hidden">
                          Status
                        </p>
                        <p className="text-sm font-semibold text-[#586756]">
                          {item.salesNum} sold
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1 xl:justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="rounded-lg p-2 text-[#2f7a5f] transition hover:bg-[#ecf4f0]"
                          title="Edit menu item"
                          aria-label={`Edit ${item.name}`}
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" />
                            <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                          </svg>
                        </button>
                        {item.isActive ? (
                          <button
                            type="button"
                            onClick={() => deleteMenuItem(item)}
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                            title="Delete or archive menu item"
                            aria-label={`Delete or archive ${item.name}`}
                          >
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="m19 6-1 14H6L5 6" />
                              <path d="M10 11v5M14 11v5" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => restoreMenuItem(item)}
                            className="rounded-lg p-2 text-[#223020] transition hover:bg-[#eef1ec]"
                            title="Restore menu item"
                            aria-label={`Restore ${item.name}`}
                          >
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path d="M3 12a9 9 0 1 0 3-6.7" />
                              <path d="M3 4v6h6" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })
              : null}
          </div>
        </div>
      </div>

      {isMounted && isModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[rgba(34,48,32,0.35)] p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-[#d9e3d5] bg-white p-6 shadow-[0_22px_60px_rgba(31,37,32,0.20)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#667463]">
                  {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-[#223020]">
                  {form.name.trim() || 'Menu Item'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-[#d9e3d5] px-3 py-1 text-sm font-semibold text-[#586756] transition hover:bg-[#f5f8f3]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleMenuSubmit} className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777]">
                    Item Name
                  </span>
                  <input
                    value={form.name}
                    onChange={(event) => updateForm('name', event.target.value)}
                    className="mt-2 w-full rounded-[18px] border border-[#d8e2d3] bg-[#fbfdfb] px-4 py-3 text-[#223020] focus:outline-none focus:ring-2 focus:ring-[#9db59a]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777]">
                    Price
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={(event) => updateForm('cost', event.target.value)}
                    className="mt-2 w-full rounded-[18px] border border-[#d8e2d3] bg-[#fbfdfb] px-4 py-3 text-[#223020] focus:outline-none focus:ring-2 focus:ring-[#9db59a]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777]">
                    Category
                  </span>
                  <select
                    value={form.categoryId}
                    onChange={(event) =>
                      updateForm('categoryId', event.target.value)
                    }
                    className="mt-2 w-full rounded-[18px] border border-[#d8e2d3] bg-white px-4 py-3 text-[#223020] focus:outline-none focus:ring-2 focus:ring-[#9db59a]"
                  >
                    <option value="">Unassigned</option>
                    {activeCategories.map((category) => (
                      <option key={category.categoryId} value={category.categoryId}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsImageDragActive(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsImageDragActive(true);
                  }}
                  onDragLeave={() => setIsImageDragActive(false)}
                  onDrop={handleImageDrop}
                  onPaste={handleImagePaste}
                  className={`md:col-span-2 rounded-[24px] border p-4 transition ${
                    isImageDragActive
                      ? 'border-[#3f8a5a] bg-[#eef8ef] shadow-[0_0_0_3px_rgba(63,138,90,0.14)]'
                      : 'border-[#e4ece0] bg-[#f8fbf7]'
                  }`}
                >
                  <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[18px] border border-[#d8e2d3] bg-white">
                      {form.imageUrl.trim() ? (
                        <img
                          src={form.imageUrl.trim()}
                          alt={form.name.trim() || 'Menu item preview'}
                          className="h-full w-full object-cover"
                          onLoad={() => setImageError(null)}
                          onError={() =>
                            setImageError(
                              'Image preview failed to load. Use another URL or upload a different file.'
                            )
                          }
                        />
                      ) : (
                        <div className="px-4 text-center text-sm font-semibold text-[#7a8777]">
                          No image selected
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777]">
                          Drink Image
                        </p>
                        <p className="mt-1 text-sm text-[#586756]">
                          Choose a file, drop one here, paste an image, or keep using a public URL.
                        </p>
                      </div>

                      <input
                        ref={imageFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) =>
                          uploadMenuImage(event.target.files?.[0])
                        }
                      />

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => imageFileInputRef.current?.click()}
                          disabled={isImageUploading}
                          className="rounded-full bg-[#2f7a5f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#28684f] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isImageUploading ? 'Uploading...' : 'Choose Image'}
                        </button>
                        {form.imageUrl.trim() ? (
                          <button
                            type="button"
                            onClick={() => updateImageUrl('')}
                            disabled={isImageUploading}
                            className="rounded-full border border-[#d4ddd0] bg-white px-4 py-2 text-sm font-semibold text-[#586756] transition hover:bg-[#f5f8f3] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Clear Image
                          </button>
                        ) : null}
                      </div>

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777]">
                          Image URL
                        </span>
                        <input
                          value={form.imageUrl}
                          onChange={(event) => updateImageUrl(event.target.value)}
                          placeholder="https://example.com/drink.jpg or /images/drink.png"
                          className="mt-2 w-full rounded-[18px] border border-[#d8e2d3] bg-white px-4 py-3 text-[#223020] focus:outline-none focus:ring-2 focus:ring-[#9db59a]"
                        />
                      </label>

                      {imageUploadError ? (
                        <p className="text-sm font-semibold text-[#91463d]">
                          {imageUploadError}
                        </p>
                      ) : null}
                      {imageError ? (
                        <p className="text-sm font-semibold text-[#91463d]">
                          {imageError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#e4ece0] bg-[#f8fbf7] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-[#223020]">
                      Recipe Ingredients
                    </h4>
                    <p className="text-sm text-[#586756]">
                      Each row deducts inventory when the drink is sold.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addRecipeRow}
                    className="rounded-full bg-[#2f7a5f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#28684f]"
                  >
                    Add Ingredient
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {form.recipe.map((row) => (
                    <div
                      key={row.key}
                      className="grid gap-3 rounded-[18px] border border-[#d8e2d3] bg-white p-3 md:grid-cols-[1fr_140px_auto]"
                    >
                      <select
                        value={row.inventoryId}
                        onChange={(event) =>
                          updateRecipeRow(
                            row.key,
                            'inventoryId',
                            event.target.value
                          )
                        }
                        className="rounded-[14px] border border-[#d8e2d3] bg-white px-3 py-2 text-[#223020] focus:outline-none focus:ring-2 focus:ring-[#9db59a]"
                        aria-label="Recipe ingredient"
                      >
                        <option value="">Select ingredient</option>
                        {activeInventory.map((inventoryItem) => (
                          <option
                            key={inventoryItem.inventoryId}
                            value={inventoryItem.inventoryId}
                          >
                            {inventoryItem.name}
                            {inventoryItem.categoryName
                              ? ` (${inventoryItem.categoryName})`
                              : ''}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={row.itemQuantity}
                        onChange={(event) =>
                          updateRecipeRow(
                            row.key,
                            'itemQuantity',
                            event.target.value
                          )
                        }
                        className="rounded-[14px] border border-[#d8e2d3] bg-white px-3 py-2 text-[#223020] focus:outline-none focus:ring-2 focus:ring-[#9db59a]"
                        aria-label={`${getInventoryName(
                          inventory,
                          row.inventoryId
                        )} quantity`}
                      />
                      <button
                        type="button"
                        onClick={() => removeRecipeRow(row.key)}
                        className="rounded-full border border-[#d9aaa4] px-4 py-2 text-sm font-semibold text-[#91463d] transition hover:bg-[#fff2f0]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded-full border border-[#d4ddd0] bg-white px-5 py-2 text-sm font-semibold text-[#586756] transition hover:bg-[#f5f8f3] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isImageUploading}
                  className="rounded-full bg-[#223020] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#172014] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? 'Saving...'
                    : isImageUploading
                      ? 'Uploading image...'
                      : 'Save Menu Item'}
                </button>
              </div>
            </form>
          </div>
            </div>,
            document.body
          )
        : null}
      {isMounted && isCategoryModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(34,48,32,0.45)] p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[#d9e3d5] bg-white p-6 shadow-[0_22px_60px_rgba(31,37,32,0.20)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#667463]">
                      Categories
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-[#223020]">
                      Reorder categories
                    </h3>
                    <p className="mt-2 text-sm text-[#586756]">
                      Drag rows to set display order. We save the database order from top to bottom.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="rounded-full border border-[#d9e3d5] px-3 py-1 text-sm font-semibold text-[#586756] transition hover:bg-[#f5f8f3]"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 overflow-hidden rounded-[22px] border border-[#d9e3d5]">
                  <div className="grid grid-cols-[1.6fr_0.7fr_0.8fr_auto] gap-3 border-b border-[#dfe8da] bg-[#edf4ea] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#6c7968]">
                    <span>Name</span>
                    <span>Color</span>
                    <span>Display Order</span>
                    <span>Actions</span>
                  </div>
                  <div className="divide-y divide-[#ebf0e8]">
                    {draftCategories.map((category, index) => {
                      const isDragging = draggedCategoryId === category.categoryId;

                      return (
                      <div
                        key={category.categoryId}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData(
                            'text/plain',
                            String(category.categoryId)
                          );
                          setDraggedCategoryId(category.categoryId);
                        }}
                        onDragEnd={() => setDraggedCategoryId(null)}
                        onDragEnter={() => moveDraftCategory(category.categoryId)}
                        onDragOver={(event) => {
                          event.preventDefault();
                          moveDraftCategory(category.categoryId);
                        }}
                        onDrop={() => {
                          moveDraftCategory(category.categoryId);
                          setDraggedCategoryId(null);
                        }}
                        className={`grid cursor-grab grid-cols-[1.6fr_0.7fr_0.8fr_auto] items-center gap-3 px-4 py-4 transition-all duration-200 active:cursor-grabbing ${
                          isDragging
                            ? 'relative z-10 scale-[1.02] border-y border-[#9db59a] bg-[#eef8ef] opacity-80 shadow-[0_18px_34px_rgba(31,37,32,0.18)]'
                            : 'bg-white hover:bg-[#f8fbf7]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[#9aa695]">::</span>
                          <div>
                            <p className="font-bold text-[#223020]">{category.name}</p>
                            {!category.isActive ? (
                              <p className="text-xs font-semibold text-[#91463d]">Inactive</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-5 w-5 rounded-full border border-black/10"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-semibold text-[#586756]">
                            {category.color.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[#586756]">{index + 1}</p>
                        <div className="flex gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              startCategoryEdit(category);
                              setIsCategoryModalOpen(false);
                            }}
                            className="rounded-lg p-2 text-[#2f7a5f] transition hover:bg-[#ecf4f0]"
                            title="Edit category"
                            aria-label={`Edit ${category.name}`}
                          >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                              <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" />
                              <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCategory(category)}
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                            title="Remove category"
                            aria-label={`Remove ${category.name}`}
                          >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="m19 6-1 14H6L5 6" />
                              <path d="M10 11v5M14 11v5" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="rounded-full border border-[#d4ddd0] bg-white px-5 py-2 text-sm font-semibold text-[#586756] transition hover:bg-[#f5f8f3]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveCategoryOrder}
                    className="rounded-full bg-[#223020] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#172014]"
                  >
                    Save Order
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}
