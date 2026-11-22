import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { upsertProfile } from '@/api/supabaseApi';
import {
  validateCity,
  validateFullName,
  validateLatitude,
  validateLongitude,
  validatePhone,
} from '@/api/validation';
import AuthCard from '@/components/AuthCard';
import FormField from '@/components/FormField';
import LocationPicker from '@/components/LocationPicker';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/useSession';

type FieldName = 'fullName' | 'phoneNumber' | 'city' | 'latitude' | 'longitude';
type FieldErrors = Partial<Record<FieldName, string>>;

interface FormValues {
  fullName: string;
  phoneNumber: string;
  city: string;
  latitude: string;
  longitude: string;
}

const FIELD_NAMES: readonly FieldName[] = ['fullName', 'phoneNumber', 'city', 'latitude', 'longitude'];
const SAVE_FAILED_MESSAGE = 'We could not save your profile. Please try again.';

function validateValues(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const fullNameError = validateFullName(values.fullName);
  if (fullNameError) errors.fullName = fullNameError;
  const phoneError = validatePhone(values.phoneNumber);
  if (phoneError) errors.phoneNumber = phoneError;
  const cityError = validateCity(values.city);
  if (cityError) errors.city = cityError;
  const latitudeError = validateLatitude(values.latitude);
  if (latitudeError) errors.latitude = latitudeError;
  const longitudeError = validateLongitude(values.longitude);
  if (longitudeError) errors.longitude = longitudeError;
  return errors;
}

export default function OnboardingPage() {
  const { session, profile, refresh } = useSession();
  const navigate = useNavigate();

  const [values, setValues] = useState<FormValues>(() => ({
    fullName: profile?.fullName ?? '',
    phoneNumber: profile?.phoneNumber ?? '',
    city: profile?.city ?? '',
    latitude: profile ? String(profile.latitude) : '',
    longitude: profile ? String(profile.longitude) : '',
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: FieldName) => (event: { target: { value: string } }) => {
    const next = event.target.value;
    setValues((prev) => ({ ...prev, [field]: next }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setValues((prev) => ({
      ...prev,
      latitude: String(lat),
      longitude: String(lng),
    }));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.latitude;
      delete copy.longitude;
      return copy;
    });
  };

  const handleAddressFound = (_address: string, foundCity: string) => {
    if (!values.city && foundCity) {
      setValues((prev) => ({ ...prev, city: foundCity }));
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.city;
        return copy;
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setFormError(null);
    const errors = validateValues(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!session) {
      setFormError('Your session has ended. Please sign in again.');
      return;
    }

    setSaving(true);
    try {
      const response = await upsertProfile({
        id: session.userId,
        fullName: values.fullName.trim(),
        phoneNumber: values.phoneNumber.trim(),
        city: values.city.trim(),
        latitude: Number(values.latitude.trim()),
        longitude: Number(values.longitude.trim()),
        role: 'user',
      });

      if (response.error) {
        const field = response.error.field as FieldName | undefined;
        if (field && FIELD_NAMES.includes(field)) {
          setFieldErrors({ [field]: response.error.message });
        } else {
          setFormError(response.error.message || SAVE_FAILED_MESSAGE);
        }
        setSaving(false);
        return;
      }

      await refresh();
      navigate('/dashboard', { replace: true });
    } catch {
      setFormError(SAVE_FAILED_MESSAGE);
      setSaving(false);
    }
  };

  const currentLat = values.latitude ? Number(values.latitude) : null;
  const currentLng = values.longitude ? Number(values.longitude) : null;

  return (
    <AuthCard
      title="Complete your profile"
      description="Tell us a little about you so we can set up your FoodPulse account."
    >
      <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
        {formError ? (
          <p
            role="alert"
            className="rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </p>
        ) : null}

        <FormField
          label="Full name"
          name="fullName"
          autoComplete="name"
          required
          value={values.fullName}
          onChange={handleChange('fullName')}
          error={fieldErrors.fullName}
          disabled={saving}
        />
        <FormField
          label="Phone number"
          name="phoneNumber"
          type="tel"
          autoComplete="tel"
          required
          value={values.phoneNumber}
          onChange={handleChange('phoneNumber')}
          error={fieldErrors.phoneNumber}
          disabled={saving}
        />
        <FormField
          label="City"
          name="city"
          autoComplete="address-level2"
          required
          value={values.city}
          onChange={handleChange('city')}
          error={fieldErrors.city}
          disabled={saving}
        />

        {/* Interactive Leaflet Map for Location Pin */}
        <div className="space-y-1.5">
          <label className="text-[0.8125rem] font-semibold text-foreground">
            Location Pin <span className="text-destructive">*</span>
          </label>
          <LocationPicker
            latitude={currentLat}
            longitude={currentLng}
            onLocationChange={handleLocationChange}
            onAddressFound={handleAddressFound}
            disabled={saving}
          />
          {(fieldErrors.latitude || fieldErrors.longitude) && (
            <p className="text-xs text-destructive">
              {fieldErrors.latitude || fieldErrors.longitude}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FormField
            label="Latitude"
            name="latitude"
            placeholder="-90 to 90"
            required
            value={values.latitude}
            onChange={handleChange('latitude')}
            error={fieldErrors.latitude}
            disabled={saving}
          />
          <FormField
            label="Longitude"
            name="longitude"
            placeholder="-180 to 180"
            required
            value={values.longitude}
            onChange={handleChange('longitude')}
            error={fieldErrors.longitude}
            disabled={saving}
          />
        </div>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </AuthCard>
  );
}
