"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { SecurityDevice } from "@/types";
import { SecurityNotice, SecurityPageShell, SecuritySpinner } from "./SecurityPageShell";

function platformIcon(platform: SecurityDevice["platform"]): string {
  switch (platform) {
    case "android":
    case "ios":
      return "smartphone";
    case "web":
      return "computer";
    default:
      return "devices_other";
  }
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Active now";
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Active ${days}d ago`;
  return `Last active ${new Date(iso).toLocaleDateString()}`;
}

function DeviceCard({
  device,
  onRename,
  onTrust,
  onUntrust,
  onLogout,
  busy,
}: {
  device: SecurityDevice;
  onRename: (name: string) => void;
  onTrust: () => void;
  onUntrust: () => void;
  onLogout: () => void;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(device.device_name);

  const location = [device.city, device.country].filter(Boolean).join(", ");

  return (
    <div className="px-4 py-4 md:px-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[22px]">{platformIcon(device.platform)}</span>
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onRename(name.trim() || device.device_name);
                setEditing(false);
              }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-outline-variant/30 bg-surface-container-high px-2.5 py-1.5 text-sm text-on-surface outline-none focus:border-primary/30"
              />
              <button type="submit" className="text-sm font-semibold text-primary">
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-sm text-on-surface-variant">
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-on-surface">{device.device_name || device.model || "Unknown device"}</p>
              {device.is_current ? (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  This device
                </span>
              ) : null}
              {device.is_trusted_active ? (
                <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  Trusted
                </span>
              ) : null}
            </div>
          )}
          <p className="mt-0.5 text-sm text-on-surface-variant">
            {[device.browser, device.os_version].filter(Boolean).join(" · ") || device.platform_label}
          </p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {formatRelative(device.last_active)}
            {location ? ` · ${location}` : ""}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {!editing ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(true)}
                className="rounded-full border border-outline-variant/30 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high/60 disabled:opacity-50"
              >
                Rename
              </button>
            ) : null}
            {device.is_trusted_active ? (
              <button
                type="button"
                disabled={busy}
                onClick={onUntrust}
                className="rounded-full border border-outline-variant/30 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high/60 disabled:opacity-50"
              >
                Remove trust
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={onTrust}
                className="rounded-full border border-outline-variant/30 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high/60 disabled:opacity-50"
              >
                Trust this device
              </button>
            )}
            {!device.is_current ? (
              <button
                type="button"
                disabled={busy}
                onClick={onLogout}
                className="rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              >
                Log out
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DevicesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [devices, setDevices] = useState<SecurityDevice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  const refresh = () => {
    setLoading(true);
    api
      .getSecurityDevices()
      .then((data) => setDevices(data.devices))
      .catch(() => setError("Could not load your devices."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const withBusy = async (id: number, action: () => Promise<unknown>) => {
    setBusyId(id);
    setNotice("");
    try {
      await action();
      refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    setConfirmLogoutAll(false);
    try {
      const result = await api.logoutAllDevices(true);
      setNotice(result.message);
      refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not log out other devices.");
    } finally {
      setLoggingOutAll(false);
    }
  };

  const otherDeviceCount = devices?.filter((d) => !d.is_current).length ?? 0;

  return (
    <SecurityPageShell title="Active devices">
      {loading ? (
        <SecuritySpinner pageName="Active devices" />
      ) : error ? (
        <SecurityNotice tone="error">{error}</SecurityNotice>
      ) : devices ? (
        <div className="space-y-6">
          {notice ? <SecurityNotice>{notice}</SecurityNotice> : null}

          <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
            {devices.map((device, idx) => (
              <div key={device.id}>
                {idx > 0 ? <div className="border-t border-outline-variant/20" /> : null}
                <DeviceCard
                  device={device}
                  busy={busyId === device.id}
                  onRename={(name) => void withBusy(device.id, () => api.renameSecurityDevice(device.id, name))}
                  onTrust={() => void withBusy(device.id, () => api.trustSecurityDevice(device.id))}
                  onUntrust={() => void withBusy(device.id, () => api.untrustSecurityDevice(device.id))}
                  onLogout={() => void withBusy(device.id, () => api.logoutSecurityDevice(device.id))}
                />
              </div>
            ))}
          </div>

          {otherDeviceCount > 0 ? (
            confirmLogoutAll ? (
              <div className="space-y-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm font-medium text-red-400">
                  Log out of {otherDeviceCount} other device{otherDeviceCount === 1 ? "" : "s"}? They will need to
                  sign in again.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmLogoutAll(false)}
                    className="rounded-full border border-outline-variant/30 px-4 py-2 text-xs font-semibold text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loggingOutAll}
                    onClick={() => void handleLogoutAll()}
                    className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {loggingOutAll ? "Logging out..." : "Confirm log out"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmLogoutAll(true)}
                className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-sm font-bold text-red-400 hover:bg-red-500/15"
              >
                Log out of all other devices
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </SecurityPageShell>
  );
}
