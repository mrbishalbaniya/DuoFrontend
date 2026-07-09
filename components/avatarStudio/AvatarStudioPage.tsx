"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  deleteOutfit,
  fetchMyAvatar,
  fetchOutfits,
  saveMyAvatar,
  saveOutfit,
  type AvatarOutfit,
} from "@/lib/avatarStudio/api";
import {
  AVATAR_CATEGORIES,
  categoriesForGender,
  randomizeAvatarConfig,
  type AvatarControl,
} from "@/lib/avatarStudio/catalog";
import { useAvatarConfigStore } from "@/lib/avatarStudio/configStore";
import {
  DEFAULT_AVATAR_CONFIG,
  SKIN_TONES,
  genderDefaults,
  type AvatarCategoryId,
  type AvatarConfig,
  type AvatarPreviewAnimation,
  type AvatarStudioBackground,
} from "@/lib/avatarStudio/types";
import { useAuth } from "@/contexts/AuthContext";

const AvatarStudioViewer = dynamic(() => import("./AvatarStudioViewer"), {
  ssr: false,
  loading: () => <div className="avatar-studio-viewer avatar-studio-viewer--loading" />,
});

const BACKGROUNDS: { id: AvatarStudioBackground; label: string; icon: string }[] = [
  { id: "studio", label: "Studio", icon: "photo_camera" },
  { id: "light", label: "White", icon: "light_mode" },
  { id: "dark", label: "Black", icon: "dark_mode" },
  { id: "gradient", label: "Gradient", icon: "gradient" },
  { id: "space", label: "Space", icon: "rocket_launch" },
  { id: "globe", label: "Globe", icon: "public" },
  { id: "transparent", label: "Clear", icon: "blur_on" },
];

const ANIM_DOCK: { id: AvatarPreviewAnimation; label: string; icon: string }[] = [
  { id: "idle", label: "Idle", icon: "accessibility_new" },
  { id: "walk", label: "Walk", icon: "directions_walk" },
  { id: "run", label: "Run", icon: "directions_run" },
  { id: "wave", label: "Wave", icon: "waving_hand" },
  { id: "dance", label: "Dance", icon: "nightlife" },
  { id: "jump", label: "Jump", icon: "sports_gymnastics" },
  { id: "sit", label: "Sit", icon: "event_seat" },
  { id: "selfie", label: "Selfie", icon: "photo_camera_front" },
  { id: "heart", label: "Heart", icon: "favorite" },
  { id: "look", label: "Look", icon: "visibility" },
];

const RAIL_GROUPS: { label: string; ids: AvatarCategoryId[] }[] = [
  { label: "Identity", ids: ["gender", "face", "skin", "body"] },
  { label: "Features", ids: ["hair", "eyes", "eyebrows", "nose", "mouth", "teeth", "ears", "beard"] },
  { label: "Style", ids: ["clothing", "shoes", "outerwear", "glasses", "hats", "accessories", "colors"] },
  { label: "Motion", ids: ["animations", "emotes", "outfits"] },
];

const FAVORITES_KEY = "duo-avatar-studio-favorites";
const RECENT_KEY = "duo-avatar-studio-recent";
const HISTORY_LIMIT = 40;

function cloneConfig(c: AvatarConfig): AvatarConfig {
  return { ...c };
}

