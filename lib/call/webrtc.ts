import type { IceServer } from "./types";

export function buildRtcConfig(iceServers: IceServer[]): RTCConfiguration {
  const servers = iceServers.length
    ? iceServers
    : [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];
  return {
    iceServers: servers.map((server) => ({
      urls: server.urls,
      username: server.username,
      credential: server.credential,
    })),
  };
}

export class MediaPermissionError extends Error {}

/** Ask for mic (and camera) with a clear error when blocked or missing. */
export async function getCallMedia(video: boolean): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new MediaPermissionError(
      "Calls need a secure page (https or localhost) and a browser with camera/mic support."
    );
  }
  const audio: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio,
      video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
    });
  } catch (error) {
    const name = (error as DOMException)?.name;
    if (video && (name === "NotFoundError" || name === "NotReadableError" || name === "OverconstrainedError")) {
      // No usable camera: fall back to audio so the call still works.
      try {
        return await navigator.mediaDevices.getUserMedia({ audio, video: false });
      } catch {
        /* fall through to the message below */
      }
    }
    if (name === "NotAllowedError" || name === "SecurityError") {
      throw new MediaPermissionError(
        video
          ? "Camera and microphone access is blocked. Allow it in the browser's site settings."
          : "Microphone access is blocked. Allow it in the browser's site settings."
      );
    }
    if (name === "NotFoundError") {
      throw new MediaPermissionError("No microphone was found on this device.");
    }
    throw new MediaPermissionError("Could not access the microphone or camera.");
  }
}

export class WebRtcPeer {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];

  onRemoteStream?: (stream: MediaStream) => void;
  onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
  onConnectionState?: (state: RTCPeerConnectionState) => void;

  get isStarted() {
    return this.pc !== null;
  }

  get hasRemoteDescription() {
    return Boolean(this.pc?.remoteDescription);
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  /** Create the peer connection using an already-acquired local stream. */
  start(localStream: MediaStream, iceServers: IceServer[]) {
    this.closeConnection();
    this.localStream = localStream;
    this.remoteStream = new MediaStream();
    const pc = new RTCPeerConnection(buildRtcConfig(iceServers));
    this.pc = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) this.onIceCandidate?.(event.candidate.toJSON());
    };
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      const remote = this.remoteStream ?? new MediaStream();
      if (stream) {
        stream.getTracks().forEach((t) => {
          if (!remote.getTracks().includes(t)) remote.addTrack(t);
        });
      } else if (!remote.getTracks().includes(event.track)) {
        remote.addTrack(event.track);
      }
      this.remoteStream = remote;
      // New MediaStream wrapper so React consumers re-bind srcObject.
      this.onRemoteStream?.(new MediaStream(remote.getTracks()));
    };
    pc.onconnectionstatechange = () => {
      if (this.pc === pc) this.onConnectionState?.(pc.connectionState);
    };

    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }
    // Always negotiate audio+video so either side can show video.
    const kinds = new Set(localStream.getTracks().map((t) => t.kind));
    if (!kinds.has("audio")) pc.addTransceiver("audio", { direction: "recvonly" });
    if (!kinds.has("video")) pc.addTransceiver("video", { direction: "recvonly" });
  }

  async createOffer() {
    if (!this.pc) throw new Error("Peer not started");
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async applyOffer(sdp: string, type: RTCSdpType) {
    if (!this.pc) throw new Error("Peer not started");
    await this.pc.setRemoteDescription({ sdp, type });
    await this.flushCandidates();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async applyAnswer(sdp: string, type: RTCSdpType) {
    if (!this.pc) throw new Error("Peer not started");
    if (this.pc.signalingState !== "have-local-offer") return;
    await this.pc.setRemoteDescription({ sdp, type });
    await this.flushCandidates();
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!candidate.candidate) return;
    if (!this.pc || !this.pc.remoteDescription) {
      this.pendingCandidates.push(candidate);
      return;
    }
    try {
      await this.pc.addIceCandidate(candidate);
    } catch {
      // Stale or duplicate candidate; safe to ignore.
    }
  }

  private async flushCandidates() {
    const queued = this.pendingCandidates;
    this.pendingCandidates = [];
    for (const c of queued) await this.addIceCandidate(c);
  }

  setMicrophoneEnabled(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }

  setVideoEnabled(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }

  async switchCamera() {
    const videoTrack = this.localStream?.getVideoTracks()[0];
    if (!videoTrack) return false;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === "videoinput");
    if (videoInputs.length < 2) return false;
    const current = videoTrack.getSettings().deviceId;
    const idx = videoInputs.findIndex((d) => d.deviceId === current);
    const next = videoInputs[(idx + 1) % videoInputs.length];
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { deviceId: { exact: next.deviceId } },
    });
    const newTrack = stream.getVideoTracks()[0];
    newTrack.enabled = videoTrack.enabled;
    const sender = this.pc?.getSenders().find((s) => s.track?.kind === "video");
    await sender?.replaceTrack(newTrack);
    videoTrack.stop();
    this.localStream?.removeTrack(videoTrack);
    this.localStream?.addTrack(newTrack);
    return true;
  }

  private closeConnection() {
    this.pendingCandidates = [];
    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.ontrack = null;
      this.pc.onconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }
  }

  close() {
    this.closeConnection();
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.remoteStream = null;
  }
}
