import { test } from "node:test";
import assert from "node:assert/strict";
import { isHostMessage, isRuntimeMessage } from "../src/protocol.ts";
import { hostExamples, runtimeExamples } from "./examples.ts";

const hostMessages = Object.values(hostExamples).flat();
const runtimeMessages = Object.values(runtimeExamples).flat();
const typesOf = (messages: { type: string }[]) => messages.map((m) => m.type);

test("isHostMessage accepts host messages and, of runtime messages, only hello", () => {
  assert.deepEqual(typesOf(hostMessages.filter((m) => !isHostMessage(m))), []);
  assert.deepEqual([...new Set(typesOf(runtimeMessages.filter(isHostMessage)))], ["hello"]);
});

test("isRuntimeMessage accepts runtime messages and, of host messages, only hello", () => {
  assert.deepEqual(typesOf(runtimeMessages.filter((m) => !isRuntimeMessage(m))), []);
  assert.deepEqual([...new Set(typesOf(hostMessages.filter(isRuntimeMessage)))], ["hello"]);
});

test("guards reject values without a known string type", () => {
  const values: unknown[] = [null, undefined, 1, "hello", [], {}, { type: 1 }, { type: "teleport" }];
  assert.deepEqual(values.filter((v) => isHostMessage(v) || isRuntimeMessage(v)), []);
});
