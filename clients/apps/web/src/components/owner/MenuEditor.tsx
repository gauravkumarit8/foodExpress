import { useState, type FormEvent } from 'react';
import { ApiError, type MenuItem } from '@foodexpress/api-client';
import { api } from '../../lib/api';

function EditableMenuItemRow({
  restaurantId,
  item,
  onChange,
}: {
  restaurantId: string;
  item: MenuItem;
  onChange: (updated: MenuItem) => void;
}) {
  const [price, setPrice] = useState(String(item.price));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function savePrice() {
    const value = parseFloat(price);
    if (Number.isNaN(value) || value < 0) {
      setError('Enter a valid price.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await api.restaurants.updateMenuItem(restaurantId, item.id, { price: value });
      onChange(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.restaurants.updateMenuItem(restaurantId, item.id, {
        isAvailable: !item.isAvailable,
      });
      onChange(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{item.name}</p>
        {item.category && <p className="text-xs text-ink/50">{item.category}</p>}
        {error && <p className="text-xs text-ticket-500">{error}</p>}
      </div>
      <div className="flex items-center gap-1">
        <span className="font-mono text-sm text-ink/60">₹</span>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={savePrice}
          inputMode="decimal"
          className="w-20 rounded-ticket border border-line bg-white px-2 py-1 font-mono text-sm text-ink focus:border-ticket-500"
        />
      </div>
      <button
        onClick={toggleAvailability}
        disabled={saving}
        className={`shrink-0 rounded-ticket border px-3 py-1.5 text-xs font-medium ${
          item.isAvailable
            ? 'border-pass-500 text-pass-700 hover:bg-pass-100'
            : 'border-line text-ink/40 hover:border-ticket-500'
        }`}
      >
        {item.isAvailable ? 'Available' : 'Unavailable'}
      </button>
    </div>
  );
}

function AddMenuItemForm({
  restaurantId,
  onAdded,
}: {
  restaurantId: string;
  onAdded: (item: MenuItem) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = parseFloat(price);
    if (Number.isNaN(value) || value < 0) {
      setError('Enter a valid price.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const item = await api.restaurants.createMenuItem(restaurantId, {
        name,
        category: category || undefined,
        description: description || undefined,
        price: value,
        imageUrl: imageUrl || undefined,
      });
      onAdded(item);
      setName('');
      setCategory('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add item.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-ticket border border-dashed border-line py-3 text-sm font-medium text-ink/60 hover:border-ticket-500 hover:text-ticket-500"
      >
        + Add menu item
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-ticket border border-line bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="col-span-2 rounded-ticket border border-line px-3 py-2 text-sm focus:border-ticket-500"
        />
        <input
          placeholder="Category (e.g. Mains)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-ticket border border-line px-3 py-2 text-sm focus:border-ticket-500"
        />
        <input
          required
          placeholder="Price"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="rounded-ticket border border-line px-3 py-2 text-sm focus:border-ticket-500"
        />
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="col-span-2 rounded-ticket border border-line px-3 py-2 text-sm focus:border-ticket-500"
        />
        <input
          placeholder="Image URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="col-span-2 rounded-ticket border border-line px-3 py-2 text-sm focus:border-ticket-500"
        />
      </div>
      {error && <p className="mt-2 text-xs text-ticket-500">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-ticket bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ticket-500 disabled:opacity-60"
        >
          {submitting ? 'Adding…' : 'Add item'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-ticket px-4 py-2 text-sm font-medium text-ink/50 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function MenuEditor({
  restaurantId,
  items,
  setItems,
}: {
  restaurantId: string;
  items: MenuItem[];
  setItems: (items: MenuItem[]) => void;
}) {
  const categories = Array.from(new Set(items.map((m) => m.category || 'Menu')));

  function handleItemChange(updated: MenuItem) {
    setItems(items.map((i) => (i.id === updated.id ? updated : i)));
  }

  return (
    <div className="space-y-6">
      {items.length === 0 ? (
        <p className="text-sm text-ink/50">No menu items yet — add your first one below.</p>
      ) : (
        categories.map((category) => (
          <div key={category}>
            <h3 className="mb-1 font-display text-sm font-bold uppercase tracking-widest text-ink/50">
              {category}
            </h3>
            <div className="rounded-ticket border border-line bg-white px-4">
              {items
                .filter((m) => (m.category || 'Menu') === category)
                .map((item) => (
                  <EditableMenuItemRow
                    key={item.id}
                    restaurantId={restaurantId}
                    item={item}
                    onChange={handleItemChange}
                  />
                ))}
            </div>
          </div>
        ))
      )}
      <AddMenuItemForm restaurantId={restaurantId} onAdded={(item) => setItems([...items, item])} />
    </div>
  );
}
