import type { IceServer } from "./types";

export function buildRtcConfig(iceServers: IceServer[]): RTCConfiguration {
  return {
    iceServers: iceServers.map((server) => ({
      urls: server.urls,
      username: server.username,
      credential: server.credential,
    })),
  };
}

export class WebRtcPeer {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  onRemoteStream?: (stream: MediaStream) => void;
  onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
  onConnectionState?: (state: RTCPeerConnectionState) => void;

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  async start(video: boolean, iceServers: IceServer[]) {
    await this.close();
    this.pc = new RTCPeerConnection(buildRtcConfig(iceServers));
    this.pc.onicecandidate = (event) => {
      if (event.candidate) this.onIceCandidate?.(event.candidate.toJSON());
    };
    this.pc.ontrack = (event) => {
      this.remoteStream = event.streams[0] ?? null;
      if (this.remoteStream) this.onRemoteStream?.(this.remoteStream);
    };
    this.pc.onconnectionstatechange = () => {
      if (this.pc) this.onConnectionState?.(this.pc.connectionState);
    };

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video,
    });
    for (const track of this.localStream.getTracks()) {
      this.pc.addTrack(track, this.localStream);
    }
  }

  async createOffer() {
    if (!this.pc) throw new Error("Peer not started");
    const offer = await this.pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async applyOffer(sdp: string, type: RTCSdpType) {
    if (!this.pc) throw new Error("Peer not started");
    await this.pc.setRemoteDescription({ sdp, type });
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async applyAnswer(sdp: string, type: RTCSdpType) {
    if (!this.pc) throw new Error("Peer not started");
    await this.pc.setRemoteDescription({ sdp, type });
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.pc || !candidate.candidate) return;
    await this.pc.addIceCandidate(candidate);
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
    if (!videoTrack) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === "videoinput");
    if (videoInputs.length < 2) return;
    const settings = videoTrack.getSettings();
    const next = videoInputs.find((d) => d.deviceId !== settings.deviceId) ?? videoInputs[0];
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { deviceId: { exact: next.deviceId } },
    });
    const newTrack = stream.getVideoTracks()[0];
    const sender = this.pc?.getSenders().find((s) => s.track?.kind === "video");
    await sender?.replaceTrack(newTrack);
    videoTrack.stop();
    this.localStream?.removeTrack(videoTrack);
    this.localStream?.addTrack(newTrack);
  }

  async close() {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.remoteStream = null;
    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.ontrack = null;
      this.pc.onconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }
  }
}
