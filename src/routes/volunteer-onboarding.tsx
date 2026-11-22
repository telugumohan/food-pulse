import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { upsertVolunteerProfile } from '@/api/supabaseApi';
import { validateCity, validatePhone } from '@/api/validation';
import FormField from '@/components/FormField';
import LocationPicker from '@/components/LocationPicker';
import { Button } from '@/components/ui/button';

export default function VolunteerOnboarding() {
  const { session, profile: commonProfile, refresh } = useSession();
  const navigate = useNavigate();

  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [maxCapacity, setMaxCapacity] = useState('30');
  const [city, setCity] = useState(commonProfile?.city ?? '');
  const [baseAddress, setBaseAddress] = useState(commonProfile?.city ? `${commonProfile.city} Central` : '');
  const [latitude, setLatitude] = useState<number | null>(commonProfile?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(commonProfile?.longitude ?? null);
  const [contactPhone, setContactPhone] = useState(commonProfile?.phoneNumber ?? '');
  const [schedule, setSchedule] = useState('flexible');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.latitude;
      delete copy.longitude;
      return copy;
    });
  };

  const handleAddressFound = (fullAddress: string, cityName: string) => {
    if (!baseAddress) setBaseAddress(fullAddress);
    if (!city && cityName) setCity(cityName);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || !session?.userId) return;

    const newErrors: Record<string, string> = {};
    const cityErr = validateCity(city);
    if (cityErr) newErrors.city = cityErr;

    const phoneErr = validatePhone(contactPhone);
    if (phoneErr) newErrors.contactPhone = phoneErr;

    const capNum = parseInt(maxCapacity, 10);
    if (!capNum || capNum <= 0) {
      newErrors.maxCapacity = 'Meal capacity must be greater than 0.';
    }

    setErrors(newErrors);
    setFormError(null);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await upsertVolunteerProfile({
        id: session.userId,
        available: true,
        vehicleType,
        maxMealCapacity: capNum,
        operatingCity: city.trim(),
        baseAddress: baseAddress.trim(),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        contactPhone: contactPhone.trim(),
        schedulePreference: schedule,
      });

      if (res.error) {
        setFormError(res.error.message);
        setSaving(false);
      } else {
        await refresh();
        navigate('/volunteer');
      }
    } catch {
      setFormError('Failed to save volunteer details. Please try again.');
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 text-foreground sm:py-12 space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Volunteer Onboarding</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us your transport mode, area, and delivery capacity so we can route active food orders to you.
        </p>
      </header>

      {formError && (
        <div className="rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Transportation / Vehicle Mode"
          control="select"
          required
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          disabled={saving}
          options={[
            { value: 'motorcycle', label: 'Motorcycle / Scooter' },
            { value: 'car', label: 'Car' },
            { value: 'van', label: 'Van / Small Truck' },
            { value: 'bicycle', label: 'Bicycle / E-Bike' },
            { value: 'walking', label: 'On Foot / Public Transit' },
          ]}
          hint="Helps determine route distance and carrying capacity"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Carrying Capacity (Max Meals)"
            type="number"
            min="1"
            max="500"
            required
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(e.target.value)}
            error={errors.maxCapacity}
            disabled={saving}
            hint="Maximum portions you can carry at once"
          />

          <FormField
            label="Contact Phone Number"
            type="tel"
            required
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            error={errors.contactPhone}
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Primary Operating City"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            error={errors.city}
            disabled={saving}
            placeholder="e.g. Mumbai"
          />

          <FormField
            label="Availability Schedule"
            control="select"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            disabled={saving}
            options={[
              { value: 'flexible', label: 'Flexible / Anytime' },
              { value: 'morning', label: 'Mornings (8 AM – 12 PM)' },
              { value: 'afternoon', label: 'Afternoons (12 PM – 5 PM)' },
              { value: 'evening', label: 'Evenings (5 PM – 10 PM)' },
              { value: 'weekends', label: 'Weekends Only' },
            ]}
          />
        </div>

        <FormField
          label="Base Starting Address / Neighborhood"
          value={baseAddress}
          onChange={(e) => setBaseAddress(e.target.value)}
          disabled={saving}
          placeholder="e.g. Bandra Station or Central Market"
          hint="Your starting point for pickup route calculation"
        />

        <div className="space-y-1.5">
          <label className="text-[0.8125rem] font-semibold text-foreground">
            Base Location Pin
          </label>
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onLocationChange={handleLocationChange}
            onAddressFound={handleAddressFound}
            disabled={saving}
          />
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-card p-4 space-y-2 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground text-sm">Volunteer Service Commitments:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Food safety: Keep containers upright and deliver promptly within pickup deadlines.</li>
            <li>Live location is only requested during an active, accepted delivery order.</li>
            <li>You can toggle your availability on/off anytime from the volunteer portal.</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? 'Registering…' : 'Complete Volunteer Registration'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => navigate('/volunteer')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}
