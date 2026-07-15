const SOUND_PREF_KEY = "duo_notification_sound";
const SOUND_URL = "/sounds/notification.wav";

let sharedAudio: HTMLAudioElement | null = null;

export function getNotificationSoundPreference(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(SOUND_PREF_KEY);
  if (raw === null) return true;
  return raw === "1";
}

export function setNotificationSoundPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_PREF_KEY, enabled ? "1" : "0");
}

function ensureAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudio) {
    sharedAudio = new Audio(SOUND_URL);
    sharedAudio.preload = "auto";
    sharedAudio.volume = 0.85;
  }
  return sharedAudio;
}

/** Unlock audio on first user gesture so later push sounds can autoplay. */
export function unlockNotificationSound(): void {
  const audio = ensureAudio();
  if (!audio) return;
  const previous = audio.volume;
  audio.volume = 0;
  void audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = previous;
    })
    .catch(() => {
      audio.volume = previous;
    });
}

/**
 * Play Duo notification chime. Honors local preference and optional
 * FCM `data.sound` ("0" / "false" silences).
 */
export function playNotificationSound(options?: {
  force?: boolean;
  soundFlag?: string | null;
}): void {
  if (typeof window === "undefined") return;

  const flag = (options?.soundFlag || "").trim().toLowerCase();
  const backendAllows =
    !flag || (flag !== "0" && flag !== "false" && flag !== "off" && flag !== "no");
  if (!options?.force && (!getNotificationSoundPreference() || !backendAllows)) {
    return;
  }

  const audio = ensureAudio();
  if (!audio) return;

  try {
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay may still be blocked until a user gesture.
    });
  } catch {
    // Ignore playback errors — visual notification still shows.
  }
}

export function shouldPlaySoundFromPayload(data?: Record<string, string> | null): boolean {
  if (!getNotificationSoundPreference()) return false;
  const flag = (data?.sound || "").trim().toLowerCase();
  if (!flag) return true;
  return flag !== "0" && flag !== "false" && flag !== "off" && flag !== "no";
}
