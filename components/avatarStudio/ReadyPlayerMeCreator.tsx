"use client";

import { useEffect, useRef } from "react";

import { optimizeRpmUrl } from "@/lib/avatarStudio/realisticAvatar";

const RPM_SUBDOMAIN = process.env.NEXT_PUBLIC_RPM_SUBDOMAIN || "demo";

type ReadyPlayerMeCreatorProps = {
  open: boolean;
  onClose: () => void;
  onExported: (modelUrl: string) => void;
};

type RpmMessage = {
  source?: string;
  eventName?: string;
  data?: { url?: string; id?: string };
};

export default function ReadyPlayerMeCreator({ open, onClose, onExported }: ReadyPlayerMeCreatorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!open) return;

    const subscribe = (event: MessageEvent) => {
      let json: RpmMessage | null = null;
      try {
        json = typeof event.data === "string" ? (JSON.parse(event.data) as RpmMessage) : (event.data as RpmMessage);
      } catch {
        return;
      }
      if (json?.source !== "readyplayerme") return;

      if (json.eventName === "v1.frame.ready") {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({
            target: "readyplayerme",
            type: "subscribe",
            eventName: "v1.**",
          }),
          "*"
        );
      }

      if (json.eventName === "v1.avatar.exported" && json.data?.url) {
        onExported(optimizeRpmUrl(json.data.url));
        onClose();
      }
    };

    window.addEventListener("message", subscribe);
    return () => window.removeEventListener("message", subscribe);
  }, [open, onClose, onExported]);

  if (!open) return null;

  const src = `https://${RPM_SUBDOMAIN}.readyplayer.me/avatar?frameApi&clearCache`;

  return (
    <div className="avatar-rpm-overlay" role="dialog" aria-modal="true" aria-label="Create realistic avatar">
      <div className="avatar-rpm-modal glass-panel">
        <header className="avatar-rpm-modal__head">
          <div>
            <p className="avatar-studio__eyebrow">Realistic 3D</p>
            <h2>Create your avatar</h2>
            <p className="avatar-rpm-modal__hint">
              Needs access to readyplayer.me. If this stays blank, your network may block it — the studio still
              works with the local 3D model.
            </p>
          </div>
          <button type="button" className="avatar-studio__tool" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
            Close
          </button>
        </header>
        <iframe
          ref={iframeRef}
          className="avatar-rpm-modal__frame"
          src={src}
          allow="camera *; microphone *; clipboard-write"
          title="Ready Player Me Avatar Creator"
        />
      </div>
    </div>
  );
}
