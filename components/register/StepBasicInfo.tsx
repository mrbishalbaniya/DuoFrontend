"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { StaticMapPreview } from "@/components/register/StaticMapPreview";
import { cn } from "@/lib/utils";
import { HeightSlider, parseHeightInches } from "@/components/profile/HeightSlider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { SelectField } from "@/components/ui/select-field";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
} from "@/lib/register/constants";
import { maxBirthDateForMinAge, minBirthDate } from "@/lib/age";
import {
  basicInfoSchema,
  type BasicInfoFormValues,
} from "@/lib/validation/registrationSchema";
import { detectUserLocation, formatShortLocationLabel, type DetectedLocation } from "@/lib/geolocation";
import { useRegistrationStore } from "@/store/registrationStore";
import type { RegistrationData } from "@/types/registration";

interface StepBasicInfoProps {
  onContinue: () => void;
  onBack: () => void;
}

type StoredLocation = {
  label: string;
  country: string;
  province: string;
  district: string;
  municipality: string;
  lat: number;
  lng: number;
  accuracyMeters: number | null;
};

function toStoredLocation(detected: DetectedLocation): StoredLocation {
  const municipality = detected.city.trim() || detected.district.trim() || "Unknown";
  const district = detected.district.trim() || municipality;
  const province = detected.province.trim() || "Bagmati";
  const country = detected.country.trim() || "Nepal";
  const place = detected.place.trim();

  return {
    label:
      formatShortLocationLabel({
        place,
        city: municipality,
        district,
        province,
        country,
      }) || detected.label,
    country,
    province,
    district,
    municipality,
    lat: detected.coordinates[0],
    lng: detected.coordinates[1],
    accuracyMeters: detected.accuracyMeters,
  };
}

