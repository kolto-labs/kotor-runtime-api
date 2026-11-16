import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import type { ValidateFunction } from "ajv/dist/2020.js";
import { HOST_MESSAGE_TYPES, PROTOCOL, PROTOCOL_MAJOR, RUNTIME_MESSAGE_TYPES } from "../src/protocol.ts";
import { hostExamples, invalidManifests, invalidMessages, manifestExamples, runtimeExamples } from "./examples.ts";

const load = (name: string) => JSON.parse(readFileSync(new URL(`../schemas/${name}`, import.meta.url), "utf8"));
const protocolSchema = load("protocol.schema.json");
const manifestSchema = load("runtime-manifest.schema.json");

const ajv = new Ajv2020({ strict: true, allErrors: true });
ajv.addSchema(protocolSchema, "protocol");
const validateAny = ajv.getSchema("protocol")!;
const validateHost = ajv.getSchema("protocol#/$defs/HostMessage")!;
const validateRuntime = ajv.getSchema("protocol#/$defs/RuntimeMessage")!;
const validateManifest = ajv.compile(manifestSchema);

const hostMessages = Object.values(hostExamples).flat();
const runtimeMessages = Object.values(runtimeExamples).flat();

/** Each value the validator rejects, with ajv's errors, so a failure names the culprit. */
const rejected = (validate: ValidateFunction, values: unknown[]) =>
  values.filter((v) => !validate(v)).map((v) => ({ value: v, errors: validate(v) ? [] : validate.errors }));

/** Each value the validator accepts. */
const accepted = (validate: ValidateFunction, values: unknown[]) => values.filter((v) => validate(v));

const sorted = (values: readonly string[]) => [...values].sort();

test("every host message example validates as a host message and as a message", () => {
  assert.deepEqual(rejected(validateHost, hostMessages), []);
  assert.deepEqual(rejected(validateAny, hostMessages), []);
});

test("every runtime message example validates as a runtime message and as a message", () => {
  assert.deepEqual(rejected(validateRuntime, runtimeMessages), []);
  assert.deepEqual(rejected(validateAny, runtimeMessages), []);
});

test("direction-only messages fail the other direction's schema", () => {
  const notHello = (m: { type: string }) => m.type !== "hello";
  assert.deepEqual(accepted(validateRuntime, hostMessages.filter(notHello)), []);
  assert.deepEqual(accepted(validateHost, runtimeMessages.filter(notHello)), []);
});

test("protocol schema rejects each invalid message", () => {
  const passed = invalidMessages.filter(([, value]) => validateAny(value)).map(([reason]) => reason);
  assert.deepEqual(passed, []);
});

test("schema message types match the TypeScript unions", () => {
  const constsOf = (def: string): string[] =>
    protocolSchema.$defs[def].oneOf.map(
      (r: { $ref: string }) => protocolSchema.$defs[r.$ref.replace("#/$defs/", "")].properties.type.const,
    );
  assert.deepEqual(sorted(constsOf("HostMessage")), sorted(HOST_MESSAGE_TYPES));
  assert.deepEqual(sorted(constsOf("RuntimeMessage")), sorted(RUNTIME_MESSAGE_TYPES));
  assert.deepEqual(sorted(Object.keys(hostExamples)), sorted(HOST_MESSAGE_TYPES));
  assert.deepEqual(sorted(Object.keys(runtimeExamples)), sorted(RUNTIME_MESSAGE_TYPES));
});

test("a hello carrying PROTOCOL validates, and PROTOCOL names PROTOCOL_MAJOR", () => {
  const hello = { type: "hello", protocol: PROTOCOL, role: "host", capabilities: [] };
  assert.deepEqual(rejected(validateHost, [hello]), []);
  assert.equal(PROTOCOL, `kotor-runtime/${PROTOCOL_MAJOR}`);
});

test("a hello of another major still validates, so the peer can read and refuse it", () => {
  const hello = { type: "hello", protocol: `kotor-runtime/${PROTOCOL_MAJOR + 1}`, role: "runtime", capabilities: [] };
  assert.deepEqual(rejected(validateRuntime, [hello]), []);
});

test("each schema $id names the package release it ships in", () => {
  const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const idOf = (file: string) =>
    `https://raw.githubusercontent.com/kolto-labs/kotor-runtime-api/v${version}/schemas/${file}`;
  assert.equal(protocolSchema.$id, idOf("protocol.schema.json"));
  assert.equal(manifestSchema.$id, idOf("runtime-manifest.schema.json"));
});

test("every manifest example validates", () => {
  assert.deepEqual(rejected(validateManifest, manifestExamples), []);
});

test("manifest schema rejects each invalid manifest", () => {
  const passed = invalidManifests.filter(([, value]) => validateManifest(value)).map(([reason]) => reason);
  assert.deepEqual(passed, []);
});
