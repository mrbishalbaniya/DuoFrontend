"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DARK_STYLE_STORAGE_KEY,
  DEFAULT_PALETTE,
  LIGHT_STYLE_STORAGE_KEY,
  PALETTE_STORAGE_KEY,
  isDarkStyleId,
  isLightStyleId,
  isPaletteId,
  type DarkStyleId,
  type LightStyleId,
  type PaletteId,
} from "@/lib/palettes";
import { DEFAULT_ICON_SET, ICON_SET_STORAGE_KEY, isIconSetId, type IconSetId } from "@/lib/iconSets";

export type ThemeMode = "dark" | "light" | "system";

const STORAGE_KEY = "duo_theme";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: ThemeMode) => void;
  palette: PaletteId;
  setPalette: (palette: PaletteId) => void;
  darkStyle: DarkStyleId;
  setDarkStyle: (style: DarkStyleId) => void;
  lightStyle: LightStyleId;
  setLightStyle: (style: LightStyleId) => void;
  iconSet: IconSetId;
  setIconSet: (set: IconSetId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStored<T>(key: string, isValid: (v: unknown) => v is T, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return isValid(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

const isThemeMode = (v: unknown): v is ThemeMode => v === "light" || v === "dark" || v === "system";

const readStoredTheme = () => readStored<ThemeMode>(STORAGE_KEY, isThemeMode, "dark");
const readStoredPalette = () => readStored<PaletteId>(PALETTE_STORAGE_KEY, isPaletteId, DEFAULT_PALETTE);
const readStoredDarkStyle = () => readStored<DarkStyleId>(DARK_STYLE_STORAGE_KEY, isDarkStyleId, "default");
const readStoredLightStyle = () => readStored<LightStyleId>(LIGHT_STYLE_STORAGE_KEY, isLightStyleId, "default");
const readStoredIconSet = () => readStored<IconSetId>(ICON_SET_STORAGE_KEY, isIconSetId, DEFAULT_ICON_SET);

function resolveTheme(mode: ThemeMode, systemTheme: "dark" | "light"): "dark" | "light" {
  return mode === "system" ? systemTheme : mode;
}

function applyThemeToDom(resolved: "dark" | "light") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start from the same defaults the server renders with, so hydration
  // matches; the saved values are loaded in a layout effect before paint.
  // The init script in app/layout.tsx has already styled <html> by then.
  const [hydrated, setHydrated] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">("dark");
  const [palette, setPaletteState] = useState<PaletteId>(DEFAULT_PALETTE);
  const [darkStyle, setDarkStyleState] = useState<DarkStyleId>("default");
  const [lightStyle, setLightStyleState] = useState<LightStyleId>("default");
  const [iconSet, setIconSetState] = useState<IconSetId>(DEFAULT_ICON_SET);

  const resolvedTheme = resolveTheme(theme, systemTheme);
  const surface = resolvedTheme === "dark" ? darkStyle : lightStyle;

  useLayoutEffect(() => {
    // One-time sync from localStorage after hydration; must run before paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(readStoredTheme());
    setSystemTheme(getSystemTheme());
    setPaletteState(readStoredPalette());
    setDarkStyleState(readStoredDarkStyle());
    setLightStyleState(readStoredLightStyle());
    setIconSetState(readStoredIconSet());
    setHydrated(true);
  }, []);

  // Skip DOM writes until saved values are loaded, so the defaults never
  // overwrite what the init script applied.
  useLayoutEffect(() => {
    if (hydrated) applyThemeToDom(resolvedTheme);
  }, [hydrated, resolvedTheme]);

  useLayoutEffect(() => {
    if (hydrated) document.documentElement.dataset.palette = palette;
  }, [hydrated, palette]);

  useLayoutEffect(() => {
    if (hydrated) document.documentElement.dataset.surface = surface;
  }, [hydrated, surface]);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(getSystemTheme());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  // Keep other open tabs in sync when appearance changes here.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setThemeState(readStoredTheme());
      if (event.key === PALETTE_STORAGE_KEY) setPaletteState(readStoredPalette());
      if (event.key === DARK_STYLE_STORAGE_KEY) setDarkStyleState(readStoredDarkStyle());
      if (event.key === LIGHT_STYLE_STORAGE_KEY) setLightStyleState(readStoredLightStyle());
      if (event.key === ICON_SET_STORAGE_KEY) setIconSetState(readStoredIconSet());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    writeStored(STORAGE_KEY, next);
  }, []);

  const setPalette = useCallback((next: PaletteId) => {
    setPaletteState(next);
    writeStored(PALETTE_STORAGE_KEY, next);
  }, []);

  const setDarkStyle = useCallback((next: DarkStyleId) => {
    setDarkStyleState(next);
    writeStored(DARK_STYLE_STORAGE_KEY, next);
  }, []);

  const setLightStyle = useCallback((next: LightStyleId) => {
    setLightStyleState(next);
    writeStored(LIGHT_STYLE_STORAGE_KEY, next);
  }, []);

  const setIconSet = useCallback((next: IconSetId) => {
    setIconSetState(next);
    writeStored(ICON_SET_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      palette,
      setPalette,
      darkStyle,
      setDarkStyle,
      lightStyle,
      setLightStyle,
      iconSet,
      setIconSet,
    }),
    [theme, resolvedTheme, setTheme, palette, setPalette, darkStyle, setDarkStyle, lightStyle, setLightStyle, iconSet, setIconSet]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