export function StepBasicInfo({ onContinue, onBack }: StepBasicInfoProps) {
  const { data, patchData } = useRegistrationStore();
  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender || undefined,
      dateOfBirth: data.dateOfBirth,
      heightFeet: data.heightFeet || 5,
      heightInches: data.heightInches || 6,
      maritalStatus: data.maritalStatus || undefined,
      relationshipGoal: data.relationshipGoal || undefined,
    },
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [location, setLocation] = useState<StoredLocation | null>(() => {
    if (
      data.gpsEnabled &&
      data.latitude != null &&
      data.longitude != null &&
      data.country &&
      data.province &&
      data.district &&
      data.municipality
    ) {
      return {
        label:
          formatShortLocationLabel({
            city: data.municipality,
            district: data.district,
            province: data.province,
            country: data.country,
          }) || data.currentLocation,
        country: data.country,
        province: data.province,
        district: data.district,
        municipality: data.municipality,
        lat: data.latitude,
        lng: data.longitude,
        accuracyMeters: data.locationAccuracyMeters,
      };
    }
    return null;
  });

  const persistLocation = useCallback(
    (stored: StoredLocation) => {
      setLocation(stored);
      patchData({
        gpsEnabled: true,
        currentLocation: stored.label,
        country: stored.country,
        province: stored.province,
        district: stored.district,
        municipality: stored.municipality,
        latitude: stored.lat,
        longitude: stored.lng,
        locationAccuracyMeters: stored.accuracyMeters,
      });
    },
    [patchData]
  );

  const detect = useCallback(async () => {
    setGpsLoading(true);
    setGpsError(null);
    setFormError(null);
    try {
      const detected = await detectUserLocation();
      persistLocation(toStoredLocation(detected));
    } catch (error) {
      setGpsError(error instanceof Error ? error.message : "Could not detect location.");
    } finally {
      setGpsLoading(false);
    }
  }, [persistLocation]);

  useEffect(() => {
    if (location) return;
    void detect();
  }, [detect, location]);

  // Keep the zustand store (and therefore localStorage) in sync with every
  // keystroke, not just on submit — otherwise clicking "Back" before
  // finishing this step discards whatever was typed, since the store never
  // saw it.
  useEffect(() => {
    const subscription = form.watch((values) => {
      patchData(values as Partial<RegistrationData>);
    });
    return () => subscription.unsubscribe();
  }, [form, patchData]);

  const submit = form.handleSubmit((values) => {
    if (!location) {
      setFormError("We need your GPS location to continue. Tap detect and allow permission.");
      return;
    }
    setFormError(null);
    patchData(values);
    persistLocation(location);
    onContinue();
  });

  return (
    <StepCard title="Basic information" subtitle="Tell us who you are and what you are looking for.">
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" {...form.register("firstName")} />
            <FieldError message={form.formState.errors.firstName?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" {...form.register("lastName")} />
            <FieldError message={form.formState.errors.lastName?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Gender"
            options={GENDER_OPTIONS}
            value={form.watch("gender") ?? ""}
            onChange={(event) =>
              form.setValue(
                "gender",
                event.target.value as BasicInfoFormValues["gender"],
                { shouldValidate: true }
              )
            }
            error={form.formState.errors.gender?.message}
          />

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <DatePicker
              id="dateOfBirth"
              min={minBirthDate()}
              max={maxBirthDateForMinAge(18)}
              value={form.watch("dateOfBirth") ?? ""}
              onChange={(dob) => form.setValue("dateOfBirth", dob, { shouldValidate: true, shouldDirty: true })}
              placeholder="Select your date of birth"
            />
            <FieldError message={form.formState.errors.dateOfBirth?.message} />
          </div>
        </div>

        <div>
          <HeightSlider
            clearable={false}
            value={`${form.watch("heightFeet") ?? 5}'${form.watch("heightInches") ?? 6}"`}
            onChange={(next) => {
              const inches = parseHeightInches(next);
              if (inches === null) return;
              form.setValue("heightFeet", Math.floor(inches / 12), { shouldValidate: true });
              form.setValue("heightInches", inches % 12, { shouldValidate: true });
            }}
          />
          <FieldError
            message={
              form.formState.errors.heightFeet?.message || form.formState.errors.heightInches?.message
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Marital status"
            options={MARITAL_STATUS_OPTIONS}
            value={form.watch("maritalStatus") ?? ""}
            onChange={(event) =>
              form.setValue(
                "maritalStatus",
                (event.target.value || undefined) as BasicInfoFormValues["maritalStatus"],
                { shouldValidate: true }
              )
            }
            error={form.formState.errors.maritalStatus?.message}
          />

          <SelectField
            label="Relationship goal"
            options={RELATIONSHIP_GOAL_OPTIONS}
            value={form.watch("relationshipGoal") ?? ""}
            onChange={(event) =>
              form.setValue(
                "relationshipGoal",
                (event.target.value || undefined) as BasicInfoFormValues["relationshipGoal"],
                { shouldValidate: true }
              )
            }
            error={form.formState.errors.relationshipGoal?.message}
          />
        </div>

        {/* Location Section */}
        <div className="overflow-hidden rounded-[1.5rem] border border-outline-variant/20 bg-surface-container/60">
          {location ? (
            <StaticMapPreview lat={location.lat} lng={location.lng} label={[location.label, location.district, location.province, location.country]
                .filter((part, index, all) => part && all.findIndex((p) => p.toLowerCase() === part.toLowerCase()) === index)
                .join(", ")} className="h-44 sm:h-52" />
          ) : (
            <div className="flex h-44 flex-col items-center justify-center gap-2 bg-surface-container-high/60 sm:h-52">
              <span
                className={`material-symbols-outlined text-[2.5rem] text-primary ${gpsLoading ? "animate-pulse" : ""}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {gpsLoading ? "travel_explore" : "location_off"}
              </span>
              <p className="text-sm font-medium text-on-surface-variant">
                {gpsLoading ? "Finding your location…" : "Location not shared yet"}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 p-4 sm:p-5">
            <span
              className="material-symbols-outlined shrink-0 text-[1.6rem] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-[var(--font-headline)] text-lg font-bold leading-snug text-on-surface">
                {location
                  ? location.municipality || location.label
                  : gpsLoading
                    ? "Detecting…"
                    : "Allow location access"}
              </p>
              <p className="truncate text-sm text-on-surface-variant">
                {location
                  ? [location.district, location.province, location.country]
                      .filter((part, index, all) => part && part !== location.municipality && all.indexOf(part) === index)
                      .join(", ")
                  : "We show people near you. Only your area is visible."}
              </p>
            </div>
            <Button
              type="button"
              variant={location ? "outline" : "default"}
              className={
                location
                  ? "shrink-0 rounded-full border-outline-variant/30 bg-surface-container-high px-4"
                  : "shrink-0 rounded-full gradient-brand px-4 text-white"
              }
              onClick={() => void detect()}
              disabled={gpsLoading}
            >
              <span className={`material-symbols-outlined mr-1.5 text-[18px] ${gpsLoading ? "animate-spin" : ""}`}>
                {gpsLoading ? "progress_activity" : location ? "refresh" : "my_location"}
              </span>
              {location ? "Detect again" : "Detect"}
            </Button>
          </div>

          {gpsError || formError ? (
            <div className="border-t border-error/20 bg-error/5 px-4 py-3 text-sm text-error sm:px-5">
              {formError || gpsError}
            </div>
          ) : null}
        </div>

        <StepNavigation 
          onBack={onBack} 
          onNext={() => submit()} 
          loading={gpsLoading}
          disableNext={!location || gpsLoading}
        />
      </form>
    </StepCard>
  );
}
