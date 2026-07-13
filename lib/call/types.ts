export type CallType = "voice" | "video";

export type CallPhase =
  | "idle"
  | "outgoing"
  | "incoming"
  | "connecting"
  | "active"
  | "ended";

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface CallSession {
  id: string;
  conversation_id: string;
  call_type: CallType;
  status: string;
  caller_id: number;
  callee_id: number;
  ice_servers?: IceServer[];
}

export interface CallSignalMessage {
  type: string;
  event?: string;
  call_id?: string;
  conversation_id?: string;
  sender_id?: number;
  payload?: Record<string, unknown>;
  sdp?: string;
  sdp_type?: string;
  candidate?: string;
  sdp_mid?: string;
  sdp_mline_index?: number;
}
