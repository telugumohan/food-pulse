import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { getDonorProfile, createDonation } from '@/api/supabaseApi';
import type { DonorProfile } from '@/api/types';
import {
  validateFoodDescription,
  validateHandlingInformation,
  validateAllergenInformation,
  validateAddress,
  validateCity,
  validateLatitude,
  validateLongitude,
  validateMealQuantity,
  validateDeadline,
} from '@/api/validation';
import FormField from '@/components/FormField';
import LocationPicker from '@/components/LocationPicker';
import { Button } from '@/components/ui/button';

export default function CreateDonationPage() {
  const { session } = useSession();
  const navigate = useNavigate();

  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [foodDesc, setFoodDesc] = useState('');
  const [vegMeals, setVegMeals] = useState<string>('0');
  const [nonVegMeals, setNonVegMeals] = useState<string>('0');
  const [bestBefore, setBestBefore] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [storageHandling, setStorageHandling] = useState('');
  const [allergenInfo, setAllergenInfo] = useState('');
  const [allergensUnknown, setAllergensUnknown] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.userId) return;
    getDonorProfile(session.userId)
      .then((res) => {
        if (!res.data) {
          navigate('/donate/onboarding', { replace: true });
        } else {
          setDonorProfile(res.data);
          setPickupAddress(res.data.addressLine);
          setPickupCity(res.data.city);
          setPickupLat(res.data.latitude);
          setPickupLng(res.data.longitude);
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [session?.userId, navigate]);

  if (loadingProfile) {
    return (
      <main className="mx-auto w-full max-w-2xl p-4 sm:p-6 text-foreground">
        <p className="text-sm text-muted-foreground">Checking donor verification…</p>
      </main>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || !session?.userId) return;

    const numVeg = parseInt(vegMeals, 10) || 0;
    const numNonVeg = parseInt(nonVegMeals, 10) || 0;
    const total = numVeg + numNonVeg;

    const newErrors: Record<string, string> = {};
    const descErr = validateFoodDescription(foodDesc);
    if (descErr) newErrors.foodDesc = descErr;

    const vegErr = validateMealQuantity(vegMeals, 'Vegetarian meals');
    if (vegErr) newErrors.vegMeals = vegErr;

    const nonVegErr = validateMealQuantity(nonVegMeals, 'Non-vegetarian meals');
    if (nonVegErr) newErrors.nonVegMeals = nonVegErr;

    if (total <= 0) {
      newErrors.totalMeals = 'Donation must include at least one meal.';
    }

    const bbErr = validateDeadline(bestBefore);
    if (bbErr) newErrors.bestBefore = bbErr;

    const auErr = validateDeadline(availableUntil);
    if (auErr) newErrors.availableUntil = auErr;

    if (bestBefore && availableUntil && Date.parse(availableUntil) < Date.parse(bestBefore)) {
      newErrors.availableUntil = 'Available until must be on or after best before date.';
    }

    const addrErr = validateAddress(pickupAddress);
    if (addrErr) newErrors.pickupAddress = addrErr;

    const cityErr = validateCity(pickupCity);
    if (cityErr) newErrors.pickupCity = cityErr;

    const latErr = validateLatitude(pickupLat ?? '');
    if (latErr) newErrors.latitude = latErr;

    const lngErr = validateLongitude(pickupLng ?? '');
    if (lngErr) newErrors.longitude = lngErr;

    const handleErr = validateHandlingInformation(storageHandling);
    if (handleErr) newErrors.storageHandling = handleErr;

    const allerErr = validateAllergenInformation(allergenInfo);
    if (allerErr) newErrors.allergenInfo = allerErr;

    if (!allergensUnknown && !allergenInfo.trim()) {
      newErrors.allergenInfo = 'Please list known allergens or check allergens unknown.';
    }

    setErrors(newErrors);
    setFormError(null);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await createDonation({
        donorId: session.userId,
        foodDescription: foodDesc.trim(),
        initialVegMeals: numVeg,
        initialNonVegMeals: numNonVeg,
        bestBeforeAt: new Date(bestBefore).toISOString(),
        availableUntilAt: new Date(availableUntil).toISOString(),
        pickupAddress: pickupAddress.trim(),
        pickupCity: pickupCity.trim(),
        pickupLatitude: pickupLat!,
        pickupLongitude: pickupLng!,
        storageHandlingInformation: storageHandling.trim(),
        allergenInformation: allergenInfo.trim() || null,
        allergensUnknown,
      });

      if (res.error) {
        setFormError(res.error.message);
        setSaving(false);
      } else {
        navigate('/donate');
      }
    } catch {
      setFormError('Failed to create donation. Please check your inputs.');
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-6 text-foreground space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Create Food Donation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Post surplus portions with safe handling details and pickup window.
        </p>
      </header>

      {formError && (
        <div className="rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Food Description"
          required
          value={foodDesc}
          onChange={(e) => setFoodDesc(e.target.value)}
          error={errors.foodDesc}
          disabled={saving}
          placeholder="e.g. 50 packs of rice and paneer curry with roti"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Vegetarian Meals"
            type="number"
            min="0"
            required
            value={vegMeals}
            onChange={(e) => setVegMeals(e.target.value)}
            error={errors.vegMeals}
            disabled={saving}
          />
          <FormField
            label="Non-Vegetarian Meals"
            type="number"
            min="0"
            required
            value={nonVegMeals}
            onChange={(e) => setNonVegMeals(e.target.value)}
            error={errors.nonVegMeals}
            disabled={saving}
          />
        </div>
        {errors.totalMeals && (
          <p className="text-xs text-destructive">{errors.totalMeals}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Best Before"
            type="datetime-local"
            required
            value={bestBefore}
            onChange={(e) => setBestBefore(e.target.value)}
            error={errors.bestBefore}
            disabled={saving}
            hint="Safe consumption cutoff time"
          />
          <FormField
            label="Available Until (Pickup Deadline)"
            type="datetime-local"
            required
            value={availableUntil}
            onChange={(e) => setAvailableUntil(e.target.value)}
            error={errors.availableUntil}
            disabled={saving}
            hint="Latest time volunteer can collect"
          />
        </div>

        <FormField
          label="Pickup Address"
          required
          value={pickupAddress}
          onChange={(e) => setPickupAddress(e.target.value)}
          error={errors.pickupAddress}
          disabled={saving}
        />

        <FormField
          label="Pickup City"
          required
          value={pickupCity}
          onChange={(e) => setPickupCity(e.target.value)}
          error={errors.pickupCity}
          disabled={saving}
        />

        <div className="space-y-1.5">
          <label className="text-[0.8125rem] font-semibold text-foreground">
            Pickup Location Pin <span className="text-destructive">*</span>
          </label>
          <LocationPicker
            latitude={pickupLat}
            longitude={pickupLng}
            onLocationChange={(lat, lng) => {
              setPickupLat(lat);
              setPickupLng(lng);
            }}
            disabled={saving}
          />
        </div>

        <FormField
          label="Storage & Handling Instructions"
          control="textarea"
          rows={3}
          required
          value={storageHandling}
          onChange={(e) => setStorageHandling(e.target.value)}
          error={errors.storageHandling}
          disabled={saving}
          placeholder="e.g. Keep refrigerated until collection. Reheat thoroughly before serving."
        />

        <div className="space-y-2">
          <FormField
            label="Allergen Information"
            control="textarea"
            rows={2}
            value={allergenInfo}
            onChange={(e) => setAllergenInfo(e.target.value)}
            error={errors.allergenInfo}
            disabled={saving || allergensUnknown}
            placeholder="e.g. Contains dairy and peanuts. Prepared in a nut-free facility."
          />
          <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
            <input
              type="checkbox"
              checked={allergensUnknown}
              onChange={(e) => setAllergensUnknown(e.target.checked)}
              disabled={saving}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <span>Allergens unknown / not provided</span>
          </label>
        </div>

        <div className="flex gap-3 pt-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? 'Publishing…' : 'Publish Donation'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => navigate('/donate')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}
