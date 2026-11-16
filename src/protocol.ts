/**
 * Runtime host protocol `kotor-runtime/1`: messages between the host page and the runtime worker,
 * carried over a `MessagePort`. JSON Schema: `schemas/protocol.schema.json`.
 */
import type { GameSourceKind } from "./game-source.js";

/** Protocol identifier this package version describes. */
export const PROTOCOL = "kotor-runtime/1";

/** Major version of {@link PROTOCOL}. A breaking protocol change bumps it. */
export const PROTOCOL_MAJOR = 1;

/**
 * A protocol identifier of any major. `Hello` carries this rather than the literal
 * {@link PROTOCOL} so a peer can read an unsupported major and refuse it.
 */
export type ProtocolId = `kotor-runtime/${number}`;

/** First message on the port, sent by both sides. Either side refuses a major it does not support. */
export type Hello = {
  type: "hello";
  protocol: ProtocolId;
  role: "host" | "runtime";
  /** Named extensions this side supports, for example `"tas"`, `"debug"`, `"recording"`. */
  capabilities: string[];
};

/** Reference to a game install the host has opened as a `GameSource`. */
export type GameSourceRef = {
  kind: GameSourceKind;
  /** Opaque identifier agreed by host and runtime. */
  id: string;
};

/** Reference to the writable save store. */
export type SaveStoreRef = {
  /** Opaque identifier agreed by host and runtime. */
  id: string;
};

/** Boot options. No option is defined yet; runtimes ignore keys they do not know. */
export type BootOptions = Record<string, unknown>;

export type KeyboardInput = {
  device: "keyboard";
  action: "down" | "up";
  /** `KeyboardEvent.code`, for example `"KeyW"`. */
  code: string;
};

export type PointerInput = {
  device: "pointer";
  action: "move" | "down" | "up";
  /** Position in CSS pixels relative to the runtime's output surface. */
  x: number;
  y: number;
  /** `PointerEvent.button` for `down` and `up`. */
  button?: number;
};

export type WheelInput = {
  device: "wheel";
  /** `WheelEvent.deltaX` / `deltaY` in pixels. */
  dx: number;
  dy: number;
};

/** Snapshot of one gamepad, in the shape of the Gamepad API. */
export type GamepadInput = {
  device: "gamepad";
  index: number;
  /** Button values from 0 to 1. */
  buttons: number[];
  /** Axis values from -1 to 1. */
  axes: number[];
};

export type InputEvent = KeyboardInput | PointerInput | WheelInput | GamepadInput;

// host -> runtime

export type Boot = {
  type: "boot";
  game: "k1" | "k2";
  source: GameSourceRef;
  saves: SaveStoreRef;
  options?: BootOptions;
};
export type Input = { type: "input"; events: InputEvent[] };
export type Pause = { type: "pause" };
export type Resume = { type: "resume" };
export type Stop = { type: "stop" };
/** Extension call, for example under `"tas"` or `"debug"`. Answered by an `ExtReply` with the same `ext` and `id`. */
export type ExtCall = { type: "ext"; ext: string; id: number; payload: unknown };

// runtime -> host

export type Progress = {
  type: "progress";
  phase: "fetch" | "mount" | "boot" | "running";
  done: number;
  total: number;
};
export type State = {
  type: "state";
  state: "booting" | "running" | "paused" | "stopped" | "error";
  /** Present when `state` is `"error"`. */
  error?: string;
};
export type Saved = { type: "saved"; slot: string };
export type ExtReply = { type: "ext-reply"; ext: string; id: number; ok: boolean; payload: unknown };

/** Any message the host sends. */
export type HostMessage = Hello | Boot | Input | Pause | Resume | Stop | ExtCall;

/** Any message the runtime sends. */
export type RuntimeMessage = Hello | Progress | State | Saved | ExtReply;

export type ProtocolMessage = HostMessage | RuntimeMessage;

export const HOST_MESSAGE_TYPES = [
  "hello",
  "boot",
  "input",
  "pause",
  "resume",
  "stop",
  "ext",
] as const satisfies readonly HostMessage["type"][];

export const RUNTIME_MESSAGE_TYPES = [
  "hello",
  "progress",
  "state",
  "saved",
  "ext-reply",
] as const satisfies readonly RuntimeMessage["type"][];

function hasType(value: unknown, types: readonly string[]): boolean {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === "string" && types.includes(type);
}

/**
 * True when `value` carries a host message `type`. Checks the discriminant only; validate the
 * full shape against `schemas/protocol.schema.json` when the peer is untrusted.
 */
export function isHostMessage(value: unknown): value is HostMessage {
  return hasType(value, HOST_MESSAGE_TYPES);
}

/** True when `value` carries a runtime message `type`. Discriminant only, as {@link isHostMessage}. */
export function isRuntimeMessage(value: unknown): value is RuntimeMessage {
  return hasType(value, RUNTIME_MESSAGE_TYPES);
}
