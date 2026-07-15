import { NextRequest, NextResponse } from "next/server";

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  neighbourhood?: string;
  neighborhood?: string;
  quarter?: string;
  hamlet?: string;
  residential?: string;
  county?: string;
  state_district?: string;
  district?: string;
  state?: string;
  region?: string;
  country?: string;
  country_code?: string;
};

function parseCoordinate(value: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: NextRequest) {
  const lat = parseCoordinate(request.nextUrl.searchParams.get("lat"));
  const lng = parseCoordinate(request.nextUrl.searchParams.get("lng"));

  if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ detail: "Valid lat and lng are required." }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("accept-language", "en");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "DuoApp/1.0 (https://duo.app; support@duo.app)",
      },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ detail: "Reverse geocoding unavailable." }, { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json({ detail: "Reverse geocoding failed." }, { status: response.status });
  }

  const data = (await response.json()) as {
    display_name?: string;
    address?: NominatimAddress;
  };

  const address = data.address ?? {};
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    "";
  const place =
    address.neighbourhood ||
    address.neighborhood ||
    address.suburb ||
    address.quarter ||
    address.hamlet ||
    address.residential ||
    "";
  const district =
    address.county || address.state_district || address.district || "";
  const state = address.state || address.region || "";
  const country = address.country || "";

  return NextResponse.json({
    label: data.display_name || [place, city, district, state, country].filter(Boolean).join(", "),
    place,
    city,
    district,
    state,
    country,
    countryCode: address.country_code ?? "",
    address,
  });
}
