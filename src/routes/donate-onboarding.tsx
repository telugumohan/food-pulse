import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { upsertDonorProfile } from '@/api/supabaseApi';
import {
  validateOrganizationName,
  validateAddress,
  validateCity,
  validateLatitude,
  validateLongitude,
} from '@/api/validation';
import FormField from '@/components/FormField';
import LocationPicker from '@/components/LocationPicker';
import { Button } from '@/components/ui/button';

type OrgType = 'restaurant' | 'caterer' | 'hostel_mess' | 'canteen' | 'event_organizer';

export default function DonorOnboardingPage() {
  const { session, profile: commonProfile } = useSession();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrgType>('restaurant');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState(commonProfile?.city ?? '');
  const [latitude, setLatitude] = useState<number | null>(commonProfile?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(commonProfile?.longitude ?? null);

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
    if (!addressLine) setAddressLine(fullAddress);
    if (!city && cityName) setCity(cityName);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const newErrors: Record<string, string> = {};
    const orgErr = validateOrganizationName(orgName);
    if (orgErr) newErrors.orgName = orgErr;
    const addrErr = validateAddress(addressLine);
    if (addrErr) newErrors.addressLine = addrErr;
    const cityErr = validateCity(city);
    if (cityErr) newErrors.city = cityErr;
    const latErr = validateLatitude(latitude ?? '');
    if (latErr) newErrors.latitude = latErr;
    const lngErr = validateLongitude(longitude ?? '');
    if (lngErr) newErrors.longitude = lngErr;

    setErrors(newErrors);
    setFormError(null);
    if (Object.keys(newErrors).length > 0) return;

    if (!session?.userId) {
      setFormError('Your session has expired. Please sign in again.');
      return;
    }

    setSaving(true);
    try {
      const res = await upsertDonorProfile({
        id: session.userId,
        organizationName: orgName.trim(),
        organizationType: orgType,
        addressLine: addressLine.trim(),
        city: city.trim(),
        latitude: latitude!,
        longitude: longitude!,
      });

      if (res.error) {
        setFormError(res.error.message);
        setSaving(false);
      } else {
        navigate('/donate');
      }
    } catch {
      setFormError('Failed to save donor profile. Please try again.');
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-6 text-foreground space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Donor Registration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us about your organization so volunteers can locate and collect your donations.
        </p>
      </header>

      {formError && (
        <div className="rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Organization Name"
          required
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          error={errors.orgName}
          disabled={saving}
          placeholder="e.g. Green Leaf Kitchen"
        />

        <FormField
          label="Organization Type"
          control="select"
          required
          value={orgType}
          onChange={(e) => setOrgType(e.target.value as OrgType)}
          disabled={saving}
          options={[
            { value: 'restaurant', label: 'Restaurant' },
            { value: 'caterer', label: 'Caterer' },
            { value: 'hostel_mess', label: 'Hostel / Mess' },
            { value: 'canteen', label: 'Canteen' },
            { value: 'event_organizer', label: 'Event Organizer' },
          ]}
        />

        <FormField
          label="Address Line"
          required
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          error={errors.addressLine}
          disabled={saving}
          placeholder="Street address, building, or landmark"
        />

        <FormField
          label="City"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          error={errors.city}
          disabled={saving}
          placeholder="e.g. Mumbai"
        />

        <div className="space-y-1.5">
          <label className="text-[0.8125rem] font-semibold text-foreground">
            Pickup Location Pin <span className="text-destructive">*</span>
          </label>
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onLocationChange={handleLocationChange}
            onAddressFound={handleAddressFound}
            disabled={saving}
          />
          {(errors.latitude || errors.longitude) && (
            <p className="text-xs text-destructive">
              {errors.latitude || errors.longitude}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Complete Donor Setup'}
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
