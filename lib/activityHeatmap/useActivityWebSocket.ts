"use client";

import { useCallback, useEffect, useRef } from "react";

import type { ActivityLayerFlags, ActivityZone } from "./types";
import { closeActivitySocket, getActivityWebSocketUrl } from "./activityWebSocket";

const RECONNECT_BASE_MS = 1500;
const RECONNECT_MAX_MS = 20000;

export type ActivityViewport = {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
  zoom: number;
};

export function useActivityWebSocket(
  enabled: boolean,
  viewport: ActivityViewport | null,
  flags: ActivityLayerFlags,
  userCoords: [number, number] | null,
  onZones: (zones: ActivityZone[]) => void
) {
  const socketRef = useRef<WebSocket | null>(null);
  const onZonesRef = useRef(onZones);
  const reconnectRef = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onZonesRef.current = onZones;
  }, [onZones]);

  const sendViewport = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !viewport) return;
    socket.send(
      JSON.stringify({
        type: "viewport",
        lat_min: viewport.latMin,
        lat_max: viewport.latMax,
        lon_min: viewport.lonMin,
        lon_max: viewport.lonMax,
        zoom: viewport.zoom,
        trending: flags.trending,
        events: flags.events,
        friends: flags.friends,
        nearby: flags.nearby,
        user_lat: userCoords?.[0],
        user_lng: userCoords?.[1],
        nearby_km: 140,
      })
    );
  }, [viewport, flags, userCoords]);

  useEffect(() => {
    if (!enabled) {
      closeActivitySocket(socketRef.current);
      socketRef.current = null;
      return;
    }

    let cancelled = false;

    const clearReconnect = () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** reconnectRef.current);
      reconnectRef.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    function connect() {
      if (cancelled) return;
      try {
        const socket = new WebSocket(getActivityWebSocketUrl());
        socketRef.current = socket;

        socket.onopen = () => {
          reconnectRef.current = 0;
          sendViewport();
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string) as { type?: string; zones?: ActivityZone[] };
            if (data.type === "zones" && Array.isArray(data.zones)) {
              onZonesRef.current(data.zones);
            }
          } catch {
            /* ignore malformed */
          }
        };

        socket.onclose = () => {
          if (!cancelled) scheduleReconnect();
        };

        socket.onerror = () => socket.close();
      } catch {
        scheduleReconnect();
      }
    }

    connect();

    return () => {
      cancelled = true;
      clearReconnect();
      closeActivitySocket(socketRef.current);
      socketRef.current = null;
    };
  }, [enabled, sendViewport]);

  useEffect(() => {
    sendViewport();
  }, [sendViewport]);
}
