const STORAGE_KEY = "duo_device_id";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Stable per-browser device id, persisted in localStorage. */
export function getWebDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateId();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function parseBrowserAndOs(ua: string): { browser: string; os: string } {
  let browser = "Browser";
  let os = "";

  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return { browser, os };
}

export interface WebDeviceInfo {
  device_id: string;
  device_name: string;
  model: string;
  platform: "web";
  os_version: string;
  app_version: string;
}

export function getWebDeviceInfo(): WebDeviceInfo {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const { browser, os } = parseBrowserAndOs(ua);
  return {
    device_id: getWebDeviceId(),
    device_name: os ? `${browser} on ${os}` : browser,
    model: "",
    platform: "web",
    os_version: os,
    app_version: "",
  };
}
