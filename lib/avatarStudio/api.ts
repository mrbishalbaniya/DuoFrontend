import { getClientApiBase } from "@/lib/backendUrl";

import type { AvatarConfig } from "./types";
import { mergeAvatarConfig } from "./types";

const base = () => getClientApiBase();

async function avatarFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : "Avatar request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type AvatarApiResponse = {
  config: AvatarConfig;
  version: number;
  updated_at: string | null;
};

export type AvatarOutfit = {
  id: number;
  name: string;
  config: AvatarConfig;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchMyAvatar(): Promise<AvatarApiResponse> {
  const data = await avatarFetch<AvatarApiResponse>("/avatars/me/");
  return { ...data, config: mergeAvatarConfig(data.config) };
}

export async function saveMyAvatar(config: AvatarConfig): Promise<AvatarApiResponse> {
  const data = await avatarFetch<AvatarApiResponse>("/avatars/me/", {
    method: "PUT",
    body: JSON.stringify({ config }),
  });
  return { ...data, config: mergeAvatarConfig(data.config) };
}

export async function deleteMyAvatar(): Promise<void> {
  await avatarFetch("/avatars/me/", { method: "DELETE" });
}

export async function fetchUserAvatar(userId: number | string): Promise<AvatarConfig | null> {
  const data = await avatarFetch<{ user_id: number; config: AvatarConfig | null }>(
    `/avatars/users/${userId}/`
  );
  return data.config ? mergeAvatarConfig(data.config) : null;
}

export async function fetchOutfits(): Promise<AvatarOutfit[]> {
  return avatarFetch("/avatars/outfits/");
}

export async function saveOutfit(name: string, config: AvatarConfig): Promise<AvatarOutfit> {
  return avatarFetch("/avatars/outfits/", {
    method: "POST",
    body: JSON.stringify({ name, config, is_favorite: false }),
  });
}

export async function deleteOutfit(id: number): Promise<void> {
  await avatarFetch(`/avatars/outfits/${id}/`, { method: "DELETE" });
}

export async function fetchAvatarBatch(
  userIds: Array<number | string>
): Promise<Record<string, AvatarConfig>> {
  const data = await avatarFetch<{ configs: Record<string, AvatarConfig> }>("/avatars/batch/", {
    method: "POST",
    body: JSON.stringify({ user_ids: userIds }),
  });
  const out: Record<string, AvatarConfig> = {};
  for (const [id, cfg] of Object.entries(data.configs ?? {})) {
    out[id] = mergeAvatarConfig(cfg);
  }
  return out;
}
