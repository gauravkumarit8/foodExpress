import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@foodexpress/api-client';
import { api } from '../../lib/api';
import { getCurrentPosition } from '../../lib/geolocation';

export function CreateRestaurantPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cityId, setCityId] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function useCurrentLocation() {
    setLocating(true);
    const coords = await getCurrentPosition();
    if (coords) {
      setLatitude(String(coords.lat));
      setLongitude(String(coords.lng));
    } else {
      setError('Could not get your location — enter latitude/longitude manually.');
    }
    setLocating(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Latitude and longitude are required — use "Use my current location" or enter them manually.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const restaurant = await api.restaurants.create({
        name,
        description: description || undefined,
        cityId,
        address: address || undefined,
        latitude: lat,
        longitude: lng,
        imageUrl: imageUrl || undefined,
      });
      navigate(`/owner/restaurants/${restaurant.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the restaurant. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="font-display text-2xl font-bold text-ink">New restaurant</h1>
      <p className="mt-1 text-sm text-ink/60">This creates a listing customers can browse and order from.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-ticket border border-line bg-white px-3 py-2 text-ink focus:border-ticket-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Description (optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-ticket border border-line bg-white px-3 py-2 text-ink focus:border-ticket-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">City ID</label>
            <input
              required
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              placeholder="e.g. bengaluru"
              className="w-full rounded-ticket border border-line bg-white px-3 py-2 text-ink focus:border-ticket-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Street address (optional)</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-ticket border border-line bg-white px-3 py-2 text-ink focus:border-ticket-500"
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-ink">Location</label>
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
              className="text-xs font-medium text-ticket-500 hover:underline disabled:opacity-60"
            >
              {locating ? 'Locating…' : 'Use my current location'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              required
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Latitude"
              inputMode="decimal"
              className="w-full rounded-ticket border border-line bg-white px-3 py-2 font-mono text-sm text-ink focus:border-ticket-500"
            />
            <input
              required
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Longitude"
              inputMode="decimal"
              className="w-full rounded-ticket border border-line bg-white px-3 py-2 font-mono text-sm text-ink focus:border-ticket-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Image URL (optional)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-ticket border border-line bg-white px-3 py-2 text-ink focus:border-ticket-500"
          />
        </div>

        {error && <p className="text-sm text-ticket-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-ticket bg-ink py-2.5 font-medium text-paper hover:bg-ticket-500 disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create restaurant'}
        </button>
      </form>
    </div>
  );
}
