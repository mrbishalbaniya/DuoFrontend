"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/register/SelectField";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import { detectUserLocation } from "@/lib/geolocation";
import { NEPAL_PROVINCES } from "@/lib/register/constants";
import {
  locationSchema,
  type LocationFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";

interface StepLocationProps {
  onContinue: () => void;
  onBack: () => void;
}

export function StepLocation({ onContinue, onBack }: StepLocationProps) {
  const { data, patchData } = useRegistrationStore();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      country: data.country || "Nepal",
      province: data.province,
      district: data.district,
      municipality: data.municipality,
      currentLocation: data.currentLocation,
    },
  });

  const enableGps = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const detected = await detectUserLocation();
      form.setValue("currentLocation", detected.label, { shouldValidate: true });
      form.setValue("municipality", detected.city, { shouldValidate: true });
      patchData({ gpsEnabled: true, currentLocation: detected.label, municipality: detected.city });
    } catch (error) {
      setGpsError(error instanceof Error ? error.message : "Could not detect location.");
    } finally {
      setGpsLoading(false);
    }
  };

  const submit = form.handleSubmit((values) => {
    patchData(values);
    onContinue();
  });

  return (
    <StepCard title="Location" subtitle="Help us connect you with people nearby across Nepal.">
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...form.register("country")} />
          <FieldError message={form.formState.errors.country?.message} />
        </div>

        <SelectField
          label="Province"
          options={NEPAL_PROVINCES.map((province) => ({ value: province, label: province }))}
          value={form.watch("province")}
          onChange={(event) => form.setValue("province", event.target.value, { shouldValidate: true })}
          error={form.formState.errors.province?.message}
        />

        <div className="space-y-2">
          <Label htmlFor="district">District</Label>
          <Input id="district" placeholder="e.g. Kathmandu" {...form.register("district")} />
          <FieldError message={form.formState.errors.district?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="municipality">Municipality / City</Label>
          <Input id="municipality" placeholder="e.g. Lalitpur" {...form.register("municipality")} />
          <FieldError message={form.formState.errors.municipality?.message} />
        </div>

        <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-surface-container/60 p-4">
          <div className="space-y-2">
            <Label htmlFor="currentLocation">Current location</Label>
            <Input
              id="currentLocation"
              placeholder="Detected or manual location"
              {...form.register("currentLocation")}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full border-outline-variant/30 bg-surface-container-high"
            onClick={enableGps}
            disabled={gpsLoading}
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">my_location</span>
            {gpsLoading ? "Detecting location..." : "Enable GPS location"}
          </Button>
          {gpsError ? <p className="text-sm text-error">{gpsError}</p> : null}
        </div>

        <StepNavigation onBack={onBack} onNext={() => submit()} />
      </form>
    </StepCard>
  );
}