function formatSavedAt(d: Date | null): string {
  if (!d) return "Not saved yet";
  return `Saved ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function ControlField({
  control,
  config,
  updateConfig,
  selectGender,
}: {
  control: AvatarControl;
  config: AvatarConfig;
  updateConfig: (patch: Partial<AvatarConfig>, recordHistory?: boolean) => void;
  selectGender: (g: "male" | "female") => void;
}) {
  const value = config[control.key];

  if (control.kind === "gender") {
    return (
      <div className="avatar-studio__card">
        <div className="avatar-studio__card-title">Character</div>
        <div className="avatar-studio__gender">
          <button
            type="button"
            className={`avatar-studio__gender-card ${config.gender === "male" ? "is-active" : ""}`}
            onClick={() => selectGender("male")}
          >
            <span className="material-symbols-outlined">man</span>
            <strong>Male</strong>
            <em>Full body · facial hair · athletic defaults</em>
          </button>
          <button
            type="button"
            className={`avatar-studio__gender-card ${config.gender === "female" ? "is-active" : ""}`}
            onClick={() => selectGender("female")}
          >
            <span className="material-symbols-outlined">woman</span>
            <strong>Female</strong>
            <em>Full body · long hair · feminine proportions</em>
          </button>
        </div>
      </div>
    );
  }

  if (control.kind === "slider") {
    return (
      <div className="avatar-studio__card">
        <label className="avatar-studio__field">
          <span>
            {control.label}
            <em>{String(value)}</em>
          </span>
          <input
            type="range"
            min={control.min ?? 0}
            max={control.max ?? 100}
            value={Number(value)}
            onChange={(e) =>
              updateConfig({ [control.key]: Number(e.target.value) } as Partial<AvatarConfig>)
            }
          />
        </label>
      </div>
    );
  }

  if (control.kind === "swatch") {
    return (
      <div className="avatar-studio__card">
        <div className="avatar-studio__field">
          <span>{control.label}</span>
          <div className="avatar-studio__swatches">
            {(control.colors ?? []).map((color) => (
              <button
                key={color}
                type="button"
                className={`avatar-studio__swatch ${value === color ? "is-active" : ""}`}
                style={{ background: color }}
                onClick={() => updateConfig({ [control.key]: color } as Partial<AvatarConfig>)}
                aria-label={color}
                title={color}
              />
            ))}
            <input
              type="color"
              value={typeof value === "string" ? value : "#ffffff"}
              onChange={(e) =>
                updateConfig({ [control.key]: e.target.value } as Partial<AvatarConfig>)
              }
              className="avatar-studio__color-input"
              aria-label={`${control.label} custom`}
            />
          </div>
        </div>
      </div>
    );
  }

  if (control.kind === "select") {
    if (control.key === "skinTone") {
      return (
        <div className="avatar-studio__card">
          <div className="avatar-studio__field">
            <span>{control.label}</span>
            <div className="avatar-studio__swatches">
              {SKIN_TONES.map((tone, i) => (
                <button
                  key={tone}
                  type="button"
                  className={`avatar-studio__swatch ${Number(value) === i ? "is-active" : ""}`}
                  style={{ background: tone }}
                  onClick={() => updateConfig({ skinTone: i })}
                  aria-label={`Tone ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    const options = control.options ?? [];
    const useGrid = options.length > 4 && options.length <= 64;

    if (useGrid) {
      return (
        <div className="avatar-studio__card">
          <div className="avatar-studio__field">
            <span>{control.label}</span>
            <div className="avatar-studio__asset-grid" role="listbox" aria-label={control.label}>
              {options.map((opt) => {
                const active = String(value) === String(opt.value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`avatar-studio__asset-thumb ${active ? "is-active" : ""}`}
                    onClick={() => {
                      const asNum = Number(opt.value);
                      const nextValue = Number.isNaN(asNum) ? opt.value : asNum;
                      updateConfig({ [control.key]: nextValue } as Partial<AvatarConfig>);
                    }}
                    title={opt.label}
                  >
                    <span className="avatar-studio__asset-thumb-icon material-symbols-outlined">
                      {control.key.includes("hair")
                        ? "face_retouching_natural"
                        : control.key.includes("shoe")
                          ? "steps"
                          : control.key.includes("shirt") || control.key.includes("pants")
                            ? "checkroom"
                            : "widgets"}
                    </span>
                    <span className="avatar-studio__asset-thumb-label">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="avatar-studio__card">
        <label className="avatar-studio__field">
          <span>{control.label}</span>
          <select
            value={String(value)}
            onChange={(e) => {
              const raw = e.target.value;
              const asNum = Number(raw);
              const nextValue = Number.isNaN(asNum) ? raw : asNum;
              updateConfig({ [control.key]: nextValue } as Partial<AvatarConfig>);
            }}
          >
            {options.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  return null;
}

export default function AvatarStudioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const setLocalConfig = useAvatarConfigStore((s) => s.setLocal);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [savedSnapshot, setSavedSnapshot] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [category, setCategory] = useState<AvatarCategoryId>("gender");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<AvatarCategoryId[]>([]);
  const [recent, setRecent] = useState<AvatarCategoryId[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cameraMode, setCameraMode] = useState<"full" | "head" | "portrait">("full");
  const [background, setBackground] = useState<AvatarStudioBackground>("studio");
  const [previewAnim, setPreviewAnim] = useState<AvatarPreviewAnimation>("idle");
  const [history, setHistory] = useState<AvatarConfig[]>([DEFAULT_AVATAR_CONFIG]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [outfits, setOutfits] = useState<AvatarOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outfitName, setOutfitName] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [toastTone, setToastTone] = useState<"ok" | "err">("ok");

  const dirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(savedSnapshot),
    [config, savedSnapshot]
  );

  const avatarName = useMemo(() => {
    if (!config.gender) return "New Character";
    const build = config.bodyBuild ? config.bodyBuild[0]!.toUpperCase() + config.bodyBuild.slice(1) : "Custom";
    return `${config.gender === "female" ? "Female" : "Male"} · ${build}`;
  }, [config.gender, config.bodyBuild]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    try {
      const fav = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]") as AvatarCategoryId[];
      const rec = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as AvatarCategoryId[];
      setFavorites(fav);
      setRecent(rec);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!status && !error) return;
    const t = window.setTimeout(() => {
      setStatus(null);
      setError(null);
    }, 3200);
    return () => window.clearTimeout(t);
  }, [status, error]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [avatar, outfitList] = await Promise.all([fetchMyAvatar(), fetchOutfits()]);
        if (cancelled) return;
        setConfig(avatar.config);
        setSavedSnapshot(avatar.config);
        setHistory([avatar.config]);
        setHistoryIndex(0);
        setPreviewAnim(avatar.config.idleAnimation);
        setOutfits(outfitList);
        if (avatar.updated_at) setLastSavedAt(new Date(avatar.updated_at));
      } catch (err) {
        if (!cancelled) {
          setToastTone("err");
          setError(err instanceof Error ? err.message : "Failed to load avatar");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const pushHistory = useCallback(
    (next: AvatarConfig) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIndex + 1);
        const nextHist = [...trimmed, cloneConfig(next)].slice(-HISTORY_LIMIT);
        setHistoryIndex(nextHist.length - 1);
        return nextHist;
      });
    },
    [historyIndex]
  );

  const updateConfig = useCallback(
    (patch: Partial<AvatarConfig>, recordHistory = true) => {
      setConfig((prev) => {
        const next = { ...prev, ...patch };
        if (recordHistory) {
          queueMicrotask(() => pushHistory(next));
        }
        return next;
      });
      if (patch.idleAnimation) setPreviewAnim(patch.idleAnimation);
      setStatus(null);
      setError(null);
    },
    [pushHistory]
  );

  const selectCategory = (id: AvatarCategoryId) => {
    setCategory(id);
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleFavorite = (id: AvatarCategoryId) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const filteredCategories = useMemo(() => {
    const cats = categoriesForGender(config.gender);
    const q = search.trim().toLowerCase();
    if (!q) return cats;
    return cats.filter((c) => c.label.toLowerCase().includes(q) || c.id.includes(q));
  }, [search, config.gender]);

  const activeCategory =
    filteredCategories.find((c) => c.id === category) ??
    filteredCategories[0] ??
    AVATAR_CATEGORIES[0]!;

  const selectGender = (gender: "male" | "female") => {
    updateConfig({
      ...genderDefaults(gender),
      modelSource: "modular",
      modelUrl: "",
    });
    setCategory("face");
    setToastTone("ok");
    setStatus(`${gender === "male" ? "Male" : "Female"} character selected`);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    setConfig(history[idx]!);
    setToastTone("ok");
    setStatus("Undo successful");
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    setConfig(history[idx]!);
    setToastTone("ok");
    setStatus("Redo applied");
  };

  const reset = () => {
    updateConfig(DEFAULT_AVATAR_CONFIG);
    setPreviewAnim("idle");
    setToastTone("ok");
    setStatus("Avatar reset");
  };

  const randomize = () => {
    const g = config.gender === "female" || config.gender === "male" ? config.gender : undefined;
    const next = randomizeAvatarConfig(Date.now(), g);
    updateConfig(next);
    setPreviewAnim("idle");
    setToastTone("ok");
    setStatus("Random avatar generated");
  };

  const cancel = () => {
    setConfig(savedSnapshot);
    setPreviewAnim(savedSnapshot.idleAnimation);
    setToastTone("ok");
    setStatus("Reverted to last save");
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await saveMyAvatar(config);
      setSavedSnapshot(res.config);
      setConfig(res.config);
      setLastSavedAt(new Date());
      if (user?.id) setLocalConfig(user.id, res.config);
      setToastTone("ok");
      setStatus("Avatar saved — live on the globe");
    } catch (err) {
      setToastTone("err");
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOutfit = async () => {
    const name = outfitName.trim() || `Outfit ${outfits.length + 1}`;
    try {
      const outfit = await saveOutfit(name, config);
      setOutfits((prev) => [outfit, ...prev]);
      setOutfitName("");
      setToastTone("ok");
      setStatus(`Saved outfit “${outfit.name}”`);
    } catch (err) {
      setToastTone("err");
      setError(err instanceof Error ? err.message : "Could not save outfit");
    }
  };

  const applyOutfit = (outfit: AvatarOutfit) => {
    updateConfig(outfit.config);
    setPreviewAnim(outfit.config.idleAnimation);
    setToastTone("ok");
    setStatus(`Applied “${outfit.name}”`);
  };

  const removeOutfit = async (id: number) => {
    try {
      await deleteOutfit(id);
      setOutfits((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setToastTone("err");
      setError(err instanceof Error ? err.message : "Could not delete outfit");
    }
  };

  const exportAvatar = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `duo-avatar-${config.gender || "draft"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToastTone("ok");
    setStatus("Avatar config exported");
  };

  const importAvatar = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<AvatarConfig>;
        updateConfig({ ...DEFAULT_AVATAR_CONFIG, ...parsed, version: 2 });
        setToastTone("ok");
        setStatus("Avatar config imported");
      } catch {
        setToastTone("err");
        setError("Invalid avatar file");
      }
    };
    reader.readAsText(file);
  };

  const previewOnGlobe = async () => {
    if (dirty) {
      try {
        await save();
      } catch {
        /* save already sets error */
      }
    }
    router.push("/map");
  };

  const railSections = useMemo(() => {
    const byId = new Map(filteredCategories.map((c) => [c.id, c]));
    return RAIL_GROUPS.map((group) => ({
      ...group,
      items: group.ids.map((id) => byId.get(id)).filter(Boolean) as typeof filteredCategories,
    })).filter((g) => g.items.length > 0);
  }, [filteredCategories]);

  if (authLoading || (!user && !error)) {
    return (
      <div className="avatar-studio avatar-studio--loading">
        <div className="avatar-studio__skeleton" />
        <p>Loading Avatar Studio…</p>
      </div>
    );
  }

  return (
    <div className="avatar-studio" data-collapsed={sidebarCollapsed ? "true" : "false"}>
      <header className="avatar-studio__topbar">
        <div className="avatar-studio__brand">
          <Link href="/profile" className="avatar-studio__back" aria-label="Back to profile">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <p className="avatar-studio__eyebrow">Duo Character Creator</p>
            <h1 className="avatar-studio__title">Avatar Studio</h1>
          </div>
          <div className="avatar-studio__meta">
            <span className="avatar-studio__avatar-name">{avatarName}</span>
            <span
              className={`avatar-studio__autosave ${dirty ? "is-dirty" : "is-saved"}`}
              title={formatSavedAt(lastSavedAt)}
            >
              <span className="avatar-studio__autosave-dot" />
              {dirty ? "Unsaved changes" : formatSavedAt(lastSavedAt)}
            </span>
          </div>
        </div>

        <div className="avatar-studio__actions">
          <div className="avatar-studio__tool-group" role="group" aria-label="History">
            <button type="button" className="avatar-studio__tool" onClick={undo} disabled={historyIndex <= 0} title="Undo">
              <span className="material-symbols-outlined">undo</span>
              <span>Undo</span>
            </button>
            <button
              type="button"
              className="avatar-studio__tool"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
            >
              <span className="material-symbols-outlined">redo</span>
              <span>Redo</span>
            </button>
            <button type="button" className="avatar-studio__tool" onClick={reset} title="Reset">
              <span className="material-symbols-outlined">restart_alt</span>
              <span>Reset</span>
            </button>
            <button type="button" className="avatar-studio__tool" onClick={randomize} title="Randomize">
              <span className="material-symbols-outlined">casino</span>
              <span>Randomize</span>
            </button>
          </div>
          <div className="avatar-studio__tool-group" role="group" aria-label="File">
            <button type="button" className="avatar-studio__tool" onClick={() => fileInputRef.current?.click()} title="Import">
              <span className="material-symbols-outlined">upload</span>
              <span>Import</span>
            </button>
            <button type="button" className="avatar-studio__tool" onClick={exportAvatar} title="Export">
              <span className="material-symbols-outlined">download</span>
              <span>Export</span>
            </button>
            <button type="button" className="avatar-studio__tool" onClick={() => void previewOnGlobe()} title="Preview on Globe">
              <span className="material-symbols-outlined">public</span>
              <span>Globe</span>
            </button>
            <button type="button" className="avatar-studio__tool" onClick={cancel} title="Cancel">
              Cancel
            </button>
          </div>
          <button
            type="button"
            className={`btn-premium avatar-studio__save ${saving ? "is-saving" : ""}`}
            onClick={() => void save()}
            disabled={saving || loading}
          >
            <span className="material-symbols-outlined">{saving ? "cloud_sync" : "cloud_done"}</span>
            {saving ? "Saving…" : "Save"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importAvatar(file);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      {(status || error) && (
        <div
          className={`avatar-studio__toast ${toastTone === "err" || error ? "is-error" : "is-success"}`}
          role="status"
        >
          <span className="material-symbols-outlined">
            {error || toastTone === "err" ? "error" : "check_circle"}
          </span>
          {error ?? status}
        </div>
      )}

      <div className="avatar-studio__workspace">
        <div className="avatar-studio__layout">
          <aside className="avatar-studio__rail glass-panel" aria-label="Categories">
            <div className="avatar-studio__rail-head">
              <button
                type="button"
                className="avatar-studio__collapse"
                onClick={() => setSidebarCollapsed((v) => !v)}
                aria-label="Toggle categories"
              >
                <span className="material-symbols-outlined">
                  {sidebarCollapsed ? "chevron_right" : "chevron_left"}
                </span>
              </button>
              {!sidebarCollapsed && (
                <label className="avatar-studio__search">
                  <span className="material-symbols-outlined">search</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search categories"
                  />
                </label>
              )}
            </div>

            <div className="avatar-studio__rail-scroll">
              {!sidebarCollapsed && favorites.length > 0 && (
                <div className="avatar-studio__group">
                  <p className="avatar-studio__group-label">Favorites</p>
                  {favorites.map((id) => {
                    const cat = AVATAR_CATEGORIES.find((c) => c.id === id);
                    if (!cat || !filteredCategories.some((c) => c.id === id)) return null;
                    return (
                      <button
                        key={`fav-${id}`}
                        type="button"
                        className={`avatar-studio__cat ${category === id ? "is-active" : ""}`}
                        onClick={() => selectCategory(id)}
                      >
                        <span className="material-symbols-outlined">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {railSections.map((section) => {
                const collapsed = collapsedGroups[section.label];
                return (
                  <div key={section.label} className="avatar-studio__group">
                    {!sidebarCollapsed && (
                      <button
                        type="button"
                        className="avatar-studio__group-label"
                        onClick={() =>
                          setCollapsedGroups((prev) => ({
                            ...prev,
                            [section.label]: !prev[section.label],
                          }))
                        }
                      >
                        <span>{section.label}</span>
                        <span className="material-symbols-outlined">
                          {collapsed ? "expand_more" : "expand_less"}
                        </span>
                      </button>
                    )}
                    {!collapsed &&
                      section.items.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`avatar-studio__cat ${category === cat.id ? "is-active" : ""}`}
                          onClick={() => selectCategory(cat.id)}
                          title={cat.label}
                        >
                          <span className="material-symbols-outlined">{cat.icon}</span>
                          {!sidebarCollapsed && <span>{cat.label}</span>}
                          {!sidebarCollapsed && (
                            <span
                              className={`avatar-studio__fav ${favorites.includes(cat.id) ? "is-on" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(cat.id);
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleFavorite(cat.id);
                                }
                              }}
                              aria-label={`Favorite ${cat.label}`}
                            >
                              <span className="material-symbols-outlined">
                                {favorites.includes(cat.id) ? "star" : "star_outline"}
                              </span>
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="avatar-studio__stage">
            <div className="avatar-studio__stage-frame">
              {loading ? (
                <div className="avatar-studio-viewer avatar-studio-viewer--loading" />
              ) : (
                <AvatarStudioViewer
                  config={config}
                  animation={previewAnim}
                  background={background}
                  autoRotate={autoRotate}
                  cameraMode={cameraMode}
                />
              )}

              <div className="avatar-studio__cam-dock" role="toolbar" aria-label="Camera">
                {(
                  [
                    ["full", "Body", "accessibility_new"],
                    ["head", "Face", "face"],
                    ["portrait", "Portrait", "crop_portrait"],
                  ] as const
                ).map(([mode, label, icon]) => (
                  <button
                    key={mode}
                    type="button"
                    className={`avatar-studio__chip ${cameraMode === mode ? "is-active" : ""}`}
                    onClick={() => setCameraMode(mode)}
                    title={label}
                  >
                    <span className="material-symbols-outlined">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`avatar-studio__chip ${autoRotate ? "is-active" : ""}`}
                  onClick={() => setAutoRotate((v) => !v)}
                  title="Auto rotate"
                >
                  <span className="material-symbols-outlined">360</span>
                  <span>Auto</span>
                </button>
                <button
                  type="button"
                  className="avatar-studio__chip"
                  onClick={() => {
                    setCameraMode("full");
                    setAutoRotate(true);
                    setToastTone("ok");
                    setStatus("Camera reset");
                  }}
                  title="Reset camera"
                >
                  <span className="material-symbols-outlined">center_focus_strong</span>
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </section>

          <aside className="avatar-studio__inspector glass-panel" aria-label="Inspector">
            <div className="avatar-studio__inspector-head">
              <div>
                <p className="avatar-studio__eyebrow">Inspector</p>
                <h2>{activeCategory.label}</h2>
              </div>
              <span className="material-symbols-outlined avatar-studio__inspector-icon">
                {activeCategory.icon}
              </span>
            </div>
            <p className="avatar-studio__inspector-sub">Changes apply instantly to your avatar.</p>

            {category === "outfits" ? (
              <div className="avatar-studio__controls">
                <div className="avatar-studio__card">
                  <label className="avatar-studio__field">
                    <span>Outfit name</span>
                    <input
                      value={outfitName}
                      onChange={(e) => setOutfitName(e.target.value)}
                      placeholder="Date night"
                    />
                  </label>
                  <button type="button" className="btn-premium-outline" onClick={() => void handleSaveOutfit()}>
                    Save current as outfit
                  </button>
                </div>
                <div className="avatar-studio__outfit-list">
                  {outfits.length === 0 && (
                    <div className="avatar-studio__empty">
                      <span className="material-symbols-outlined">bookmark_add</span>
                      <p>No saved outfits yet.</p>
                    </div>
                  )}
                  {outfits.map((outfit) => (
                    <div key={outfit.id} className="avatar-studio__outfit">
                      <button type="button" onClick={() => applyOutfit(outfit)}>
                        {outfit.name}
                      </button>
                      <button
                        type="button"
                        className="avatar-studio__outfit-del"
                        onClick={() => void removeOutfit(outfit.id)}
                        aria-label={`Delete ${outfit.name}`}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="avatar-studio__controls">
                {!config.gender && category !== "gender" && (
                  <div className="avatar-studio__empty">
                    <span className="material-symbols-outlined">wc</span>
                    <p>Choose Male or Female in Character to begin customizing.</p>
                    <button type="button" className="btn-premium-outline" onClick={() => selectCategory("gender")}>
                      Open Character
                    </button>
                  </div>
                )}
                {activeCategory.controls.map((control) => (
                  <ControlField
                    key={String(control.key) + control.label}
                    control={control}
                    config={config}
                    updateConfig={updateConfig}
                    selectGender={selectGender}
                  />
                ))}
              </div>
            )}
          </aside>
        </div>

        <div className="avatar-studio__dock glass-panel" role="toolbar" aria-label="Studio dock">
          <div className="avatar-studio__dock-section">
            <span className="avatar-studio__dock-label">Animation</span>
            <div className="avatar-studio__dock-row">
              {ANIM_DOCK.map((anim) => (
                <button
                  key={anim.id}
                  type="button"
                  className={`avatar-studio__chip ${previewAnim === anim.id ? "is-active" : ""}`}
                  onClick={() => {
                    setPreviewAnim(anim.id);
                    updateConfig({ idleAnimation: anim.id }, false);
                    setToastTone("ok");
                    setStatus(`${anim.label} animation`);
                  }}
                  title={anim.label}
                >
                  <span className="material-symbols-outlined">{anim.icon}</span>
                  <span>{anim.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="avatar-studio__dock-section">
            <span className="avatar-studio__dock-label">Environment</span>
            <div className="avatar-studio__dock-row">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  className={`avatar-studio__chip ${background === bg.id ? "is-active" : ""}`}
                  onClick={() => {
                    setBackground(bg.id);
                    setToastTone("ok");
                    setStatus(`${bg.label} background`);
                  }}
                  title={bg.label}
                >
                  <span className="material-symbols-outlined">{bg.icon}</span>
                  <span>{bg.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
