import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { getReceiverProfile, createFoodRequest } from '@/api/supabaseApi';
import type { ReceiverProfile } from '@/api/types';
import {
  validateTotalMeals,
  validatePureVegMeals,
  validateDeadline,
  validateAddress,
  validateCity,
  validateLatitude,
  validateLongitude,
} from '@/api/validation';
import FormField from '@/components/FormField';
import LocationPicker from '@/components/LocationPicker';
import { Button } from '@/components/ui/button';

export default function CreateFoodRequestPage() {
  const { session } = useSession();
  const navigate = useNavigate();

  const [receiverProfile, setReceiverProfile] = useState<ReceiverProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [totalMeals, setTotalMeals] = useState<string>('10');
  const [pureVegMeals, setPureVegMeals] = useState<string>('0');
  const [neededBefore, setNeededBefore] = useState('');
  const [receivingAddress, setReceivingAddress] = useState('');
  const [receivingCity, setReceivingCity] = useState('');
  const [receivingLat, setReceivingLat] = useState<number | null>(null);
  const [receivingLng, setReceivingLng] = useState<number | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.userId) return;
    getReceiverProfile(session.userId)
      .then((res) => {
        if (!res.data) {
          navigate('/receive/onboarding', { replace: true });
        } else {
          setReceiverProfile(res.data);
          setReceivingAddress(res.data.addressLine);
          setReceivingCity(res.data.city);
          setReceivingLat(res.data.latitude);
          setReceivingLng(res.data.longitude);
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [session?.userId, navigate]);

  if (loadingProfile) {
    return (
      <main className="mx-auto w-full max-w-2xl p-4 sm:p-6 text-foreground">
        <p className="text-sm text-muted-foreground">Verifying receiver profile…</p>
      </main>
    );
  }

  const parsedTotal = parseInt(totalMeals, 10) || 0;
  const parsedPureVeg = parseInt(pureVegMeals, 10) || 0;
  const flexibleDemand = Math.max(parsedTotal - parsedPureVeg, 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || !session?.userId) return;

    const newErrors: Record<string, string> = {};
    const totalErr = validateTotalMeals(totalMeals, 'Total meals required');
    if (totalErr) newErrors.totalMeals = totalErr;

    const vegErr = validatePureVegMeals(pureVegMeals, parsedTotal);
    if (vegErr) newErrors.pureVegMeals = vegErr;

    const dateErr = validateDeadline(neededBefore);
    if (dateErr) newErrors.neededBefore = dateErr;

    const addrErr = validateAddress(receivingAddress);
    if (addrErr) newErrors.receivingAddress = addrErr;

    const cityErr = validateCity(receivingCity);
    if (cityErr) newErrors.receivingCity = cityErr;

    const latErr = validateLatitude(receivingLat ?? '');
    if (latErr) newErrors.latitude = latErr;

    const lngErr = validateLongitude(receivingLng ?? '');
    if (lngErr) newErrors.longitude = lngErr;

    setErrors(newErrors);
    setFormError(null);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await createFoodRequest({
        receiverId: session.userId,
        initialTotalMeals: parsedTotal,
        initialPureVegMeals: parsedPureVeg,
        neededBeforeAt: new Date(neededBefore).toISOString(),
        receivingAddress: receivingAddress.trim(),
        receivingCity: receivingCity.trim(),
        receivingLatitude: receivingLat!,
        receivingLongitude: receivingLng!,
      });

      if (res.error) {
        setFormError(res.error.message);
        setSaving(false);
      } else {
        navigate('/receive');
      }
    } catch {
      setFormError('Failed to create food request. Please check inputs.');
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-6 text-foreground space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Create Food Request</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Specify the total number of portions needed and any pure-vegetarian dietary restrictions.
        </p>
      </header>

      {formError && (
        <div className="rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Total Meals Required"
            type="number"
            min="1"
            required
            value={totalMeals}
            onChange={(e) => setTotalMeals(e.target.value)}
            error={errors.totalMeals}
            disabled={saving}
          />
          <FormField
            label="Pure Vegetarian Portion"
            type="number"
            min="0"
            max={parsedTotal}
            required
            value={pureVegMeals}
            onChange={(e) => setPureVegMeals(e.target.value)}
            error={errors.pureVegMeals}
            disabled={saving}
            hint="Strict veg required"
          />
        </div>

        {/* Display flexible demand per PRD §8.3 */}
        <div className="rounded-[var(--radius)] border border-border bg-muted/40 p-3 flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Flexible demand (veg or non-veg accepted):</span>
          <span className="font-bold text-foreground text-base">{flexibleDemand} meals</span>
        </div>

        <FormField
          label="Needed Before (Deadline)"
          type="datetime-local"
          required
          value={neededBefore}
          onChange={(e) => setNeededBefore(e.target.value)}
          error={errors.neededBefore}
          disabled={saving}
          hint="Deliveries must arrive before this cutoff"
        />

        <FormField
          label="Receiving Address"
          required
          value={receivingAddress}
          onChange={(e) => setReceivingAddress(e.target.value)}
          error={errors.receivingAddress}
          disabled={saving}
        />

        <FormField
          label="Receiving City"
          required
          value={receivingCity}
          onChange={(e) => setReceivingCity(e.target.value)}
          error={errors.receivingCity}
          disabled={saving}
        />

        <div className="space-y-1.5">
          <label className="text-[0.8125rem] font-semibold text-foreground">
            Drop-off Location Pin <span className="text-destructive">*</span>
          </label>
          <LocationPicker
            latitude={receivingLat}
            longitude={receivingLng}
            onLocationChange={(lat, lng) => {
              setReceivingLat(lat);
              setReceivingLng(lng);
            }}
            disabled={saving}
          />
        </div>

        <div className="flex gap-3 pt-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? 'Creating…' : 'Submit Food Request'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => navigate('/receive')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}
