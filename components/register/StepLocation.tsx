"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StepCard, StepNavigation } from "@/components/register/StepNavigation";
import { detectUserLocation, formatShortLocationLabel, type DetectedLocation } from "@/lib/geolocation";
import { useRegistrationStore } from "@/store/registrationStore";

interface StepLocationProps {
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

export function StepLocation({ onContinue, onBack }: StepLocationProps) {
  const { data, patchData } = useRegistrationStore();
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

  const submit = () => {
    if (!location) {
      setFormError("We need your GPS location to continue. Tap detect and allow permission.");
      return;
    }
    setFormError(null);
    persistLocation(location);
    onContinue();
  };

  return (
    <StepCard
      title="Location"
      subtitle="We’ll detect your place with GPS and save country, province, district, and city for matching."
    >
      <div className="space-y-5">
        <div className="space-y-4 rounded-[1.5rem] border border-outline-variant/20 bg-surface-container/60 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <span
                className="material-symbols-outlined text-[1.6rem]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                my_location
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                {gpsLoading ? "Detecting…" : location ? "Detected location" : "Location needed"}
              </p>
              <p className="font-[var(--font-headline)] text-lg font-bold leading-snug text-on-surface">
                {gpsLoading
                  ? "Finding your precise position"
                  : location?.label || "Allow location access to continue"}
              </p>
              {location ? (
                <p className="text-xs text-on-surface-variant">
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  {location.accuracyMeters != null && location.accuracyMeters > 0
                    ? ` · ±${Math.round(location.accuracyMeters)}m`
                    : ""}
                </p>
              ) : null}
            </div>
          </div>

          {location ? (
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["Country", location.country],
                ["Province", location.province],
                ["District", location.district],
                ["Municipality / City", location.municipality],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/5 bg-surface-container-high/70 px-3.5 py-3"
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-on-surface">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full border-outline-variant/30 bg-surface-container-high"
            onClick={() => void detect()}
            disabled={gpsLoading}
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">
              {location ? "refresh" : "my_location"}
            </span>
            {gpsLoading
              ? "Detecting precise location..."
              : location
                ? "Detect again"
                : "Detect my location"}
          </Button>

          {gpsError ? <p className="text-sm text-error">{gpsError}</p> : null}
          {formError ? <p className="text-sm text-error">{formError}</p> : null}
        </div>

        <StepNavigation
          onBack={onBack}
          onNext={submit}
          nextLabel="Continue"
          loading={gpsLoading}
          disableNext={!location || gpsLoading}
        />
      </div>
    </StepCard>
  );
}
