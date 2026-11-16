// Typed examples. The mapped types make the compiler demand at least one example per message type,
// so a type added to a union without an example fails `tsc`; schemas.test.ts validates every example.
import type { HostMessage, RuntimeMessage, RuntimeManifest } from "../src/index.ts";

type ExamplesOf<M extends { type: string }> = { [T in M["type"]]: [Extract<M, { type: T }>, ...Extract<M, { type: T }>[]] };

const CURSOR_X = 320;
const CURSOR_Y = 240;
const WHEEL_NOTCH = -120;
const HALF_PRESSED = 0.5;
const STICK_TILT = 0.25;
const MIB = 1_048_576;
const FETCHED_BYTES = MIB;
const TOTAL_BYTES = 4_194_304;
const SECOND_CALL_ID = 2;
const SHA256_HEX_LENGTH = 64;
const HEX_DIGITS = "0123456789abcdef";
const ZERO_HASH = "0".repeat(SHA256_HEX_LENGTH);
const A_HASH = "a".repeat(SHA256_HEX_LENGTH);
const MIXED_HASH = HEX_DIGITS.repeat(SHA256_HEX_LENGTH / HEX_DIGITS.length);
const UPPERCASE_HASH = "A".repeat(SHA256_HEX_LENGTH);
const WASM_BYTES = 1024;
const JS_BYTES = 2048;
const CHUNK_BYTES = 33_554_432;
const FRACTIONAL_ID = 1.5;

export const hostExamples: ExamplesOf<HostMessage> = {
  hello: [{ type: "hello", protocol: "kotor-runtime/1", role: "host", capabilities: [] }],
  boot: [
    { type: "boot", game: "k1", source: { kind: "fsa-directory", id: "src-1" }, saves: { id: "saves-k1" } },
    {
      type: "boot",
      game: "k2",
      source: { kind: "native-fs", id: "src-2" },
      saves: { id: "saves-k2" },
      options: {},
    },
  ],
  input: [
    {
      type: "input",
      events: [
        { device: "keyboard", action: "down", code: "KeyW" },
        { device: "pointer", action: "move", x: CURSOR_X, y: CURSOR_Y },
        { device: "pointer", action: "down", x: CURSOR_X, y: CURSOR_Y, button: 0 },
        { device: "wheel", dx: 0, dy: WHEEL_NOTCH },
        { device: "gamepad", index: 0, buttons: [1, 0, HALF_PRESSED], axes: [-1, 0, STICK_TILT, 1] },
      ],
    },
    { type: "input", events: [] },
  ],
  pause: [{ type: "pause" }],
  resume: [{ type: "resume" }],
  stop: [{ type: "stop" }],
  ext: [{ type: "ext", ext: "tas", id: 1, payload: { op: "frame-advance" } }],
};

export const runtimeExamples: ExamplesOf<RuntimeMessage> = {
  hello: [{ type: "hello", protocol: "kotor-runtime/1", role: "runtime", capabilities: ["tas", "debug"] }],
  progress: [{ type: "progress", phase: "fetch", done: FETCHED_BYTES, total: TOTAL_BYTES }],
  state: [
    { type: "state", state: "running" },
    { type: "state", state: "error", error: "chitin.key not found" },
  ],
  saved: [{ type: "saved", slot: "000001 - QuickSave" }],
  "ext-reply": [
    { type: "ext-reply", ext: "tas", id: 1, ok: true, payload: null },
    { type: "ext-reply", ext: "debug", id: SECOND_CALL_ID, ok: false, payload: "unknown op" },
  ],
};

export const manifestExamples: RuntimeManifest[] = [
  {
    version: "0.1.0",
    protocol: 1,
    qualified: false,
    files: [
      { name: "runtime.wasm", sha256: ZERO_HASH, size: WASM_BYTES },
      { name: "runtime.js", sha256: A_HASH, size: JS_BYTES },
      { name: "root.chunk-0001.bin", sha256: MIXED_HASH, size: CHUNK_BYTES },
    ],
  },
];

/** Values that must fail validation, each with the reason. */
export const invalidMessages: [string, unknown][] = [
  ["unknown type", { type: "teleport" }],
  ["hello with a malformed protocol id", { type: "hello", protocol: "kotor-runtime/v1", role: "host", capabilities: [] }],
  ["boot without saves", { type: "boot", game: "k1", source: { kind: "file-list", id: "x" } }],
  ["boot with an unknown game", { type: "boot", game: "k3", source: { kind: "file-list", id: "x" }, saves: { id: "s" } }],
  ["ext without payload", { type: "ext", ext: "tas", id: 1 }],
  ["ext-reply with a fractional id", { type: "ext-reply", ext: "tas", id: FRACTIONAL_ID, ok: true, payload: null }],
  ["input with an unknown device", { type: "input", events: [{ device: "touch", x: 0, y: 0 }] }],
  ["state with an unknown state", { type: "state", state: "crashed" }],
];

const manifestWith = (patch: Record<string, unknown>, file: Record<string, unknown> = {}) => ({
  version: "0.1.0",
  protocol: 1,
  qualified: true,
  files: [{ name: "a", sha256: ZERO_HASH, size: 1, ...file }],
  ...patch,
});

export const invalidManifests: [string, unknown][] = [
  ["missing qualified", manifestWith({ qualified: undefined })],
  ["uppercase sha256", manifestWith({}, { sha256: UPPERCASE_HASH })],
  ["file name with a slash", manifestWith({}, { name: "a/b" })],
  ["file name that is a dot segment", manifestWith({}, { name: ".." })],
  ["negative size", manifestWith({}, { size: -1 })],
  ["non-semver version", manifestWith({ version: "1.0" })],
  ["protocol major 0", manifestWith({ protocol: 0 })],
  ["no files", manifestWith({ files: [] })],
];
